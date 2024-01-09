import { Box, Button, Collapse, Flex, useDisclosure } from "@chakra-ui/react";
import { UserRole } from "@prisma/client";
import { useSession } from "next-auth/react";
import { SessionUser } from "../../pages/api/auth/[...nextauth]";
import { TicketWithNames } from "../../server/trpc/router/ticket";
import ActivityTable from "./ActivityTable";

interface ActivityViewProps {
  helpedTickets: TicketWithNames[];
  createdTickets: TicketWithNames[];
}

/**
 * Displays the activity log for the current user
 */
const ActivityView = (props: ActivityViewProps) => {
  const { helpedTickets, createdTickets } = props;
  const { data: session } = useSession();
  const user = session?.user as SessionUser;
  const { isOpen: isHelpedTableOpen, onToggle: toggleHelpedTable } =
    useDisclosure();
  const { isOpen: isCreatedTableOpen, onToggle: toggleCreatedTable } =
    useDisclosure();

  return (
    <Flex mr={4} flexDirection="column">
      <Flex>
        <Button
          mr={4}
          onClick={toggleHelpedTable}
          hidden={user.role === UserRole.STUDENT}
        >
          {isHelpedTableOpen ? "Hide " : "Show "} helped tickets
        </Button>
        <Button onClick={toggleCreatedTable}>
          {isCreatedTableOpen ? "Hide " : "Show "} created tickets
        </Button>
      </Flex>

      <Box hidden={user.role === UserRole.STUDENT}>
        <Collapse in={isHelpedTableOpen} animateOpacity>
          <ActivityTable
            tickets={helpedTickets}
            title={`${helpedTickets.length} helped tickets`}
            shouldShowCreatedBy={true}
            shouldShowHelpedBy={false}
          />
        </Collapse>
      </Box>

      <Box>
        <Collapse in={isCreatedTableOpen} animateOpacity>
          <ActivityTable
            tickets={createdTickets}
            title={`${createdTickets.length} created tickets`}
            shouldShowCreatedBy={false}
            shouldShowHelpedBy={true}
          />
        </Collapse>
      </Box>
    </Flex>
  );
};

export default ActivityView;
