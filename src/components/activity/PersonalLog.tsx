import { Flex, Spinner, Text } from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { trpc } from "../../utils/trpc";

const PersonalLog = () => {
	const ActivityView = dynamic(
		() => import("../../components/activity/ActivityView"),
	);
	const { data: session } = useSession();
	const user = session?.user;

	const { data: userTickets, isLoading: isTicketsLoading } =
		trpc.ticket.getTicketsWithUserId.useQuery(
			{ userId: user!.id, shouldSortByCreatedAt: true },
			{ refetchOnWindowFocus: false, enabled: !!user },
		);

	return (
		<Flex ml={4} mr={4} flexDirection="column">
			<Text mt={4} fontSize="3xl" fontWeight="semibold" mb={3}>
				Personal Log
			</Text>
			{isTicketsLoading ? (
				<Spinner />
			) : (
				<ActivityView
					createdTickets={userTickets?.createdTickets ?? []}
					helpedTickets={userTickets?.helpedTickets ?? []}
				/>
			)}
		</Flex>
	);
};

export default PersonalLog;
