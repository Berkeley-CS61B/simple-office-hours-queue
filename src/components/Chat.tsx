import { useState, useEffect } from 'react';
import { Box, Button, Input, Text, Flex } from '@chakra-ui/react';
import { useChannel } from '@ably-labs/react-hooks';
import { trpc } from '../utils/trpc';
import { useSession } from 'next-auth/react';

interface ChatProps {
  ticketId: number;
}

interface Message {
  message: string;
  sentBy: string;
}

/**
 * Component that renders the chat box. Note: This assumes that
 * the user is authorized to view the ticket and that ably is configured.
 */
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
    const fullMessage: Message = message.data;
    setMessages([...messages, fullMessage]);
  });

  console.log('messages', messages);

  const sendChatMessage = (messageText: string) => {
    channel.publish({
      name: 'chat-message',
      data: {
        message: messageText,
        sentBy: currentUserName,
      },
    });
    setMessageText('');
    inputBox.focus();
  };

  const handleKeyDown = (event: any) => {
    if (event.key === 'Enter' && !messageTextIsEmpty) {
      sendChatMessage(messageText);
    }
  };

  const handleSendButtonClick = () => {
    if (!messageTextIsEmpty) {
      sendChatMessage(messageText);
    }
  };

  // TODO figure out how to make all messages appear
  useEffect(() => {
    if (currentUserName) {
      messageEnd.scrollIntoView({ behaviour: 'smooth' });
    }
  }, [messages]);

  return (
    <>
      {!!currentUserName && (
        <Flex p={8} border='1px solid black' flexDirection='column'>
          <Box>
            {messages.map((message, index) => (
              <Flex key={index}>
                <Text fontWeight='bold' mr={3}>
                  {message.sentBy}
                </Text>
                <Text>{message.message}</Text>
              </Flex>
            ))}
            <div
              ref={element => {
                messageEnd = element;
              }}
            ></div>
          </Box>
          <Flex>
            <Input
              onKeyDown={handleKeyDown}
              mr={3}
              ref={el => (inputBox = el)}
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
            />
            <Button onClick={handleSendButtonClick}>Send</Button>
          </Flex>
        </Flex>
      )}
    </>
  );
};

export default Chat;
