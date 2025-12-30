import { EmbedBuilder } from 'discord.js';
import type { ParsedEventData } from '@/types/agent';

export function createConfirmationEmbed(eventData: ParsedEventData) {
  // Convert string dates back to Date objects if needed (from JSON parsing)
  const date = eventData.date ? new Date(eventData.date) : null;
  const startTime = eventData.startTime ? new Date(eventData.startTime) : null;
  const endTime = eventData.endTime ? new Date(eventData.endTime) : null;

  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle('🤖 I understood:')
    .addFields(
      { name: '📅 Event', value: eventData.name, inline: true },
      {
        name: '📆 Date',
        value: date
          ? date.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric'
            })
          : 'Unknown',
        inline: true
      },
      {
        name: '🕐 Time',
        value: startTime
          ? `${startTime.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit'
            })}${endTime ? ` - ${endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : ''}`
          : 'All day',
        inline: true
      },
      { name: '📍 Location', value: eventData.location, inline: true },
      { name: '🏷️ Type', value: capitalizeFirst(eventData.eventType), inline: true }
    )
    .setDescription('Would you like me to create this event?')
    .setTimestamp();

  return embed;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
