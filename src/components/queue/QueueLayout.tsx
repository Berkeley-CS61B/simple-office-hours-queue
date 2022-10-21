import { useEffect, useState } from 'react';
import { SiteSettings, SiteSettingsValues, UserRole } from '@prisma/client';
import TicketQueue from './TicketQueue';
import CreateTicket from './CreateTicket';
import Broadcast from './Broadcast';
import OpenOrCloseQueue from './OpenOrCloseQueue';
import { Spinner } from '@chakra-ui/react';
import { useChannel } from '@ably-labs/react-hooks';
import useSiteSettings from '../../utils/hooks/useSiteSettings';

interface QueueLayoutProps {
  userRole: UserRole;
}
/**
 * Intermediate component to guarantee that Ably is initialized
 */
const QueueLayout = (props: QueueLayoutProps) => {
  const { userRole } = props;
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>();
  const [isPendingStageEnabled, setIsPendingStageEnabled] = useState<boolean>();
  const { siteSettings } = useSiteSettings();

  useEffect(() => {
    if (siteSettings) {
      setIsQueueOpen(siteSettings.get(SiteSettings.IS_QUEUE_OPEN) === SiteSettingsValues.TRUE);
      setIsPendingStageEnabled(siteSettings.get(SiteSettings.IS_PENDING_STAGE_ENABLED) === SiteSettingsValues.TRUE);
    }
  }, [siteSettings]);

  // Listens for queue open/close events
  useChannel('settings', 'queue-open-close', ablyMsg => {
    setIsQueueOpen(ablyMsg.data === SiteSettingsValues.TRUE);
  });

  if (isQueueOpen === undefined || isPendingStageEnabled === undefined) {
    return <Spinner />;
  }

  return (
    <>
      {userRole === UserRole.STAFF && (
        <>
          <Broadcast />
          <OpenOrCloseQueue isQueueOpen={isQueueOpen} />
        </>
      )}
      {userRole === UserRole.STUDENT && isQueueOpen && <CreateTicket />}
      <TicketQueue userRole={userRole} isPendingStageEnabled={isPendingStageEnabled} isQueueOpen={isQueueOpen} />
    </>
  );
};

export default QueueLayout;
