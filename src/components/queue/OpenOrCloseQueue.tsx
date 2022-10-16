import { useChannel } from '@ably-labs/react-hooks';
import { Button, ModalFooter, Modal, ModalContent, ModalHeader, ModalBody, ModalCloseButton } from '@chakra-ui/react';
import { SiteSettings, SiteSettingsValues } from '@prisma/client';
import { useState } from 'react';
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
    if (shouldClearQueue) {
      await clearQueueMutation.mutateAsync();
      context.ticket.getTicketsWithStatus.invalidate();
    }
    setIsModalOpen(false);
    channel.publish({
      name: 'broadcast',
      data:
        'The queue has been ' +
        (isQueueOpen ? 'closed' : 'opened') +
        (shouldClearQueue ? ' and the queue has been cleared' : ''),
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
        <ModalContent>
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
