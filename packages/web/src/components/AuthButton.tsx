"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <Button variant="ghost" disabled>Loading...</Button>;
  }

  if (!session) {
    return (
      <Link href="/auth/signin">
        <Button>Sign In</Button>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={session.user.image || undefined} alt={session.user.name || "User"} />
          <AvatarFallback>{session.user.name?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
        <div className="hidden md:block">
          <p className="text-sm font-medium">{session.user.name}</p>
          <p className="text-xs text-muted-foreground">
            {session.guilds?.length || 0} servers
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => signOut({ callbackUrl: "/auth/signin" })}
        className="rounded-full transition-smooth shadow-soft hover:shadow-medium hover-scale"
      >
        Sign Out
      </Button>
    </div>
  );
}
