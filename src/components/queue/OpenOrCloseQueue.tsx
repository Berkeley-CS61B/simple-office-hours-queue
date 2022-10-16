import { Button } from '@chakra-ui/react';
import { SiteSettings, SiteSettingsValues } from '@prisma/client';
import { trpc } from '../../utils/trpc';

interface OpenOrCloseQueueProps {
  isQueueOpen: boolean;
}

const OpenOrCloseQueue = (props: OpenOrCloseQueueProps) => {
  const { isQueueOpen } = props;
  const setSiteSettingsMutation = trpc.admin.setSiteSettings.useMutation();

  // TODO - add a confirmation modal with asking if they want to wipe queue
  const handleOpenOrCloseQueue = () => {
    const valueToSet = isQueueOpen ? SiteSettingsValues.FALSE : SiteSettingsValues.TRUE;
    setSiteSettingsMutation.mutateAsync({
      [SiteSettings.IS_QUEUE_OPEN]: valueToSet,
    });
  };

  return (
    <Button onClick={handleOpenOrCloseQueue} outlineColor={isQueueOpen ? 'red.300' : 'green.300'} outlineOffset={-2} m={4} mb={0}>
      {isQueueOpen ? 'Close' : 'Open'} Queue
    </Button>
  );
};

export default OpenOrCloseQueue;
