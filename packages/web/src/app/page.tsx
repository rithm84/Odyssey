import { NavBar } from "@/components/NavBar";
import { Calendar, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Mock data for events from different servers
const events = [
  {
    id: 1,
    name: "Weekend Camping Trip",
    server: "Adventure Club",
    serverColor: "from-emerald-500 to-teal-500",
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
    serverColor: "from-pink-500 to-rose-500",
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
    serverColor: "from-blue-500 to-cyan-500",
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
    serverColor: "from-orange-500 to-amber-500",
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
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl p-12 mb-12 shadow-glow">
          <div className="absolute inset-0 gradient-hero opacity-90" />
          <div className="relative z-10 text-center">
            <h1 className="text-5xl font-bold text-white mb-4">
              Your Events, All in One Place
            </h1>
            <p className="text-white/90 text-lg max-w-2xl mx-auto">
              Manage events from all your Discord servers seamlessly. Plan, coordinate, and never miss a moment.
            </p>
          </div>
        </div>

        {/* Events Grid */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Your Events ({events.length})</h2>
          <p className="text-muted-foreground">Events from all your servers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Link key={event.id} href={`/event/${event.id}`} className="block group">
              <Card className="h-full transition-all duration-300 hover:shadow-elegant hover:-translate-y-1 border-border/50">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge 
                      variant="secondary" 
                      className={`bg-gradient-to-r ${event.serverColor} text-white border-0 px-3 py-1 text-xs font-semibold`}
                    >
                      {event.server}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {event.type}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {event.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {event.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4 text-primary" />
                    <span>{event.attendees} attending</span>
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