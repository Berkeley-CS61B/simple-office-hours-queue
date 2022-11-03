import { useEffect, useState } from 'react';
import { UserRole, TicketStatus, User } from '@prisma/client';
import { Text, Spinner, Box, List, ListItem, Tag, Flex } from '@chakra-ui/react';
import { timeDifferenceInMinutes, uppercaseFirstLetter } from '../../utils/utils';
import { trpc } from '../../utils/trpc';
import { useChannel } from '@ably-labs/react-hooks';
import Confetti from 'react-confetti';
import { TicketWithNames } from '../../server/trpc/router/ticket';
import StaffNotes from './StaffNotes';
import useNotification from '../../utils/hooks/useNotification';
import TicketButtons from './TicketButtons';

interface InnerTicketInfoProps {
  ticket: TicketWithNames;
  userRole: UserRole;
  userId: string;
}

/**
 * InnerTicketInfo component that displays the ticket information (left column)
 */
const InnerTicketInfo = (props: InnerTicketInfoProps) => {
  const { ticket, userRole, userId } = props;

  const [showConfetti, setShowConfetti] = useState(false);
  const [usersInGroup, setUsersInGroup] = useState<User[]>([]);
  const isCurrentUserInGroup = usersInGroup.some(user => user.id === userId);

  const { showNotification } = useNotification();
  const canSeeName =
    userId === ticket.createdByUserId ||
    isCurrentUserInGroup ||
    (userRole === UserRole.STAFF &&
      (ticket.status === TicketStatus.ASSIGNED ||
        ticket.status === TicketStatus.RESOLVED ||
        ticket.status === TicketStatus.CLOSED));

  const isResolved = ticket.status === TicketStatus.RESOLVED;
  const isAssigned = ticket.status === TicketStatus.ASSIGNED;
  const isStaff = userRole === UserRole.STAFF;
  const helpOrJoin = isStaff ? 'Help' : 'Join';

  const { isLoading: isGetUsersLoading } = trpc.ticket.getUsersInTicketGroup.useQuery(
    { ticketId: ticket.id },
    {
      enabled: ticket.isPublic,
      refetchOnWindowFocus: false,
      onSuccess: users => {
        setUsersInGroup(users);
      },
    },
  );

  const context = trpc.useContext();

  // Refresh the ticket every minute so the timer updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (ticket.status === TicketStatus.ASSIGNED) {
        context.ticket.getTicket.invalidate({ id: ticket.id });
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Listens for updates on the ticket status
  useChannel(`ticket-${ticket.id}`, ticketData => {
    const message = ticketData.name;
    const shouldUpdateTicketMessages: string[] = [
      'ticket-approved',
      'ticket-resolved',
      'ticket-assigned',
      'ticket-reopened',
      'ticket-requeued',
      'ticket-staffnote',
      'ticket-closed',
      'ticket-joined',
      'ticket-left',
    ];

    const shouldNotNotifyStudent: string[] = ['ticket-staffnote'];

    if (shouldUpdateTicketMessages.includes(message)) {
      context.ticket.getTicket.invalidate({ id: ticket.id });

      if (message === 'ticket-joined' || message === 'ticket-left') {
        context.ticket.getUsersInTicketGroup.invalidate({ ticketId: ticket.id });
      }

      // Notify the student when the ticket is updated
      if (userRole === UserRole.STUDENT) {
        const update = message.split('-')[1];
        if (!shouldNotNotifyStudent.includes(message)) {
          showNotification(`Ticket ${update}`, `Your ticket has been ${update}`);
        }
      }
    }
  });

  return (
    <>
      <Text fontSize='2xl'>{canSeeName ? ticket.createdByName : <>{helpOrJoin} to see name</>}</Text>
      <Text>Ticket Status: {uppercaseFirstLetter(ticket.status)}</Text>
      <Text hidden={!isAssigned}>
        <>
          Being helped by {ticket.helpedByName} for {timeDifferenceInMinutes(new Date(), ticket.helpedAt)} minute(s)
        </>
      </Text>
      <Text hidden={!isResolved}>Helped by {ticket.helpedByName}</Text>
      <Text mt={4} mb={4}>
        Description: {ticket.description}
      </Text>

      <Box mb={4}>
        <Tag p={2.5} size='lg' mr={3} colorScheme='blue' borderRadius={5}>
          {ticket.assignmentName}
        </Tag>
        <Tag p={2.5} size='lg' colorScheme='orange' borderRadius={5}>
          {ticket.locationName}
        </Tag>
      </Box>

      <Text fontWeight='semibold'>{ticket.isPublic ? 'Public' : 'Private'} ticket</Text>

      <Box hidden={!ticket.isPublic} mb={3}>
        <Text fontWeight='bold'>Users in group:</Text>
        {canSeeName ? (
          <>
            {isGetUsersLoading ? (
              <Spinner />
            ) : (
              <List>
                {usersInGroup.map(user => (
                  <ListItem key={user.id}>{user.name}</ListItem>
                ))}
              </List>
            )}
          </>
        ) : (
          <Text>{helpOrJoin} to see names</Text>
        )}
      </Box>

      <StaffNotes ticket={ticket} userRole={userRole} />
      <TicketButtons
        ticket={ticket}
        userId={userId}
        isGetUsersLoading={isGetUsersLoading}
        userRole={userRole}
        isCurrentUserInGroup={isCurrentUserInGroup}
        setShowConfetti={setShowConfetti}
      />
      <Confetti
        recycle={false}
        numberOfPieces={200}
        run={showConfetti}
        onConfettiComplete={() => setShowConfetti(false)}
      />
    </>
  );
};

export default InnerTicketInfo;
