import { Flex, Text } from '@chakra-ui/react';

const PersonalLog = () => {
  return (
    <Flex ml={4} mr={4} mb={10} flexDirection='column'>
      <Text mt={4} fontSize='3xl' fontWeight='semibold' mb={3}>
        Personal Log
      </Text>
    </Flex>
  );
};

export default PersonalLog;
