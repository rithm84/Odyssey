// Shared utilities for event handling and formatting

// Map event types to readable labels
export const eventTypeLabels: Record<string, string> = {
  social: "Social",
  trip: "Trip",
  meeting: "Meeting",
  sports: "Sports",
  food: "Food & Dining",
  gaming: "Gaming",
  other: "Other",
};

// Generate gradient colors based on guild name hash
export function getGuildGradient(guildName: string): string {
  const gradients = [
    "from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-indigo-600",
    "from-pink-500 to-orange-500 dark:from-fuchsia-600 dark:to-indigo-700",
    "from-blue-500 to-indigo-500 dark:from-indigo-600 dark:to-blue-800",
    "from-orange-500 to-amber-600 dark:from-orange-600 dark:to-indigo-700",
    "from-green-500 to-emerald-500 dark:from-teal-600 dark:to-indigo-700",
    "from-purple-500 to-pink-500 dark:from-purple-600 dark:to-indigo-700",
    "from-red-500 to-rose-500 dark:from-red-600 dark:to-indigo-700",
    "from-cyan-500 to-blue-500 dark:from-cyan-600 dark:to-indigo-700",
  ];

  // Better hash function to reduce collisions (FNV-1a hash)
  let hash = 2166136261;
  for (let i = 0; i < guildName.length; i++) {
    hash ^= guildName.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  // Make hash positive and get index
  hash = Math.abs(hash);
  return gradients[hash % gradients.length] || gradients[0];
}

// Convert time string (e.g., "1:30 PM", "12:00 AM") to minutes since midnight for sorting
export function timeToMinutes(timeStr: string | null): number {
  if (!timeStr) return Infinity; // Events without time sort last

  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return Infinity;

  let [, hours, minutes, period] = match;
  let hour = parseInt(hours);
  const min = parseInt(minutes);

  // Convert to 24-hour format
  if (period.toUpperCase() === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period.toUpperCase() === 'AM' && hour === 12) {
    hour = 0;
  }

  return hour * 60 + min;
}
