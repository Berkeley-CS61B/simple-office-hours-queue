import { useState, useEffect } from 'react';
import { useChannel } from '@ably-labs/react-hooks';
import { Button, Input, Box, Flex, Text, Spinner, useToast } from '@chakra-ui/react';
import { trpc } from '../../utils/trpc';
import { useSession } from 'next-auth/react';
import { ChatMessageWithUserName } from '../../server/trpc/router/ticket';
import useNotification from '../../utils/hooks/useNotification';
import { UserRole } from '@prisma/client';
import { uppercaseFirstLetter } from '../../utils/utils';

interface ChatProps {
  ticketId: number;
}

interface Message {
  content: string;
  sentByName: string;
  sentByUserId: string;
  sentByUserRole: UserRole;
}

const Chat = (props: ChatProps) => {
  const { ticketId } = props;
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState<string>('');
  const [isChatLoaded, setIsChatLoaded] = useState<boolean>(false);
  const toast = useToast();
  const sendChatMessageMutation = trpc.ticket.sendChatMessage.useMutation();
  const { data: session } = useSession();
  const { showNotification } = useNotification();

  const messageTextIsEmpty: boolean = messageText.trim().length === 0;

  trpc.ticket.getChatMessages.useQuery(
    { ticketId },
    {
      enabled: ticketId !== undefined,
      refetchOnWindowFocus: false,
      onSuccess: data => {
        const messages: Message[] = data.map(message => {
          return {
            content: message.message,
            sentByName: message.userName,
            sentByUserId: message.userId,
            sentByUserRole: message.userRole,
          };
        });
        setMessages(messages);
        setIsChatLoaded(true);
      },
    },
  );

  let inputBox: any = null;
  let messageEnd: any = null;

  useChannel(`ticket-${ticketId}`, 'chat-message', ablyMsg => {
    const { message, userName, userId, userRole } = ablyMsg.data as ChatMessageWithUserName;

    // The chat message is from the current user, and it was optimisticly added to the chat
    if (userId === session?.user?.id) {
      return;
    }

    const newMessage: Message = {
      content: message,
      sentByName: userName,
      sentByUserId: userId,
      sentByUserRole: userRole,
    };
    setMessages(prevMessages => [...prevMessages, newMessage]);

    if (userId !== session?.user?.id) {
      showNotification(`New message from ${userName}`, message);
    }
  });

  const handleFormSubmission = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (messageTextIsEmpty) {
      return;
    }

    // Note: The 'Unknown' should never happen, it's just to make Typescript happy
    const newMessage: Message = {
      content: messageText,
      sentByName: session?.user?.preferredName ?? session?.user?.name ?? 'Unknown',
      sentByUserId: session?.user?.id ?? 'Unknown',
      sentByUserRole: session?.user?.role ?? 'STUDENT',
    };
    // Optimistic update on chat message
    setMessages(prevMessages => [...prevMessages, newMessage]);

    setMessageText('');
    if (inputBox) {
      inputBox.focus();
    }

    await sendChatMessageMutation
      .mutateAsync({
        ticketId,
        message: messageText,
      })
      .catch(err => {
        console.error(err);
        toast({
          title: 'Error',
          description: 'There was an error sending your message. Please refresh the page and try again.',
          status: 'error',
          position: 'top-right',
          duration: 3000,
          isClosable: true,
        });
      });
  };

  const allMessages = messages.map((message, index: number) => {
    const { content, sentByName, sentByUserId, sentByUserRole } = message;
    const amISender = sentByUserId === (session?.user?.id ?? 'Unknown');
    return (
      <Flex
        key={index}
        data-author={sentByName}
        backgroundColor={amISender ? 'blue.600' : 'gray'}
        p={3}
        alignSelf={amISender ? 'flex-end' : 'flex-start'}
        borderRadius={5}
        borderBottomRightRadius={amISender ? 0 : 5}
        borderBottomLeftRadius={amISender ? 5 : 0}
        color='white'
      >
        <Text mr={2} fontWeight='bold' hidden={amISender}>
          {sentByName + " (" + uppercaseFirstLetter(sentByUserRole) + ")"}
        </Text>
        {content}
      </Flex>
    );
  });

  useEffect(() => {
    if (messageEnd) {
      messageEnd.scrollIntoView({ behaviour: 'smooth' });
    }
  }, [messages, messageEnd]);

  return (
    <>
      {!isChatLoaded && <Spinner />}
      {isChatLoaded && (
        <Box border='1px solid lightgray' p={4} mr={4} ml={4} borderRadius={5}>
          <Flex mb={4} flexDirection='column' gap={2} height='50vh' overflowY='auto'>
            {allMessages}
            <Box ref={element => (messageEnd = element)} />
          </Flex>

          <form onSubmit={handleFormSubmission}>
            <Flex>
              <Input
                ref={element => (inputBox = element)}
                value={messageText}
                placeholder='Type a message...'
                onChange={e => setMessageText(e.target.value)}
                mr={4}
              />
              <Button colorScheme='green' type='submit' disabled={messageTextIsEmpty}>
                Send
              </Button>
            </Flex>
          </form>
        </Box>
      )}
    </>
  );
};

export default Chat;
