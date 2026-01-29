'use client';

import { usePathname } from 'next/navigation';

const pageTitles: Record<string, string> = {
  '/recordings': 'Recordings',
  '/recordings/new': 'New Recording',
};

export function Header() {
  const pathname = usePathname();

  // Get title from pathname
  let title = pageTitles[pathname];

  // Check for dynamic routes (e.g., /recordings/[id])
  if (!title && pathname.startsWith('/recordings/')) {
    title = 'Recording Details';
  }

  return (
    <header className="flex h-16 items-center border-b border-slate-200 bg-white px-6">
      <h1 className="text-xl font-semibold text-slate-900">{title || 'Komuchi'}</h1>
    </header>
  );
}
