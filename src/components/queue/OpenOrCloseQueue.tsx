import { useChannel } from '@ably-labs/react-hooks';
import {
  Button,
  ModalFooter,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useColorModeValue,
} from '@chakra-ui/react';
import { SiteSettings, SiteSettingsValues } from '@prisma/client';
import { useState } from 'react';
import { DARK_GRAY_COLOR, DARK_HOVER_COLOR } from '../../utils/constants';
import { trpc } from '../../utils/trpc';

interface OpenOrCloseQueueProps {
  isQueueOpen: boolean;
}

const OpenOrCloseQueue = (props: OpenOrCloseQueueProps) => {
  const [channel] = useChannel('broadcast', () => {});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isQueueOpen } = props;
  const setSiteSettingsMutation = trpc.admin.setSiteSettings.useMutation();
  const clearQueueMutation = trpc.ticket.clearQueue.useMutation();
  const context = trpc.useContext();

  const handleOpenOrCloseQueue = async (shouldClearQueue: boolean) => {
    const valueToSet = isQueueOpen ? SiteSettingsValues.FALSE : SiteSettingsValues.TRUE;
    await setSiteSettingsMutation.mutateAsync({
      [SiteSettings.IS_QUEUE_OPEN]: valueToSet,
    });
    setIsModalOpen(false);
    if (shouldClearQueue) {
      await clearQueueMutation.mutateAsync();
      context.ticket.getTicketsWithStatus.invalidate();
    }
    channel.publish({
      name: 'broadcast',
      data: 'The queue has been ' + (isQueueOpen ? 'closed' : 'opened') + (shouldClearQueue ? ' and cleared' : ''),
    });
  };

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        outlineColor={isQueueOpen ? 'red.300' : 'green.300'}
        outlineOffset={-2}
        m={4}
        mb={0}
      >
        {isQueueOpen ? 'Close' : 'Open'} Queue
      </Button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalContent
          backgroundColor={useColorModeValue('', DARK_GRAY_COLOR)}
          boxShadow={`0 0 1px 2px ${DARK_HOVER_COLOR}`}
        >
          <ModalHeader>{isQueueOpen ? 'Close' : 'Open'} Queue</ModalHeader>
          <ModalCloseButton />
          <ModalBody>Are you sure you want to {isQueueOpen ? 'close' : 'open'} the queue?</ModalBody>
          <ModalFooter>
            <Button variant='ghost' mr={3} onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button colorScheme='blue' mr={3} onClick={() => handleOpenOrCloseQueue(false)}>
              Confirm
            </Button>
            {isQueueOpen && (
              <Button colorScheme='green' onClick={() => handleOpenOrCloseQueue(true)}>
                Confirm and Clear Queue
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default OpenOrCloseQueue;
