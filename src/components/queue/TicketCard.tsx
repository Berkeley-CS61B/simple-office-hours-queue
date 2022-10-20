import { Box, Button, useColorModeValue, Text, Divider, Tag, Flex } from '@chakra-ui/react';
import { TicketStatus, UserRole } from '@prisma/client';
import Router from 'next/router';
import React from 'react';
import { TicketWithNames } from '../../server/trpc/router/ticket';
import { trpc } from '../../utils/trpc';
import { timeDifferenceInMinutes } from '../../utils/utils';

interface TicketCardProps {
  ticket: TicketWithNames;
  userRole: UserRole;
}

/**
 * TicketCard component that displays the details of a ticket
 */
const TicketCard = (props: TicketCardProps) => {
  const { ticket, userRole } = props;
  const isStaff = userRole === UserRole.STAFF;
  const isPending = ticket.status === TicketStatus.PENDING;
  const isOpen = ticket.status === TicketStatus.OPEN;
  const isAssigned = ticket.status === TicketStatus.ASSIGNED;

  const approveTicketsMutation = trpc.ticket.approveTickets.useMutation();
  const assignTicketsMutation = trpc.ticket.assignTickets.useMutation();
  const resolveTicketsMutation = trpc.ticket.resolveTickets.useMutation();

  const handleApproveTicket = async () => {
    await approveTicketsMutation.mutateAsync({ ticketIds: [ticket.id] });
  };

  const handleHelpTicket = async () => {
    await assignTicketsMutation.mutateAsync({ ticketIds: [ticket.id] }).then(() => {
      Router.push(`/ticket/${ticket.id}`);
    });
  };

  const handleResolveTicket = async () => {
    await resolveTicketsMutation.mutateAsync({ ticketIds: [ticket.id] });
  };
  
  const handleTicketPress = (event : any) => {
	if (event.target.tagName === 'BUTTON') {
	  return;
	}
	Router.push(`/ticket/${ticket.id}`);
  }
  
  return (
    <Box
      mb={4}
      p={8}
      backgroundColor={useColorModeValue('white', 'gray.800')}
      width='full'
      borderWidth={1}
      borderRadius={8}
      boxShadow='lg'
	  onClick={handleTicketPress}
	  className='hover-cursor'
    >
      <Text fontSize='2xl'>{ticket.description}</Text>
      <Divider my={4} />
      <Flex justifyContent='space-between'>
        <Box>
          <Tag p={2.5} size='lg' mr={3} colorScheme='blue' borderRadius={5}>
            {ticket.assignmentName}
          </Tag>
          <Tag p={2.5} size='lg' colorScheme='orange' borderRadius={5}>
            {ticket.locationName}
          </Tag>
        </Box>
        <Flex flexDirection='column'>
          <Text hidden={ticket.status !== TicketStatus.ASSIGNED} fontSize='lg' mb={2}>
            <>Being helped by {ticket.helpedByName} for {timeDifferenceInMinutes(ticket.helpedAt)} minute(s)</>
          </Text>
          <Box textAlign='right'>
            <Button onClick={handleApproveTicket} hidden={!isStaff || !isPending}>
              Approve
            </Button>
            <Button onClick={handleHelpTicket} hidden={!isStaff || !isOpen}>
              Help
            </Button>
            <Button onClick={handleResolveTicket} hidden={!isStaff || !isAssigned}>
              Resolve
            </Button>
          </Box>
        </Flex>
      </Flex>
    </Box>
  );
};

export default TicketCard;
