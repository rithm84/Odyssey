import { NavBar } from "@/components/NavBar";
import { EventHeader } from "@/components/EventHeader";
import { ScheduleTimeline } from "@/components/ScheduleTimeline";
import { AttendeesModule } from "@/components/AttendeesModule";
import { GroupDashboard } from "@/components/GroupDashboard";
import { IndividualPackingList } from "@/components/IndividualPackingList";
import { TransportationModule } from "@/components/TransportationModule";
import { WeatherForecast } from "@/components/WeatherForecast";
import { BudgetModule } from "@/components/BudgetModule";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function EventDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: eventId } = await params;
  const supabase = await createClient();

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/");
  }

  // Fetch event details
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    redirect("/");
  }

  // Count attendees
  const { count: attendeeCount } = await supabase
    .from("event_members")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);

  const eventData = {
    ...event,
    attendee_count: attendeeCount || 0,
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 gradient-mesh" />
      <div className="absolute inset-0 grid-overlay-dots" />

      <NavBar />

      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        <EventHeader event={eventData} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="animate-slide-up stagger-1">
              <ScheduleTimeline eventId={eventId} />
            </div>
            <div className="animate-slide-up stagger-2">
              <WeatherForecast />
            </div>
            <div className="animate-slide-up stagger-3">
              <BudgetModule />
            </div>
          </div>

          <div className="space-y-6">
            <div className="animate-slide-up stagger-2">
              <AttendeesModule />
            </div>
            <div className="animate-slide-up stagger-3">
              <GroupDashboard />
            </div>
            <div className="animate-slide-up stagger-4">
              <IndividualPackingList />
            </div>
            <div className="animate-slide-up stagger-5">
              <TransportationModule />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}