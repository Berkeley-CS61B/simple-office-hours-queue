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

	  if (!!userIsConfirmed) {
		// Delete the user from the 'ConfirmedUser' table since they are now in 'User'
		await prisma.confirmedUser.delete({
		  where: {
			email: user.email,
		  },
		});
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
