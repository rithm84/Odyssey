import { Users, Crown, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const attendees = [
  { name: "Sarah Johnson", role: "Host", initials: "SJ", color: "gradient-primary" },
  { name: "Mike Chen", role: "Co-Host", initials: "MC", color: "gradient-warm" },
  { name: "Emily Davis", role: "Attendee", initials: "ED", color: "bg-[hsl(var(--accent-purple))]" },
  { name: "James Wilson", role: "Attendee", initials: "JW", color: "bg-[hsl(var(--accent-blue))]" },
  { name: "Lisa Anderson", role: "Attendee", initials: "LA", color: "bg-[hsl(var(--accent-green))]" },
  { name: "Tom Martinez", role: "Attendee", initials: "TM", color: "bg-[hsl(var(--primary))]" },
];

const roleConfig = {
  Host: {
    className: "gradient-primary text-white border-0 shadow-medium",
    icon: Crown
  },
  "Co-Host": {
    className: "gradient-warm text-white border-0 shadow-medium",
    icon: Shield
  },
  Attendee: {
    className: "bg-muted text-foreground border-border/60",
    icon: null
  },
};

export function AttendeesModule() {
  return (
    <Card className="p-6 shadow-soft transition-all duration-500 hover:shadow-glow-red border-border/60 backdrop-blur-sm bg-card/80 group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-medium">
              <Users className="h-5 w-5 text-white" />
            </div>
            <span>Attendees</span>
          </h2>
          <Badge className="gradient-primary text-white border-0 px-4 py-2 text-sm font-bold shadow-medium">
            {attendees.length}
          </Badge>
        </div>

        <div className="space-y-3">
          {attendees.map((attendee, index) => {
            const config = roleConfig[attendee.role as keyof typeof roleConfig];
            const RoleIcon = config.icon;

            return (
              <div
                key={index}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted/50 transition-all duration-300 group/item border border-transparent hover:border-primary/20"
              >
                <div className="relative">
                  <div className={`absolute inset-0 ${attendee.color} rounded-full blur-sm opacity-50`} />
                  <Avatar className={`${attendee.color} text-white shadow-medium relative`}>
                    <AvatarFallback className={`${attendee.color} text-white font-bold`}>
                      {attendee.initials}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="flex-1">
                  <p className="font-bold text-lg group-hover/item:text-primary transition-colors">
                    {attendee.name}
                  </p>
                </div>

                <Badge className={`${config.className} px-4 py-1.5 font-bold flex items-center gap-1.5`}>
                  {RoleIcon && <RoleIcon className="h-3.5 w-3.5" />}
                  {attendee.role}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}