import { Users } from "lucide-react"; // SVG icon
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

// roleColors object with keys
const roleColors = {
  Host: "bg-primary text-primary-foreground",
  "Co-Host": "bg-secondary text-secondary-foreground",
  Attendee: "bg-muted text-muted-foreground",
};

export function AttendeesModule() {
  return (
    <Card className="p-6 shadow-soft transition-smooth hover:shadow-medium">
      <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"> {/* flex forces horizontal alignment and gap introduces horizontal gap, mb is margin bottom */}
        <Users className="h-6 w-6 text-primary" />
        Attendees ({attendees.length})
      </h2>
      <div className="space-y-3"> {/* vertical spacing */}
        {attendees.map((attendee, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-smooth"
          >
            <Avatar className={`${attendee.color} text-white`}> {/* circle for avatar */}
              <AvatarFallback className={attendee.color}>{attendee.initials}</AvatarFallback> {/* actual avatar */}
            </Avatar>
            <div className="flex-1"> {/* flex-1 makes div take up remaining space inside parent div */}
              <p className="font-medium">{attendee.name}</p>
            </div>
            <Badge className={roleColors[attendee.role as keyof typeof roleColors]}> {/* basically roleColors[attendee.role], but guaranteeing that attendee.role will be a key in roleColors */}
              {attendee.role}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}