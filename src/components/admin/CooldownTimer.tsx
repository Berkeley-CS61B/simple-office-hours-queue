import {
  Button,
  Flex,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Text,
  useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import { trpc } from "../../utils/trpc";

/** Handles how long a student should wait before they can make another ticket */
const CoolDownTimer = () => {
  const [cooldownTime, setCooldownTime] = useState<number>(0);
  const setCooldownTimeMutation = trpc.admin.setCooldownTime.useMutation();
  const toast = useToast();

  trpc.admin.getCoolDownTime.useQuery(undefined, {
    refetchOnWindowFocus: false,
    onSuccess: (time) => {
      setCooldownTime(time);
    },
  });

  const handleSetCooldownTime = async () => {
    console.log(cooldownTime);
    await setCooldownTimeMutation.mutateAsync({
      cooldownTime,
    });

    toast({
      title: "Success",
      description: "Cooldown time updated",
      status: "success",
      duration: 5000,
      position: "top-right",
      isClosable: true,
    });
  };

  return (
    <Flex direction="column">
      <Text fontSize="xl">Cooldown</Text>
      <Text fontSize="md">
        Students must wait this many minutes since their last ticket was
        resolved to make another ticket
      </Text>
      <Flex flexDir="row">
        <NumberInput
          value={cooldownTime}
          min={0}
          max={180}
          width="100%"
          onChange={(val) => setCooldownTime(parseInt(val))}
          mr={1}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        <Button colorScheme="telegram" onClick={handleSetCooldownTime}>
          Confirm
        </Button>
      </Flex>
    </Flex>
  );
};

export default CoolDownTimer;
