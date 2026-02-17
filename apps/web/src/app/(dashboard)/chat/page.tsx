'use client';

import { ChatPanel } from '@/components/chat/chat-panel';

function formatSessionDate(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00');
  const today = new Date();
  if (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  ) {
    return 'Today';
  }
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}

export default function ChatPage() {
  const date = new Date().toISOString().slice(0, 10);
  return (
    <div className="flex h-full flex-col">
      <ChatPanel date={date} subtitle={formatSessionDate(date)} />
    </div>
  );
}
