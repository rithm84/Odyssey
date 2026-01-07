import { EmbedBuilder } from 'discord.js';
import type { ParsedEventData } from '@/types/agent';

export function createConfirmationEmbed(eventData: ParsedEventData) {
  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle('🤖 I understood:')
    .setDescription('Would you like me to create this event?')
    .setTimestamp();

  // Event name
  embed.addFields({ name: '📅 Event', value: eventData.name, inline: true });

  // Date range
  let dateDisplay = 'Unknown';
  if (eventData.startDate && eventData.endDate) {
    const start = new Date(eventData.startDate + 'T00:00:00');
    const end = new Date(eventData.endDate + 'T00:00:00');

    // Check if single-day or multi-day event
    if (eventData.startDate === eventData.endDate) {
      // Single-day event
      dateDisplay = start.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });
    } else {
      // Multi-day event - show date range
      const sameYear = start.getFullYear() === end.getFullYear();

      const startFormatted = start.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: sameYear ? undefined : 'numeric'  // Show year on both if different years
      });

      const endFormatted = end.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: sameYear ? undefined : 'numeric'  // Show year on both if different years
      });

      dateDisplay = `${startFormatted} - ${endFormatted}`;
    }
  }
  embed.addFields({ name: '📆 Date', value: dateDisplay, inline: true });

  // Time
  let timeDisplay = 'All day';

  // Check if multi-day event
  const isMultiDay = eventData.startDate !== eventData.endDate;

  if (isMultiDay) {
    // Multi-day events always show "All day"
    timeDisplay = 'All day';
  } else if (eventData.startTime) {
    // Single-day event with time
    const [startHour, startMin] = eventData.startTime.split(':');
    const startHourNum = parseInt(startHour ?? '0', 10);
    const startPeriod = startHourNum >= 12 ? 'PM' : 'AM';
    const startDisplayHour = startHourNum > 12 ? startHourNum - 12 : startHourNum === 0 ? 12 : startHourNum;

    if (eventData.endTime) {
      const [endHour, endMin] = eventData.endTime.split(':');
      const endHourNum = parseInt(endHour ?? '0', 10);
      const endPeriod = endHourNum >= 12 ? 'PM' : 'AM';
      const endDisplayHour = endHourNum > 12 ? endHourNum - 12 : endHourNum === 0 ? 12 : endHourNum;

      timeDisplay = `${startDisplayHour}:${startMin} ${startPeriod} - ${endDisplayHour}:${endMin} ${endPeriod}`;
    } else {
      timeDisplay = `${startDisplayHour}:${startMin} ${startPeriod}`;
    }
  }
  embed.addFields({ name: '🕐 Time', value: timeDisplay, inline: true });

  // Location
  embed.addFields({ name: '📍 Location', value: eventData.location, inline: true });

  // Event type
  embed.addFields({ name: '🏷️ Type', value: capitalizeFirst(eventData.eventType), inline: true });

  return embed;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
