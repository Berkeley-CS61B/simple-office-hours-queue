import { useEffect, useState } from 'react';
import { PersonalQueue, SiteSettings, SiteSettingsValues, UserRole } from '@prisma/client';
import TicketQueue from './TicketQueue';
import CreateTicket from './CreateTicket';
import Broadcast from './Broadcast';
import OpenOrCloseQueue from './OpenOrCloseQueue';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Flex,
  Spinner,
} from '@chakra-ui/react';
import { useChannel } from '@ably-labs/react-hooks';
import useSiteSettings from '../../utils/hooks/useSiteSettings';
import { trpc } from '../../utils/trpc';
import { useSession } from 'next-auth/react';

interface QueueLayoutProps {
  personalQueue?: PersonalQueue;
}

/**
 * Intermediate component to guarantee that Ably is initialized
 */
const QueueLayout = (props: QueueLayoutProps) => {
  const { personalQueue } = props;
  const { data: session } = useSession();
  const userRole = session?.user?.role!;
  const userId = session?.user?.id!;

  const [isQueueOpen, setIsQueueOpen] = useState<boolean>();
  const [isPendingStageEnabled, setIsPendingStageEnabled] = useState<boolean>();
  const changeUserRoleMutation = trpc.user.updateUserRole.useMutation();
  const { siteSettings } = useSiteSettings();

  // If the user was added as STAFF, change their role
  useEffect(() => {
    (async () => {
      const roleVerified = sessionStorage.getItem('roleVerified');
      if (!roleVerified || roleVerified === 'false') {
        await changeUserRoleMutation.mutateAsync().then(res => {
          sessionStorage.setItem('roleVerified', 'true');
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
      if (personalQueue) {
        setIsQueueOpen(personalQueue.isOpen);
      } else {
        setIsQueueOpen(siteSettings.get(SiteSettings.IS_QUEUE_OPEN) === SiteSettingsValues.TRUE);
      }
      setIsPendingStageEnabled(siteSettings.get(SiteSettings.IS_PENDING_STAGE_ENABLED) === SiteSettingsValues.TRUE);
    }
  }, [siteSettings]);

  // Listens for queue open/close events
  useChannel('settings', ablyMsg => {
    const queueName = ablyMsg.name.split('-').slice(3).join('-');
    const shouldUpdateQueue =
      // On main queue
      (ablyMsg.name === 'queue-open-close' && !personalQueue) ||
      // On personal queue
      (ablyMsg.name.startsWith('queue-open-close-') && personalQueue && personalQueue.name === queueName);

    if (shouldUpdateQueue) {
      setIsQueueOpen(ablyMsg.data === SiteSettingsValues.TRUE);
    }
  });

  if (isQueueOpen === undefined || isPendingStageEnabled === undefined) {
    return <Spinner />;
  }

  return (
    <>
      {userRole === UserRole.STAFF && (
        <Flex flexDirection='column'>
          {!personalQueue && <Broadcast />}
          {(!personalQueue || personalQueue.ownerId === userId || personalQueue.allowStaffToOpen) && (
            <OpenOrCloseQueue isQueueOpen={isQueueOpen} personalQueue={personalQueue} />
          )}
          <Accordion allowToggle m={4}>
            <AccordionItem>
              <AccordionButton>
                Create ticket
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel>
                <CreateTicket personalQueue={personalQueue} siteSettings={siteSettings ?? new Map()} />
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </Flex>
      )}

      {userRole === UserRole.STUDENT && isQueueOpen && (
        <CreateTicket personalQueue={personalQueue} siteSettings={siteSettings ?? new Map()} />
      )}

      <TicketQueue
        userId={userId}
        userRole={userRole}
        isPendingStageEnabled={isPendingStageEnabled}
        isQueueOpen={isQueueOpen}
        personalQueue={personalQueue}
      />
    </>
  );
};

export default QueueLayout;
