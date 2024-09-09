import { Flex, Text } from "@chakra-ui/react";
import {
  PersonalQueue,
  SiteSettings,
  SiteSettingsValues,
} from "@prisma/client";
import { useRef } from "react";
import { MutableRefObject } from "react";
import { trpc } from "../../utils/trpc";
import Countdown from "../ticket-page/Countdown";
import CreateTicketForm from "./CreateTicketForm";

interface CreateTicketProps {
  siteSettings: Map<SiteSettings, SiteSettingsValues>;
  personalQueue?: PersonalQueue;
}

/**
 * CreateTicket component that allows students to create a new ticket
 */
const CreateTicket = (props: CreateTicketProps) => {
  const { siteSettings, personalQueue } = props;
  const endOfForm = useRef() as MutableRefObject<HTMLSpanElement>;

  const { data: userCooldown } = trpc.ticket.getUserCooldownTime.useQuery();

  return (
    <Flex width="full" align="left" flexDir="column" p={4}>
      <Text fontSize="2xl">
        Welcome back. Create a ticket to get started or{" "}
        <span
          style={{ cursor: "pointer", textDecoration: "underline" }}
          onClick={() => endOfForm.current.scrollIntoView()}
          onKeyDown={() => endOfForm.current.scrollIntoView()}
        >
          view the queue
        </span>
      </Text>
      {userCooldown && (
        <Flex>
          <Text mt="0.5" fontSize="lg">
            Cooldown until you can make another ticket:&nbsp;
          </Text>
          <Countdown initialTimeInMs={userCooldown} />
        </Flex>
      )}
      <CreateTicketForm
        personalQueue={personalQueue}
        arePublicTicketsEnabled={
          siteSettings.get(SiteSettings.ARE_PUBLIC_TICKETS_ENABLED) ===
          SiteSettingsValues.TRUE
        }
      />
      <span ref={endOfForm} /> {/* Start of queue */}
    </Flex>
  );
};

export default CreateTicket;
