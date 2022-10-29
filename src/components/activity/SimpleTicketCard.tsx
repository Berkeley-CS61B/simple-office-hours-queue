import { Box, Flex, Tag, Text, useColorModeValue } from '@chakra-ui/react';
import Router from 'next/router';
import { TicketWithNames } from '../../server/trpc/router/ticket';

const SimpleTicketCard = ({ ticket }: { ticket: TicketWithNames }) => {
  const handleTicketPress = () => {
    Router.push(`/ticket/${ticket.id}`);
  };

  // TODO: Add 'resolvedAt' to ticket model
  return (
    <Flex
      backgroundColor={useColorModeValue('white', 'gray.800')}
      borderWidth={1}
      borderRadius={8}
      p={2}
      mt={2}
      boxShadow='lg'
      onClick={handleTicketPress}
	  justifyContent='space-between'
      className='hover-cursor'
      _hover={{
        backgroundColor: useColorModeValue('gray.100', 'gray.700'),
      }}
    >
      <Flex>
        <Text mr={3}>{ticket.description || 'No description'}</Text>
        <Tag p={1} size='sm' mr={3} colorScheme='blue' borderRadius={5}>
          {ticket.assignmentName}
        </Tag>
        <Tag p={1} size='sm' colorScheme='orange' borderRadius={5}>
          {ticket.locationName}
        </Tag>
      </Flex>
      <Text>
        Helped {ticket.createdByName} for {} minutes
      </Text>
    </Flex>
  );
};

export default SimpleTicketCard;
