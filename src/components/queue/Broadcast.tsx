import { useState } from 'react';
import { useChannel } from '@ably-labs/react-hooks';
import {
  Flex,
  Input,
  Button,
  ModalFooter,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useToast,
  Center,
  useColorModeValue,
} from '@chakra-ui/react';
import { DARK_GRAY_COLOR } from '../../utils/constants';

/**
 * Broadcast component that allows staff to broadcast messages everyone
 */
const Broadcast = () => {
  const [channel] = useChannel('broadcast', () => {});
  const [broadcastMsg, setBroadcastMsg] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const toast = useToast();

  const broadcast = () => {
    setIsModalOpen(false);
    channel.publish({
      name: 'broadcast',
      data: broadcastMsg,
    });
    setBroadcastMsg('');
  };

  const handleModalOpen = () => {
    if (broadcastMsg.trim() === '') {
      toast({
        title: 'Please enter a message to broadcast',
        position: 'top-right',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <Flex borderColor={useColorModeValue('', 'whiteAlpha.500')}>
      <Input
        m={4}
        placeholder='Broadcast Message'
        value={broadcastMsg}
        onChange={e => setBroadcastMsg(e.target.value)}
        _placeholder={{ color: useColorModeValue('gray.500', 'white') }}
      />
      <Button m={4} onClick={handleModalOpen}>
        Broadcast
      </Button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalContent backgroundColor={useColorModeValue('', DARK_GRAY_COLOR)}>
          <ModalHeader>Confirm Broadcast</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Are you sure you want to broadcast this message? <br /> <br />{' '}
            <Center>
              <strong>{broadcastMsg}</strong>
            </Center>
          </ModalBody>
          <ModalFooter>
            <Button variant='ghost' mr={3} onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button colorScheme='blue' onClick={broadcast}>
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

export default Broadcast;
