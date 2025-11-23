import { Calendar, MapPin, Users, Tent } from "lucide-react";

export function EventHeader() {
  return (
    <div className="relative overflow-hidden rounded-3xl p-12 mb-8 shadow-glow group">
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />

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
                Weekend Camping Trip
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
              <div className="text-white font-bold">Nov 15-17, 2024</div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-5 py-3 transition-all hover:bg-white/20">
            <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-white/70 text-xs font-semibold uppercase tracking-wide">Location</div>
              <div className="text-white font-bold">Yosemite National Park</div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-5 py-3 transition-all hover:bg-white/20">
            <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-white/70 text-xs font-semibold uppercase tracking-wide">Attendees</div>
              <div className="text-white font-bold">12 People</div>
            </div>
          </div>
        </div>

        <p className="text-white/80 text-lg max-w-3xl leading-relaxed">
          Join us for an amazing weekend in nature! We'll be camping, hiking, and enjoying quality time together under the stars.
        </p>
      </div>
    </div>
  );
}