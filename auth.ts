import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { connectToDatabase } from "@/lib/db/client";
import { User } from "@/lib/db/models/User";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
          } else if (!existingUser.googleId) {
            existingUser.googleId = account.providerAccountId;
            if (user.image && !existingUser.image) existingUser.image = user.image;
            await existingUser.save();
          }
        } catch (error) {
          console.error("Error syncing user during sign-in:", error);
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user?.email) {
        try {
          await connectToDatabase();
          const dbUser = await User.findOne({ email: session.user.email.toLowerCase() });
          if (dbUser) {
            session.user.id = dbUser._id.toString();
            (session.user as any).pincode = dbUser.pincode;
            (session.user as any).language = dbUser.language || "en";
            (session.user as any).disclaimerAckAt = dbUser.disclaimerAckAt;
            (session.user as any).disclaimerVersion = dbUser.disclaimerVersion;
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
