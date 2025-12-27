import type { EnabledModules, EventType } from '@odyssey/shared/types/database';

/**
 * Get recommended module selections based on event type
 * Schedule and Attendees are always enabled (required)
 */
export function getRecommendedModules(eventType: EventType): EnabledModules {
  const base: EnabledModules = {
    schedule: true,      // Always required
    attendees: true,     // Always required
    group_dashboard: false,
    individual_packing: false,
    transportation: false,
    budget: false,
    weather: false
  };

  switch(eventType) {
    case 'trip':
      return {
        ...base,
        group_dashboard: true,
        individual_packing: true,
        transportation: true,
        budget: true,
        weather: true
      };

    case 'food':
    case 'social':
      return {
        ...base,
        group_dashboard: true,      // For potluck items
        transportation: false,
        budget: true,                // Split costs
        weather: true                // Outdoor gatherings
      };

    case 'sports':
    case 'gaming':
      return {
        ...base,
        transportation: true,        // Getting to venue
        weather: true                // Outdoor sports
      };

    case 'meeting':
      return base;                   // Minimal - just schedule & attendees

    case 'other':
    default:
      return base;                   // Start with minimal
  }
}
