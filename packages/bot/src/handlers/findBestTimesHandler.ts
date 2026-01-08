import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  MessageFlags
} from 'discord.js';
import { supabase } from '@/lib/supabase';
import type { Poll, PollResponse, AvailabilityResponse, TimeSlot } from '@odyssey/shared/types/database';

interface SlotAvailability {
  availableCount: number;
  ifNecessaryCount: number;
  unavailableCount: number;
}

interface WindowScore {
  date: string;
  startTime: string;
  endTime: string;
  startSlotIndex: number;
  minAvailable: number;
  avgAvailable: number;
  avgIfNecessary: number;
  compositeScore: number;
  slotDetails: SlotAvailability[];
  guaranteedUsers: string[];
  ifNecessaryUsers: string[];
  missingUsers: string[];
}

const getCellKey = (date: string, timeSlot: string): string => {
  return `${date}T${timeSlot}`;
};

// Calculate the end time for a time slot (1 hour later)
const getSlotEndTime = (timeStr: string): string => {
  // Parse time like "17:00" or "5:00 PM" or "12 PM"
  const match24h = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  const match12h = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  const match12hNoMinutes = timeStr.match(/^(\d{1,2})\s*(AM|PM)$/i);

  let hours: number;
  let minutes: number;

  if (match24h) {
    hours = parseInt(match24h[1] ?? '0');
    minutes = parseInt(match24h[2] ?? '0');
  } else if (match12h) {
    hours = parseInt(match12h[1] ?? '0');
    minutes = parseInt(match12h[2] ?? '0');
    const period = match12h[3]?.toUpperCase() ?? 'AM';

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
  } else if (match12hNoMinutes) {
    hours = parseInt(match12hNoMinutes[1] ?? '0');
    minutes = 0;
    const period = match12hNoMinutes[2]?.toUpperCase() ?? 'AM';

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
  } else {
    return timeStr; // Fallback if we can't parse
  }

  // Add 1 hour
  hours += 1;
  if (hours >= 24) hours -= 24;

  // Format back to 12-hour format
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

  return minutes === 0
    ? `${displayHours} ${period}`
    : `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Calculate availability for a specific date/time slot
const calculateSlotAvailability = (
  date: string,
  slot: TimeSlot,
  responses: PollResponse[]
): SlotAvailability => {
  const key = getCellKey(date, slot.time);
  let availableCount = 0;
  let ifNecessaryCount = 0;
  let unavailableCount = 0;

  responses.forEach(response => {
    const availability = response.availability as AvailabilityResponse;
    if (!availability) return;

    const status = availability[key];
    if (status === 'available') availableCount++;
    else if (status === 'maybe') ifNecessaryCount++;
    else unavailableCount++;
  });

  return { availableCount, ifNecessaryCount, unavailableCount };
};

// Categorize users by their availability for a window
const categorizeUsers = (
  date: string,
  windowSlots: TimeSlot[],
  durationHours: number,
  responses: PollResponse[]
): { guaranteed: string[]; ifNecessary: string[]; missing: string[] } => {
  // Calculate threshold based on duration
  let threshold: number;
  if (durationHours >= 1 && durationHours <= 3) {
    threshold = 1;
  } else if (durationHours >= 4 && durationHours <= 6) {
    // Round down
    threshold = Math.floor(durationHours * 0.25);
  } else {
    // Round up for 7+ hours
    threshold = Math.ceil(durationHours * 0.25);
  }

  const guaranteed: string[] = [];
  const ifNecessary: string[] = [];
  const missing: string[] = [];

  responses.forEach(response => {
    const availability = response.availability as AvailabilityResponse;
    if (!availability) return;

    let availableSlots = 0;
    let maybeSlots = 0;
    let unavailableSlots = 0;

    windowSlots.forEach(slot => {
      const key = getCellKey(date, slot.time);
      const status = availability[key];
      if (status === 'available') availableSlots++;
      else if (status === 'maybe') maybeSlots++;
      else unavailableSlots++;
    });

    // Guaranteed: available for ALL slots
    if (availableSlots === windowSlots.length) {
      guaranteed.push(response.user_id);
    }
    // Missing: unavailable for threshold or more slots
    else if (unavailableSlots >= threshold || (unavailableSlots + maybeSlots) >= threshold) {
      missing.push(response.user_id);
    }
    // If necessary: everyone else (available for some, maybe for some)
    else {
      ifNecessary.push(response.user_id);
    }
  });

  return { guaranteed, ifNecessary, missing };
};

// Calculate best time windows using hybrid scoring
const calculateBestTimeWindows = (
  dateOptions: string[],
  timeSlots: TimeSlot[],
  responses: PollResponse[],
  eventDuration?: number
): WindowScore[] => {
  if (!eventDuration || eventDuration <= 0) {
    return calculateBestSingleSlots(dateOptions, timeSlots, responses);
  }

  const slotsPerWindow = Math.ceil(eventDuration / 60); // Convert minutes to hours
  const windows: WindowScore[] = [];

  // Determine weights based on event duration
  const isLongEvent = eventDuration > 300; // > 5 hours
  const weights = isLongEvent
    ? { avg: 0.60, min: 0.25, ifNecessary: 0.15 }
    : { avg: 0.50, min: 0.35, ifNecessary: 0.15 };

  dateOptions.forEach(date => {
    // Create sliding windows
    for (let i = 0; i <= timeSlots.length - slotsPerWindow; i++) {
      const windowSlots = timeSlots.slice(i, i + slotsPerWindow);

      // Calculate availability for each slot in window
      const slotStats = windowSlots.map(slot =>
        calculateSlotAvailability(date, slot, responses)
      );

      // Extract metrics
      const availableCounts = slotStats.map(s => s.availableCount);
      const ifNecessaryCounts = slotStats.map(s => s.ifNecessaryCount);

      const minAvailable = Math.min(...availableCounts);
      const avgAvailable = availableCounts.reduce((a, b) => a + b, 0) / availableCounts.length;
      const avgIfNecessary = ifNecessaryCounts.reduce((a, b) => a + b, 0) / ifNecessaryCounts.length;

      // Calculate composite score
      const compositeScore =
        (weights.avg * avgAvailable) +
        (weights.min * minAvailable) +
        (weights.ifNecessary * avgIfNecessary);

      // Categorize users by availability
      const userCategories = categorizeUsers(date, windowSlots, slotsPerWindow, responses);

      // Get end time - this is the end of the last slot in the window
      const lastSlot = windowSlots[windowSlots.length - 1];
      const endTime = lastSlot?.label
        ? getSlotEndTime(lastSlot.label)
        : getSlotEndTime(lastSlot?.time ?? '17:00');

      windows.push({
        date,
        startTime: windowSlots[0]?.time ?? '9:00',
        endTime,
        startSlotIndex: i,
        minAvailable,
        avgAvailable,
        avgIfNecessary,
        compositeScore,
        slotDetails: slotStats,
        guaranteedUsers: userCategories.guaranteed,
        ifNecessaryUsers: userCategories.ifNecessary,
        missingUsers: userCategories.missing
      });
    }
  });

  // Sort by composite score (descending) and return top 3
  return windows
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .slice(0, 3)
    .filter(window => window.minAvailable > 0);
};

// Fallback for when no duration is specified (show individual slots)
const calculateBestSingleSlots = (
  dateOptions: string[],
  timeSlots: TimeSlot[],
  responses: PollResponse[]
): WindowScore[] => {
  const slots: WindowScore[] = [];

  dateOptions.forEach(date => {
    timeSlots.forEach((slot, index) => {
      const stats = calculateSlotAvailability(date, slot, responses);

      const compositeScore = stats.availableCount + (stats.ifNecessaryCount * 0.5);

      const endTime = slot.label
        ? getSlotEndTime(slot.label)
        : getSlotEndTime(slot.time);

      // For single slots, categorize users
      const userCategories = categorizeUsers(date, [slot], 1, responses);

      slots.push({
        date,
        startTime: slot.time,
        endTime,
        startSlotIndex: index,
        minAvailable: stats.availableCount,
        avgAvailable: stats.availableCount,
        avgIfNecessary: stats.ifNecessaryCount,
        compositeScore,
        slotDetails: [stats],
        guaranteedUsers: userCategories.guaranteed,
        ifNecessaryUsers: userCategories.ifNecessary,
        missingUsers: userCategories.missing
      });
    });
  });

  return slots
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .slice(0, 3)
    .filter(slot => slot.minAvailable > 0);
};

const formatWindowDisplay = (window: WindowScore, timeSlots: TimeSlot[]): string => {
  const dateObj = new Date(window.date + 'T00:00:00');
  const month = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = dateObj.getDate();

  const startSlot = timeSlots.find(s => s.time === window.startTime);
  const startLabel = startSlot?.label || window.startTime;

  return `${month} ${day} from ${startLabel} to ${window.endTime}`;
};

export async function handleFindBestTimes(interaction: ChatInputCommandInteraction) {
  const pollId = interaction.options.getString('poll', true);

  try {
    // Fetch poll data
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      await interaction.reply({
        content: 'Error: Poll not found.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    // Verify it's an availability grid poll
    if (poll.vote_type !== 'availability_grid') {
      await interaction.reply({
        content: 'Error: This command only works with availability grid polls.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    // Fetch poll responses
    const { data: responses, error: responsesError } = await supabase
      .from('poll_responses')
      .select('*')
      .eq('poll_id', pollId);

    if (responsesError) {
      throw new Error(`Failed to fetch responses: ${responsesError.message}`);
    }

    if (!responses || responses.length === 0) {
      await interaction.reply({
        content: 'No responses yet for this poll. Ask people to vote first!',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    // Calculate best times
    const dateOptions = poll.date_options as string[];
    const timeSlots = poll.time_slots as TimeSlot[];
    const bestWindows = calculateBestTimeWindows(
      dateOptions,
      timeSlots,
      responses as PollResponse[],
      poll.event_duration || undefined
    );

    if (bestWindows.length === 0) {
      await interaction.reply({
        content: 'Could not find any time slots where people are available.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    // Create embed
    const embed = new EmbedBuilder()
      .setColor(0xF97316) // Orange
      .setTitle(`📊 Best Times: ${poll.title}`)
      .setDescription(`Based on ${responses.length} response${responses.length !== 1 ? 's' : ''}`)
      .setTimestamp();

    // Add each best time window
    bestWindows.forEach((window, index) => {
      const timeDisplay = formatWindowDisplay(window, timeSlots);
      const scorePercentage = Math.round((window.compositeScore / responses.length) * 100);

      // Build user info string
      const userInfo: string[] = [];
      if (window.guaranteedUsers.length > 0) {
        userInfo.push(`✅ **${window.guaranteedUsers.length} guaranteed**`);
      }
      if (window.ifNecessaryUsers.length > 0) {
        userInfo.push(`⚠️ **${window.ifNecessaryUsers.length} likely**`);
      }
      if (window.missingUsers.length > 0) {
        userInfo.push(`❌ **${window.missingUsers.length} unlikely**`);
      }

      embed.addFields({
        name: `#${index + 1} - ${timeDisplay} (${scorePercentage}% availability score)`,
        value: userInfo.join('\n') || 'No availability data',
        inline: false
      });
    });

    // Add button to view poll webpage
    const pollUrl = `${process.env.WEB_APP_URL || 'http://localhost:3000'}/poll/${poll.id}`;
    const button = new ButtonBuilder()
      .setLabel('View Full Poll')
      .setStyle(ButtonStyle.Link)
      .setURL(pollUrl);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });

  } catch (error) {
    console.error('Error finding best times:', error);
    await interaction.reply({
      content: 'Sorry, there was an error finding the best times. Please try again.',
      flags: MessageFlags.Ephemeral
    });
  }
}
