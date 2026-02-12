import { useChannel } from "@ably-labs/react-hooks";
import {
  Box,
  Button,
  Flex,
  Spinner,
  Text,
  Textarea,
  Tooltip,
  useToast,
} from "@chakra-ui/react";
import { UserRole } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { TicketWithNames } from "../../server/trpc/router/ticket";
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
  const toast = useToast();

  const isStaff = session?.user?.role === "STAFF";
  const isIntern = session?.user?.role === "INTERN";
  const isStudent = session?.user?.role === "STUDENT";
  const isPrivileged = isStaff || isIntern;
  const isAssigned = ticketStatus === "ASSIGNED";
  const isResolved = ticketStatus === "RESOLVED";
  const isClosed = ticketStatus === "CLOSED";
  const isAbsent = ticketStatus === "ABSENT";
  const userId = session?.user?.id;
  const isOwner = userId === ticket.createdByUserId;
  const shouldCheckGroupMembership =
    isStudent && ticket.isPublic && Boolean(userId) && !isOwner;

  const { data: usersInGroup, isLoading: isUsersInGroupLoading } =
    trpc.ticket.getUsersInTicketGroup.useQuery(
      { ticketId },
      {
        enabled: shouldCheckGroupMembership,
        refetchOnWindowFocus: false,
      },
    );

  const isCurrentUserInGroup =
    usersInGroup?.some((user) => user.id === userId) ?? false;
  const canParticipateInChat = isPrivileged || isOwner || isCurrentUserInGroup;
  const isChatAccessResolved =
    !shouldCheckGroupMembership || !isUsersInGroupLoading;
  const canLoadChatMessages = canParticipateInChat && isChatAccessResolved;

  const canSeeName =
    isOwner ||
    isCurrentUserInGroup ||
    (isPrivileged && (isAssigned || isResolved || isClosed || isAbsent));

  const messageTextIsEmpty: boolean = messageText.trim().length === 0;

  const { refetch: refetchMessages } = trpc.ticket.getChatMessages.useQuery(
    { ticketId },
    {
      enabled: ticketId !== undefined && canLoadChatMessages,
      refetchOnWindowFocus: false,
      // Fallback polling in case realtime events are delayed/missed.
      refetchInterval: isStudent && canLoadChatMessages ? 4000 : false,
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
      onError: () => {
        // Preserve existing messages on transient refetch failures.
        setIsChatLoaded(true);
      },
    },
  );

  let inputBox: any = null;
  let messageEnd: any = null;

  const perTicketChatChannel = isPrivileged ? `ticket-${ticketId}` : "settings";

  useChannel(perTicketChatChannel, "chat-message", () => {
    if (!canLoadChatMessages) {
      return;
    }
    void refetchMessages();
  });

  useChannel("tickets", "ticket-chat-message", (msg) => {
    if (!canLoadChatMessages) {
      return;
    }
    if (!msg.data || msg.data.ticketId === ticketId) {
      void refetchMessages();
    }
  });

  useEffect(() => {
    if (canLoadChatMessages) {
      setIsChatLoaded(false);
    }
  }, [canLoadChatMessages, ticketId]);

  useEffect(() => {
    if (!canLoadChatMessages && isChatAccessResolved) {
      setMessages([]);
      setIsChatLoaded(true);
    }
  }, [canLoadChatMessages, isChatAccessResolved]);

  const handleFormSubmission = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (messageTextIsEmpty || !canParticipateInChat) {
      return;
    }

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
      .catch(() => {
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
      <ChatMessage
        key={index.toString()}
        message={message}
        canSeeName={canSeeName}
      />
    ));
  }, [messages, canSeeName]);

  useEffect(() => {
    if (messageEnd) {
      messageEnd.scrollIntoView({ behavior: "smooth" });
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
            <Box
              ref={(element) => {
                messageEnd = element;
              }}
            />
          </Flex>

          {canParticipateInChat ? (
            <form onSubmit={handleFormSubmission}>
              <Flex>
                <Textarea
                  ref={(element) => {
                    inputBox = element;
                  }}
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
                        backgroundColor:
                          chatMessageColors.visibleToStudentsHover,
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
          ) : (
            <Text color="gray.600">
              Join this public ticket group to access chat.
            </Text>
          )}
        </Box>
      )}
    </>
  );
};

export default Chat;
