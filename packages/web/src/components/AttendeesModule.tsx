import { Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const attendees = [
  { name: "Sarah Johnson", role: "Host", initials: "SJ", color: "bg-primary" },
  { name: "Mike Chen", role: "Co-Host", initials: "MC", color: "bg-secondary" },
  { name: "Emily Davis", role: "Attendee", initials: "ED", color: "bg-accent" },
  { name: "James Wilson", role: "Attendee", initials: "JW", color: "bg-primary" },
  { name: "Lisa Anderson", role: "Attendee", initials: "LA", color: "bg-secondary" },
  { name: "Tom Martinez", role: "Attendee", initials: "TM", color: "bg-accent" },
];

const roleColors = {
  Host: "bg-primary text-primary-foreground",
  "Co-Host": "bg-secondary text-secondary-foreground",
  Attendee: "bg-muted text-muted-foreground",
};

export function AttendeesModule() {
  return (
    <Card className="p-6 shadow-soft transition-smooth hover:shadow-medium">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Users className="h-6 w-6 text-primary" />
        Attendees ({attendees.length})
      </h2>
      <div className="space-y-3">
        {attendees.map((attendee, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-smooth"
          >
            <Avatar className={`${attendee.color} text-white`}>
              <AvatarFallback className={attendee.color}>{attendee.initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{attendee.name}</p>
            </div>
            <Badge className={roleColors[attendee.role as keyof typeof roleColors]}>
              {attendee.role}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}