import { NavBar } from "@/components/NavBar";
import { Calendar, MapPin, Users, Sparkles } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const events = [
  {
    id: 1,
    name: "Weekend Camping Trip",
    server: "Adventure Club",
    serverColor: "from-emerald-500 to-teal-600",
    date: "Nov 15-17, 2024",
    location: "Yosemite National Park",
    attendees: 12,
    description: "Join us for an amazing weekend in nature!",
    type: "Outdoor Adventure"
  },
  {
    id: 2,
    name: "Game Night",
    server: "Friends Group",
    serverColor: "from-pink-500 to-rose-600",
    date: "Nov 20, 2024",
    location: "Mike's Place",
    attendees: 8,
    description: "Board games, video games, and fun times!",
    type: "Social"
  },
  {
    id: 3,
    name: "Hackathon 2024",
    server: "UCLA Coding Club",
    serverColor: "from-blue-500 to-cyan-600",
    date: "Dec 1-3, 2024",
    location: "UCLA Campus",
    attendees: 45,
    description: "48-hour coding challenge with amazing prizes",
    type: "Tech Event"
  },
  {
    id: 4,
    name: "Thanksgiving Dinner",
    server: "Family",
    serverColor: "from-red-500 to-orange-600",
    date: "Nov 28, 2024",
    location: "Mom's House",
    attendees: 15,
    description: "Annual family gathering and feast",
    type: "Family"
  },
  {
    id: 5,
    name: "Beach Cleanup",
    server: "Eco Warriors",
    serverColor: "from-green-500 to-emerald-600",
    date: "Nov 25, 2024",
    location: "Santa Monica Beach",
    attendees: 32,
    description: "Help keep our beaches clean!",
    type: "Community Service"
  }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 gradient-mesh pointer-events-none" />
      <div className="absolute inset-0 grid-overlay-dots pointer-events-none" />

      <NavBar />

      <div className="container mx-auto px-4 py-12 max-w-7xl relative z-10">

        <div className="relative overflow-hidden rounded-3xl p-16 mb-16 shadow-glow group">
          <div className="absolute inset-0 gradient-hero" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />

          <div className="relative z-10 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
              <Sparkles className="h-4 w-4 text-white animate-pulse-glow" />
              <span className="text-white/90 text-sm font-medium">Unified Event Management</span>
            </div>

            <h1 className="text-6xl md:text-7xl font-black text-white mb-6 tracking-tight leading-none">
              Your Events,
              <br />
              <span className="drop-shadow-[0_0_30px_rgba(255,80,60,1)]" style={{
                color: '#ffeeee',
                textShadow: '0 0 20px rgba(255,100,70,0.9), 0 0 40px rgba(255,120,80,0.7), 0 0 60px rgba(255,90,60,0.5)'
              }}>All in One Place</span>
            </h1>

            <p className="text-white/80 text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
              Manage events from all your Discord servers seamlessly. Plan, coordinate, and never miss a moment.
            </p>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
                <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse-glow" />
                <span className="text-white/90 text-sm">{events.length} Active Events</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
                <Users className="h-4 w-4 text-white" />
                <span className="text-white/90 text-sm">{events.reduce((sum, e) => sum + e.attendees, 0)} Total Attendees</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-4xl font-black mb-3 tracking-tight">
            Your Events <span className="text-gradient">({events.length})</span>
          </h2>
          <p className="text-muted-foreground text-lg">Events from all your servers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, index) => (
            <Link
              key={event.id}
              href={`/event/${event.id}`}
              className={`block group animate-slide-up stagger-${(index % 6) + 1}`}
            >
              <Card className="h-full transition-all duration-500 hover:shadow-glow-orange hover:scale-[1.02] border-border/60 backdrop-blur-sm bg-card/80 group-hover:border-primary/40 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <CardHeader className="space-y-4 relative z-10">
                  <div className="flex items-start justify-between gap-2">
                    <Badge
                      variant="secondary"
                      className={`bg-gradient-to-r ${event.serverColor} text-white border-0 px-4 py-1.5 text-xs font-bold shadow-medium`}
                    >
                      {event.server}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-xs border-border/60 bg-background/60 backdrop-blur-sm font-semibold"
                    >
                      {event.type}
                    </Badge>
                  </div>

                  <CardTitle className="text-2xl group-hover:text-primary transition-all duration-300 font-black tracking-tight leading-tight">
                    {event.name}
                  </CardTitle>

                  <CardDescription className="line-clamp-2 text-base leading-relaxed">
                    {event.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 relative z-10">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">{event.date}</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">{event.location}</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">{event.attendees} attending</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}