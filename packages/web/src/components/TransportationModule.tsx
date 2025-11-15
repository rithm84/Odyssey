import { Car, Users } from "lucide-react";
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
    <Card className="p-6 shadow-soft transition-smooth hover:shadow-medium">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Car className="h-6 w-6 text-primary" />
        Transportation
      </h2>
      <div className="space-y-6">
        {drivers.map((carpool, index) => {
          const remainingSeats = carpool.totalSeats - carpool.riders.length - 1;
          return (
            <div key={index} className="p-4 rounded-lg bg-gradient-card border border-border">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="bg-primary text-white">
                  <AvatarFallback className="bg-primary">{carpool.driver.initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{carpool.driver.name}</p>
                  <p className="text-sm text-muted-foreground">Driver</p>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <Users className="h-3 w-3" />
                  {remainingSeats} seats left
                </Badge>
              </div>
              {carpool.riders.length > 0 && (
                <div className="pl-14 space-y-2">
                  {carpool.riders.map((rider, riderIndex) => (
                    <div key={riderIndex} className="flex items-center gap-2 text-sm">
                      <Avatar className="h-6 w-6 bg-secondary text-white text-xs">
                        <AvatarFallback className="bg-secondary text-xs">
                          {rider.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-muted-foreground">{rider.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {needRide.length > 0 && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="font-semibold text-destructive mb-3">Need a Ride</p>
            <div className="space-y-2">
              {needRide.map((person, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Avatar className="h-6 w-6 bg-destructive text-white text-xs">
                    <AvatarFallback className="bg-destructive text-xs">
                      {person.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{person.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}