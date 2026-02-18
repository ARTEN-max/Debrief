"""
Speaker Diarization Microservice
Uses WhoSpeaks for speaker identification
"""
import os
import tempfile
import shutil
from pathlib import Path
from typing import List, Dict
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import librosa
import torch
import soundfile as sf
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import AgglomerativeClustering
from scipy.cluster.hierarchy import linkage, dendrogram
from scipy.spatial.distance import pdist
from TTS.utils.manage import ModelManager
from TTS.tts.models import setup_model as setup_tts_model
from TTS.config import load_config

# ---- Monkey-patch torchaudio.load to use soundfile ----
# torchaudio 2.10+ defaults to torchcodec which may not be available.
# Patch it to use soundfile (already installed) as fallback.
import torchaudio
_original_torchaudio_load = torchaudio.load

def _soundfile_torchaudio_load(filepath, *args, **kwargs):
    """Fallback torchaudio.load using soundfile when torchcodec is unavailable."""
    try:
        return _original_torchaudio_load(filepath, *args, **kwargs)
    except (ImportError, RuntimeError):
        data, samplerate = sf.read(str(filepath), dtype='float32')
        waveform = torch.from_numpy(data)
        if waveform.ndim == 1:
            waveform = waveform.unsqueeze(0)  # (samples,) -> (1, samples)
        else:
            waveform = waveform.T  # (samples, channels) -> (channels, samples)
        return waveform, samplerate

torchaudio.load = _soundfile_torchaudio_load
print("✅ Patched torchaudio.load with soundfile fallback")

app = FastAPI(title="Speaker Diarization Service")


def convert_to_wav(input_path: str) -> str:
    """Convert any audio format to WAV using pydub (ffmpeg backend).
    Returns path to a new WAV temp file. Caller must clean up."""
    from pydub import AudioSegment
    wav_path = input_path + ".converted.wav"
    try:
        audio_seg = AudioSegment.from_file(input_path)
        audio_seg.export(wav_path, format="wav")
        print(f"✅ Converted audio to WAV: {wav_path}")
        return wav_path
    except Exception as e:
        print(f"❌ Audio conversion failed: {e}")
        raise

# Global model cache
model = None
device = None

class SpeakerSegment(BaseModel):
    start: float
    end: float
    speaker: str
    text: str = ""

class DiarizationResponse(BaseModel):
    speakers: List[str]
    segments: List[SpeakerSegment]
    num_speakers: int

def load_model():
    """Load Coqui TTS model for speaker embeddings"""
    global model, device

    if model is not None:
        return model, device

    print("🔧 Loading Coqui TTS model for speaker embeddings...")

    # Check for model path in environment
    model_path = os.environ.get('COQUI_MODEL_PATH')

    if not model_path or not Path(model_path).exists():
        print("⚠️  COQUI_MODEL_PATH not set or invalid, downloading model...")
        manager = ModelManager()
        model_path, _, _ = manager.download_model("tts_models/multilingual/multi-dataset/xtts_v2")
        print(f"📥 Downloaded model to: {model_path}")
        # Config path is always in the model directory
        config_path = Path(model_path) / "config.json"
        print(f"📝 Config path: {config_path}")
    else:
        model_path = Path(model_path)
        config_path = model_path / "config.json"
        print(f"✅ Using model from: {model_path}")

    device_name = "cuda" if torch.cuda.is_available() else "cpu"
    device = torch.device(device_name)
    print(f"🎯 Using device: {device_name}")

    # Load config and setup model
    print(f"📖 Loading config from: {config_path}")
    config = load_config(str(config_path))
    print("🏗️  Setting up model...")
    model = setup_tts_model(config)
    print(f"💾 Loading checkpoint from: {model_path}")

    # Patch torch.load to use weights_only=False for XTTS (trusted source)
    original_torch_load = torch.load
    def patched_load(*args, **kwargs):
        kwargs['weights_only'] = False
        return original_torch_load(*args, **kwargs)

    torch.load = patched_load
    try:
        model.load_checkpoint(
            config,
            checkpoint_dir=str(model_path),
            eval=True,
        )
    finally:
        torch.load = original_torch_load

    model.to(device)

    print("✅ Model loaded successfully")
    return model, device

