import { Calendar, MapPin } from "lucide-react";

export function EventHeader() {
  return (
    <div className="relative overflow-hidden rounded-2xl p-8 mb-6 shadow-medium">
      <div className="absolute inset-0 gradient-hero opacity-90" />
      <div className="relative z-10">
        <h1 className="text-4xl font-bold text-white mb-4">Weekend Camping Trip</h1>
        <div className="flex flex-wrap gap-4 text-white/90 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span>Nov 15-17, 2024</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            <span>Yosemite National Park</span>
          </div>
        </div>
        <p className="text-white/80 max-w-2xl">
          Join us for an amazing weekend in nature! We'll be camping, hiking, and enjoying quality time together under the stars.
        </p>
      </div>
    </div>
  );
}