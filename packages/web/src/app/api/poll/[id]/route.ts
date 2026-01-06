import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database, Poll, PollResponse } from '@odyssey/shared/types/database';

/**
 * GET /api/poll/[id]
 * Fetches poll data and all responses (aggregated if anonymous)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params;

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseKey);

    // Fetch poll
    const { data: pollData, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .eq('id', pollId)
      .single();

    if (pollError || !pollData) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    const poll: Poll = pollData;

    // Fetch all responses
    const { data: responsesData, error: responsesError } = await supabase
      .from('poll_responses')
      .select('*')
      .eq('poll_id', pollId);

    if (responsesError) {
      return NextResponse.json(
        { error: 'Error fetching responses' },
        { status: 500 }
      );
    }

    const responses: PollResponse[] = responsesData ?? [];

    // If anonymous, aggregate the data
    if (poll.is_anonymous) {
      return NextResponse.json({
        poll,
        responses: responses.map(r => ({
          id: r.id,
          poll_id: r.poll_id,
          selected_option_ids: r.selected_option_ids,
          availability: r.availability,
          has_voted: r.has_voted
          // Omit user_id for privacy
        })),
        isAnonymous: true
      });
    }

    // Return full data if not anonymous
    return NextResponse.json({
      poll,
      responses,
      isAnonymous: false
    });

  } catch (error) {
    console.error('Error fetching poll:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
