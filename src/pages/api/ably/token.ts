import { UserRole } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import Ably from "ably/promises";
import { getServerAuthSession } from "../../../server/common/get-server-auth-session";

const getCapabilityForRole = (role: UserRole) => {
  const capability: Record<string, ("subscribe" | "publish")[]> = {
    broadcast: ["subscribe"],
    tickets: ["subscribe"],
    settings: ["subscribe"],
  };

  if (role === UserRole.STAFF || role === UserRole.INTERN) {
    capability["staff-broadcast"] = ["subscribe"];
    capability["ticket-*"] = ["subscribe"];
  }

  if (role === UserRole.STAFF) {
    capability.broadcast = ["subscribe", "publish"];
  }

  return capability;
};

const tokenHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getServerAuthSession({ req, res });
  if (!session?.user?.id || !session.user.role) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const client = new Ably.Rest(process.env.ABLY_SERVER_API_KEY!);
  const tokenRequest = await client.auth.createTokenRequest({
    clientId: session.user.id,
    ttl: 60 * 60 * 1000,
    capability: JSON.stringify(getCapabilityForRole(session.user.role)),
  });

  res.status(200).json(tokenRequest);
};

export default tokenHandler;
