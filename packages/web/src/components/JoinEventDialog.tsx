"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface JoinEventDialogProps {
  eventId: string;
  eventName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinEventDialog({
  eventId,
  eventName,
  open,
  onOpenChange,
}: JoinEventDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoinEvent = async (rsvpStatus: "yes" | "maybe") => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/event/${eventId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rsvp_status: rsvpStatus }),
      });

      if (response.ok) {
        // Full page reload to remount all components and re-check permissions
        window.location.reload();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to join event");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join {eventName}?</DialogTitle>
          <DialogDescription>
            Please select your RSVP status to join this event.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <Button
            onClick={() => handleJoinEvent("yes")}
            disabled={isLoading}
            className="w-full gradient-primary text-white h-12 text-base font-semibold"
          >
            ✅ Yes - I'm attending
          </Button>

          <Button
            onClick={() => handleJoinEvent("maybe")}
            disabled={isLoading}
            variant="outline"
            className="w-full h-12 text-base font-semibold border-2"
          >
            ❓ Maybe - Not sure yet
          </Button>

          <Button
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            variant="ghost"
            className="w-full"
          >
            Cancel
          </Button>
        </div>

        {error && (
          <div className="text-sm text-red-500 text-center bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
            {error}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
