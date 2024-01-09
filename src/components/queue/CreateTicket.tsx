import { Flex, Text } from "@chakra-ui/react";
import {
  PersonalQueue,
  SiteSettings,
  SiteSettingsValues,
} from "@prisma/client";
import { useRef } from "react";
import { MutableRefObject } from "react";
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

  return (
    <Flex width="full" align="left" flexDir="column" p={4}>
      <Text fontSize="2xl" mb={5}>
        Welcome back. Create a ticket to get started or{" "}
        <span
          style={{ cursor: "pointer", textDecoration: "underline" }}
          onClick={() => endOfForm.current.scrollIntoView()}
          onKeyDown={() => endOfForm.current.scrollIntoView()}
        >
          view the queue
        </span>
      </Text>
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
