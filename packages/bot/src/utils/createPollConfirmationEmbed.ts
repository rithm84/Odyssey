import { EmbedBuilder } from 'discord.js';
import type { ParsedPollData } from '@/types/agent';

export function createPollConfirmationEmbed(pollData: ParsedPollData): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(0xF97316) // Orange color
    .setTitle('📊 Poll Preview')
    .setDescription(`**${pollData.title}**\n\nDoes this look correct?`)
    .setTimestamp();

  // Add poll type info
  if (pollData.pollType === 'embed') {
    embed.addFields({
      name: '📱 Poll Type',
      value: 'Discord Embed Poll (vote with buttons)',
      inline: true
    });

    embed.addFields({
      name: '🎯 Vote Type',
      value: pollData.voteType === 'single_choice' ? 'Single Choice' : 'Multiple Choice',
      inline: true
    });

    // Show options
    if (pollData.options && pollData.options.length > 0) {
      const optionsList = pollData.options
        .map(opt => `• ${opt.label}`)
        .join('\n');

      embed.addFields({
        name: '✅ Options',
        value: optionsList,
        inline: false
      });
    }
  } else {
    // Web-based availability poll
    embed.addFields({
      name: '🌐 Poll Type',
      value: 'Web Availability Grid (vote on web page)',
      inline: true
    });

    // Show date range
    if (pollData.dateOptions && pollData.dateOptions.length > 0) {
      const firstDateStr = pollData.dateOptions[0];
      const lastDateStr = pollData.dateOptions[pollData.dateOptions.length - 1];
      if (!firstDateStr || !lastDateStr) {
        return embed;
      }
      const firstDate = new Date(firstDateStr);
      const lastDate = new Date(lastDateStr);

      embed.addFields({
        name: '📅 Dates',
        value: `${firstDate.toLocaleDateString()} - ${lastDate.toLocaleDateString()} (${pollData.dateOptions.length} days)`,
        inline: false
      });
    }

    // Show time slots
    if (pollData.timeSlots && pollData.timeSlots.length > 0) {
      const firstSlot = pollData.timeSlots[0]?.label ?? pollData.timeSlots[0]?.time;
      const lastSlot = pollData.timeSlots[pollData.timeSlots.length - 1]?.label ?? pollData.timeSlots[pollData.timeSlots.length - 1]?.time;

      embed.addFields({
        name: '🕐 Time Slots',
        value: `${firstSlot} - ${lastSlot} (${pollData.timeSlots.length} slots, 1-hour blocks)`,
        inline: false
      });
    }
  }

  // Add privacy settings
  const privacySettings = [];
  if (pollData.isAnonymous) {
    privacySettings.push('🔒 Anonymous voting');
  }
  if (pollData.allowMaybe) {
    privacySettings.push('❔ "Maybe" option enabled');
  }

  if (privacySettings.length > 0) {
    embed.addFields({
      name: '⚙️ Settings',
      value: privacySettings.join('\n'),
      inline: false
    });
  }

  // Add attendee selection notice
  if (pollData.needsAttendeeSelection) {
    embed.addFields({
      name: '👥 Next Step',
      value: 'You\'ll be asked to select attendees after confirming.',
      inline: false
    });
  }

  return embed;
}
