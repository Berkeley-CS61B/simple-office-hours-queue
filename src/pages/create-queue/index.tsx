import { UserRole } from "@prisma/client";
import { NextPage } from "next";
import dynamic from "next/dynamic";
import Layout from "../../components/layout/Layout";

const CreateQueuePage: NextPage = () => {
  const CreatePersonalQueue = dynamic(
    () => import("../../components/queue/CreatePersonalQueue"),
  );

  return (
    <Layout restrictedTo={[UserRole.STAFF]}>
      <CreatePersonalQueue />
    </Layout>
  );
};

export default CreateQueuePage;
