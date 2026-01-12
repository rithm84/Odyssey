"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface Member {
  user_id: string;
  username: string;
  avatar_url: string | null;
  role: string;
}

interface TransferOrganizerDialogProps {
  eventId: string;
  eventName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransferOrganizerDialog({
  eventId,
  eventName,
  open,
  onOpenChange,
}: TransferOrganizerDialogProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchMembers();
    }
  }, [open, eventId]);

  const fetchMembers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/event/${eventId}/members`);

      if (!response.ok) {
        throw new Error("Failed to fetch members");
      }

      const data = await response.json();
      // Filter to only show co-hosts and regular members (not viewers or organizers)
      const eligibleMembers = data.members.filter(
        (m: Member) => m.role === "co_host" || m.role === "member"
      );
      setMembers(eligibleMembers);
    } catch (err) {
      console.error("Error fetching members:", err);
      setError("Failed to load members");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedUserId) {
      setError("Please select a member to transfer the organizer role to");
      return;
    }

    setIsTransferring(true);
    setError(null);

    try {
      const response = await fetch(`/api/event/${eventId}/transfer-organizer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_organizer_user_id: selectedUserId }),
      });

      if (response.ok) {
        // Full page reload to show updated status
        window.location.reload();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to transfer organizer role");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsTransferring(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "co_host":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "member":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "co_host":
        return "Co-Host";
      case "member":
        return "Member";
      default:
        return role;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Organizer Role</DialogTitle>
          <DialogDescription>
            You're the organizer of "{eventName}". To leave, you must first transfer the organizer role to another member.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              There are no other members to transfer the organizer role to. You must have at least one co-host or member to leave the event.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Select New Organizer <span className="text-destructive">*</span>
              </label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a member..." />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      <div className="flex items-center gap-2">
                        <span>{member.username}</span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getRoleBadgeColor(member.role)}`}
                        >
                          {getRoleLabel(member.role)}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-muted/50 border border-border/60 rounded-lg p-3 text-sm">
              <p className="text-muted-foreground">
                <strong>Note:</strong> After transferring, you will leave the event. The selected member will become the organizer, and you will become a viewer (if you have access).
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-500 text-center bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
            {error}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isTransferring}
          >
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!selectedUserId || isTransferring || members.length === 0}
            className="gradient-primary text-white"
          >
            {isTransferring ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Transferring...
              </>
            ) : (
              "Transfer & Leave"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
