import { useState } from 'react';
import { UserRole, TicketStatus } from '@prisma/client';
import { Text, Button } from '@chakra-ui/react';
import { uppercaseFirstLetter } from '../utils';
import { trpc } from '../utils/trpc';
import { useChannel } from '@ably-labs/react-hooks';
import Confetti from 'react-confetti'
import { TicketWithNames } from '../server/router/ticket';

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
  const canSeeName = ticket.status === TicketStatus.ASSIGNED || ticket.status === TicketStatus.RESOLVED || userRole === UserRole.STUDENT;
  const isResolved = ticket.status === TicketStatus.RESOLVED;
  const isAssigned = ticket.status === TicketStatus.ASSIGNED;
  const isOpen = ticket.status === TicketStatus.OPEN;
  const isStaff = userRole === UserRole.STAFF;

  const resolveTicketsMutation = trpc.useMutation('ticket.resolveTickets');
  const requeueTicketsMutation = trpc.useMutation('ticket.requeueTickets');
  const assignTicketsMutation = trpc.useMutation('ticket.assignTickets');
  const reopenTicketsMutation = trpc.useMutation('ticket.reopenTickets');

  const context = trpc.useContext();
  
  // Listens for updates on the ticket status
  useChannel(`ticket-${ticket.id}`, ticketData => {
    const message = ticketData.name;
    const shouldUpdateTicketMessages: string[] = [
      'ticket-resolved',
      'ticket-assigned',
      'ticket-reopened',
      'ticket-requeued',
    ];

    if (shouldUpdateTicketMessages.includes(message)) {
      context.invalidateQueries(['ticket.getTicket', { id: ticket.id }]);
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

  // TODO pending is broken 
  return (
    <>
      <Text fontSize='2xl'>{canSeeName ? ticket.createdByName : 'Help to see name'}</Text>
      <Text>Ticket Status: {uppercaseFirstLetter(ticket.status)}</Text>
      <Text hidden={!isAssigned}>Being helped by {ticket.helpedByName}</Text>
      <Text hidden={!isResolved}>Helped by {ticket.helpedByName}</Text>
      <Text mt={4}>{ticket.description}</Text>
      <Text>Location: {ticket.locationName}</Text>
      <Text>Assignment: {ticket.assignmentName}</Text>
      <Button m={4} onClick={handleHelpTicket} hidden={!isStaff || !isOpen}>
        Help
      </Button>
      <Button m={4} onClick={handleResolveTicket} hidden={!isStaff || !isAssigned}>
        Resolve
      </Button>
      <Button m={4} onClick={handleRequeueTicket} hidden={!isStaff || !isAssigned}>
        Requeue
      </Button>
      <Button m={4} onClick={handleReopenTicket} hidden={!isStaff || !isResolved}>
        Reopen
      </Button>
	  <Confetti recycle={false} numberOfPieces={200} run={showConfetti} onConfettiComplete={() => setShowConfetti(false)} />

    </>
  );
};

export default InnerTicketInfo;
