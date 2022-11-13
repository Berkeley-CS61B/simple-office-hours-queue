import { Button, Flex, Spinner } from '@chakra-ui/react';
import { TicketStatus, UserRole } from '@prisma/client';
import { TicketWithNames } from '../../server/trpc/router/ticket';
import { trpc } from '../../utils/trpc';

interface TicketCardProps {
  ticket: TicketWithNames;
  userId: string;
  userRole: UserRole;
  isGetUsersLoading: boolean;
  isCurrentUserInGroup: boolean;
  setShowConfetti: (showConfetti: boolean) => void;
}

/**
 * Renders the buttons on the ticket info page. This is in a separate component
 * because InnerTicketInfo was getting too big.
 */
const TicketButtons = (props: TicketCardProps) => {
  const { ticket, userId, userRole, isCurrentUserInGroup, isGetUsersLoading, setShowConfetti } = props;

  const approveTicketsMutation = trpc.ticket.approveTickets.useMutation();
  const resolveTicketsMutation = trpc.ticket.resolveTickets.useMutation();
  const requeueTicketsMutation = trpc.ticket.requeueTickets.useMutation();
  const assignTicketsMutation = trpc.ticket.assignTickets.useMutation();
  const reopenTicketsMutation = trpc.ticket.reopenTickets.useMutation();
  const closeTicketMutation = trpc.ticket.closeTicket.useMutation();
  const joinTicketMutation = trpc.ticket.joinTicketGroup.useMutation();
  const leaveTicketMutation = trpc.ticket.leaveTicketGroup.useMutation();
  const markAsAbsentMutation = trpc.ticket.markAsAbsent.useMutation();
  const isPending = ticket.status === TicketStatus.PENDING;
  const isOpen = ticket.status === TicketStatus.OPEN;
  const isClosed = ticket.status === TicketStatus.CLOSED;
  const isStaff = userRole === UserRole.STAFF;
  const isResolved = ticket.status === TicketStatus.RESOLVED;
  const isAssigned = ticket.status === TicketStatus.ASSIGNED;

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

  const handleMarkAsAbsent = async () => {
    await markAsAbsentMutation.mutateAsync({
      ticketId: ticket.id,
      markOrUnmark: ticket.status !== TicketStatus.ABSENT,
    });
  };

  return (
    <Flex justifyContent='center'>
      <Button m={4} onClick={handleApproveTicket} hidden={!isStaff || !isPending} colorScheme='whatsapp'>
        Approve
      </Button>
      <Button m={4} onClick={handleHelpTicket} hidden={!isStaff || !isOpen} colorScheme='whatsapp'>
        Help
      </Button>
      <Button m={4} onClick={handleResolveTicket} hidden={!isStaff || !isAssigned} colorScheme='whatsapp'>
        Resolve
      </Button>
      <Button m={4} onClick={handleRequeueTicket} hidden={!isStaff || !isAssigned} colorScheme='yellow'>
        Requeue
      </Button>
      <Button
        m={4}
        onClick={handleMarkAsAbsent}
        hidden={!isStaff || !(isOpen || isPending || isAssigned)}
        colorScheme='red'
      >
        {ticket.status === TicketStatus.ABSENT ? 'Unmark' : 'Mark'} as absent
      </Button>
      <Button m={4} onClick={handleReopenTicket} hidden={!isStaff || (!isResolved && !isClosed)} colorScheme='whatsapp'>
        Reopen
      </Button>
      <Button m={4} onClick={handleCloseTicket} hidden={isStaff || (!isPending && !isOpen)} colorScheme='red'>
        Close
      </Button>
      {isGetUsersLoading && ticket.isPublic ? (
        <Spinner />
      ) : (
        <Button
          m={4}
          onClick={isCurrentUserInGroup ? handleLeaveGroup : handleJoinGroup}
          hidden={isStaff || !ticket.isPublic || ticket.createdByUserId === userId}
          colorScheme={isCurrentUserInGroup ? 'red' : 'whatsapp'}
        >
          {isCurrentUserInGroup ? 'Leave' : 'Join'} group
        </Button>
      )}
    </Flex>
  );
};

export default TicketButtons;