def get_speaker_embedding(audio_path: str) -> np.ndarray:
    """Extract speaker embedding from audio file using XTTS v2 get_conditioning_latents"""
    try:
        tts, device = load_model()

        # Load audio to check duration
        audio, sr = librosa.load(audio_path, sr=22050)

        # Ensure minimum length (shorter threshold to process more segments)
        duration = len(audio) / sr
        if duration < 0.5:
            print(f"⚠️  Audio too short: {duration:.2f}s (minimum 0.5s)")
            return None

        print(f"📊 Processing audio segment: {duration:.2f}s")

        # Get conditioning latents (includes speaker embedding)
        # gpt_cond_len: Number of seconds of audio to use for GPT conditioning
        # max_ref_length: Maximum reference audio length in seconds
        gpt_cond_latent, speaker_embedding = tts.get_conditioning_latents(
            audio_path=audio_path,
            gpt_cond_len=min(30, int(duration)),
            max_ref_length=min(60, int(duration))
        )

        # Convert to 1D numpy array
        speaker_embedding_1D = speaker_embedding.view(-1).cpu().detach().numpy()

        print(f"✅ Extracted embedding: shape={speaker_embedding_1D.shape}")
        return speaker_embedding_1D

    except Exception as e:
        print(f"❌ Embedding extraction failed: {e}")
        import traceback
        traceback.print_exc()
        return None

def split_audio_by_segments(audio_path: str, segments: List[Dict]) -> List[str]:
    """Split audio file into segments based on timestamps"""
    temp_dir = tempfile.mkdtemp()
    segment_paths = []

    # Load full audio
    audio, sr = librosa.load(audio_path, sr=22050)

    for i, seg in enumerate(segments):
        start_sample = int(seg['start'] * sr)
        end_sample = int(seg['end'] * sr)

        # Extract segment
        segment_audio = audio[start_sample:end_sample]

        # Skip very short segments (allow shorter segments for better diarization)
        if len(segment_audio) < sr * 0.3:  # Minimum 0.3 seconds
            print(f"⚠️  Segment {i} too short: {len(segment_audio)/sr:.2f}s, skipping")
            segment_paths.append(None)
            continue

        # Save segment
        seg_path = os.path.join(temp_dir, f"segment_{i:04d}.wav")
        import soundfile as sf
        sf.write(seg_path, segment_audio, sr)
        segment_paths.append(seg_path)

    return segment_paths, temp_dir

