import { Car, Users, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const drivers = [
  {
    driver: { name: "Sarah Johnson", initials: "SJ" },
    riders: [
      { name: "Emily Davis", initials: "ED" },
      { name: "Lisa Anderson", initials: "LA" },
    ],
    totalSeats: 4,
  },
  {
    driver: { name: "Mike Chen", initials: "MC" },
    riders: [{ name: "James Wilson", initials: "JW" }],
    totalSeats: 5,
  },
];

const needRide = [
  { name: "Tom Martinez", initials: "TM" },
];

export function TransportationModule() {
  return (
    <Card className="p-6 shadow-soft transition-all duration-500 hover:shadow-glow-red border-border/60 backdrop-blur-sm bg-card/80 group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        <h2 className="text-3xl font-black tracking-tight flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-medium">
            <Car className="h-5 w-5 text-white" />
          </div>
          <span>Transportation</span>
        </h2>

        <div className="space-y-4">
          {drivers.map((carpool, index) => {
            const remainingSeats = carpool.totalSeats - carpool.riders.length - 1;
            return (
              <div key={index} className="p-5 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/60 hover:border-primary/30 transition-all group/carpool">
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 gradient-primary rounded-full blur-sm opacity-60" />
                    <Avatar className="relative gradient-primary text-white shadow-medium">
                      <AvatarFallback className="gradient-primary font-bold">
                        {carpool.driver.initials}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="flex-1">
                    <p className="font-black text-lg group-hover/carpool:text-primary transition-colors">
                      {carpool.driver.name}
                    </p>
                    <p className="text-sm text-muted-foreground font-medium">Driver</p>
                  </div>

                  <Badge className="gradient-primary text-white border-0 font-bold px-4 py-2 flex items-center gap-2 shadow-medium" style={{ color: '#ffffff' }}>
                    <Users className="h-4 w-4" />
                    {remainingSeats} seats left
                  </Badge>
                </div>

                {carpool.riders.length > 0 && (
                  <div className="pl-14 space-y-3">
                    {carpool.riders.map((rider, riderIndex) => (
                      <div key={riderIndex} className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/40">
                        <Avatar className="h-8 w-8 bg-[hsl(var(--accent-blue))] text-white shadow-medium">
                          <AvatarFallback className="bg-[hsl(var(--accent-blue))] font-bold text-xs">
                            {rider.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-foreground font-medium">{rider.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {needRide.length > 0 && (
            <div className="p-5 rounded-xl bg-gradient-to-br from-destructive/10 to-destructive/5 border-2 border-destructive/30 shadow-medium">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-destructive flex items-center justify-center shadow-medium">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <p className="font-black text-xl text-destructive">Need a Ride</p>
              </div>

              <div className="space-y-3">
                {needRide.map((person, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-destructive/30">
                    <Avatar className="h-8 w-8 bg-destructive text-white shadow-medium">
                      <AvatarFallback className="bg-destructive font-bold text-xs">
                        {person.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-bold text-foreground">{person.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
