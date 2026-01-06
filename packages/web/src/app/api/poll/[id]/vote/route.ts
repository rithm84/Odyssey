import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database, Poll, PollResponse } from '@odyssey/shared/types/database';

/**
 * POST /api/poll/[id]/vote
 * Submits or updates a user's poll response
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params;
    const body = await request.json();
    const { userId, availability, selectedOptionIds } = body;

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

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if poll exists and is not closed
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

    if (poll.closed_at) {
      return NextResponse.json(
        { error: 'Poll is closed' },
        { status: 403 }
      );
    }

    // Check if user has already voted
    const { data: existingResponseData, error: fetchError } = await supabase
      .from('poll_responses')
      .select('*')
      .eq('poll_id', pollId)
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    const existingResponse = existingResponseData as PollResponse | null;

    if (existingResponse) {
      // Update existing vote
      const updatePayload: Database['public']['Tables']['poll_responses']['Update'] = {
        has_voted: true
      };

      if (selectedOptionIds !== undefined) {
        updatePayload.selected_option_ids = selectedOptionIds;
      }
      if (availability !== undefined) {
        updatePayload.availability = availability as any;
      }

      const { error: updateError } = await ((supabase
        .from('poll_responses')
        .update as any)(updatePayload)
        .eq as any)('id', existingResponse.id);

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({
        success: true,
        message: 'Vote updated successfully'
      });
    } else {
      // Create new vote
      const voteInsert: Database['public']['Tables']['poll_responses']['Insert'] = {
        poll_id: pollId,
        user_id: userId,
        has_voted: true
      };

      if (selectedOptionIds !== undefined) {
        voteInsert.selected_option_ids = selectedOptionIds;
      }
      if (availability !== undefined) {
        voteInsert.availability = availability as any;
      }

      const { error: insertError } = await (supabase
        .from('poll_responses')
        .insert as any)(voteInsert);

      if (insertError) {
        throw insertError;
      }

      return NextResponse.json({
        success: true,
        message: 'Vote recorded successfully'
      });
    }

  } catch (error) {
    console.error('Error recording vote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