def cluster_speakers_personalized(
    embeddings: List[np.ndarray],
    user_embedding: np.ndarray,
    similarity_threshold: float = 0.45
) -> List[str]:
    """
    Cluster embeddings with personalized labels: YOU for user, OTHER for others

    Args:
        embeddings: List of speaker embeddings for each segment
        user_embedding: The user's reference voice embedding
        similarity_threshold: Cosine similarity threshold to identify user (default 0.75)

    Returns:
        List of speaker labels: "YOU", "OTHER", "OTHER_1", "OTHER_2", etc.
    """
    from scipy.spatial.distance import cosine

    if not embeddings:
        return []

    # Create mapping for valid embeddings
    valid_indices = [i for i, e in enumerate(embeddings) if e is not None]
    valid_embeddings = [embeddings[i] for i in valid_indices]

    if not valid_embeddings:
        print("⚠️  No valid embeddings extracted, using single speaker")
        return ["YOU"] * len(embeddings)

    # Compare each embedding with user's embedding
    all_labels = []
    other_embeddings = []  # Track non-user embeddings for clustering
    other_indices = []  # Track which segments are non-user

    # Track all similarity scores for statistics
    all_similarities = []
    you_similarities = []
    other_similarities = []

    print(f"\n🎯 Personalized Diarization (threshold={similarity_threshold:.2f})")
    print(f"   User embedding shape: {user_embedding.shape}")

    for i, emb in enumerate(embeddings):
        if emb is None:
            all_labels.append("YOU")  # Default to user for skipped segments
            print(f"  Segment {i}: YOU (skipped - no embedding)")
            continue

        # Calculate cosine similarity with user embedding
        similarity = 1 - cosine(emb, user_embedding)
        all_similarities.append(similarity)

        if similarity >= similarity_threshold:
            all_labels.append("YOU")
            you_similarities.append(similarity)
            print(f"  ✅ Segment {i}: YOU (similarity={similarity:.3f})")
        else:
            # This is someone else - cluster later
            all_labels.append(None)  # Placeholder
            other_embeddings.append(emb)
            other_similarities.append(similarity)
            other_indices.append(i)
            print(f"  ❌ Segment {i}: OTHER (similarity={similarity:.3f})")

    # If there are multiple "OTHER" speakers, cluster them
    if len(other_embeddings) > 1:
        X = np.vstack(other_embeddings)

        # Standardize
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        # Determine optimal number of clusters
        linkage_matrix = linkage(X_scaled, method='ward')
        distances = pdist(X_scaled, metric='euclidean')
        max_distance = np.max(distances)

        # If distances are small, likely same speaker
        if max_distance < 19 or len(X) < 2:
            n_clusters = 1
        else:
            # Try to find optimal clusters
            from sklearn.metrics import silhouette_score
            best_score = -1
            best_n = 1
            max_clusters = min(5, len(X) - 1)  # Max 5 other speakers

            for n in range(2, max_clusters + 1):
                clustering = AgglomerativeClustering(n_clusters=n, linkage='ward')
                labels = clustering.fit_predict(X_scaled)

                if len(set(labels)) > 1:
                    score = silhouette_score(X_scaled, labels)
                    if score > best_score:
                        best_score = score
                        best_n = n

            n_clusters = best_n if best_score > 0.2 else 1

        print(f"📊 Detected {n_clusters} other speaker(s) besides YOU")

        # Cluster the "OTHER" embeddings
        if n_clusters == 1:
            other_labels = ["OTHER"] * len(other_embeddings)
        else:
            clustering = AgglomerativeClustering(n_clusters=n_clusters, linkage='ward')
            cluster_ids = clustering.fit_predict(X_scaled)
            other_labels = [f"OTHER_{label}" for label in cluster_ids]

        # Fill in the "OTHER" labels
        for idx, other_idx in enumerate(other_indices):
            all_labels[other_idx] = other_labels[idx]

    elif len(other_embeddings) == 1:
        # Only one "OTHER" segment
        all_labels[other_indices[0]] = "OTHER"

    # Print summary statistics
    you_count = sum(1 for label in all_labels if label == "YOU")
    other_count = len(all_labels) - you_count

    print(f"\n📈 Similarity Statistics:")
    print(f"   Total segments: {len(all_labels)}")
    print(f"   YOU: {you_count} segments ({you_count/len(all_labels)*100:.1f}%)")
    print(f"   OTHER: {other_count} segments ({other_count/len(all_labels)*100:.1f}%)")

    if all_similarities:
        print(f"   All similarities: min={min(all_similarities):.3f}, max={max(all_similarities):.3f}, avg={np.mean(all_similarities):.3f}")
    if you_similarities:
        print(f"   YOU similarities: min={min(you_similarities):.3f}, max={max(you_similarities):.3f}, avg={np.mean(you_similarities):.3f}")
    if other_similarities:
        print(f"   OTHER similarities: min={min(other_similarities):.3f}, max={max(other_similarities):.3f}, avg={np.mean(other_similarities):.3f}")

    # Warn if many segments are close to threshold
    close_to_threshold = [s for s in all_similarities if abs(s - similarity_threshold) < 0.05]
    if len(close_to_threshold) > len(all_similarities) * 0.3:
        print(f"   ⚠️  Warning: {len(close_to_threshold)} segments are close to threshold (±0.05)")
        print(f"      Consider adjusting threshold or re-enrolling voice profile with better audio")

    return all_labels

