import { NavBar } from "@/components/NavBar";
import { EventHeader } from "@/components/EventHeader";
import { ScheduleTimeline } from "@/components/ScheduleTimeline";
import { AttendeesModule } from "@/components/AttendeesModule";
import { GroupDashboard } from "@/components/GroupDashboard";
import { IndividualPackingList } from "@/components/IndividualPackingList";
import { TransportationModule } from "@/components/TransportationModule";
import { WeatherForecast } from "@/components/WeatherForecast";
import { BudgetModule } from "@/components/BudgetModule";

export default function EventDetail({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <EventHeader />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <ScheduleTimeline />
            <WeatherForecast />
            <BudgetModule />
          </div>
          
          <div className="space-y-6">
            <AttendeesModule />
            <GroupDashboard />
            <IndividualPackingList />
            <TransportationModule />
          </div>
        </div>
      </div>
    </div>
  );
}