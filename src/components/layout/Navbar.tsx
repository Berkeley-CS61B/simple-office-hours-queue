import { HamburgerIcon } from "@chakra-ui/icons";
import {
	Box,
	Divider,
	Flex,
	IconButton,
	Slide,
	Stack,
	Text,
	useColorModeValue,
	useDisclosure,
} from "@chakra-ui/react";
import { UserRole } from "@prisma/client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Router from "next/router";
import { COURSE_ID, DARK_MODE_COLOR } from "../../utils/constants";
import { trpc } from "../../utils/trpc";
import AvatarDropdown from "./AvatarDropdown";
import { DarkModeToggle } from "./DarkModeToggle";
import HamburgerMenu from "./HamburgerMenu";

export const Navbar = () => {
	const { data: session } = useSession();
	const { isOpen, onToggle } = useDisclosure();

	const { data: userQueue } = trpc.queue.getCurrentUserQueue.useQuery(
		undefined,
		{
			enabled: session?.user?.role === UserRole.STAFF,
			refetchOnWindowFocus: false,
		},
	);

	const personalQueueLink = userQueue
		? `/queue/${userQueue.name}`
		: "/create-queue";

	/**
	 * If the user came from a personal queue page, return the queue page url
	 */
	const getHomeUrl = () => {
		// Router is not immediately available
		if (typeof window === "undefined") {
			return "/";
		}

		if (Router.query.queueName) {
			return `/queue/${Router.query.queueName}`;
		}
		if (window.location.href.includes("/queue/")) {
			return window.location.href;
		}
		return "/";
	};
	const homeUrl = getHomeUrl();

	return (
		<Box
			bg={useColorModeValue("gray.100", DARK_MODE_COLOR)}
			boxShadow="0 0 2px #4a4a4a"
			fontSize="md"
		>
			<Flex
				pl={4}
				pr={4}
				h={16}
				alignItems="center"
				justifyContent="space-between"
			>
				<Flex>
					<Link href={homeUrl}>
						<Text
							className="hover-cursor"
							mt={2}
							fontWeight="semibold"
							fontSize="xl"
						>
							{COURSE_ID} OH
						</Text>
					</Link>
					<Divider orientation="vertical" height="50px" ml={4} />
				</Flex>

				<Flex alignItems="center" display={["none", "none", "flex", "flex"]}>
					<Stack direction="row" spacing={5} alignItems="center">
						{session?.user?.role === UserRole.STAFF && (
							<Link href={personalQueueLink}>
								<Text fontWeight="semibold" className="hover-cursor">
									Personal Queue
								</Text>
							</Link>
						)}
						{session?.user && (
							<Link href="/activity">
								<Text fontWeight="semibold" className="hover-cursor">
									Activity
								</Text>
							</Link>
						)}
						{session?.user?.role === UserRole.STAFF && (
							<Link href="/admin">
								<Text fontWeight="semibold" className="hover-cursor">
									Admin
								</Text>
							</Link>
						)}
						<DarkModeToggle />
						<AvatarDropdown />
					</Stack>
				</Flex>
				<IconButton
					aria-label="Open Menu"
					size="md"
					mr={2}
					icon={<HamburgerIcon />}
					onClick={onToggle}
					display={["flex", "flex", "none", "none"]}
				/>
			</Flex>

			<Slide direction="right" in={isOpen} style={{ zIndex: 50 }}>
				<HamburgerMenu
					onToggle={onToggle}
					personalQueueLink={personalQueueLink}
				/>
			</Slide>
		</Box>
	);
};