def cluster_speakers(embeddings: List[np.ndarray], segments: List[Dict]) -> List[str]:
    """Cluster embeddings to identify speakers"""
    if not embeddings:
        return []

    # Create mapping for valid embeddings
    valid_indices = [i for i, e in enumerate(embeddings) if e is not None]
    valid_embeddings = [embeddings[i] for i in valid_indices]

    if not valid_embeddings:
        print("⚠️  No valid embeddings extracted, using single speaker")
        return ["speaker_0"] * len(embeddings)

    # Stack embeddings
    X = np.vstack(valid_embeddings)

    if len(X) < 2:
        return ["speaker_0"] * len(embeddings)

    # Standardize
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Determine optimal number of clusters
    # Use hierarchical clustering
    linkage_matrix = linkage(X_scaled, method='ward')
    distances = pdist(X_scaled, metric='euclidean')
    max_distance = np.max(distances)

    # Heuristic: if max distance > threshold, likely multiple speakers
    two_speaker_threshold = 19

    if max_distance < two_speaker_threshold:
        n_clusters = 1
    else:
        # Try 2-10 clusters, pick best silhouette score
        from sklearn.metrics import silhouette_score
        best_score = -1
        best_n = 2

        # Maximum clusters is len(X) - 1 to ensure silhouette_score can work
        max_clusters = min(10, len(X) - 1)
        for n in range(2, max_clusters + 1):
            clustering = AgglomerativeClustering(n_clusters=n, linkage='ward')
            labels = clustering.fit_predict(X_scaled)

            if len(set(labels)) > 1:
                score = silhouette_score(X_scaled, labels)
                if score > best_score:
                    best_score = score
                    best_n = n

        n_clusters = best_n

    print(f"📊 Detected {n_clusters} speakers")

    # Final clustering
    if n_clusters == 1:
        return ["speaker_0"] * len(embeddings)

    clustering = AgglomerativeClustering(n_clusters=n_clusters, linkage='ward')
    valid_labels = clustering.fit_predict(X_scaled)

    # Map labels back to all embeddings (None embeddings get most common label)
    most_common_label = np.bincount(valid_labels).argmax()
    all_labels = []
    valid_label_idx = 0

    for i, emb in enumerate(embeddings):
        if emb is not None:
            all_labels.append(f"speaker_{valid_labels[valid_label_idx]}")
            valid_label_idx += 1
        else:
            all_labels.append(f"speaker_{most_common_label}")

    return all_labels

