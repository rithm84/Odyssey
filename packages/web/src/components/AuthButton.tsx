"use client";

import { createClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AuthButton() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [guildCount, setGuildCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    // Get initial user (secure - verifies JWT with auth server)
    supabase.auth.getUser().then(({ data: { user } }) => {
      // Convert user to session format for compatibility
      const session = user ? { user } : null;
      setSession(session);
      setLoading(false);

      // Fetch guild count if logged in
      if (user) {
        fetch("/api/guilds")
          .then(res => res.json())
          .then(data => setGuildCount(data.guilds?.length || 0))
          .catch(() => setGuildCount(0));
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);

      // Fetch guild count when session changes
      if (session) {
        fetch("/api/guilds")
          .then(res => res.json())
          .then(data => setGuildCount(data.guilds?.length || 0))
          .catch(() => setGuildCount(0));
      } else {
        setGuildCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/signin");
  };

  if (loading) {
    return <Button variant="ghost" disabled>Loading...</Button>;
  }

  if (!session) {
    return (
      <Link href="/auth/signin">
        <Button>Sign In</Button>
      </Link>
    );
  }

  const userName = session.user?.user_metadata?.full_name || session.user?.email || "User";
  const avatarUrl = session.user?.user_metadata?.avatar_url;

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={avatarUrl || undefined} alt={userName} />
          <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="hidden md:block">
          <p className="text-sm font-medium">{userName}</p>
          <p className="text-xs text-muted-foreground">
            {guildCount} servers
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        className="rounded-full transition-smooth hover-scale"
      >
        Sign Out
      </Button>
    </div>
  );
}
