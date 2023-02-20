import { useState } from 'react';
import { trpc } from '../../utils/trpc';
import { Select } from 'chakra-react-select';
import Router from 'next/router';
import {
  Box,
  FormControl,
  Input,
  FormLabel,
  Button,
  useToast,
  Switch,
  Tooltip,
  Textarea,
  RadioGroup,
  Radio,
  Flex,
  Text,
} from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';
import { PersonalQueue, TicketType } from '@prisma/client';
import { STARTER_CONCEPTUAL_TICKET_DESCRIPTION, STARTER_DEBUGGING_TICKET_DESCRIPTION } from '../../utils/constants';
import { uppercaseFirstLetter } from '../../utils/utils';
import ConfirmPublicToggleModal from '../modals/ConfirmPublicToggleModal';

interface Assignment {
  id: number;
  label: string;
  value: string;
}

interface Location {
  id: number;
  label: string;
  value: string;
}

interface CreateTicketFormProps {
  arePublicTicketsEnabled: boolean;
  personalQueue?: PersonalQueue;
}

const CreateTicketForm = (props: CreateTicketFormProps) => {
  const { arePublicTicketsEnabled, personalQueue } = props;
  const [ticketType, setTicketType] = useState<TicketType>();
  const [description, setDescription] = useState<string>('');
  const [locationDescription, setLocationDescription] = useState<string>('');
  const [assignment, setAssignment] = useState<Assignment>();
  const [assignmentOptions, setAssignmentOptions] = useState<Assignment[]>([]);
  const [locationOptions, setLocationOptions] = useState<Location[]>([]);
  const [isPublicModalOpen, setIsPublicModalOpen] = useState<boolean>(false);
  const [location, setLocation] = useState<Location>();
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const toast = useToast();

  const createTicketMutation = trpc.ticket.createTicket.useMutation();
  trpc.admin.getActiveAssignments.useQuery(undefined, {
    refetchOnWindowFocus: false,
    onSuccess: data => {
      setAssignmentOptions(
        data.map(assignment => ({ label: assignment.name, value: assignment.name, id: assignment.id } as Assignment)),
      );
    },
  });

  trpc.admin.getActiveLocations.useQuery(undefined, {
    refetchOnWindowFocus: false,
    onSuccess: data => {
      setLocationOptions(
        data.map(location => ({ label: location.name, value: location.name, id: location.id } as Location)),
      );
    },
  });

  const handleTicketTypeChange = (newVal: TicketType) => {
    setTicketType(newVal);
    if (newVal === TicketType.DEBUGGING) {
      setDescription(STARTER_DEBUGGING_TICKET_DESCRIPTION);
      setIsPublic(false);
    } else {
      setDescription(STARTER_CONCEPTUAL_TICKET_DESCRIPTION);
      setIsPublic(true);
    }
  };

  const handleTogglePublic = () => {
    if (ticketType === TicketType.CONCEPTUAL && isPublic) {
      setIsPublicModalOpen(true);
      return;
    }
    setIsPublic(!isPublic);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!assignment || !location || !ticketType) {
      toast({
        title: 'Error',
        description: 'Please select an assignment and location',
        status: 'error',
        position: 'top-right',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // If description has "[this test]" or "[this concept]" in it, toast and return
    if (description.includes('[this test]') || description.includes('[this concept]')) {
      toast({
        title: 'Error',
        description: 'Please replace [this concept] with the name the concept',
        status: 'error',
        position: 'top-right',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    await createTicketMutation
      .mutateAsync({
        description: description.trim(),
        assignmentId: assignment.id,
        locationId: location.id,
        locationDescription: locationDescription.trim(),
        personalQueueName: personalQueue?.name,
        ticketType,
        isPublic,
      })
      .then(ticket => {
        if (!ticket) {
          toast({
            title: 'Error',
            description: 'Could not create ticket. You may already have a ticket open.',
            status: 'error',
            position: 'top-right',
            duration: 3000,
            isClosable: true,
          });
          return;
        }
        setDescription('');
        // Resets the select options
        setAssignment('' as unknown as Assignment);
        setLocation('' as unknown as Location);
        toast({
          title: 'Ticket created',
          description: 'Your help request has been created',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top-right',
        });
        Router.push(`/ticket/${ticket?.id}`);
      });
  };

  return (
    <Box p={8} pt={2} width='full' borderWidth={1} borderRadius={8} boxShadow='lg'>
      <Box my={4} textAlign='left'>
        <form onSubmit={onSubmit}>
          <FormControl isRequired>
            <Flex>
              <FormLabel>Ticket Type</FormLabel>
              <RadioGroup onChange={handleTicketTypeChange} value={ticketType}>
                {Object.keys(TicketType).map(type => (
                  <Radio mr={2} key={type} value={type}>
                    {uppercaseFirstLetter(type)}
                  </Radio>
                ))}
              </RadioGroup>
            </Flex>
          </FormControl>
          <FormControl isRequired isDisabled={ticketType === undefined}>
            <FormLabel>Description</FormLabel>
            <Text hidden={ticketType !== TicketType.CONCEPTUAL} mb={2}>
              Please make sure staff does not have to look at your code to answer your question.
            </Text>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              name='description'
              size='md'
              maxLength={1000}
              height={ticketType === TicketType.DEBUGGING ? '200px' : '50px'}
            />
          </FormControl>
          <FormControl mt={6} isRequired>
            <FormLabel>Assignment</FormLabel>
            <Select value={assignment} onChange={val => setAssignment(val ?? undefined)} options={assignmentOptions} />
          </FormControl>
          <FormControl mt={6} isRequired>
            <FormLabel>Location</FormLabel>
            <Select value={location} onChange={val => setLocation(val ?? undefined)} options={locationOptions} />
          </FormControl>
          <FormControl mt={6} isRequired={isPublic}>
            <FormLabel>Briefly describe where you are</FormLabel>
            <Input
              value={locationDescription}
              onChange={e => setLocationDescription(e.target.value)}
              type='text'
              placeholder='Back right corner of the room'
              name='locationDescription'
              maxLength={140}
            />
          </FormControl>
          <FormControl
            mt={6}
            display='flex'
            hidden={!arePublicTicketsEnabled}
            isDisabled={ticketType === TicketType.DEBUGGING || ticketType === undefined}
          >
            <FormLabel>
              Public
              <Tooltip
                hasArrow
                label='Public tickets can be joined by other students. This is great for group work 
						   or conceptual questions! If your ticket is public, we are more likely to 
						   help you for a longer time.'
                bg='gray.300'
                color='black'
              >
                <InfoIcon ml={2} mb={1} />
              </Tooltip>
            </FormLabel>
            <Switch isChecked={isPublic} mt={1} onChange={handleTogglePublic} />
          </FormControl>
          <Button type='submit' width='full' mt={4} colorScheme='whatsapp'>
            Request Help
          </Button>
        </form>
      </Box>
      <ConfirmPublicToggleModal
        isModalOpen={isPublicModalOpen}
        setIsModalOpen={setIsPublicModalOpen}
        handleConfirm={() => {
          setIsPublicModalOpen(false);
          setIsPublic(false);
        }}
      />
    </Box>
  );
};

export default CreateTicketForm;
