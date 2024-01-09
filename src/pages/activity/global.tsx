import { Button, Flex, Spinner, Text } from "@chakra-ui/react";
import { UserRole } from "@prisma/client";
import { NextPage } from "next";
import { useState } from "react";
import ActivityTable from "../../components/activity/ActivityTable";
import Layout from "../../components/layout/Layout";
import { TicketWithNames } from "../../server/trpc/router/ticket";
import { trpc } from "../../utils/trpc";

/** All tickets made */
const GlobalActivityPage: NextPage = () => {
	const [tickets, setTickets] = useState<TicketWithNames[]>([]);
	const [page, setPage] = useState(1);
	const { isLoading, refetch } = trpc.ticket.getAllTickets.useQuery(
		{ page },
		{
			refetchOnWindowFocus: false,
			onSuccess: (data) => {
				setTickets((old) => [...old, ...data]);
			},
		},
	);

	const handleLoadMore = async () => {
		setPage((old) => old + 1);
		await refetch();
	};

	return (
		<Layout restrictedTo={[UserRole.STAFF]}>
			<Flex ml={4} mr={4} mt={4} flexDirection="column">
				<Text fontSize="3xl" fontWeight="semibold">
					Global Activity
				</Text>
				<Text fontSize="lg">
					This page shows all tickets made by students and staff. By default, 5
					pages are shown. If you&lsquo;d like to load 5 more pages, click the
					button under the table. Note that a duration of -1 means that the
					ticket was never taken.
				</Text>
				{isLoading && <Spinner />}
				{!isLoading && (
					<ActivityTable
						tickets={tickets}
						title={`${tickets.length} tickets`}
						shouldShowCreatedBy={true}
						shouldShowHelpedBy={true}
					/>
				)}
				<Button
					mt={2}
					colorScheme="yellow"
					onClick={handleLoadMore}
					disabled={isLoading}
				>
					Load more
				</Button>
			</Flex>
		</Layout>
	);
};

export default GlobalActivityPage;
