import NextAuth, { type DefaultSession } from "next-auth";
import Discord from "next-auth/providers/discord";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      discordId: string;
    } & DefaultSession["user"];
    guilds: Array<{
      id: string;
      name: string;
      icon: string | null;
      owner: boolean;
      permissions: string;
    }>;
  }
}

// Define custom JWT type
interface CustomJWT {
  discordId?: string;
  accessToken?: string;
  guilds?: Array<{
    id: string;
    name: string;
    icon: string | null;
    owner: boolean;
    permissions: string;
  }>;
}

export const authConfig = {
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "identify guilds email",
        },
      },
    }),
  ],
  callbacks: {
    // @ts-ignore - NextAuth v5 callback types
    async jwt({ token, account, profile }) {
      const customToken = token as any;

      // On first sign in, save Discord ID and access token
      if (account && profile) {
        customToken.discordId = profile.id as string;
        customToken.accessToken = account.access_token;

        // Fetch user's guilds using the access token
        try {
          const guildsResponse = await fetch("https://discord.com/api/users/@me/guilds", {
            headers: {
              Authorization: `Bearer ${account.access_token}`,
            },
          });

          if (guildsResponse.ok) {
            const guilds = await guildsResponse.json();
            customToken.guilds = guilds.map((guild: any) => ({
              id: guild.id,
              name: guild.name,
              icon: guild.icon,
              owner: guild.owner,
              permissions: guild.permissions,
            }));
          }
        } catch (error) {
          console.error("Error fetching guilds:", error);
          customToken.guilds = [];
        }
      }

      return customToken;
    },
    // @ts-ignore - NextAuth v5 callback types
    async session({ session, token }) {
      const customToken = token as any;

      // Pass Discord ID and guilds to the session
      if (customToken.discordId) {
        session.user.discordId = customToken.discordId;
      }
      if (customToken.guilds) {
        session.guilds = customToken.guilds;
      }

      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 24 * 60 * 60, // 24 hours
  },
};

// @ts-ignore - NextAuth v5 config compatibility
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
