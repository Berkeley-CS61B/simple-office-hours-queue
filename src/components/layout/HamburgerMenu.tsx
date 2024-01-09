import { CloseIcon } from "@chakra-ui/icons";
import { Flex, IconButton, Text, useColorModeValue } from "@chakra-ui/react";
import { UserRole } from "@prisma/client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { DARK_GRAY_COLOR } from "../../utils/constants";
import AvatarDropdown from "./AvatarDropdown";
import { DarkModeToggle } from "./DarkModeToggle";

interface HamburgerMenuProps {
	onToggle: () => void;
	personalQueueLink: string;
}

const HamburgerMenu = (props: HamburgerMenuProps) => {
	const { onToggle, personalQueueLink } = props;
	const { data: session } = useSession();

	return (
		<Flex
			w="50vw"
			bgColor={useColorModeValue("gray.100", DARK_GRAY_COLOR)}
			zIndex={20}
			h="100vh"
			pos="fixed"
			top="0"
			right="0"
			overflowY="auto"
			flexDir="column"
		>
			<Flex justifyContent="space-between" m={4}>
				<DarkModeToggle />
				<AvatarDropdown />
				<IconButton
					aria-label="Close Menu"
					size="md"
					icon={<CloseIcon />}
					onClick={onToggle}
				/>
			</Flex>

			<Flex flexDir="column" align="center" gap={5}>
				{session?.user?.role === UserRole.STAFF && (
					<Link href={personalQueueLink}>
						<Text fontWeight="semibold" className="hover-cursor" fontSize="xl">
							Personal Queue
						</Text>
					</Link>
				)}
				{session?.user && (
					<Link href="/activity">
						<Text fontWeight="semibold" className="hover-cursor" fontSize="xl">
							Activity
						</Text>
					</Link>
				)}
				{session?.user?.role === UserRole.STAFF && (
					<Link href="/admin">
						<Text fontWeight="semibold" className="hover-cursor" fontSize="xl">
							Admin
						</Text>
					</Link>
				)}
			</Flex>
		</Flex>
	);
};

export default HamburgerMenu;
