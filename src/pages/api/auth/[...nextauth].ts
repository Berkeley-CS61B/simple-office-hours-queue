import NextAuth, { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '../../../server/db/client';

export const authOptions: NextAuthOptions = {
  // Include user.id and user.role on session
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
      }
      return session;
    },

    // Only allow users that are present in the database to sign in
    async signIn({ user, account }) {
      if (account?.provider !== 'google') {
        return false;
      }

      const userExists = await prisma.user.findUnique({
        where: {
          email: user.email ?? undefined,
        },
      });

      if (!userExists) {
        return false;
      } else {
        return true;
      }
    },
  },

  // Prisma is the ORM used
  adapter: PrismaAdapter(prisma),

  // Currently we support sign in with Google
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
};

export default NextAuth(authOptions);
