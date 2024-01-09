import { UserRole } from "@prisma/client";
import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
	/**
	 * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
	 */
	interface Session {
		user?: {
			id: string;
			role: UserRole;
			preferredName: string;
		} & DefaultSession["user"];
	}

	interface User extends DefaultUser {
		role: UserRole;
		preferredName: string;
	}
}
