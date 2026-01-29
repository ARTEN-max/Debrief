'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft,
  FileAudio,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  RefreshCw,
  FileText,
  LayoutList,
} from 'lucide-react';
import { useRecordingWithPolling, useRetryDebrief, useRecordingJobs } from '@/hooks/use-recordings';
import { getDownloadUrl } from '@/lib/api';
import { useUserId } from '@/lib/auth';
import { cn } from '@komuchi/ui';

type Tab = 'debrief' | 'transcript';

const STATUS_CONFIG: Record<string, { icon: typeof Clock; label: string; color: string; animate?: boolean }> = {
  pending: { icon: Clock, label: 'Waiting', color: 'text-slate-500' },
  uploaded: { icon: Clock, label: 'Uploaded', color: 'text-blue-500' },
  processing: { icon: Loader2, label: 'Processing', color: 'text-amber-500', animate: true },
  running: { icon: Loader2, label: 'Running', color: 'text-amber-500', animate: true },
  complete: { icon: CheckCircle, label: 'Complete', color: 'text-emerald-500' },
  failed: { icon: AlertCircle, label: 'Failed', color: 'text-red-500' },
};

const MODE_LABELS = {
  general: 'General',
  meeting: 'Meeting',
  sales: 'Sales Call',
  interview: 'Interview',
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function ProcessingStatus() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16">
      <div className="relative mb-6">
        <div className="h-16 w-16 rounded-full border-4 border-slate-200" />
        <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-slate-900">Processing your recording</h3>
      <p className="text-sm text-slate-500">
        Transcribing audio and generating debrief...
      </p>
    </div>
  );
}