@app.post("/diarize", response_model=DiarizationResponse)
async def diarize_audio(
    audio: UploadFile = File(...),
    segments: str = Form(None),  # JSON string of transcript segments with timestamps
    user_embedding: str = Form(None)  # JSON string of user's voice embedding (512-dim array)
):
    """
    Perform speaker diarization on audio file

    Args:
        audio: Audio file (WAV, MP3, etc.)
        segments: JSON array of transcript segments with start/end times
                 Example: [{"start": 0.0, "end": 2.5, "text": "Hello"}]
    """
    temp_audio = None
    temp_dir = None
    wav_path = None

    try:
        print(f"🔍 Diarization request received - segments parameter: {segments is not None}")
        print(f"   Audio filename: {audio.filename}, content_type: {audio.content_type}")
        if segments:
            print(f"📦 Segments data length: {len(segments)} chars")

        # Save uploaded audio to temp file with original extension
        ext = Path(audio.filename).suffix if audio.filename else ".webm"
        temp_audio = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
        temp_audio.write(await audio.read())
        temp_audio.close()

        # Always convert to proper WAV via pydub (handles mislabeled formats)
        wav_path = convert_to_wav(temp_audio.name)
        audio_file = wav_path

        # Parse segments if provided
        import json
        if segments:
            segment_list = json.loads(segments)
            print(f"📥 Received {len(segment_list)} segments:")
            for i, seg in enumerate(segment_list[:3]):  # Show first 3
                print(f"  Segment {i}: start={seg.get('start')}, end={seg.get('end')}, text='{seg.get('text', '')[:50]}'")
        else:
            print("⚠️  No segments provided, treating whole audio as one segment")
            # If no segments, treat whole audio as one segment
            duration = librosa.get_duration(path=audio_file)
            segment_list = [{"start": 0.0, "end": duration, "text": ""}]

        print(f"🎤 Processing {len(segment_list)} segments...")

        # Split audio by segments
        segment_paths, temp_dir = split_audio_by_segments(audio_file, segment_list)

        # Extract embeddings for each segment
        embeddings = []
        valid_segment_indices = []  # Track which segments are valid

        for i, seg_path in enumerate(segment_paths):
            if seg_path is None:
                embeddings.append(None)
                continue

            try:
                embedding = get_speaker_embedding(seg_path)
                embeddings.append(embedding)
                if embedding is not None:
                    valid_segment_indices.append(i)
            except Exception as e:
                print(f"⚠️  Failed to extract embedding: {e}")
                embeddings.append(None)

        # Parse user embedding if provided
        user_emb = None
        if user_embedding:
            try:
                user_emb_list = json.loads(user_embedding)
                user_emb = np.array(user_emb_list, dtype=np.float32)
                print(f"👤 User embedding provided: shape={user_emb.shape}")
            except Exception as e:
                print(f"⚠️  Failed to parse user embedding: {e}")

        # Cluster speakers (personalized if user embedding provided)
        print(f"🔬 Clustering {len([e for e in embeddings if e is not None])} valid embeddings...")
        if user_emb is not None and len(user_emb) == 512:
            speaker_labels = cluster_speakers_personalized(embeddings, user_emb)
            print(f"🎯 Personalized clustering complete: {speaker_labels}")
        else:
            speaker_labels = cluster_speakers(embeddings, segment_list)
            print(f"🎯 Standard clustering complete: {speaker_labels}")

        # Build response - ensure we preserve text from original segments
        unique_speakers = sorted(set(speaker_labels))
        response_segments = []

        for i, (seg, speaker) in enumerate(zip(segment_list, speaker_labels)):
            # Preserve the original text from segment_list
            response_segments.append(SpeakerSegment(
                start=seg['start'],
                end=seg['end'],
                speaker=speaker,
                text=seg.get('text', '')
            ))

        print(f"📝 Returning {len(response_segments)} segments with speakers")

        return DiarizationResponse(
            speakers=unique_speakers,
            segments=response_segments,
            num_speakers=len(unique_speakers)
        )

    except Exception as e:
        print(f"❌ Diarization failed with error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Diarization failed: {str(e)}")

    finally:
        # Cleanup
        if temp_audio and os.path.exists(temp_audio.name):
            os.unlink(temp_audio.name)
        if wav_path and os.path.exists(wav_path):
            os.unlink(wav_path)
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)

@app.post("/enroll")
async def enroll_voice(
    audio: UploadFile = File(...)
):
    """
    Extract speaker embedding from audio for voice enrollment

    Args:
        audio: Audio file (10-30 seconds of user speaking)

    Returns:
        {"embedding": [512-dim array]}
    """
    temp_audio = None
    wav_path = None

    try:
        print(f"🎤 Voice enrollment request received (filename: {audio.filename}, content_type: {audio.content_type})")

        # Save uploaded audio to temp file with original extension
        ext = Path(audio.filename).suffix if audio.filename else ".webm"
        temp_audio = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
        temp_audio.write(await audio.read())
        temp_audio.close()

        # Always convert to proper WAV via pydub (handles mislabeled formats)
        wav_path = convert_to_wav(temp_audio.name)
        audio_path = wav_path

        # Extract speaker embedding from the whole file
        embedding = get_speaker_embedding(audio_path)

        if embedding is None:
            raise HTTPException(status_code=400, detail="Failed to extract voice embedding. Audio may be too short or invalid.")

        print(f"✅ Voice embedding extracted: shape={embedding.shape}")

        return {
            "embedding": embedding.tolist()
        }

    except Exception as e:
        print(f"❌ Voice enrollment failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Voice enrollment failed: {str(e)}")

    finally:
        # Cleanup
        if temp_audio and os.path.exists(temp_audio.name):
            os.unlink(temp_audio.name)
        if wav_path and os.path.exists(wav_path):
            os.unlink(wav_path)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "model_loaded": model is not None}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
