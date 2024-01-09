import {
  Button,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputLeftAddon,
  Spinner,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import Router from "next/router";
import { useState } from "react";
import { DARK_GRAY_COLOR } from "../../utils/constants";
import { trpc } from "../../utils/trpc";
import { sanitizeString } from "../../utils/utils";

const CreatePersonalQueue = () => {
  const [queueName, setQueueName] = useState("");
  const borderColor = useColorModeValue(DARK_GRAY_COLOR, "white");
  const toast = useToast();

  // Redirect to personal queue if it already exists
  const { isLoading: isGetCurrentUserQueueLoading } =
    trpc.queue.getCurrentUserQueue.useQuery(undefined, {
      refetchOnWindowFocus: false,
      onSuccess: (queue) => {
        if (queue) {
          Router.push(`/queue/${queue.name}`, undefined, { shallow: true });
        }
      },
    });

  const createQueueMutation = trpc.queue.createQueue.useMutation();

  const handleCreateQueue = async () => {
    // A valid queue name must be between 3 and 25 characters long
    // and contain only alphanumeric characters and dashes/underscores
    const isValid = /^[a-zA-Z0-9-_]{3,25}$/.test(queueName);
    if (!isValid) {
      toast({
        title: "Invalid queue name",
        description:
          "Queue name must be between 3 and 25 characters long and contain only alphanumeric characters, dashes, and underscores.",
        status: "error",
        position: "top-right",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    createQueueMutation
      .mutateAsync({ name: queueName })
      .then(() => {
        toast({
          title: "Queue created",
          description: `Queue "${queueName}" has been created.`,
          status: "success",
          position: "top-right",
          duration: 3000,
          isClosable: true,
        });
        Router.push(`/queue/${queueName}`);
      })
      .catch((err) => {
        toast({
          title: "Error creating queue",
          description: err.message,
          status: "error",
          position: "top-right",
          duration: 3000,
          isClosable: true,
        });
      });
  };

  if (isGetCurrentUserQueueLoading) {
    return <Spinner />;
  }

  return (
    <Flex direction="column" align="center" justify="center" p={8}>
      <Heading as="h1" size="xl" mb={4}>
        Create your personal queue!
      </Heading>
      <Flex
        direction="column"
        align="center"
        justify="center"
        m={8}
        p={8}
        borderRadius={8}
      >
        <InputGroup
          size={["xs", "sm", "md", "lg"]}
          border="2px"
          borderRadius={8}
        >
          <InputLeftAddon>{window.location.origin + "/queue/"}</InputLeftAddon>
          <Input
            placeholder="queue-name"
            value={queueName}
            onChange={(e) => setQueueName(sanitizeString(e.target.value))}
            border="none"
            maxLength={25}
            _focusVisible={{ boxShadow: "none", outline: "none" }}
          />
        </InputGroup>
      </Flex>
      <Button
        fontSize="xl"
        colorScheme="green"
        p={8}
        onClick={handleCreateQueue}
      >
        Check Availability and Create
      </Button>
    </Flex>
  );
};

export default CreatePersonalQueue;
