import { useEffect, useState } from 'react';
import { SiteSettings, SiteSettingsValues, UserRole } from '@prisma/client';
import TicketQueue from './TicketQueue';
import CreateTicket from './CreateTicket';
import Broadcast from './Broadcast';
import OpenOrCloseQueue from './OpenOrCloseQueue';
import { Spinner } from '@chakra-ui/react';
import { useChannel } from '@ably-labs/react-hooks';
import useSiteSettings from '../../utils/hooks/useSiteSettings';
import { trpc } from '../../utils/trpc';

interface QueueLayoutProps {
  userRole: UserRole;
  userId: string;
}

/**
 * Intermediate component to guarantee that Ably is initialized
 */
const QueueLayout = (props: QueueLayoutProps) => {
  const { userRole, userId } = props;
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>();
  const [isPendingStageEnabled, setIsPendingStageEnabled] = useState<boolean>();
  const changeUserRoleMutation = trpc.user.updateUserRole.useMutation();
  const { siteSettings } = useSiteSettings();

  // If the user was added as STAFF, change their role
  useEffect(() => {
    (async () => {
      const roleVerified = localStorage.getItem('roleVerified');
      if (!roleVerified || roleVerified === 'false') {
        changeUserRoleMutation.mutateAsync().then(res => {
          localStorage.setItem('roleVerified', 'true');
          if (res) {
            alert('Your role has been updated. Press OK to continue.');
            window.location.reload();
          }
        });
      }
    })();
  }, []);

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
      {userRole === UserRole.STUDENT && isQueueOpen && <CreateTicket siteSettings={siteSettings!} />}
      <TicketQueue
        userId={userId}
        userRole={userRole}
        isPendingStageEnabled={isPendingStageEnabled}
        isQueueOpen={isQueueOpen}
      />
    </>
  );
};

export default QueueLayout;
