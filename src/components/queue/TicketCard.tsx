import { useState } from 'react';
import Router from 'next/router';
import { Box, Button, useColorModeValue, Text, Divider, Tag, Flex, Spinner, useToast } from '@chakra-ui/react';
import { TicketStatus, UserRole } from '@prisma/client';
import { TicketWithNames } from '../../server/trpc/router/ticket';
import { trpc } from '../../utils/trpc';
import { getTicketUrl, timeDifferenceInMinutes, uppercaseFirstLetter } from '../../utils/utils';
import { StarIcon } from '@chakra-ui/icons';
import { DARK_GRAY_COLOR, DARK_HOVER_COLOR, FIVE_MINUTES_IN_MS } from '../../utils/constants';
import { BUTTONS_DISABLED_WAIT_MSG, BUTTONS_DISABLED_WAIT_TIME } from '../ticket-page/TicketButtons';
import Countdown from '../ticket-page/Countdown';

interface TicketCardProps {
  ticket: TicketWithNames;
  userRole: UserRole;
  userId: string;
  idx: number;
}

/**
 * TicketCard component that displays the details of a ticket
 */
const TicketCard = (props: TicketCardProps) => {
  const { ticket, userRole, userId, idx } = props;

  const context = trpc.useContext();
  const toast = useToast();
  const [areButtonsLoading, setAreButtonsLoading] = useState(false);
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(false);

  const hoverColor = useColorModeValue('#dddddd', DARK_HOVER_COLOR);
  const isStaff = userRole === UserRole.STAFF;
  const isIntern = userRole === UserRole.INTERN;
  const isPending = ticket.status === TicketStatus.PENDING;
  const isOpen = ticket.status === TicketStatus.OPEN;
  const isAssigned = ticket.status === TicketStatus.ASSIGNED;
  const isAbsent = ticket.status === TicketStatus.ABSENT;
  const isPriority = ticket.isPriority;
  const canUserClickOnTicket = ticket.isPublic || isStaff || isIntern || ticket.createdByUserId === userId;

  const approveTicketsMutation = trpc.ticket.approveTickets.useMutation();
  const assignTicketsMutation = trpc.ticket.assignTickets.useMutation();
  const resolveTicketsMutation = trpc.ticket.resolveTickets.useMutation();
  const joinTicketMutation = trpc.ticket.joinTicketGroup.useMutation();
  const leaveTicketMutation = trpc.ticket.leaveTicketGroup.useMutation();
  const markAsAbsentMutation = trpc.ticket.markAsAbsent.useMutation();
  const closeTicketMutation = trpc.ticket.closeTicket.useMutation();
  const markAsPriorityMutation = trpc.ticket.markAsPriority.useMutation();
  const requeueTicketsMutation = trpc.ticket.requeueTickets.useMutation();

  const { data: usersInGroup } = trpc.ticket.getUsersInTicketGroup.useQuery(
    { ticketId: ticket.id },
    {
      enabled: ticket.isPublic,
      refetchOnWindowFocus: false,
    },
  );
  const isCurrentUserInGroup = usersInGroup?.some(user => user.id === userId);

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

  const handleApproveTicket = async () => {
    onClickWrapper(async () => {
      await approveTicketsMutation.mutateAsync({ ticketIds: [ticket.id] });
    })();
  };

  const handleHelpTicket = async () => {
    onClickWrapper(async () => {
      const res = await assignTicketsMutation.mutateAsync({ ticketIds: [ticket.id] });
      if (res.length > 0) {
        Router.push(getTicketUrl(ticket.id));
      } else {
        toast({
          title: 'Ticket already assigned',
          description: 'This ticket is already assigned to a staff member.',
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top-right',
        });
      }
    })();
  };

  const handleResolveTicket = async () => {
    onClickWrapper(async () => {
      await resolveTicketsMutation.mutateAsync({ ticketIds: [ticket.id] });
    })();
  };

  const handleTicketPress = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!canUserClickOnTicket || (event.target as HTMLElement).tagName === 'BUTTON') {
      return;
    }
    Router.push(getTicketUrl(ticket.id));
  };

  const handleJoinGroup = async () => {
    onClickWrapper(async () => {
      await joinTicketMutation.mutateAsync({ ticketId: ticket.id });
      Router.push(getTicketUrl(ticket.id));
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

  const handleEscalate = async () => {
    const prioritizeAndRequeue = async () => {
      await markAsPriorityMutation.mutateAsync({
        ticketId: ticket.id,
        isPriority: !isPriority,
      });
      await requeueTicketsMutation.mutateAsync({
        ticketIds: [ticket.id],
      });
    };
    await onClickWrapper(() => prioritizeAndRequeue())();
  };

  const handleCloseTicket = async () => {
    await onClickWrapper(() => closeTicketMutation.mutateAsync({ ticketId: ticket.id }))();
  };

  const deleteTicketThenRefresh = async () => {
    await closeTicketMutation.mutateAsync({ ticketId: ticket.id });
    context.ticket.getTicketsWithStatus.invalidate({ status: ticket.status });
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
      <Flex direction='row' mt={-7} ml={-6}>
        <Text fontStyle='italic' color='gray.500'>
          {idx > -1 ? `#${idx} (${uppercaseFirstLetter(ticket.status)})` : `${uppercaseFirstLetter(ticket.status)}`}
        </Text>
        <Flex hidden={!ticket.isPublic}>
          <StarIcon color='gold' mt={1} ml={2} mr={2} />
          {usersInGroup === undefined ? (
            <Spinner />
          ) : (
            <Text>
              Public ({usersInGroup.length} student{usersInGroup.length === 1 ? '' : 's'} in group)
            </Text>
          )}
        </Flex>
      </Flex>
      <Text fontSize='lg' whiteSpace='pre-line'>
        {ticket.description}
      </Text>
      <Divider my={4} />
      <Flex justifyContent='space-between'>
        <Box>
          <Tag p={2.5} mr={2} size='lg' colorScheme='green' borderRadius={5}>
            {uppercaseFirstLetter(ticket.ticketType)}
          </Tag>
          <Tag p={2.5} size='lg' mr={3} colorScheme='blue' borderRadius={5}>
            {ticket.assignmentName}
          </Tag>
          <Tag p={2.5} size='lg' colorScheme='orange' borderRadius={5}>
            {ticket.locationName}
          </Tag>
        </Box>
        <Flex flexDirection='column'>
          <Text
            hidden={ticket.status !== TicketStatus.OPEN && ticket.status !== TicketStatus.PENDING}
            fontSize='lg'
            mb={2}
            alignSelf='flex-end'
          >
            Created {timeDifferenceInMinutes(new Date(), ticket.createdAt)} minute(s) ago
          </Text>
          <Text hidden={ticket.status !== TicketStatus.ASSIGNED} fontSize='lg' mb={2}>
            Being helped by {ticket.helpedByName} for {timeDifferenceInMinutes(new Date(), ticket.helpedAt)} minute(s)
          </Text>
          {ticket.markedAbsentAt && ticket.status === TicketStatus.ABSENT && (
            <Box alignSelf='flex-end'>
              <Countdown
                onComplete={deleteTicketThenRefresh}
                key={ticket.markedAbsentAt.getTime()}
                initialTimeInMs={FIVE_MINUTES_IN_MS - (new Date().getTime() - ticket.markedAbsentAt.getTime())}
              />
            </Box>
          )}
          <Box textAlign='right'>
            <Button
              title={areButtonsDisabled ? BUTTONS_DISABLED_WAIT_MSG : ''}
              disabled={areButtonsDisabled}
              isLoading={areButtonsLoading}
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
              onClick={handleCloseTicket}
              mr={2}
              hidden={!isStaff || !isAbsent}
              colorScheme='red'
            >
              Delete
            </Button>
            <Button
              title={areButtonsDisabled ? BUTTONS_DISABLED_WAIT_MSG : ''}
              disabled={areButtonsDisabled}
              isLoading={areButtonsLoading}
              onClick={handleMarkAsAbsent}
              hidden={!isStaff || !isAbsent}
              colorScheme='red'
            >
              {ticket.status === TicketStatus.ABSENT ? 'Unmark' : 'Mark'} as absent
            </Button>
            <Button
              title={areButtonsDisabled ? BUTTONS_DISABLED_WAIT_MSG : ''}
              disabled={areButtonsDisabled}
              isLoading={areButtonsLoading}
              onClick={handleMarkAsPriority}
              hidden={!isStaff || (!isPending && !isOpen && !isAssigned)}
              ml={2}
              colorScheme='purple'
            >
              {isPriority ? 'Unprioritize' : 'Prioritize'}
            </Button>
            <Button
              title={areButtonsDisabled ? BUTTONS_DISABLED_WAIT_MSG : ''}
              disabled={areButtonsDisabled}
              isLoading={areButtonsLoading}
              onClick={handleEscalate}
              hidden={!isIntern || !isAssigned || isPriority}
              ml={2}
              colorScheme='purple'
            >
              Escalate
            </Button>
            {usersInGroup === undefined && ticket.isPublic ? (
              <Spinner />
            ) : (
              <Button
                title={areButtonsDisabled ? BUTTONS_DISABLED_WAIT_MSG : ''}
                disabled={areButtonsDisabled}
                isLoading={areButtonsLoading}
                onClick={isCurrentUserInGroup ? handleLeaveGroup : handleJoinGroup}
                hidden={isStaff || isIntern || !ticket.isPublic}
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
