'use client';

import type { Poll } from '@odyssey/shared/types/database';

interface PollHeaderProps {
  poll: Poll;
  responseCount: number;
}

export function PollHeader({ poll, responseCount }: PollHeaderProps) {
  const isClosed = !!poll.closed_at;

  return (
    <div className="mb-8">
      <h1 className="text-4xl font-bold mb-2">{poll.title}</h1>
      {poll.description && (
        <p className="text-lg text-muted-foreground mb-4">{poll.description}</p>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        {isClosed && (
          <span className="px-3 py-1 bg-destructive/20 text-destructive rounded-full font-medium">
            Poll Closed
          </span>
        )}
        {poll.is_anonymous && (
          <span className="px-3 py-1 bg-secondary/20 text-secondary-foreground rounded-full font-medium">
            Anonymous
          </span>
        )}
        <span className="px-3 py-1 bg-muted rounded-full font-medium">
          {responseCount} response{responseCount !== 1 ? 's' : ''}
        </span>
        {poll.deadline && !isClosed && (
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full font-medium">
            Deadline: {new Date(poll.deadline).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}
