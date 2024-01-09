import { NextPage } from "next";
import dynamic from "next/dynamic";
import Layout from "../../components/layout/Layout";

const TicketPage: NextPage = () => {
	const TicketView = dynamic(
		() => import("../../components/ticket-page/TicketView"),
	);

	return (
		<Layout>
			<TicketView />
		</Layout>
	);
};

export default TicketPage;
