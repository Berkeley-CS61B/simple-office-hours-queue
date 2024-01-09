import { useChannel } from "@ably-labs/react-hooks";
import { Button } from "@chakra-ui/react";
import { PersonalQueue } from "@prisma/client";
import { useState } from "react";
import { trpc } from "../../utils/trpc";
import OpenOrCloseQueueModal from "../modals/OpenOrCloseQueueModal";

interface OpenOrCloseQueueProps {
  isQueueOpen: boolean;
  personalQueue?: PersonalQueue;
}

const OpenOrCloseQueue = (props: OpenOrCloseQueueProps) => {
  const [channel] = useChannel("broadcast", () => {});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isQueueOpen, personalQueue } = props;
  const openOrCloseQueueMutation = trpc.admin.openOrCloseQueue.useMutation();
  const clearQueueMutation = trpc.ticket.clearQueue.useMutation();
  const context = trpc.useContext();

  const handleOpenOrCloseQueue = async (shouldClearQueue: boolean) => {
    setIsModalOpen(false);
    await openOrCloseQueueMutation.mutateAsync({
      shouldOpen: !isQueueOpen,
      personalQueueName: personalQueue?.name,
    });

    if (shouldClearQueue) {
      // Add queue name to clearQueue mutation
      await clearQueueMutation.mutateAsync({
        personalQueueName: personalQueue?.name,
      });
      context.ticket.getTicketsWithStatus.invalidate();
    }

    // Only broadcast if the user is not in a personal queue
    if (!personalQueue) {
      channel.publish({
        name: "broadcast",
        data: `The queue has been ${isQueueOpen ? "closed" : "opened"}${
          shouldClearQueue ? " and cleared" : ""
        }`,
      });
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        outlineColor={isQueueOpen ? "red.300" : "green.300"}
        outlineOffset={-2}
        m={4}
        mb={0}
      >
        {isQueueOpen ? "Close" : "Open"} Queue
      </Button>
      <OpenOrCloseQueueModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        isQueueOpen={isQueueOpen}
        handleOpenOrCloseQueue={handleOpenOrCloseQueue}
      />
    </>
  );
};

export default OpenOrCloseQueue;
