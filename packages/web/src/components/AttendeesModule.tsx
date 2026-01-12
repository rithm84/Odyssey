"use client";
import { Users, Crown, Shield, Plus, Check, HelpCircle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase-browser";

interface Member {
  user_id: string;
  role: string;
  rsvp_status: string;
  username?: string;
  avatar_url?: string;
}

interface EligibleUser {
  discord_id: string;
  username: string;
  avatar_url?: string;
  currentRole: string | null;
  currentRsvp: string | null;
}

interface AttendeesModuleProps {
  eventId: string;
}

const roleConfig = {
  organizer: {
    label: "Host",
    className: "gradient-primary text-white border-0 shadow-medium",
    icon: Crown,
  },
  co_host: {
    label: "Co-Host",
    className: "gradient-neon text-white border-0 shadow-medium",
    icon: Shield,
  },
  member: {
    label: "Member",
    className: "bg-muted text-foreground border-border/60",
    icon: null,
  },
};

const rsvpConfig = {
  yes: {
    label: "Going",
    className: "bg-green-500/20 text-green-700 dark:text-green-300 border-0",
    icon: Check,
  },
  maybe: {
    label: "Maybe",
    className: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-0",
    icon: HelpCircle,
  },
};

export function AttendeesModule({ eventId }: AttendeesModuleProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [eligibleUsers, setEligibleUsers] = useState<EligibleUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showPopover, setShowPopover] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTransferWarning, setShowTransferWarning] = useState(false);

  // Form state
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("member");
  const [selectedRsvp, setSelectedRsvp] = useState<string>("yes");

  const supabase = createClient();

  const canManageMembers = userRole === "organizer" || userRole === "co_host";

  // Fetch members
  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/event/${eventId}/members`);
      const data = await response.json();

      if (response.ok) {
        setMembers(data.members || []);

        // Find current user's role
        const currentUser = await supabase.auth.getUser();
        const discordUserId =
          currentUser.data.user?.user_metadata?.provider_id ||
          currentUser.data.user?.user_metadata?.sub;

        if (discordUserId) {
          const currentMember = data.members?.find(
            (m: Member) => m.user_id === discordUserId
          );
          setUserRole(currentMember?.role || null);
        }
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch eligible users (when popover opens)
  const fetchEligibleUsers = async () => {
    if (!canManageMembers) return;

    setLoadingEligible(true);
    try {
      const response = await fetch(`/api/event/${eventId}/eligible-users`);
      const data = await response.json();

      if (response.ok) {
        setEligibleUsers(data.users || []);
      } else {
        console.error("Failed to fetch eligible users:", data);
      }
    } catch (error) {
      console.error("Error fetching eligible users:", error);
    } finally {
      setLoadingEligible(false);
    }
  };

  // Setup realtime subscription
  useEffect(() => {
    fetchMembers();

    const channel = supabase
      .channel(`event_members_${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "event_members",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            // Refetch to get updated data with user info
            fetchMembers();
          } else if (payload.eventType === "DELETE") {
            setMembers((prev) =>
              prev.filter((m) => m.user_id !== payload.old.user_id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  // Handle popover open
  const handlePopoverChange = (open: boolean) => {
    setShowPopover(open);
    if (open && eligibleUsers.length === 0) {
      fetchEligibleUsers();
    }
    if (!open) {
      // Reset form
      setSelectedUserId("");
      setSelectedRole("member");
      setSelectedRsvp("yes");
    }
  };

  // Get selected user object
  const selectedUser = useMemo(() => {
    return eligibleUsers.find((u) => u.discord_id === selectedUserId);
  }, [selectedUserId, eligibleUsers]);

  // Determine available role options based on selected user and current user role
  const roleOptions = useMemo(() => {
    if (!selectedUser) {
      // If no user selected, show default options based on user role
      if (userRole === "organizer") {
        return ["member", "co_host", "organizer"];
      } else {
        return ["member"];
      }
    }

    const isCurrentlyViewer = selectedUser.currentRole === "viewer";

    // Role-based permissions
    if (userRole === "organizer") {
      // Organizers can add anyone to any role
      if (isCurrentlyViewer) {
        // Upgrading a viewer - can make them member, co-host, or organizer
        return ["member", "co_host", "organizer"];
      } else {
        // Adding a guild member - can make them member, co-host, viewer, or organizer
        return ["member", "co_host", "viewer", "organizer"];
      }
    } else if (userRole === "co_host") {
      // Co-hosts can only add members or viewers
      if (isCurrentlyViewer) {
        // Upgrading a viewer - can only make them member
        return ["member"];
      } else {
        // Adding a guild member - can only make them member or viewer
        return ["member", "viewer"];
      }
    }

    return ["member"];
  }, [selectedUser, userRole]);

  // Show RSVP dropdown only when role is not viewer
  const showRsvpDropdown = selectedRole !== "viewer";

  // Handle add member button click
  const handleAddMemberClick = () => {
    // If trying to add as organizer, show transfer warning
    if (selectedRole === "organizer" && userRole === "organizer") {
      setShowTransferWarning(true);
    } else {
      handleAddMember();
    }
  };

  // Confirm organizer transfer
  const handleConfirmTransfer = () => {
    setShowTransferWarning(false);
    handleAddMember();
  };

  // Handle add member
  const handleAddMember = async () => {
    if (!selectedUserId || !selectedRole) return;

    setIsSubmitting(true);
    try {
      const body: any = {
        user_id: selectedUserId,
        role: selectedRole,
      };

      if (selectedRole !== "viewer") {
        body.rsvp_status = selectedRsvp;
      }

      const response = await fetch(`/api/event/${eventId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setShowPopover(false);
        setShowTransferWarning(false);
        // Reset form
        setSelectedUserId("");
        setSelectedRole("member");
        setSelectedRsvp("yes");
      } else {
        const data = await response.json();
        console.error("Failed to add member:", data.error);
      }
    } catch (error) {
      console.error("Error adding member:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sort members: organizer -> co_host -> member, then by RSVP (yes -> maybe), then alphabetically
  const sortedMembers = useMemo(() => {
    const roleOrder = { organizer: 0, co_host: 1, member: 2 };
    const rsvpOrder = { yes: 0, maybe: 1 };

    return [...members].sort((a, b) => {
      // Sort by role
      const roleCompare =
        roleOrder[a.role as keyof typeof roleOrder] -
        roleOrder[b.role as keyof typeof roleOrder];
      if (roleCompare !== 0) return roleCompare;

      // Then by RSVP
      const rsvpCompare =
        rsvpOrder[a.rsvp_status as keyof typeof rsvpOrder] -
        rsvpOrder[b.rsvp_status as keyof typeof rsvpOrder];
      if (rsvpCompare !== 0) return rsvpCompare;

      // Then alphabetically by username
      const usernameA = a.username || a.user_id;
      const usernameB = b.username || b.user_id;
      return usernameA.localeCompare(usernameB);
    });
  }, [members]);

  if (loading) {
    return (
      <Card className="p-6 shadow-soft">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 shadow-soft transition-all duration-500 hover:shadow-glow border-border/60 backdrop-blur-sm bg-card/80 group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-medium">
              <Users className="h-5 w-5 text-white" />
            </div>
            <span>Attendees</span>
          </h2>
          <div className="flex items-center gap-2">
            <Badge className="gradient-primary text-white border-0 px-4 py-2 text-sm font-bold shadow-medium">
              {members.length}
            </Badge>
            {canManageMembers && (
              <Popover open={showPopover} onOpenChange={handlePopoverChange}>
                <PopoverTrigger asChild>
                  <Button
                    size="icon"
                    className="h-10 w-10 rounded-xl gradient-primary text-white shadow-medium hover:shadow-glow"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96" align="end">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-3">Add Member</h4>
                    </div>

                    {/* User Selection */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Select User <span className="text-destructive">*</span>
                      </label>
                      {loadingEligible ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : eligibleUsers.length === 0 ? (
                        <div className="text-sm text-muted-foreground py-4">
                          No eligible users found in this server.
                        </div>
                      ) : (
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a user" />
                          </SelectTrigger>
                          <SelectContent>
                            {eligibleUsers.map((user) => (
                              <SelectItem key={user.discord_id} value={user.discord_id}>
                                {user.username}
                                {user.currentRole === "viewer" && " (Viewer)"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {/* Role Selection */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Role <span className="text-destructive">*</span>
                      </label>
                      <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.includes("member") && (
                            <SelectItem value="member">Member</SelectItem>
                          )}
                          {roleOptions.includes("co_host") && (
                            <SelectItem value="co_host">Co-Host</SelectItem>
                          )}
                          {roleOptions.includes("viewer") && (
                            <SelectItem value="viewer">Viewer</SelectItem>
                          )}
                          {roleOptions.includes("organizer") && (
                            <SelectItem value="organizer">Organizer</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* RSVP Selection - only show if role is not viewer */}
                    {showRsvpDropdown && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          RSVP Status <span className="text-destructive">*</span>
                        </label>
                        <Select value={selectedRsvp} onValueChange={setSelectedRsvp}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes - Going</SelectItem>
                            <SelectItem value="maybe">Maybe</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowPopover(false)}
                        disabled={isSubmitting}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddMemberClick}
                        disabled={!selectedUserId || !selectedRole || isSubmitting}
                        className="flex-1 gradient-primary text-white"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          "Add"
                        )}
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        {/* Transfer Organizer Warning Dialog */}
        <AlertDialog open={showTransferWarning} onOpenChange={setShowTransferWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Transfer Organizer Role?</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to transfer the organizer role to {eligibleUsers.find(u => u.discord_id === selectedUserId)?.username}.
                This will demote you from organizer to co-host. You will lose organizer privileges.
                Are you sure you want to continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>Go Back</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmTransfer}
                disabled={isSubmitting}
                className="gradient-primary text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Transferring...
                  </>
                ) : (
                  "Confirm Transfer"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {members.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-lg">No attendees yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedMembers.map((member) => {
              const config = roleConfig[member.role as keyof typeof roleConfig];
              const rsvpConf = rsvpConfig[member.rsvp_status as keyof typeof rsvpConfig];
              const RoleIcon = config?.icon;
              const RsvpIcon = rsvpConf?.icon;
              const initials = member.username
                ? member.username
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : member.user_id.slice(0, 2).toUpperCase();

              return (
                <div
                  key={member.user_id}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted/50 transition-all duration-300 group/item border border-transparent hover:border-primary/20"
                >
                  <div className="relative">
                    <Avatar className="gradient-primary text-white shadow-medium relative">
                      {member.avatar_url && (
                        <AvatarImage src={member.avatar_url} alt={member.username} />
                      )}
                      <AvatarFallback className="gradient-primary text-white font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="flex-1">
                    <p className="font-bold text-lg dark:text-dark-lg group-hover/item:text-primary transition-colors">
                      {member.username || member.user_id}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {config && (
                      <Badge
                        className={`${config.className} px-4 py-1.5 font-bold flex items-center gap-1.5`}
                      >
                        {RoleIcon && <RoleIcon className="h-3.5 w-3.5" />}
                        {config.label}
                      </Badge>
                    )}
                    {rsvpConf && (
                      <Badge
                        className={`${rsvpConf.className} px-3 py-1.5 font-bold flex items-center gap-1.5`}
                      >
                        {RsvpIcon && <RsvpIcon className="h-3.5 w-3.5" />}
                        {rsvpConf.label}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
