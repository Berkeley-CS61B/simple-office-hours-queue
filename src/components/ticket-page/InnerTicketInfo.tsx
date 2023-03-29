import { useEffect, useState } from 'react';
import { UserRole, TicketStatus, User } from '@prisma/client';
import {
  Text,
  Spinner,
  Box,
  List,
  ListItem,
  Tag,
  Flex,
  Button,
  Tooltip,
  Textarea,
  Editable,
  EditableInput,
  EditableTextarea,
  useEditableControls,
  ButtonGroup,
  IconButton,
} from '@chakra-ui/react';
import { timeDifferenceInMinutes, uppercaseFirstLetter } from '../../utils/utils';
import { CheckIcon, CloseIcon, EditIcon } from '@chakra-ui/icons';
import { FIVE_MINUTES_IN_MS } from '../../utils/constants';
import { trpc } from '../../utils/trpc';
import { useChannel } from '@ably-labs/react-hooks';
import Confetti from 'react-confetti';
import { TicketWithNames } from '../../server/trpc/router/ticket';
import StaffNotes from './StaffNotes';
import useNotification from '../../utils/hooks/useNotification';
import TicketButtons from './TicketButtons';
import Countdown from './Countdown';

interface InnerTicketInfoProps {
  ticket: TicketWithNames;
  userRole: UserRole;
  userId: string;
}

const EditableControls = ({ setIsEditing }: { setIsEditing: (val: boolean) => void }) => {
  const { isEditing, getSubmitButtonProps, getCancelButtonProps, getEditButtonProps } = useEditableControls();

  useEffect(() => {
    setIsEditing(isEditing);
  }, [isEditing, setIsEditing]);

  return isEditing ? (
    <ButtonGroup ml={4} mt={1} justifyContent='center' size='sm'>
      <IconButton aria-label='Confirm' icon={<CheckIcon />} {...getSubmitButtonProps()} />
      <IconButton aria-label='Cancel' icon={<CloseIcon />} {...getCancelButtonProps()} />
    </ButtonGroup>
  ) : (
    <Flex ml={2} mt={1} justifyContent='center'>
      <IconButton aria-label='Edit' size='sm' icon={<EditIcon />} {...getEditButtonProps()} />
    </Flex>
  );
};

/**
 * InnerTicketInfo component that displays the ticket information (left column)
 */
