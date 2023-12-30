import { useState } from 'react';
import { Flex, Text } from '@chakra-ui/react';
import { UserRole } from '@prisma/client';
import { useSession } from 'next-auth/react';
import { Message, chatMessageColors } from './Chat';
import { uppercaseFirstLetter } from '../../utils/utils';

interface ChatMessageProps {
	message: Message;
	canSeeName: boolean;
}

type MessageBlur = 'blur(5px)' | 'none';

const ChatMessage = ({ message, canSeeName }: ChatMessageProps) => {
	const { data: session } = useSession();
	const { content, sentByName, sentByUserId, sentByUserRole, visibleToStudents } = message;
	const [messageBlur, setMessageBlur] = useState<MessageBlur>(visibleToStudents ? 'none' : 'blur(5px)');
	const amISender = sentByUserId === (session?.user?.id ?? 'Unknown');

	const toggleMessageBlur = () => {
		if (visibleToStudents) return;
		setMessageBlur(messageBlur === 'none' ? 'blur(5px)' : 'none');
	}

	const backgrounColor =
		!visibleToStudents ? chatMessageColors.notVisibleToStudents :
			amISender ? chatMessageColors.visibleToStudents
				: chatMessageColors.notSentByCurrentUser;

	return (
		<Flex
			data-author={sentByName}
			backgroundColor={backgrounColor}
			p={3}
			alignSelf={amISender ? 'flex-end' : 'flex-start'}
			borderRadius={5}
			borderBottomRightRadius={amISender ? 0 : 5}
			borderBottomLeftRadius={amISender ? 5 : 0}
			color='white'
			cursor={visibleToStudents ? 'default' : 'pointer'}
			onClick={toggleMessageBlur}
		>
			<Text mr={2} fontWeight='bold' hidden={amISender}>
				{canSeeName || sentByUserRole !== UserRole.STUDENT
					? sentByName
					: 'Anonymous' + ' (' + uppercaseFirstLetter(sentByUserRole) + ')'}
			</Text>
			<Text filter={messageBlur} transition='filter 0.1s ease-in-out'>
				{content}
			</Text>
		</Flex>
	)
}

export default ChatMessage;