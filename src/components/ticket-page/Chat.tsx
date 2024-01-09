import { useChannel } from "@ably-labs/react-hooks";
import {
  Box,
  Button,
  Flex,
  Spinner,
  Textarea,
  Tooltip,
  useToast,
} from "@chakra-ui/react";
import { UserRole } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import {
  ChatMessageWithUserName,
  TicketWithNames,
} from "../../server/trpc/router/ticket";
import useNotification from "../../utils/hooks/useNotification";
import { trpc } from "../../utils/trpc";
import ChatMessage from "./ChatMessage";

interface ChatProps {
  ticket: TicketWithNames;
}

export interface Message {
  content: string;
  sentByName: string;
  sentByUserId: string;
  sentByUserRole: UserRole;
  visibleToStudents: boolean;
}

export const chatMessageColors = {
  notVisibleToStudents: "green.600",
  notVisibleToStudentsHover: "green.700",
  visibleToStudents: "blue.600",
  visibleToStudentsHover: "blue.700",
  notSentByCurrentUser: "gray",
};

const Chat = (props: ChatProps) => {
  const { ticket } = props;
  const ticketId = ticket.id;
  const ticketStatus = ticket.status;

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState<string>("");
  const [isChatLoaded, setIsChatLoaded] = useState<boolean>(false);
  const [sentToStaff, setSentToStaff] = useState<boolean>(false);
  const sendChatMessageMutation = trpc.ticket.sendChatMessage.useMutation();
  const { data: session } = useSession();
  const { showNotification } = useNotification();
  const toast = useToast();

  const isStaff = session?.user?.role === "STAFF";
  const isIntern = session?.user?.role === "INTERN";
  const isAssigned = ticketStatus === "ASSIGNED";
  const isResolved = ticketStatus === "RESOLVED";
  const isClosed = ticketStatus === "CLOSED";
  const isAbsent = ticketStatus === "ABSENT";
  const isCurrentUserInGroup = false;
  const userId = session?.user?.id;
  const canSeeName =
    userId === ticket.createdByUserId ||
    isCurrentUserInGroup ||
    ((isStaff || isIntern) &&
      (isAssigned || isResolved || isClosed || isAbsent));

  const messageTextIsEmpty: boolean = messageText.trim().length === 0;

  trpc.ticket.getChatMessages.useQuery(
    { ticketId },
    {
      enabled: ticketId !== undefined,
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        const messages: Message[] = data.map((message) => {
          return {
            content: message.message,
            sentByName: message.userName,
            sentByUserId: message.userId,
            sentByUserRole: message.userRole,
            visibleToStudents: message.visibleToStudents,
          };
        });
        setMessages(messages);
        setIsChatLoaded(true);
      },
    },
  );

  let inputBox: any = null;
  let messageEnd: any = null;

  useChannel(`ticket-${ticketId}`, "chat-message", (ablyMsg) => {
    const { message, userName, userId, userRole, visibleToStudents } =
      ablyMsg.data as ChatMessageWithUserName;

    // The chat message is from the current user, and it was optimisticly added to the chat
    if (userId === session?.user?.id) {
      return;
    }

    // The chat message is not visible to students, and the current user is a student
    if (!visibleToStudents && session?.user?.role === UserRole.STUDENT) {
      return;
    }

    const newMessage: Message = {
      content: message,
      sentByName: userName,
      sentByUserId: userId,
      sentByUserRole: userRole,
      visibleToStudents,
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);

    if (userId !== session?.user?.id) {
      showNotification(
        `New message from ${canSeeName ? userName : "Anonymous"}`,
        message,
      );
    }
  });

  const handleFormSubmission = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (messageTextIsEmpty) {
      return;
    }

    // Note: The 'Unknown' should never happen, it's just to make Typescript happy
    const newMessage: Message = {
      content: messageText,
      sentByName:
        session?.user?.preferredName ?? session?.user?.name ?? "Unknown",
      sentByUserId: session?.user?.id ?? "Unknown",
      sentByUserRole: session?.user?.role ?? "STUDENT",
      visibleToStudents: sentToStaff ? false : true,
    };
    // Optimistic update on chat message
    setMessages((prevMessages) => [...prevMessages, newMessage]);

    setMessageText("");
    if (inputBox) {
      inputBox.focus();
    }

    await sendChatMessageMutation
      .mutateAsync({
        ticketId,
        message: messageText,
        visibleToStudents: sentToStaff ? false : true,
      })
      .catch((err) => {
        console.error(err);
        toast({
          title: "Error",
          description:
            "There was an error sending your message. Please refresh the page and try again.",
          status: "error",
          position: "top-right",
          duration: 3000,
          isClosable: true,
        });
      });

    // Reset so the default message is sent to students
    setSentToStaff(false);
  };

  const allMessages = useMemo(() => {
    return messages.map((message, index) => (
      <ChatMessage key={index} message={message} canSeeName={canSeeName} />
    ));
  }, [messages, canSeeName]);

  useEffect(() => {
    if (messageEnd) {
      messageEnd.scrollIntoView({ behaviour: "smooth" });
    }
  }, [messages, messageEnd]);

  /** Pressing Enter should call handleFormSubmission */
  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleFormSubmission(event as any);
    }
  };

  return (
    <>
      {!isChatLoaded && <Spinner />}
      {isChatLoaded && (
        <Box border="1px solid lightgray" p={4} mr={4} ml={4} borderRadius={5}>
          <Flex
            mb={4}
            flexDirection="column"
            gap={2}
            height="50vh"
            overflowY="auto"
          >
            {allMessages}
            <Box ref={(element) => (messageEnd = element)} />
          </Flex>

          <form onSubmit={handleFormSubmission}>
            <Flex>
              <Textarea
                ref={(element) => (inputBox = element)}
                value={messageText}
                placeholder="Type a message..."
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyPress}
                mr={4}
                maxLength={1000}
              />
              <Flex flexDirection="column" gap={0.5}>
                <Tooltip hasArrow label="Send to everyone (enter)">
                  <Button
                    backgroundColor={chatMessageColors.visibleToStudents}
                    _hover={{
                      backgroundColor: chatMessageColors.visibleToStudentsHover,
                    }}
                    color="white"
                    type="submit"
                    disabled={messageTextIsEmpty}
                    onClick={() => setSentToStaff(false)}
                  >
                    Send
                  </Button>
                </Tooltip>
                <Tooltip hasArrow label="Send to staff only">
                  <Button
                    backgroundColor={chatMessageColors.notVisibleToStudents}
                    _hover={{
                      backgroundColor:
                        chatMessageColors.notVisibleToStudentsHover,
                    }}
                    color={"white"}
                    type="submit"
                    hidden={session?.user?.role === UserRole.STUDENT}
                    disabled={messageTextIsEmpty}
                    onClick={() => setSentToStaff(true)}
                  >
                    Staff Send
                  </Button>
                </Tooltip>
              </Flex>
            </Flex>
          </form>
        </Box>
      )}
    </>
  );
};

export default Chat;
