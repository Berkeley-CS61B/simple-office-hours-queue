import { NextPage } from "next";
import dynamic from "next/dynamic";
import Layout from "../components/layout/Layout";

const Home: NextPage = () => {
	const QueueLayout = dynamic(() => import("../components/queue/QueueLayout"));

	return (
		<Layout>
			<QueueLayout />
		</Layout>
	);
};

export default Home;
