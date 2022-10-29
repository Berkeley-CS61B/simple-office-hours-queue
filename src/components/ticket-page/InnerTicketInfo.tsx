import { useEffect, useState } from 'react';
import { UserRole, TicketStatus } from '@prisma/client';
import { Text, Button } from '@chakra-ui/react';
import { timeDifferenceInMinutes, uppercaseFirstLetter } from '../../utils/utils';
import { trpc } from '../../utils/trpc';
import { useChannel } from '@ably-labs/react-hooks';
import Confetti from 'react-confetti';
import { TicketWithNames } from '../../server/trpc/router/ticket';
import StaffNotes from './StaffNotes';

interface InnerTicketInfoProps {
  ticket: TicketWithNames;
  userRole: UserRole;
}

/**
 * InnerTicketInfo component that displays the ticket information (left column)
 */
const InnerTicketInfo = (props: InnerTicketInfoProps) => {
  const { ticket, userRole } = props;
  const [showConfetti, setShowConfetti] = useState(false);
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
    ];

    if (shouldUpdateTicketMessages.includes(message)) {
      context.ticket.getTicket.invalidate({ id: ticket.id });
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
      <Text mt={4}>{ticket.description}</Text>
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
