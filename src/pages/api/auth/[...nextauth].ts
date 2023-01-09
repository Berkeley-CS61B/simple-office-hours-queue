import NextAuth, { User, type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '../../../server/db/client';
import { UserRole } from '@prisma/client';
import { ImportUsersMethodPossiblities } from '../../../utils/utils';

export type SessionUser = {
  id: string;
  role: UserRole;
  preferredName: string;
} & User;

export const authOptions: NextAuthOptions = {
  // Include user.id, user.role, and user.preferredName on session
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
        session.user.preferredName = user.preferredName;
      }
      return session;
    },

    // Only allow users that either exist in the 'User' table or have been imported (confirmed)
    async signIn({ user, account }) {
      if (account?.provider !== 'google' || !user?.email) {
        return false;
      }

      const userExists = await prisma.user.findFirst({
        where: {
          email: user.email,
        },
      });

      if (userExists) {
        return true;
      }

      const userIsConfirmed = await prisma.confirmedUser.findFirst({
        where: {
          email: user.email,
        },
      });

      const importUserMethod = await prisma.settings.findFirst({
        where: {
          setting: 'IMPORT_USERS_METHOD',
        },
      });

      // Allow login if user is confirmed or if import method is IMPORT_STAFF
      if (!!userIsConfirmed || importUserMethod?.value === ImportUsersMethodPossiblities.IMPORT_STAFF) {
        return true;
      }

      return false;
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
