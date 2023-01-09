import NextAuth, { User, type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '../../../server/db/client';
import { SiteSettings, UserRole, VariableSiteSettings } from '@prisma/client';
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

    /**
	 * Allow sign in if:
	 * 	The user is already in the database
	 *  The user is in the confirmed table (aka they've been imported) 
	 *  The import method is IMPORT_STAFF and the email domain matches
	 */
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

      // Allow login if user is confirmed
      if (!!userIsConfirmed) {
        return true;
      }

      // Allow login if import method is IMPORT_STAFF and the email domain matches
      const importUserMethod = await prisma.settings.findFirst({
        where: { setting: SiteSettings.IMPORT_USERS_METHOD },
      });
      const isImportStaff = importUserMethod?.value === ImportUsersMethodPossiblities.IMPORT_STAFF;
      const isImportStaffAndStudents =
        importUserMethod?.value === ImportUsersMethodPossiblities.IMPORT_STAFF_AND_STUDENTS;

      // If students had to be imported and they're not in the confirmed table, then they
      // haven't been imported
      if (isImportStaffAndStudents) {
        return false;
      }

      const emailDomain = await prisma.variableSettings.findFirst({
        where: { setting: VariableSiteSettings.EMAIL_DOMAIN },
      });
      // No/Empty domain means that anyone can sign in
      const domainMatches = !emailDomain || emailDomain.value === '' || user.email.endsWith(emailDomain.value);

      if (isImportStaff && domainMatches) {
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
