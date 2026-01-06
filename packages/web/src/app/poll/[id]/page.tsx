'use client';

import { use, useEffect, useState } from 'react';
import { AvailabilityGrid } from '@/components/poll/AvailabilityGrid';
import { AvailabilityHeatmap } from '@/components/poll/AvailabilityHeatmap';
import { HeatmapDetailView } from '@/components/poll/HeatmapDetailView';
import { PollHeader } from '@/components/poll/PollHeader';
import { BestTimes } from '@/components/poll/BestTimes';
import type { Poll, PollResponse, AvailabilityResponse } from '@odyssey/shared/types/database';

interface PollPageProps {
  params: Promise<{ id: string }>;
}

type ViewMode = 'standard' | 'detail';

export default function PollPage({ params }: PollPageProps) {
  const { id } = use(params);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [responses, setResponses] = useState<PollResponse[]>([]);
  const [userAvailability, setUserAvailability] = useState<AvailabilityResponse>({});
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('standard');
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  // Generate temporary user ID
  useEffect(() => {
    const tempUserId = localStorage.getItem('tempUserId') || `user_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('tempUserId', tempUserId);
    setUserId(tempUserId);
  }, []);

  // Fetch poll data
  useEffect(() => {
    async function fetchPoll() {
      try {
        const response = await fetch(`/api/poll/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch poll');
        }

        const data = await response.json();
        setPoll(data.poll);
        setResponses(data.responses);

        // Check if user has already voted
        if (userId) {
          const userResponse = data.responses.find((r: PollResponse) => r.user_id === userId);
          if (userResponse && userResponse.availability) {
            setUserAvailability(userResponse.availability as AvailabilityResponse);
            setHasVoted(true);
          }
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    }

    if (userId) {
      fetchPoll();
    }
  }, [id, userId]);

  // Submit vote
  const handleSubmitVote = async () => {
    if (!userId) {
      setError('User ID not available');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/poll/${id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          availability: userAvailability
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit vote');
      }

      setHasVoted(true);

      // Refresh poll data
      const pollResponse = await fetch(`/api/poll/${id}`);
      const pollData = await pollResponse.json();
      setResponses(pollData.responses);

      setSaving(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit vote');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading poll...</p>
        </div>
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive text-lg mb-2">Error loading poll</p>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Poll not found</p>
      </div>
    );
  }

  const isClosed = !!poll.closed_at;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Poll Header */}
        <PollHeader poll={poll} responseCount={responses.length} />

        {/* Availability Section */}
        {poll.date_options && poll.time_slots && (
          <>
            <div className="bg-card rounded-lg p-6 shadow-soft mb-6">
              {/* View Mode Toggle Button */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">
                  {viewMode === 'standard' ? 'Mark Your Availability' : 'Availability Overview'}
                </h2>
                <button
                  onClick={() => setViewMode(viewMode === 'standard' ? 'detail' : 'standard')}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all text-sm font-medium"
                >
                  {viewMode === 'standard' ? 'View Details' : 'Go Back'}
                </button>
              </div>

              {viewMode === 'standard' ? (
                /* Standard View: Grid on left, Heatmap on right */
                <div className="grid grid-cols-1 lg:grid-cols-[1fr,1fr] gap-2 max-w-5xl mx-auto">
                  {/* Left: Your Availability Grid */}
                  <div className="flex flex-col items-center">
                    <AvailabilityGrid
                      dateOptions={poll.date_options as string[]}
                      timeSlots={poll.time_slots}
                      availability={userAvailability}
                      onChange={setUserAvailability}
                      readonly={isClosed}
                    />

                    {/* Click or drag instruction and legend - under grid */}
                    <div className="ml-[75px]">
                      {!isClosed && (
                        <p className="text-center text-sm text-muted-foreground mt-4">
                          Click or drag to mark your availability
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 mt-3 justify-center text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-[hsl(var(--poll-available))]" />
                          <span>Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-[hsl(var(--poll-maybe))]" />
                          <span>If Necessary</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-[hsl(var(--poll-unavailable))]" />
                          <span>Not Available</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Group Availability Heatmap */}
                  <div className="flex flex-col items-center">
                    {responses.length > 0 ? (
                      <>
                        <AvailabilityHeatmap
                          dateOptions={poll.date_options as string[]}
                          timeSlots={poll.time_slots}
                          responses={responses}
                        />

                        {/* Gradient scale bar */}
                        <div className="w-[280px] ml-[75px] mt-4">
                          <div className="h-6 rounded-lg" style={{
                            background: 'linear-gradient(to right, hsl(var(--poll-unavailable)), #FFEECC, #FFD699, #FFB999, #FF9F66, #FF8533, #FF6B00)'
                          }} />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>0 available</span>
                            <span>{responses.length} available</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="bg-muted rounded-lg p-12 text-center mt-10">
                        <p className="text-muted-foreground">
                          No responses yet. Be the first to vote!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Detail View: Heatmap on left, Details on right */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 max-w-5xl mx-auto">
                  {/* Left: Interactive Heatmap */}
                  <div className="flex flex-col items-center">
                    {responses.length > 0 ? (
                      <>
                        <AvailabilityHeatmap
                          dateOptions={poll.date_options as string[]}
                          timeSlots={poll.time_slots}
                          responses={responses}
                          onHoverCell={setHoveredCell}
                          hoveredCell={hoveredCell}
                        />

                        {/* Gradient scale bar */}
                        <div className="w-[280px] ml-[75px] mt-4">
                          <div className="h-6 rounded-lg" style={{
                            background: 'linear-gradient(to right, hsl(var(--poll-unavailable)), #FFEECC, #FFD699, #FFB999, #FF9F66, #FF8533, #FF6B00)'
                          }} />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>0 available</span>
                            <span>{responses.length} available</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="bg-muted rounded-lg p-12 text-center mt-10">
                        <p className="text-muted-foreground">
                          No responses yet
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right: Hover Details */}
                  <div className="mt-8">
                    <HeatmapDetailView
                      hoveredCell={hoveredCell}
                      dateOptions={poll.date_options as string[]}
                      timeSlots={poll.time_slots}
                      responses={responses}
                      isAnonymous={poll.is_anonymous}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button (only in standard view) */}
            {!isClosed && viewMode === 'standard' && (
              <div className="mb-6 flex gap-4 items-center">
                <button
                  onClick={handleSubmitVote}
                  disabled={saving}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {saving ? 'Saving...' : hasVoted ? 'Update Vote' : 'Submit Vote'}
                </button>

                {hasVoted && (
                  <span className="text-sm text-muted-foreground">
                    You&apos;ve already voted. You can update your response anytime.
                  </span>
                )}

                {error && (
                  <span className="text-sm text-destructive">
                    {error}
                  </span>
                )}
              </div>
            )}

            {/* Best Times Section */}
            {responses.length > 0 && (
              <BestTimes
                dateOptions={poll.date_options as string[]}
                timeSlots={poll.time_slots}
                responses={responses}
              />
            )}

            {/* Closed poll message */}
            {isClosed && (
              <div className="bg-muted rounded-lg p-6 text-center mt-6">
                <p className="text-lg font-medium">
                  This poll was closed on {new Date(poll.closed_at!).toLocaleString()}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
