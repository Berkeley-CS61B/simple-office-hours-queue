import { useEffect, useState } from 'react';
import { SettingsIcon } from '@chakra-ui/icons';
import {
  Button,
  ModalFooter,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useColorModeValue,
  Flex,
  Text,
  Box,
  Spinner,
  useToast,
  Input,
  Switch,
} from '@chakra-ui/react';
import { UserRole } from '@prisma/client';
import { NextPage } from 'next';
import { useSession } from 'next-auth/react';
import Router, { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import QueueLayout from '../../components/queue/QueueLayout';
import { DARK_GRAY_COLOR, DARK_HOVER_COLOR } from '../../utils/constants';
import { trpc } from '../../utils/trpc';
import { sanitizeString } from '../../utils/utils';

/**
 * Component that renders the Personal queue page. It ensures that
 * the queue exists and the user is authorized to view the queue.
 */
const PersonalQueuePage: NextPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const toast = useToast();
  const queueName = router.query.name as string;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [changedQueueName, setChangedQueueName] = useState<string | undefined>();
  const [isSwitchToggled, setIsSwitchToggled] = useState(false);

  const editQueueNameMutation = trpc.queue.editQueueName.useMutation();
  const allowStaffToOpenMutation = trpc.queue.editAllowStaffToOpen.useMutation();

  useEffect(() => {
    if (queueName) {
      setChangedQueueName(queueName);
    }
  }, [queueName]);

  const { data: queue } = trpc.queue.getQueueByName.useQuery(
    { queueName },
    {
      enabled: queueName !== undefined && session?.user !== undefined,
      refetchOnWindowFocus: false,
      onSuccess: data => {
        if (!data) {
          toast({
            title: 'Queue does not exist',
            description: `Queue "${queueName}" does not exist.`,
            status: 'error',
            position: 'top-right',
            duration: 3000,
            isClosable: true,
          });

          if (session?.user?.role === UserRole.STAFF) {
            Router.push('/create-queue');
          } else {
            Router.push('/');
          }
        }
      },
    },
  );

  const handleAllowStaffToOpen = async () => {
    if (!queue) return;

    const newVal = !isSwitchToggled;
    setIsSwitchToggled(newVal);
    allowStaffToOpenMutation
      .mutateAsync({ queueName: queue.name, allowStaffToOpen: newVal })
      .then(() => {
        toast({
          title: 'Queue settings changed',
          description: `Other staff members can ${newVal ? '' : 'not'} open/close this queue`,
          status: 'success',
          position: 'top-right',
          duration: 3000,
          isClosable: true,
        });
      })
      .catch(err => {
        toast({
          title: 'Error changing queue settings',
          description: err.message,
          status: 'error',
          position: 'top-right',
          duration: 3000,
          isClosable: true,
        });
        setIsSwitchToggled(!newVal);
      });
  };

  const handleEditQueueName = async () => {
    setIsModalOpen(false);
    const isValid = /^[a-zA-Z0-9-_]{3,25}$/.test(changedQueueName ?? '');
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

    if (!queue || !changedQueueName || queue.name.toLowerCase() === changedQueueName.toLowerCase()) {
      toast({
        title: 'Queue name unchanged',
        description: `Queue name is already "${changedQueueName}"`,
        status: 'error',
        position: 'top-right',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    editQueueNameMutation
      .mutateAsync({ queueName: queue.name, newName: changedQueueName })
      .then(() => {
        toast({
          title: 'Queue name changed',
          description: `Queue name changed to "${changedQueueName}"`,
          status: 'success',
          position: 'top-right',
          duration: 3000,
          isClosable: true,
        });
        Router.push(`/queue/${changedQueueName}`);
        return;
      })
      .catch(err => {
        toast({
          title: 'Error changing queue name',
          description: err.message,
          status: 'error',
          position: 'top-right',
          duration: 3000,
          isClosable: true,
        });
      });
  };

  return (
    <Layout>
      {!queue ? (
        <Spinner />
      ) : (
        <>
          <Flex p={4} justifyContent='space-between'>
            <Text fontSize='2xl'>Queue name: {queue.name}</Text>
            {queue.ownerId === session?.user?.id && (
              <Box>
                <SettingsIcon boxSize={5} className='hover-cursor' mt={2.5} onClick={() => setIsModalOpen(true)} />
              </Box>
            )}
          </Flex>
          <QueueLayout personalQueue={queue} />
        </>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalContent
          backgroundColor={useColorModeValue('', DARK_GRAY_COLOR)}
          boxShadow={`0 0 1px 2px ${DARK_HOVER_COLOR}`}
        >
          <ModalHeader>Edit Personal Queue</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize='xl' mb={2}>
              Queue name
            </Text>
            <Input
              maxLength={25}
              value={changedQueueName ?? ''}
              onChange={e => setChangedQueueName(sanitizeString(e.target.value))}
            />
            <Button width='100%' mb={4} mt={2} colorScheme='green' onClick={handleEditQueueName}>
              Check validity and change name
            </Button>
            <Text>Allow other staff members to open/close your queue</Text>
            <Switch onChange={handleAllowStaffToOpen} isChecked={isSwitchToggled} />
          </ModalBody>
          <ModalFooter>
            <Button variant='ghost' mr={3} onClick={() => setIsModalOpen(false)}>
              Done
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  );
};

export default PersonalQueuePage;
