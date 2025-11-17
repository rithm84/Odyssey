import { NavBar } from "@/components/NavBar";
import { EventHeader } from "@/components/EventHeader";
import { ScheduleTimeline } from "@/components/ScheduleTimeline";
import { AttendeesModule } from "@/components/AttendeesModule";
import { GroupDashboard } from "@/components/GroupDashboard";
import { IndividualPackingList } from "@/components/IndividualPackingList";
import { TransportationModule } from "@/components/TransportationModule";
import { WeatherForecast } from "@/components/WeatherForecast";
import { BudgetModule } from "@/components/BudgetModule";

export default function EventDetail({ params }: { params: { id: string } }) { // Next.js will inject parameters when user visits a page like '/event/1'
  return (
    <div className="min-h-screen bg-background"> {/* div containing full webpage area */}
      <NavBar />
      <div className="container mx-auto px-4 py-8 max-w-7xl"> {/* div for all page content */}
        <EventHeader />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"> {/* grid layout for event modules, the 2 internal divs determine the 2 columns when that happens */}
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