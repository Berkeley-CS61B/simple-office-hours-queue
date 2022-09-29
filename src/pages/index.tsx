import type { NextPage } from "next";
import { Text } from "@chakra-ui/react";
import Layout from "../components/Layout";
import { useSession } from "next-auth/react";
import { trpc } from "../utils/trpc";
import { useEffect, useState } from "react";
import { configureAbly } from "@ably-labs/react-hooks";
import { clientEnv } from "../env/schema.mjs";

const Home: NextPage = () => {
  const { data: session } = useSession();
  const [userId, setUserId] = useState<string>("");
  const [isAblyConnected, setIsAblyConnected] = useState(false);

  useEffect(() => {
    if (session) {
      setUserId(session.user?.id!);

      new Promise((resolve) => {
        configureAbly({
          key: clientEnv.NEXT_PUBLIC_ABLY_CLIENT_API_KEY,
          clientId: session?.user?.id, // Not sure if this should be different (random?)
        });
        resolve(setIsAblyConnected(true));
      });
    }
  }, [session]);

  return (
    <Layout>
	  {isAblyConnected && <Text>Ably Connected</Text>}
    </Layout>
  );
};

export default Home;
