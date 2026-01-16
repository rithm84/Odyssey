'use client';

import type { Poll } from '@odyssey/shared/types/database';

interface PollHeaderProps {
  poll: Poll;
  responseCount: number;
}

export function PollHeader({ poll, responseCount }: PollHeaderProps) {
  const isClosed = !!poll.closed_at;

  return (
    <div className="mb-8 border-brutal bg-card p-6 shadow-brutal">
      <h1 className="text-4xl font-black mb-2 uppercase tracking-tight">{poll.title}</h1>
      {poll.description && (
        <p className="text-lg text-muted-foreground mb-4 font-medium">{poll.description}</p>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        {isClosed && (
          <span className="px-3 py-1 bg-destructive text-white dark:text-black border-2 border-black dark:border-white font-bold uppercase">
            Poll Closed
          </span>
        )}
        {poll.is_anonymous && (
          <span className="px-3 py-1 bg-secondary text-white dark:text-black border-2 border-black dark:border-white font-bold uppercase">
            Anonymous
          </span>
        )}
        <span className="px-3 py-1 bg-muted border-2 border-border font-bold uppercase">
          {responseCount} response{responseCount !== 1 ? 's' : ''}
        </span>
        {poll.deadline && !isClosed && (
          <span className="px-3 py-1 bg-primary text-white dark:text-black border-2 border-black dark:border-white font-bold uppercase">
            Deadline: {new Date(poll.deadline).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}
