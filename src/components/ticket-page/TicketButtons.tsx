import { useState } from 'react';
import { Button, Flex, Spinner } from '@chakra-ui/react';
import { TicketStatus, TicketType, UserRole } from '@prisma/client';
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

export const BUTTONS_DISABLED_WAIT_TIME = 3000;
export const BUTTONS_DISABLED_WAIT_MSG = 'Please wait 3 seconds before clicking again.';

/**
 * Renders the buttons on the ticket info page. This is in a separate component
 * because InnerTicketInfo was getting too big.
 */
const TicketButtons = (props: TicketCardProps) => {
  const { ticket, userId, userRole, isCurrentUserInGroup, isGetUsersLoading, setShowConfetti } = props;

  const [areButtonsLoading, setAreButtonsLoading] = useState(false);
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(false);
  const approveTicketsMutation = trpc.ticket.approveTickets.useMutation();
  const resolveTicketsMutation = trpc.ticket.resolveTickets.useMutation();
  const requeueTicketsMutation = trpc.ticket.requeueTickets.useMutation();
  const assignTicketsMutation = trpc.ticket.assignTickets.useMutation();
  const reopenTicketsMutation = trpc.ticket.reopenTickets.useMutation();
  const closeTicketMutation = trpc.ticket.closeTicket.useMutation();
  const joinTicketMutation = trpc.ticket.joinTicketGroup.useMutation();
  const leaveTicketMutation = trpc.ticket.leaveTicketGroup.useMutation();
  const markAsAbsentMutation = trpc.ticket.markAsAbsent.useMutation();
  const markAsPriorityMutation = trpc.ticket.markAsPriority.useMutation();
  const toggleIsPublicMutation = trpc.ticket.toggleIsPublic.useMutation();
  const isPending = ticket.status === TicketStatus.PENDING;
  const isOpen = ticket.status === TicketStatus.OPEN;
  const isClosed = ticket.status === TicketStatus.CLOSED;
  const isStaff = userRole === UserRole.STAFF;
  const isIntern = userRole === UserRole.INTERN;
  const isResolved = ticket.status === TicketStatus.RESOLVED;
  const isAssigned = ticket.status === TicketStatus.ASSIGNED;
  const isAbsent = ticket.status === TicketStatus.ABSENT;
  const isPriority = ticket.isPriority;

  /** To prevent spamming, use loading and disabled state for buttons */
  const onClickWrapper = (fn: () => Promise<void>) => async () => {
    setAreButtonsLoading(true);
    setAreButtonsDisabled(true);
    await fn();
    setAreButtonsLoading(false);

    // Keep buttons disabled for 3 seconds
    setTimeout(() => {
      setAreButtonsDisabled(false);
    }, BUTTONS_DISABLED_WAIT_TIME);
  };

  const handleResolveTicket = async () => {
    onClickWrapper(async () => {
      await resolveTicketsMutation.mutateAsync({ ticketIds: [ticket.id] });
      setShowConfetti(true);
    })();
  };

  const handleRequeueTicket = async () => {
    onClickWrapper(async () => {
      await requeueTicketsMutation.mutateAsync({ ticketIds: [ticket.id] });
    })();
  };

  const handleHelpTicket = async () => {
    onClickWrapper(async () => {
      await assignTicketsMutation.mutateAsync({ ticketIds: [ticket.id] });
    })();
  };

  const handleReopenTicket = async () => {
    onClickWrapper(async () => {
      await reopenTicketsMutation.mutateAsync({ ticketIds: [ticket.id] });
    })();
  };

  const handleApproveTicket = async () => {
    onClickWrapper(async () => {
      await approveTicketsMutation.mutateAsync({ ticketIds: [ticket.id] });
    })();
  };

  const handleCloseTicket = async () => {
    onClickWrapper(async () => {
      await closeTicketMutation.mutateAsync({ ticketId: ticket.id });
    })();
  };

  const handleJoinGroup = async () => {
    onClickWrapper(async () => {
      await joinTicketMutation.mutateAsync({ ticketId: ticket.id });
    })();
  };

  const handleLeaveGroup = async () => {
    onClickWrapper(async () => {
      await leaveTicketMutation.mutateAsync({ ticketId: ticket.id });
    })();
  };

  const handleMarkAsAbsent = async () => {
    onClickWrapper(async () => {
      await markAsAbsentMutation.mutateAsync({
        ticketId: ticket.id,
        markOrUnmark: ticket.status !== TicketStatus.ABSENT,
      });
    })();
  };

  const handleMarkAsPriority = async () => {
    await onClickWrapper(() =>
      markAsPriorityMutation.mutateAsync({
        ticketId: ticket.id,
        isPriority: !isPriority,
      }),
    )();
  };

  const handleToggleIsPublic = async () => {
    await onClickWrapper(() =>
      toggleIsPublicMutation.mutateAsync({
        ticketId: ticket.id,
        isPublic: !ticket.isPublic,
      }),
    )();
  };

  return (
    <Flex justifyContent='center' flexDirection={['column', 'column', 'column', 'row']}>
      <Button
        title={areButtonsDisabled ? BUTTONS_DISABLED_WAIT_MSG : ''}
        disabled={areButtonsDisabled}
        isLoading={areButtonsLoading}
        m={4}
        onClick={handleApproveTicket}
        hidden={!isStaff || !isPending}
        colorScheme='whatsapp'
      >
        Approve
      </Button>
      <Button
        title={areButtonsDisabled ? BUTTONS_DISABLED_WAIT_MSG : ''}
        disabled={areButtonsDisabled}
        isLoading={areButtonsLoading}
        m={4}
        mt={[1, 1, 1, 4]}
        onClick={handleHelpTicket}
        hidden={(!isStaff && !isIntern) || !isOpen}
        colorScheme='whatsapp'
      >
        Help
      </Button>
      <Button
        title={areButtonsDisabled ? BUTTONS_DISABLED_WAIT_MSG : ''}
        disabled={areButtonsDisabled}
        isLoading={areButtonsLoading}
        m={4}
        mt={[1, 1, 1, 4]}
        onClick={handleResolveTicket}
        hidden={(!isStaff && !isIntern) || !isAssigned}
        colorScheme='whatsapp'
      >
        Resolve
      </Button>
      <Button
        title={areButtonsDisabled ? BUTTONS_DISABLED_WAIT_MSG : ''}
        disabled={areButtonsDisabled}
        isLoading={areButtonsLoading}
        m={4}
        mt={[1, 1, 1, 4]}
        onClick={handleRequeueTicket}
        hidden={(!isStaff && !isIntern) || !isAssigned}
        colorScheme='yellow'
      >
        Requeue
      </Button>
      <Button
        title={areButtonsDisabled ? BUTTONS_DISABLED_WAIT_MSG : ''}
        disabled={areButtonsDisabled}
        isLoading={areButtonsLoading}
        m={4}
        mt={[1, 1, 1, 4]}
        onClick={handleMarkAsAbsent}
        hidden={(!isStaff && !isIntern) || isResolved || isClosed}
        colorScheme='red'
      >
        {isAbsent ? 'Unmark' : 'Mark'} as absent
      </Button>
      <Button
        title={areButtonsDisabled ? BUTTONS_DISABLED_WAIT_MSG : ''}
        disabled={areButtonsDisabled}
        isLoading={areButtonsLoading}
        m={4}
        mt={[1, 1, 1, 4]}
        onClick={handleReopenTicket}
        hidden={(!isStaff && !isIntern) || (!isResolved && !isClosed)}
        colorScheme='whatsapp'
      >
        Reopen
      </Button>
      <Button
        title={areButtonsDisabled ? BUTTONS_DISABLED_WAIT_MSG : ''}
        disabled={areButtonsDisabled}
        isLoading={areButtonsLoading}
        m={4}
        mt={[1, 1, 1, 4]}
        onClick={handleToggleIsPublic}
        colorScheme='teal'
        hidden={
          isAbsent ||
          isResolved ||
          isClosed ||
          (ticket.ticketType === TicketType.DEBUGGING && !isStaff && !isIntern) ||
          (!isStaff && !isIntern && ticket.isPublic)
        }
      >
        {ticket.isPublic ? 'Make private' : 'Make public'}
      </Button>
      <Button
        title={areButtonsDisabled ? BUTTONS_DISABLED_WAIT_MSG : ''}
        disabled={areButtonsDisabled}
        isLoading={areButtonsLoading}
        m={4}
        mt={[1, 1, 1, 4]}
        onClick={handleCloseTicket}
        hidden={isResolved || isClosed || ((isStaff || isIntern) && isAssigned)}
        colorScheme='red'
      >
        Delete
      </Button>
      <Button
        title={areButtonsDisabled ? BUTTONS_DISABLED_WAIT_MSG : ''}
        disabled={areButtonsDisabled}
        isLoading={areButtonsLoading}
        onClick={handleMarkAsPriority}
        hidden={!isStaff || (!isPending && !isOpen && !isAssigned)}
        m={4}
        mt={[1, 1, 1, 4]}
        colorScheme='purple'
      >
        {isPriority ? 'Unprioritize' : 'Prioritize'}
      </Button>
      <Button
        title={areButtonsDisabled ? BUTTONS_DISABLED_WAIT_MSG : ''}
        disabled={areButtonsDisabled}
        isLoading={areButtonsLoading}
        onClick={handleMarkAsPriority}
        hidden={!isIntern || !isAssigned || isPriority}
        m={4}
        mt={[1, 1, 1, 4]}
        colorScheme='purple'
      >
        Escalate
      </Button>
      {isGetUsersLoading && ticket.isPublic ? (
        <Spinner />
      ) : (
        <Button
          title={areButtonsDisabled ? BUTTONS_DISABLED_WAIT_MSG : ''}
          disabled={areButtonsDisabled}
          isLoading={areButtonsLoading}
          m={4}
          mt={[1, 1, 1, 4]}
          onClick={isCurrentUserInGroup ? handleLeaveGroup : handleJoinGroup}
          hidden={isStaff || isIntern || !ticket.isPublic || ticket.createdByUserId === userId}
          colorScheme={isCurrentUserInGroup ? 'red' : 'whatsapp'}
        >
          {isCurrentUserInGroup ? 'Leave' : 'Join'} group
        </Button>
      )}
    </Flex>
  );
};

export default TicketButtons;
