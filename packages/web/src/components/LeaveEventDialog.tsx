"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LeaveEventDialogProps {
  eventId: string;
  eventName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeaveEventDialog({
  eventId,
  eventName,
  open,
  onOpenChange,
}: LeaveEventDialogProps) {
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLeaveEvent = async () => {
    setIsLeaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/event/${eventId}/leave`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Full page reload to remount all components and re-check permissions
        window.location.reload();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to leave event");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Leave {eventName}?</DialogTitle>
          <DialogDescription>
            Are you sure you want to leave this event? You can rejoin anytime if you have access.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="text-sm text-red-500 text-center bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
            {error}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLeaving}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleLeaveEvent}
            disabled={isLeaving}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isLeaving ? "Leaving..." : "Leave Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
