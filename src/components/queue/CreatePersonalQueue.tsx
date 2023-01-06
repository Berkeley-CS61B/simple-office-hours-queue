import { useState } from 'react';
import { Box, Button, Flex, Heading, Input, Text, useColorModeValue, useToast } from '@chakra-ui/react';
import { sanitizeString } from '../../utils/utils';
import { DARK_GRAY_COLOR } from '../../utils/constants';
import { trpc } from '../../utils/trpc';

const MAX_QUEUE_NAME_LENGTH = 25;
const MIN_QUEUE_NAME_LENGTH = 3;

const CreatePersonalQueue = () => {
  const [queueName, setQueueName] = useState('');
  const borderColor = useColorModeValue(DARK_GRAY_COLOR, 'white');
  const toast = useToast();

  const { refetch: getQueue } = trpc.queue.getQueue.useQuery({ queueName }, { enabled: false });

  const handleCreateQueue = async () => {
    // a valid queuen name must be between 3 and 25 characters long
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

	// 
  };

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
            maxLength={MAX_QUEUE_NAME_LENGTH}
            _focusVisible={{ boxShadow: 'none', outline: 'none' }}
            ml={-4}
          />
        </Box>
      </Flex>
      <Button fontSize='xl' colorScheme='blue' p={8} onClick={handleCreateQueue}>
        Check Availability and Create
      </Button>
    </Flex>
  );
};

export default CreatePersonalQueue;