const InnerTicketInfo = (props: InnerTicketInfoProps) => {
  const { ticket, userRole, userId } = props;

  const [showConfetti, setShowConfetti] = useState(false);
  const [usersInGroup, setUsersInGroup] = useState<User[]>([]);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingLocationDescription, setIsEditingLocationDescription] = useState(false);

  const isCurrentUserInGroup = usersInGroup.some(user => user.id === userId);

  const { showNotification } = useNotification();

  const markAsAbsentMutation = trpc.ticket.markAsAbsent.useMutation();
  const closeTicketMutation = trpc.ticket.closeTicket.useMutation();
  const editTicketDescriptionMutation = trpc.ticket.editTicketDescription.useMutation();
  const editTicketLocationDescriptionMutation = trpc.ticket.editTicketLocationDescription.useMutation();
  const isResolved = ticket.status === TicketStatus.RESOLVED;
  const isAssigned = ticket.status === TicketStatus.ASSIGNED;
  const isClosed = ticket.status === TicketStatus.CLOSED;
  const isAbsent = ticket.status === TicketStatus.ABSENT;
  const isPending = ticket.status === TicketStatus.PENDING;

  const isStaff = userRole === UserRole.STAFF;
  const isStudent = userRole === UserRole.STUDENT;
  const isIntern = userRole === UserRole.INTERN;
  const helpOrJoin = isStaff || isIntern ? 'Help' : 'Join';

  const canSeeName =
    userId === ticket.createdByUserId ||
    isCurrentUserInGroup ||
    ((isStaff || isIntern) && (isAssigned || isResolved || isClosed || isAbsent || isPending));

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
  }, [context.ticket.getTicket, ticket.id, ticket.status]);

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
      'ticket-marked-as-absent',
      'ticket-closed',
      'ticket-joined',
      'ticket-left',
      'ticket-marked-as-priority',
      'ticket-description-changed',
      'ticket-location-description-changed',
      'ticket-toggle-public',
    ];

    const messageShouldBeUpdate: string[] = [
      'ticket-description-changed',
      'ticket-location-description-changed',
      'ticket-toggle-public',
    ];

    const shouldNotNotifyStudent: string[] = ['ticket-staffnote', 'ticket-marked-as-priority'];

    if (shouldUpdateTicketMessages.includes(message)) {
      context.ticket.getTicket.invalidate({ id: ticket.id });

      if (message === 'ticket-joined' || message === 'ticket-left') {
        context.ticket.getUsersInTicketGroup.invalidate({ ticketId: ticket.id });
      }

      // Notify the student when the ticket is updated
      if (userRole === UserRole.STUDENT) {
        let update = message.split('-')[1];
        if (message === 'ticket-marked-as-absent') {
          update = `${ticketData.data.isAbsent ? 'unmarked' : 'marked'} as absent`;
        }
        if (messageShouldBeUpdate.includes(message)) {
          update = `updated`;
        }
        if (!shouldNotNotifyStudent.includes(message)) {
          showNotification(`Ticket ${update}`, `Your ticket has been ${update}`);
        }
      }
    }
  });

  const handleMarkAsAbsent = async () => {
    await markAsAbsentMutation.mutateAsync({
      ticketId: ticket.id,
      markOrUnmark: ticket.status !== TicketStatus.ABSENT,
    });
  };

  const handleCloseTicket = async () => {
    if (!isClosed) {
      await closeTicketMutation.mutateAsync({ ticketId: ticket.id });
    }
  };

  /** Name with an email hover */
  const TooltipName = ({ createdByName, createdByEmail }: { createdByName: string; createdByEmail: string }) => {
    return (
      <Tooltip placement='top' isDisabled={!canSeeName} label={createdByEmail}>
        {createdByName}
      </Tooltip>
    );
  };

  const handleDescriptionChange = async (newDescription: string) => {
    if (ticket.status == TicketStatus.PENDING || ticket.status == TicketStatus.OPEN) {
      await editTicketDescriptionMutation.mutateAsync({ ticketId: ticket.id, description: newDescription });
    }
  };

  const handleLocationDescriptionChange = async (newLocationDescription: string) => {
    if (ticket.status == TicketStatus.PENDING || ticket.status == TicketStatus.OPEN) {
      await editTicketLocationDescriptionMutation.mutateAsync({
        ticketId: ticket.id,
        locationDescription: newLocationDescription,
      });
    }
  };

  return (
    <>
      <Text fontSize='2xl'>
        {canSeeName ? (
          <TooltipName createdByName={ticket.createdByName ?? ''} createdByEmail={ticket.createdByEmail ?? ''} />
        ) : (
          <>{helpOrJoin} to see name</>
        )}
      </Text>
      <Text>
        <span className='semibold'>Ticket Status:</span> {uppercaseFirstLetter(ticket.status)}
      </Text>
      <Text hidden={!isAssigned}>
        <>
          Being helped by {ticket.helpedByName} for {timeDifferenceInMinutes(new Date(), ticket.helpedAt)} minute(s)
        </>
      </Text>
      <Text hidden={!isResolved}>Helped by {ticket.helpedByName}</Text>
      <Text mt={4}>Description:</Text>
      <Flex justifyContent='center'>
        <Text hidden={isEditingDescription} whiteSpace='pre-line' mt={2} textAlign='left' ml={4}>
          {ticket.description}
        </Text>
        <Editable
          hidden={ticket.status !== TicketStatus.PENDING && ticket.status !== TicketStatus.OPEN}
          onSubmit={handleDescriptionChange}
          fontWeight='semibold'
          submitOnBlur={false}
          defaultValue={ticket.description ?? ''}
          display='flex'
          justifyContent='center'
          fontSize='md'
          isPreviewFocusable={false}
        >
          <Textarea as={EditableTextarea} textAlign='left' maxLength={1000} resize='both' />
          <EditableControls setIsEditing={setIsEditingDescription} />
        </Editable>
      </Flex>

      <Box mb={4} mt={4}>
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

      <Text hidden={!ticket.locationDescription}>
        <span className='semibold'>Location Description:</span>
      </Text>

      <Flex justifyContent='center'>
        <Text hidden={isEditingLocationDescription} fontWeight='semibold' mt={2}>
          {ticket.locationDescription}
        </Text>
        <Editable
          hidden={ticket.status !== TicketStatus.PENDING && ticket.status !== TicketStatus.OPEN}
          onSubmit={handleLocationDescriptionChange}
          fontWeight='semibold'
          submitOnBlur={false}
          defaultValue={ticket.locationDescription ?? ''}
          display='flex'
          justifyContent='center'
          fontSize='md'
          isPreviewFocusable={false}
        >
          <Text as={EditableInput} textAlign='left' maxLength={190} />
          <EditableControls setIsEditing={setIsEditingLocationDescription} />
        </Editable>
      </Flex>

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
                  <ListItem key={user.id}>{user.preferredName ?? user.name}</ListItem>
                ))}
              </List>
            )}
          </>
        ) : (
          <Text>{helpOrJoin} to see names</Text>
        )}
      </Box>

      <TicketButtons
        ticket={ticket}
        userId={userId}
        isGetUsersLoading={isGetUsersLoading}
        userRole={userRole}
        isCurrentUserInGroup={isCurrentUserInGroup}
        setShowConfetti={setShowConfetti}
      />
      <StaffNotes ticket={ticket} userRole={userRole} />
      <Flex
        hidden={!isAbsent}
        flexDirection='column'
        justifyContent='center'
        backgroundColor='red.500'
        mt={3}
        ml={3}
        borderRadius={4}
        p={2}
      >
        <Text fontWeight='semibold' fontSize='xl'>
          This ticket has been marked as absent. If you do not click the &quot;
          {isStaff ? 'Unmark as absent' : 'I am here'}&quot; button {isStaff ? 'above' : 'below'}, the ticket will be
          closed in
        </Text>
        {ticket.markedAbsentAt && (
          <Countdown
            key={ticket.markedAbsentAt.getTime()}
            initialTimeInMs={FIVE_MINUTES_IN_MS - (new Date().getTime() - ticket.markedAbsentAt.getTime())}
            onComplete={handleCloseTicket}
          />
        )}
      </Flex>
      <Button colorScheme='whatsapp' m={4} onClick={handleMarkAsAbsent} hidden={!isStudent || !isAbsent}>
        I am here
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