function TranscriptView({ text, segments }: { text: string; segments?: Array<{ start: number; end: number; text: string; speaker?: string }> | null }) {
  if (segments && segments.length > 0) {
    return (
      <div className="space-y-4">
        {segments.map((segment, idx) => (
          <div key={idx} className="group rounded-lg p-3 hover:bg-slate-50">
            <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
              <span className="font-mono">
                {Math.floor(segment.start / 60)}:{(segment.start % 60).toFixed(0).padStart(2, '0')}
              </span>
              {segment.speaker && (
                <>
                  <span>•</span>
                  <span className="font-medium text-slate-700">{segment.speaker}</span>
                </>
              )}
            </div>
            <p className="text-slate-700">{segment.text}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
      {text}
    </div>
  );
}

function DebriefView({ markdown }: { markdown: string }) {
  return (
    <div className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700 prose-strong:text-slate-900">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}

interface JobInfo {
  id: string;
  type: 'TRANSCRIBE' | 'DEBRIEF';
  status: string;
}

function JobsStatus({ jobs }: { jobs?: JobInfo[] }) {
  if (!jobs || jobs.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h4 className="mb-3 text-sm font-semibold text-slate-700">Processing Jobs</h4>
      <div className="space-y-2">
        {jobs.map((job) => {
          const config = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
          const Icon = config.icon;
          return (
            <div key={job.id} className="flex items-center justify-between text-sm">
              <span className="text-slate-600">
                {job.type === 'TRANSCRIBE' ? 'Transcription' : 'Debrief Generation'}
              </span>
              <span className={cn('flex items-center gap-1.5', config.color)}>
                <Icon className={cn('h-4 w-4', config.animate && 'animate-spin')} />
                {config.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function RecordingDetailPage() {
  const params = useParams();
  const recordingId = params.id as string;
  const userId = useUserId();
  const [activeTab, setActiveTab] = useState<Tab>('debrief');
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: recording, isLoading, isError } = useRecordingWithPolling(recordingId);
  const { data: jobs } = useRecordingJobs(recordingId);
  const retryDebrief = useRetryDebrief();

  const handleDownload = async () => {
    if (!recording) return;
    setIsDownloading(true);
    try {
      const { downloadUrl, filename } = await getDownloadUrl(userId, recordingId);
      // Open in new tab or trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'recording';
      link.click();
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRetryDebrief = () => {
    retryDebrief.mutate(recordingId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (isError || !recording) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-500" />
        <p className="font-medium text-red-800">Failed to load recording</p>
        <Link
          href="/recordings"
          className="mt-4 inline-flex items-center gap-2 text-sm text-red-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to recordings
        </Link>
      </div>
    );
  }

  // Check job statuses to determine actual state
  const hasFailedJob = jobs?.some((job) => job.status === 'failed');
  const hasTranscript = !!recording.transcript;
  const hasDebrief = !!recording.debrief;

  // Determine effective status
  const effectiveStatus = hasFailedJob && !hasDebrief ? 'failed' : recording.status;
  const statusConfig = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const isProcessing = (effectiveStatus === 'processing' || effectiveStatus === 'uploaded') && !hasFailedJob;
  const isComplete = effectiveStatus === 'complete';
  const isFailed = effectiveStatus === 'failed' || hasFailedJob;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/recordings"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to recordings
      </Link>

      {/* Header Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100">
              <FileAudio className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{recording.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium">
                  {MODE_LABELS[recording.mode]}
                </span>
                <span>{formatDuration(recording.duration)}</span>
                <span>•</span>
                <span>{formatDate(recording.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status badge */}
            <span className={cn('flex items-center gap-1.5 text-sm font-medium', statusConfig.color)}>
              <StatusIcon className={cn('h-4 w-4', statusConfig.animate && 'animate-spin')} />
              {statusConfig.label}
            </span>

            {/* Download button */}
            {recording.objectKey && (
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download
              </button>
            )}
          </div>
        </div>

        {/* Jobs status */}
        {isProcessing && (
          <div className="mt-6">
            <JobsStatus jobs={jobs} />
          </div>
        )}
      </div>

      {/* Processing state */}
      {isProcessing && <ProcessingStatus />}

      {/* Failed state */}
      {isFailed && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-500" />
          <p className="font-medium text-red-800">
            {hasTranscript && !hasDebrief ? 'Debrief generation failed' : 'Processing failed'}
          </p>
          <p className="mt-1 text-sm text-red-600">
            {hasTranscript && !hasDebrief
              ? 'The transcript was saved successfully, but debrief generation encountered an error.'
              : 'There was an error processing this recording.'}
          </p>
          {hasTranscript && !hasDebrief && (
            <button
              onClick={handleRetryDebrief}
              disabled={retryDebrief.isPending}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
            >
              <RefreshCw className={cn('h-4 w-4', retryDebrief.isPending && 'animate-spin')} />
              Retry Debrief Generation
            </button>
          )}
        </div>
      )}

      {/* Content tabs - show if we have transcript or debrief, even if failed */}
      {(isComplete || hasTranscript || hasDebrief) && (recording.transcript || recording.debrief) && (
        <div className="rounded-xl border border-slate-200 bg-white">
          {/* Tab headers */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('debrief')}
              className={cn(
                'flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors',
                activeTab === 'debrief'
                  ? 'border-b-2 border-emerald-500 text-emerald-600'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <LayoutList className="h-4 w-4" />
              Debrief
            </button>
            <button
              onClick={() => setActiveTab('transcript')}
              className={cn(
                'flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors',
                activeTab === 'transcript'
                  ? 'border-b-2 border-emerald-500 text-emerald-600'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <FileText className="h-4 w-4" />
              Transcript
            </button>
          </div>

          {/* Tab content */}
          <div className="p-6">
            {activeTab === 'debrief' && recording.debrief && (
              <DebriefView markdown={recording.debrief.markdown} />
            )}
            {activeTab === 'debrief' && !recording.debrief && (
              <p className="text-slate-500">No debrief available yet.</p>
            )}
            {activeTab === 'transcript' && recording.transcript && (
              <TranscriptView
                text={recording.transcript.text}
                segments={recording.transcript.segments}
              />
            )}
            {activeTab === 'transcript' && !recording.transcript && (
              <p className="text-slate-500">No transcript available yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
