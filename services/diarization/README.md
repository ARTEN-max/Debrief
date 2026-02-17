# Speaker Diarization Service

This microservice provides speaker diarization capabilities using the WhoSpeaks algorithm with Coqui TTS voice embeddings.

## Features

- **Multi-speaker identification**: Automatically detects and labels different speakers
- **Integration with transcription**: Merges speaker labels with transcript segments
- **Fallback support**: Returns single speaker if service unavailable
- **RESTful API**: Easy integration with main application

## Quick Start

### 1. Install Dependencies

```bash
cd services/diarization
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Run the Service

```bash
python main.py
```

The service will start on `http://localhost:8001`

### 3. (Optional) Set Model Path

If you have a local Coqui XTTS v2 model, set the environment variable:

```bash
export COQUI_MODEL_PATH=/path/to/coqui/xtts_v2/model
```

Otherwise, the model will be downloaded automatically on first run (~2GB).

## API Endpoints

### POST /diarize

Perform speaker diarization on an audio file.

**Parameters:**

- `audio` (file): Audio file (WAV, MP3, etc.)
- `segments` (JSON string, optional): Transcript segments with timestamps

**Example:**

```bash
curl -X POST "http://localhost:8001/diarize" \
  -F "audio=@recording.wav" \
  -F 'segments=[{"start": 0.0, "end": 2.5, "text": "Hello"}]'
```

**Response:**

```json
{
  "speakers": ["speaker_0", "speaker_1"],
  "num_speakers": 2,
  "segments": [
    {
      "start": 0.0,
      "end": 2.5,
      "speaker": "speaker_0",
      "text": "Hello"
    }
  ]
}
```

### GET /health

Health check endpoint.

**Response:**

```json
{
  "status": "healthy",
  "model_loaded": true
}
```

## Integration with Main Application

The TypeScript API automatically calls this service during transcription:

1. Audio is uploaded and transcribed with OpenAI Whisper
2. Transcript segments are sent to diarization service
3. Speaker labels are merged with transcript segments
4. Results are stored in database

To enable/disable diarization, configure the `DIARIZATION_SERVICE_URL` in your API `.env`:

```env
DIARIZATION_SERVICE_URL=http://localhost:8001
```

If the service is unavailable, the system falls back to single speaker mode.

## Docker Deployment

```bash
docker build -t diarization-service .
docker run -p 8001:8001 diarization-service
```

## Performance Notes

- First request will download the model (~2GB) if not cached
- GPU recommended for faster processing
- Processing time: ~2-5 seconds per minute of audio (CPU)
- Processing time: ~0.5-1 second per minute of audio (GPU)

## Troubleshooting

### Model Download Issues

If automatic download fails, manually download the XTTS v2 model:

1. Visit https://github.com/coqui-ai/TTS/releases
2. Download XTTS v2 model
3. Set `COQUI_MODEL_PATH` environment variable

### Memory Issues

For long audio files, consider:

- Splitting into chunks
- Using GPU
- Increasing Python memory limits
