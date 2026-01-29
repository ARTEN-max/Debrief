'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Upload, FileAudio, X, Loader2, CheckCircle } from 'lucide-react';
import { useUploadRecording } from '@/hooks/use-recordings';
import { cn } from '@komuchi/ui';

const MODES = [
  { value: 'general', label: 'General', description: 'General conversation or discussion' },
  { value: 'meeting', label: 'Meeting', description: 'Team meetings and standups' },
  { value: 'sales', label: 'Sales Call', description: 'Sales conversations and demos' },
  { value: 'interview', label: 'Interview', description: 'Job interviews and screenings' },
];

const ACCEPTED_TYPES = {
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/webm': ['.webm'],
  'audio/ogg': ['.ogg'],
  'audio/mp4': ['.mp4', '.m4a'],
  'audio/x-m4a': ['.m4a'],
  'audio/flac': ['.flac'],
};

type UploadStep = 'select' | 'uploading' | 'processing' | 'complete' | 'error';

export default function NewRecordingPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState('general');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [step, setStep] = useState<UploadStep>('select');
  const [error, setError] = useState<string | null>(null);

  const uploadMutation = useUploadRecording();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const audioFile = acceptedFiles[0];
    if (audioFile) {
      setFile(audioFile);
      // Auto-set title from filename
      if (!title) {
        const nameWithoutExt = audioFile.name.replace(/\.[^/.]+$/, '');
        setTitle(nameWithoutExt);
      }
    }
  }, [title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    maxSize: 500 * 1024 * 1024, // 500MB
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    setStep('uploading');
    setError(null);

    try {
      const result = await uploadMutation.mutateAsync({
        file,
        title,
        mode,
        onProgress: setUploadProgress,
      });

      setStep('complete');
      
      // Redirect to recording detail after a short delay
      setTimeout(() => {
        router.push(`/recordings/${result.recordingId}`);
      }, 1500);
    } catch (err) {
      setStep('error');
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const handleReset = () => {
    setFile(null);
    setTitle('');
    setMode('general');
    setUploadProgress(0);
    setStep('select');
    setError(null);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* File Upload */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Upload Audio</h2>

          {!file ? (
            <div
              {...getRootProps()}
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors',
                isDragActive
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50'
              )}
            >
              <input {...getInputProps()} />
              <Upload className="mb-4 h-12 w-12 text-slate-400" />
              <p className="mb-2 text-center text-sm font-medium text-slate-900">
                {isDragActive ? 'Drop your audio file here' : 'Drag & drop your audio file'}
              </p>
              <p className="text-center text-xs text-slate-500">
                or click to select • MP3, WAV, M4A, WebM, OGG • Max 500MB
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-4 rounded-lg bg-slate-50 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                <FileAudio className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-slate-900">{file.name}</p>
                <p className="text-sm text-slate-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              {step === 'select' && (
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Title Input */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <label htmlFor="title" className="mb-2 block text-lg font-semibold text-slate-900">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title for this recording"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            disabled={step !== 'select'}
          />
        </div>

        {/* Mode Selector */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Recording Type</h2>
          <div className="grid grid-cols-2 gap-3">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMode(m.value)}
                disabled={step !== 'select'}
                className={cn(
                  'rounded-lg border-2 p-4 text-left transition-colors',
                  mode === m.value
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <p className="font-medium text-slate-900">{m.label}</p>
                <p className="mt-1 text-xs text-slate-500">{m.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Progress / Status */}
        {step !== 'select' && (
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            {step === 'uploading' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                  <span className="font-medium text-slate-900">Uploading...</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-slate-500">{uploadProgress}% complete</p>
              </div>
            )}

            {step === 'complete' && (
              <div className="flex items-center gap-3 text-emerald-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Upload complete! Redirecting...</span>
              </div>
            )}

            {step === 'error' && (
              <div className="space-y-4">
                <p className="text-red-600">{error}</p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        {step === 'select' && (
          <button
            type="submit"
            disabled={!file || !title}
            className={cn(
              'w-full rounded-xl py-4 text-lg font-semibold transition-colors',
              file && title
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'cursor-not-allowed bg-slate-200 text-slate-400'
            )}
          >
            Upload & Process
          </button>
        )}
      </form>
    </div>
  );
}
