import { EmbedBuilder } from 'discord.js';
import type { ParsedEventData } from '@/types/agent';

export function createConfirmationEmbed(eventData: ParsedEventData) {
  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle('🤖 I understood:')
    .addFields(
      { name: '📅 Event', value: eventData.name, inline: true },
      {
        name: '📆 Date',
        value: eventData.date
          ? eventData.date.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric'
            })
          : 'Unknown',
        inline: true
      },
      {
        name: '🕐 Time',
        value: eventData.startTime
          ? `${eventData.startTime.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit'
            })}${eventData.endTime ? ` - ${eventData.endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : ''}`
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
