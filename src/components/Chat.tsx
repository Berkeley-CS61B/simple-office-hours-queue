import { useState, useEffect } from 'react';
import { useChannel } from '@ably-labs/react-hooks';
import { Button, Input, Box, Flex, Text, Spinner } from '@chakra-ui/react';
import { trpc } from '../utils/trpc';
import { useSession } from 'next-auth/react';
import { ChatMessageWithUserName } from '../server/router/ticket';

interface ChatProps {
  ticketId: number;
}

interface Message {
  content: string;
  sentByName: string;
  sentByUserId: string;
}

const Chat = (props: ChatProps) => {
  const { ticketId } = props;
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState<string>('');
  const [isChatLoaded, setIsChatLoaded] = useState<boolean>(false);
  const messageTextIsEmpty: boolean = messageText.trim().length === 0;
  const sendChatMessageMutation = trpc.useMutation('ticket.sendChatMessage');
  const { data: session } = useSession();

  trpc.useQuery(['ticket.getChatMessages', { ticketId }], {
    enabled: ticketId !== undefined,
    refetchOnWindowFocus: false,
    onSuccess: data => {
      const messages: Message[] = data.map(message => {
        return {
          content: message.message,
          sentByName: message.userName,
          sentByUserId: message.userId,
        };
      });
      setMessages(messages);
      setIsChatLoaded(true);
    },
  });

  let inputBox: any = null;
  let messageEnd: any = null;

  useChannel(`ticket-${ticketId}`, 'chat-message', ablyMsg => {
    const { message, userName, userId } = ablyMsg.data as ChatMessageWithUserName;
    const newMessage: Message = {
      content: message,
      sentByName: userName,
      sentByUserId: userId,
    };
	setMessages(prevMessages => [...prevMessages, newMessage]);
  });

  const handleFormSubmission = async (event: any) => {
    event.preventDefault();
    if (messageTextIsEmpty) {
      return;
    }

    await sendChatMessageMutation.mutateAsync({
      ticketId,
      message: messageText,
    });
	
    setMessageText('');
    if (inputBox) {
      inputBox.focus();
    }
  };

  const allMessages = messages.map((message, index: number) => {
    const { content, sentByName, sentByUserId } = message;
    const amISender = sentByUserId === session?.user?.id!;
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
          {sentByName}:
        </Text>
        {content}
      </Flex>
    );
  });

  useEffect(() => {
    if (messageEnd) {
      messageEnd.scrollIntoView({ behaviour: 'smooth' });
    }
  }, [messages]);

  return (
    <>
      {!isChatLoaded && <Spinner />}
      {isChatLoaded && (
        <Box border='1px solid gray' p={4} mr={4} ml={4}>
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
              <Button type='submit' disabled={messageTextIsEmpty}>
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
