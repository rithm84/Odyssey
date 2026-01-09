import { Calendar, MapPin, Users, Tent } from "lucide-react";

interface EventHeaderProps {
  event: {
    name: string;
    description?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    location?: string | null;
    attendee_count: number;
  };
}

// Helper function to format date range
function formatDateRange(startDate?: string | null, endDate?: string | null): string {
  if (!startDate) return "Date TBD";

  // Parse dates manually to avoid UTC timezone issues
  // "2026-01-12" as new Date() → interprets as UTC midnight → shifts to previous day in PST
  const [startYearNum, startMonthNum, startDayNum] = startDate.split('-').map(Number);
  const start = new Date(startYearNum, startMonthNum - 1, startDayNum);

  let end = start;
  if (endDate) {
    const [endYearNum, endMonthNum, endDayNum] = endDate.split('-').map(Number);
    end = new Date(endYearNum, endMonthNum - 1, endDayNum);
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const startMonth = monthNames[start.getMonth()];
  const startDay = start.getDate();
  const year = start.getFullYear();

  // Single day event or same start and end date
  if (startDate === endDate || !endDate) {
    return `${startMonth} ${startDay}, ${year}`;
  }

  const endMonth = monthNames[end.getMonth()];
  const endDay = end.getDate();

  // Same month
  if (start.getMonth() === end.getMonth()) {
    return `${startMonth} ${startDay}-${endDay}, ${year}`;
  }

  // Different months
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
}

export function EventHeader({ event }: EventHeaderProps) {
  const formattedDate = formatDateRange(event.start_date, event.end_date);
  const attendeeText = event.attendee_count === 1 ? "1 Person" : `${event.attendee_count} People`;

  return (
    <div className="relative overflow-hidden rounded-3xl px-12 py-8 mb-8 shadow-glow group">
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute inset-0 hero-grid" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center animate-float">
              <Tent className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 mb-2">
                <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse-glow" />
                <span className="text-white/90 text-xs font-bold">ACTIVE EVENT</span>
              </div>
              <h1 className="text-5xl font-black text-white tracking-tight leading-tight">
                {event.name}
              </h1>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-5 py-3 transition-all hover:bg-white/20">
            <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-white/70 text-xs font-semibold uppercase tracking-wide">Date</div>
              <div className="text-white font-bold">{formattedDate}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-5 py-3 transition-all hover:bg-white/20">
            <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-white/70 text-xs font-semibold uppercase tracking-wide">Location</div>
              <div className="text-white font-bold">{event.location || "Location TBD"}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-5 py-3 transition-all hover:bg-white/20">
            <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-white/70 text-xs font-semibold uppercase tracking-wide">Attendees</div>
              <div className="text-white font-bold">{attendeeText}</div>
            </div>
          </div>
        </div>

        <p className="text-white/80 text-lg max-w-3xl leading-relaxed">
          {event.description || "No description available."}
        </p>
      </div>
    </div>
  );
}