import { useToast } from "@chakra-ui/react";
import { UserRole } from "@prisma/client";
import { useSession } from "next-auth/react";
import Router, { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { trpc } from "../../utils/trpc";
import InnerTicket from "./InnerTicket";

/**
 * Component that renders the ticket view. It ensures that
 * the current user is authorized to view the ticket.
 */
const TicketView = () => {
  const router = useRouter();
  const id = Number(router.query.id);
  const { data: session } = useSession();

  //   const [ticket, setTicket] = useState<TicketWithNames>();
  const [isInvalidTicket, setIsInvalidTicket] = useState<boolean | null>(null); // Start with null to indicate loading
  const toast = useToast();

  const { data: ticket } = trpc.ticket.getTicket.useQuery(
    { id },
    {
      enabled: id !== undefined && !Number.isNaN(id),
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        if (data) {
          //   setTicket(data);
          setIsInvalidTicket(false);
        } else {
          setIsInvalidTicket(true);
        }
      },
    },
  );

  const userRole = session?.user?.role;
  const userId = session?.user?.id;

  const authorized =
    userRole === UserRole.STAFF ||
    userRole === UserRole.INTERN ||
    ticket?.createdByUserId === userId ||
    ticket?.isPublic;

  /**
   * If the ticket doesn't exist or user doesn't have correct access,
   * redirect them to the queue page
   */
  useEffect(() => {
    if (!userRole || isInvalidTicket === null) {
      return;
    }

    if (isInvalidTicket || !authorized) {
      toast({
        title: "Invalid ticket",
        description: "The ticket you are trying to access is invalid.",
        status: "error",
        position: "top-right",
        duration: 3000,
        isClosable: true,
      });
      Router.push("/");
    }
  }, [userRole, isInvalidTicket, authorized, toast]);

  return (
    <>
      {ticket && (
        <InnerTicket ticket={ticket} userId={userId!} userRole={userRole!} />
      )}
    </>
  );
};

export default TicketView;
