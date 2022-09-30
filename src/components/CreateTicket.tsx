import { useState, useRef, useLayoutEffect } from "react";
import {
  Flex,
  Box,
  FormControl,
  Input,
  FormLabel,
  Button,
  useToast,
  Text,
} from "@chakra-ui/react";
import { trpc } from "../utils/trpc";

const CreateTicketForm = () => {
  const [description, setDescription] = useState<string>("");
  const [assignment, setAssignment] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const toast = useToast();

  const createTicketMutation = trpc.useMutation("ticket.createTicket");

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "description") {
      setDescription(value);
    } else if (name === "assignment") {
      setAssignment(value);
    } else if (name === "location") {
      setLocation(value);
    } else {
      console.error("Invalid input name");
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createTicketMutation
      .mutateAsync({ description, assignment, location })
      .then(() => {
        setDescription("");
        setAssignment("");
        setLocation("");
        toast({
          title: "Ticket created",
          description: "Your help request is pending approval",
          status: "success",
          duration: 3000,
          isClosable: true,
          position: "top-right",
        });
      });
  };

  return (
    <Box p={8} width="full" borderWidth={1} borderRadius={8} boxShadow="lg">
      <Box my={4} textAlign="left">
        <form onSubmit={onSubmit}>
          <FormControl>
            <FormLabel>Description</FormLabel>
            <Input
              value={description}
              onChange={onInputChange}
              type="text"
              placeholder="Null Pointer Exception"
              name="description"
            />
          </FormControl>
          <FormControl mt={6} isRequired>
            <FormLabel>Assignment</FormLabel>
            <Input
              value={assignment}
              onChange={onInputChange}
              type="text"
              placeholder="Lab 3"
              name="assignment"
            />
          </FormControl>
          <FormControl mt={6} isRequired>
            <FormLabel>Location</FormLabel>
            <Input
              value={location}
              onChange={onInputChange}
              type="text"
              placeholder="Room 273"
              name="location"
            />
          </FormControl>
          <Button type="submit" variant="outline" width="full" mt={4}>
            Request Help
          </Button>
        </form>
      </Box>
    </Box>
  );
};

const CreateTicket = () => {
  // TODO fix this type
  const endOfForm: any = useRef<HTMLSpanElement>();

  return (
    <Flex width="full" align="left" flexDir="column" p={10}>
      <Text fontSize="2xl" mb={5}>
        Welcome back. Create a ticket to get started or{" "}
        <Box
          as="span"
          className="hover-cursor"
          border="1px"
          borderRadius={8}
          p="3px"
          pl="5px"
          pr="5px"
          onClick={() => endOfForm.current.scrollIntoView()}
        >
          view the queue
        </Box>
      </Text>
      <CreateTicketForm />
      <span ref={endOfForm}></span> {/* Start of queue */}
    </Flex>
  );
};

export default CreateTicket;
