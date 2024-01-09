import { configureAbly } from "@ably-labs/react-hooks";
import { Flex, useToast } from "@chakra-ui/react";
import { UserRole } from "@prisma/client";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import Router from "next/router";
import { ReactNode, useEffect, useState } from "react";
import { clientEnv } from "../../env/schema.mjs";
import { SITE_BASE_TITLE } from "../../utils/constants";
import ReceiveBroadcast from "../queue/ReceiveBroadcast";
import Landing from "./Landing";
import { Navbar } from "./Navbar";

interface LayoutProps {
	children: ReactNode;
	// If specified, the user must have one of the roles to view the page
	restrictedTo?: UserRole[];
}

/**
 * Layout component that wraps all pages.
 * Provides a navbar and ensures that the user is logged in and authorized.
 * Also configures Ably.
 */
const Layout = (props: LayoutProps) => {
	const { children } = props;
	const [isAblyConnected, setIsAblyConnected] = useState(false);
	const [isAuthorized, setIsAuthorized] = useState(false);
	const toast = useToast();
	const { data: session, status } = useSession();

	useEffect(() => {
		if (!("Notification" in window)) {
			return;
		} else if (
			Notification.permission === "denied" ||
			Notification.permission === "default"
		) {
			Notification.requestPermission().then((permission) => {
				if (
					localStorage.getItem("notificationPermission") == null &&
					(permission === "denied" || permission === "default")
				) {
					alert(
						"We highly recommend enabling desktop notifications to receive updates on your queue status.",
					);
					localStorage.setItem("notificationPermission", JSON.stringify(true));
				}
			});
		}
	}, []);

	useEffect(() => {
		if (session && session.user) {
			if (
				props.restrictedTo &&
				!props.restrictedTo.includes(session.user.role)
			) {
				toast({
					title: "Not Authorized",
					description: "You are not authorized to view this page.",
					status: "error",
					position: "top-right",
					duration: 3000,
					isClosable: true,
				});
				Router.push("/");
			} else {
				setIsAuthorized(true);
			}

			new Promise((resolve) => {
				configureAbly({
					key: clientEnv.NEXT_PUBLIC_ABLY_CLIENT_API_KEY,
					clientId: session?.user?.id,
				});
				resolve(setIsAblyConnected(true));
			}).catch((err) => console.error(err));
		}
	}, [session]);

	return (
		<Flex direction="column" minH="100vh" justifyContent="space-between">
			<Head>
				<title>{SITE_BASE_TITLE}</title>
				<meta
					name="OH Queue"
					content="Office Hours Queue"
					lang="en"
					translate="no"
					dir="ltr"
				/>
			</Head>

			<Flex direction="column">
				<Navbar />
				{!session && status !== "loading" && <Landing />}
				{status === "authenticated" && isAuthorized && <>{children}</>}
				{isAblyConnected && <ReceiveBroadcast />}
			</Flex>

			<Flex alignSelf="flex-end">
				<footer>
					<a
						href="https://vercel.com?utm_source=cs61b&utm_campaign=oss"
						target="_blank"
						rel="noopener noreferrer"
						aria-label="Powered by Vercel"
					>
						<img src="https://images.ctfassets.net/e5382hct74si/78Olo8EZRdUlcDUFQvnzG7/fa4cdb6dc04c40fceac194134788a0e2/1618983297-powered-by-vercel.svg" />
					</a>
				</footer>
			</Flex>
		</Flex>
	);
};

export default Layout;
