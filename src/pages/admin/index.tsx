import { UserRole } from "@prisma/client";
import { NextPage } from "next";
import dynamic from "next/dynamic";
import Layout from "../../components/layout/Layout";

const AdminPage: NextPage = () => {
	const AdminView = dynamic(() => import("../../components/admin/AdminView"));

	return (
		<Layout restrictedTo={[UserRole.STAFF]}>
			<AdminView />
		</Layout>
	);
};

export default AdminPage;
