import { useEffect, useState } from 'react';
import { UserRole, TicketStatus, User } from '@prisma/client';
import { Text, Button, Spinner, Box, List, ListItem } from '@chakra-ui/react';
import { timeDifferenceInMinutes, uppercaseFirstLetter } from '../../utils/utils';
import { trpc } from '../../utils/trpc';
import { useChannel } from '@ably-labs/react-hooks';
import Confetti from 'react-confetti';
import { TicketWithNames } from '../../server/trpc/router/ticket';
import StaffNotes from './StaffNotes';
import useNotification from '../../utils/hooks/useNotification';

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
    ticket.status === TicketStatus.ASSIGNED || ticket.status === TicketStatus.RESOLVED || userRole === UserRole.STUDENT;
  const isPending = ticket.status === TicketStatus.PENDING;
  const isResolved = ticket.status === TicketStatus.RESOLVED;
  const isAssigned = ticket.status === TicketStatus.ASSIGNED;
  const isOpen = ticket.status === TicketStatus.OPEN;
  const isClosed = ticket.status === TicketStatus.CLOSED;
  const isStaff = userRole === UserRole.STAFF;

  const approveTicketsMutation = trpc.ticket.approveTickets.useMutation();
  const resolveTicketsMutation = trpc.ticket.resolveTickets.useMutation();
  const requeueTicketsMutation = trpc.ticket.requeueTickets.useMutation();
  const assignTicketsMutation = trpc.ticket.assignTickets.useMutation();
  const reopenTicketsMutation = trpc.ticket.reopenTickets.useMutation();
  const closeTicketMutation = trpc.ticket.closeTicket.useMutation();
  const joinTicketMutation = trpc.ticket.joinTicketGroup.useMutation();
  const leaveTicketMutation = trpc.ticket.leaveTicketGroup.useMutation();

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

      // Not too sure why getUsersInTicketGroup.invalidate() doesn't work here
      //   if (message === 'ticket-joined') {
      //     setIsInGroup(true);
      //   } else if (message === 'ticket-left') {
      //     setIsInGroup(false);
      //   }
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

  const handleResolveTicket = async () => {
    await resolveTicketsMutation.mutateAsync({ ticketIds: [ticket.id] }).then(() => {
      setShowConfetti(true);
    });
  };

  const handleRequeueTicket = async () => {
    await requeueTicketsMutation.mutateAsync({ ticketIds: [ticket.id] });
  };

  const handleHelpTicket = async () => {
    await assignTicketsMutation.mutateAsync({ ticketIds: [ticket.id] });
  };

  const handleReopenTicket = async () => {
    await reopenTicketsMutation.mutateAsync({ ticketIds: [ticket.id] });
  };

  const handleApproveTicket = async () => {
    await approveTicketsMutation.mutateAsync({ ticketIds: [ticket.id] });
  };

  const handleCloseTicket = async () => {
    await closeTicketMutation.mutateAsync({ ticketId: ticket.id });
  };

  const handleJoinGroup = async () => {
    await joinTicketMutation.mutateAsync({ ticketId: ticket.id });
  };

  const handleLeaveGroup = async () => {
    await leaveTicketMutation.mutateAsync({ ticketId: ticket.id });
  };

  return (
    <>
      <Text fontSize='2xl'>{canSeeName ? ticket.createdByName : 'Help to see name'}</Text>
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
      <Text fontWeight='semibold'>{ticket.isPublic ? 'Public' : 'Private'} ticket</Text>

      <Box hidden={!ticket.isPublic} mb={3}>
        <Text fontWeight='bold'>Users in group:</Text>
        {isGetUsersLoading ? (
          <Spinner />
        ) : (
          <List>
            {usersInGroup.map(user => (
              <ListItem key={user.id}>{user.name}</ListItem>
            ))}
          </List>
        )}
      </Box>

      <Text>Location: {ticket.locationName}</Text>
      <Text>Assignment: {ticket.assignmentName}</Text>

      <StaffNotes ticket={ticket} userRole={userRole} />

      <Button m={4} onClick={handleApproveTicket} hidden={!isStaff || !isPending}>
        Approve
      </Button>
      <Button m={4} onClick={handleHelpTicket} hidden={!isStaff || !isOpen}>
        Help
      </Button>
      <Button m={4} onClick={handleResolveTicket} hidden={!isStaff || !isAssigned}>
        Resolve
      </Button>
      <Button m={4} onClick={handleRequeueTicket} hidden={!isStaff || !isAssigned}>
        Requeue
      </Button>
      <Button m={4} onClick={handleReopenTicket} hidden={!isStaff || (!isResolved && !isClosed)}>
        Reopen
      </Button>
      <Button m={4} onClick={handleCloseTicket} hidden={isStaff || (!isPending && !isOpen)}>
        Close
      </Button>
      {isGetUsersLoading && ticket.isPublic ? (
        <Spinner />
      ) : (
        <Button
          m={4}
          onClick={isCurrentUserInGroup ? handleLeaveGroup : handleJoinGroup}
          hidden={isStaff || !ticket.isPublic || ticket.createdByUserId === userId}
        >
          {isCurrentUserInGroup ? 'Leave' : 'Join'} group
        </Button>
      )}
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
