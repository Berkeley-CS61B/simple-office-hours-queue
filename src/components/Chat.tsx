import { useState, useEffect } from 'react';
import { useChannel } from '@ably-labs/react-hooks';
import { Button, Input, Box, Flex, Text } from '@chakra-ui/react';
import { trpc } from '../utils/trpc';
import { useSession } from 'next-auth/react';

interface ChatProps {
  ticketId: number;
}

interface Message {
  content: string;
  sentByName: string;
  sentByUserId: string;
}

const Chat = (props: ChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const messageTextIsEmpty: boolean = messageText.trim().length === 0;

  const { data: session } = useSession();
  trpc.useQuery(['user.getUserName', { id: session?.user?.id! }], {
    refetchOnWindowFocus: false,
    enabled: !!session?.user?.id,
    onSuccess: data => {
      setCurrentUserName(data!);
    },
  });

  let inputBox: any = null;
  let messageEnd: any = null;

  const [channel, _] = useChannel(`ticket-${props.ticketId}`, 'chat-message', message => {
    setMessages((messages: Message[]) => [...messages, message.data]);
  });

  // TODO : Store messages in db and fetch them on load
  

  const sendChatMessage = (messageText: string) => {
    if (messageTextIsEmpty) return;

    channel.publish({
      name: 'chat-message',
      data: {
        content: messageText,
        sentByName: currentUserName,
        sentByUserId: session?.user?.id,
      } as Message,
    });
    setMessageText('');
    inputBox.focus();
  };

  const handleFormSubmission = (event: any) => {
    event.preventDefault();
    sendChatMessage(messageText);
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
    if (currentUserName) {
      messageEnd.scrollIntoView({ behaviour: 'smooth' });
    }
  }, [messages]);

  return (
    <>
      {!!currentUserName && (
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
