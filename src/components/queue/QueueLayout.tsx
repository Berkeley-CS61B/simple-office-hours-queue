import { useChannel } from "@ably-labs/react-hooks";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Flex,
  Spinner,
} from "@chakra-ui/react";
import {
  PersonalQueue,
  SiteSettings,
  SiteSettingsValues,
  UserRole,
} from "@prisma/client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import useSiteSettings from "../../utils/hooks/useSiteSettings";
import { trpc } from "../../utils/trpc";
import Broadcast from "./Broadcast";
import CreateTicket from "./CreateTicket";
import OpenOrCloseQueue from "./OpenOrCloseQueue";
import TicketQueue from "./TicketQueue";
import React from "react";

interface QueueLayoutProps {
  personalQueue?: PersonalQueue;
}

/**
 * Intermediate component to guarantee that Ably is initialized
 */
const QueueLayout: React.FC<QueueLayoutProps> = (props) => {
  const { personalQueue } = props;
  const { data: session } = useSession();
  const userRole = session?.user?.role!;
  const userId = session?.user?.id!;

  const [isQueueOpen, setIsQueueOpen] = useState<boolean>();
  const [isPendingStageEnabled, setIsPendingStageEnabled] = useState<boolean>();
  const [arePublicTicketsEnabled, setArePublicTicketsEnabled] =
    useState<boolean>();
  const changeUserRoleMutation = trpc.user.updateUserRole.useMutation();
  const { siteSettings } = useSiteSettings();

  // If the user was added as STAFF/INTERN, change their role
  useEffect(() => {
    (async () => {
      await changeUserRoleMutation.mutateAsync().then((res) => {
        if (res) {
          alert("Your role has been updated. Press OK to continue.");
          window.location.reload();
        }
      });
    })();
  }, []);

  useEffect(() => {
    if (siteSettings) {
      if (personalQueue) {
        setIsQueueOpen(personalQueue.isOpen);
      } else {
        setIsQueueOpen(
          siteSettings.get(SiteSettings.IS_QUEUE_OPEN) ===
            SiteSettingsValues.TRUE,
        );
      }
      setIsPendingStageEnabled(
        siteSettings.get(SiteSettings.IS_PENDING_STAGE_ENABLED) ===
          SiteSettingsValues.TRUE,
      );
      setArePublicTicketsEnabled(
        siteSettings.get(SiteSettings.ARE_PUBLIC_TICKETS_ENABLED) ===
          SiteSettingsValues.TRUE,
      );
    }
  }, [personalQueue, siteSettings]);

  // Listens for queue open/close events
  useChannel("settings", (ablyMsg) => {
    const queueName = ablyMsg.name.split("-").slice(3).join("-");
    const shouldUpdateQueue =
      // On main queue
      (ablyMsg.name === "queue-open-close" && !personalQueue) ||
      // On personal queue
      (ablyMsg.name.startsWith("queue-open-close-") &&
        personalQueue &&
        personalQueue.name === queueName);

    if (shouldUpdateQueue) {
      setIsQueueOpen(ablyMsg.data === SiteSettingsValues.TRUE);
    }
  });

  const isSettingsLoading =
    isQueueOpen === undefined ||
    isPendingStageEnabled === undefined ||
    arePublicTicketsEnabled === undefined;

  if (isSettingsLoading) {
    // @ts-ignore TS2590: Expression produces a union type that is too complex to represent.
    return React.createElement(Spinner);
  }

  return (
    <>
      {userRole === UserRole.STAFF && (
        <Flex flexDirection="column">
          {!personalQueue && <Broadcast />}
          {(!personalQueue ||
            personalQueue.ownerId === userId ||
            personalQueue.allowStaffToOpen) && (
            <OpenOrCloseQueue
              isQueueOpen={isQueueOpen}
              personalQueue={personalQueue}
            />
          )}
          <Accordion allowToggle m={4}>
            <AccordionItem>
              <AccordionButton>
                Create ticket
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel>
                <CreateTicket
                  personalQueue={personalQueue}
                  siteSettings={siteSettings ?? new Map()}
                />
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </Flex>
      )}

      {userRole === UserRole.STUDENT && isQueueOpen && (
        <CreateTicket
          personalQueue={personalQueue}
          siteSettings={siteSettings ?? new Map()}
        />
      )}

      <TicketQueue
        userId={userId}
        userRole={userRole}
        isPendingStageEnabled={isPendingStageEnabled}
        arePublicTicketsEnabled={arePublicTicketsEnabled}
        isQueueOpen={isQueueOpen}
        personalQueue={personalQueue}
      />
    </>
  );
};

export default QueueLayout;