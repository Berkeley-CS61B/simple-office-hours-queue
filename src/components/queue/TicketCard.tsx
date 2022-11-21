import Router from 'next/router';
import { Box, Button, useColorModeValue, Text, Divider, Tag, Flex, Spinner } from '@chakra-ui/react';
import { TicketStatus, UserRole } from '@prisma/client';
import { TicketWithNames } from '../../server/trpc/router/ticket';
import { trpc } from '../../utils/trpc';
import { timeDifferenceInMinutes } from '../../utils/utils';
import { StarIcon } from '@chakra-ui/icons';
import { DARK_GRAY_COLOR, DARK_HOVER_COLOR } from '../../utils/constants';
import React from 'react';

interface TicketCardProps {
  ticket: TicketWithNames;
  userRole: UserRole;
  userId: string;
}

/**
 * TicketCard component that displays the details of a ticket
 */
const TicketCard = (props: TicketCardProps) => {
  const { ticket, userRole, userId } = props;

  const hoverColor = useColorModeValue('#dddddd', DARK_HOVER_COLOR);
  const isStaff = userRole === UserRole.STAFF;
  const isPending = ticket.status === TicketStatus.PENDING;
  const isOpen = ticket.status === TicketStatus.OPEN;
  const isAssigned = ticket.status === TicketStatus.ASSIGNED;
  const isAbsent = ticket.status === TicketStatus.ABSENT;
  const canUserClickOnTicket = ticket.isPublic || isStaff || ticket.createdByUserId === userId;

  const approveTicketsMutation = trpc.ticket.approveTickets.useMutation();
  const assignTicketsMutation = trpc.ticket.assignTickets.useMutation();
  const resolveTicketsMutation = trpc.ticket.resolveTickets.useMutation();
  const joinTicketMutation = trpc.ticket.joinTicketGroup.useMutation();
  const leaveTicketMutation = trpc.ticket.leaveTicketGroup.useMutation();
  const markAsAbsentMutation = trpc.ticket.markAsAbsent.useMutation();

  const { data: usersInGroup } = trpc.ticket.getUsersInTicketGroup.useQuery(
    { ticketId: ticket.id },
    {
      enabled: ticket.isPublic,
      refetchOnWindowFocus: false,
    },
  );
  const isCurrentUserInGroup = usersInGroup?.some(user => user.id === userId);

  const handleApproveTicket = async () => {
    await approveTicketsMutation.mutateAsync({ ticketIds: [ticket.id] });
  };

  const handleHelpTicket = async () => {
    Router.push(`/ticket/${ticket.id}`);
    await assignTicketsMutation.mutateAsync({ ticketIds: [ticket.id] });
  };

  const handleResolveTicket = async () => {
    await resolveTicketsMutation.mutateAsync({ ticketIds: [ticket.id] });
  };

  const handleTicketPress = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!canUserClickOnTicket || (event.target as HTMLElement).tagName === 'BUTTON') {
      return;
    }

    Router.push(`/ticket/${ticket.id}`);
  };

  const handleJoinGroup = async () => {
    Router.push(`/ticket/${ticket.id}`);
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
    <Box
      mb={4}
      p={8}
      backgroundColor={useColorModeValue('white', DARK_GRAY_COLOR)}
      width='full'
      borderWidth={1}
      borderRadius={8}
      boxShadow={ticket.isPublic ? '0 0 3px 3px gold' : 'lg'}
      onClick={handleTicketPress}
      className={canUserClickOnTicket ? 'hover-cursor' : ''}
      _hover={canUserClickOnTicket ? { backgroundColor: hoverColor, transition: '0.3s' } : {}}
    >
      <Flex hidden={!ticket.isPublic}>
        <StarIcon mt={-6} ml={-6} color='gold' />
        {usersInGroup === undefined ? (
          <Spinner />
        ) : (
          <Text mt={-7} ml={2}>
            Public ({usersInGroup.length} student{usersInGroup.length === 1 ? '' : 's'} in group)
          </Text>
        )}
      </Flex>
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
            <>
              Being helped by {ticket.helpedByName} for {timeDifferenceInMinutes(new Date(), ticket.helpedAt)} minute(s)
            </>
          </Text>
          <Box textAlign='right'>
            <Button onClick={handleApproveTicket} hidden={!isStaff || !isPending} colorScheme='whatsapp'>
              Approve
            </Button>
            <Button onClick={handleHelpTicket} hidden={!isStaff || !isOpen} colorScheme='whatsapp'>
              Help
            </Button>
            <Button onClick={handleResolveTicket} hidden={!isStaff || !isAssigned} colorScheme='whatsapp'>
              Resolve
            </Button>
            <Button onClick={handleMarkAsAbsent} hidden={!isStaff || !isAbsent} colorScheme='red'>
              {ticket.status === TicketStatus.ABSENT ? 'Unmark' : 'Mark'} as absent
            </Button>
            {usersInGroup === undefined && ticket.isPublic ? (
              <Spinner />
            ) : (
              <Button
                onClick={isCurrentUserInGroup ? handleLeaveGroup : handleJoinGroup}
                hidden={isStaff || !ticket.isPublic}
                colorScheme={isCurrentUserInGroup ? 'red' : 'whatsapp'}
              >
                {isCurrentUserInGroup ? 'Leave' : 'Join'}
              </Button>
            )}
          </Box>
        </Flex>
      </Flex>
    </Box>
  );
};

export default TicketCard;
