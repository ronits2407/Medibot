import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { connectToDatabase } from "@/lib/db/client";
import { User } from "@/lib/db/models/User";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "dummy-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy-client-secret",
    }),
    Credentials({
      id: "credentials",
      name: "Demo Account",
      credentials: {
        email: { label: "Email", type: "email" },
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        const email =
          (credentials?.email as string)?.trim()?.toLowerCase() || "demo@medibot.local";
        const name =
          (credentials?.name as string)?.trim() || "Dr. Demo (Verified Tester)";
        try {
          await connectToDatabase();
          let user = await User.findOne({ email });
          if (!user) {
            user = await User.create({
              email,
              name,
              language: "en",
              pincode: "110001",
              disclaimerAckAt: new Date(),
              disclaimerVersion: "v1",
            });
          }
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image,
          };
        } catch (err) {
          console.error("Credentials authorize error:", err);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        try {
          await connectToDatabase();
          const existingUser = await User.findOne({ email: user.email.toLowerCase() });
          if (!existingUser) {
            await User.create({
              email: user.email.toLowerCase(),
              name: user.name || "User",
              image: user.image || undefined,
              googleId: account.providerAccountId,
              language: "en",
            });
          } else {
            if (!existingUser.googleId) {
              existingUser.googleId = account.providerAccountId;
            }
            if (user.image && existingUser.image !== user.image) {
              existingUser.image = user.image;
            }
            if (user.name && (!existingUser.name || existingUser.name === "User")) {
              existingUser.name = user.name;
            }
            await existingUser.save();
          }
        } catch (error) {
          console.error("Error syncing user during sign-in:", error);
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        if (user.image) {
          token.picture = user.image;
        }
      }
      return token;
    },
    async session({ session, token }) {
      const email = session.user?.email || (token.email as string);
      if (email) {
        try {
          await connectToDatabase();
          const dbUser = await User.findOne({ email: email.toLowerCase() });
          if (dbUser) {
            session.user.id = dbUser._id.toString();
            session.user.email = dbUser.email;
            session.user.name = dbUser.name;
            session.user.image = dbUser.image || (token.picture as string) || session.user.image;
            (session.user as any).pincode = dbUser.pincode;
            (session.user as any).language = dbUser.language || "en";
            (session.user as any).disclaimerAckAt = dbUser.disclaimerAckAt;
            (session.user as any).disclaimerVersion = dbUser.disclaimerVersion;
          } else if (token.picture) {
            session.user.image = token.picture as string;
          }
        } catch (error) {
          console.error("Error augmenting session with db user:", error);
        }
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
});
