import { useState } from 'react';
import { Box, Button, Flex, Heading, Input, Spinner, Text, useColorModeValue, useToast } from '@chakra-ui/react';
import { sanitizeString } from '../../utils/utils';
import { DARK_GRAY_COLOR } from '../../utils/constants';
import { trpc } from '../../utils/trpc';
import Router from 'next/router';

const CreatePersonalQueue = () => {
  const [queueName, setQueueName] = useState('');
  const borderColor = useColorModeValue(DARK_GRAY_COLOR, 'white');
  const toast = useToast();

  const { refetch: getQueue } = trpc.queue.getQueueByName.useQuery({ queueName }, { enabled: false });

  // Redirect to personal queue if it already exists
  const { isLoading: isGetCurrentUserQueueLoading } = trpc.queue.getCurrentUserQueue.useQuery(undefined, {
	refetchOnWindowFocus: false,
    onSuccess: data => {
      if (data) {
        Router.push(`/queue/${data.name}`, undefined, { shallow: true });
      }
    },
  });

  const createQueueMutation = trpc.queue.createQueue.useMutation();

  const handleCreateQueue = async () => {
    // A valid queue name must be between 3 and 25 characters long
    // and contain only alphanumeric characters and dashes/underscores
    const isValid = /^[a-zA-Z0-9-_]{3,25}$/.test(queueName);
    if (!isValid) {
      toast({
        title: 'Invalid queue name',
        description:
          'Queue name must be between 3 and 25 characters long and contain only alphanumeric characters, dashes, and underscores.',
        status: 'error',
        position: 'top-right',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const { data: queue } = await getQueue();

    if (queue) {
      toast({
        title: 'Queue already exists',
        description: `Queue "${queueName}" already exists.`,
        status: 'error',
        position: 'top-right',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    createQueueMutation
      .mutateAsync({ name: queueName })
      .then(() => {
        toast({
          title: 'Queue created',
          description: `Queue "${queueName}" has been created.`,
          status: 'success',
          position: 'top-right',
          duration: 3000,
          isClosable: true,
        });
      })
      .then(() => {
        Router.push(`/queue/${queueName}`);
      });
  };

  if (isGetCurrentUserQueueLoading) {
	return <Spinner />
  }

  return (
    <Flex direction='column' align='center' justify='center' p={8}>
      <Heading as='h1' size='xl' mb={4}>
        Create your personal queue!
      </Heading>
      <Flex
        direction='row'
        align='center'
        justify='center'
        m={8}
        p={8}
        border={`1px solid ${borderColor}`}
        borderRadius={8}
      >
        <Box>
          <Text fontSize='2xl'>{window.location.origin}/queue/</Text>
        </Box>
        <Box>
          <Input
            fontSize='2xl'
            placeholder='queue-name'
            value={queueName}
            onChange={e => setQueueName(sanitizeString(e.target.value))}
            border='none'
            maxLength={25}
            _focusVisible={{ boxShadow: 'none', outline: 'none' }}
            ml={-4}
          />
        </Box>
      </Flex>
      <Button fontSize='xl' colorScheme='green' p={8} onClick={handleCreateQueue}>
        Check Availability and Create
      </Button>
    </Flex>
  );
};

export default CreatePersonalQueue;
