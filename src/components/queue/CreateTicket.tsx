import { useRef } from 'react';
import { Flex, Button, Text } from '@chakra-ui/react';
import { PersonalQueue, SiteSettings, SiteSettingsValues } from '@prisma/client';
import CreateTicketForm from './CreateTicketForm';

interface CreateTicketProps {
  siteSettings: Map<SiteSettings, SiteSettingsValues>;
  personalQueue?: PersonalQueue;
}

/**
 * CreateTicket component that allows studnets to create a new ticket
 */
const CreateTicket = (props: CreateTicketProps) => {
  const { siteSettings, personalQueue } = props;
  const endOfForm: any = useRef<HTMLSpanElement>();

  return (
    <Flex width='full' align='left' flexDir='column' p={4}>
      <Text fontSize='2xl' mb={5}>
        Welcome back. Create a ticket to get started or{' '}
        <Button border='1px' borderRadius={8} pl='5px' pr='5px' onClick={() => endOfForm.current.scrollIntoView()}>
          view the queue
        </Button>
      </Text>
      <CreateTicketForm
        personalQueue={personalQueue}
        arePublicTicketsEnabled={siteSettings.get(SiteSettings.ARE_PUBLIC_TICKETS_ENABLED) === SiteSettingsValues.TRUE}
      />
      <span ref={endOfForm}></span> {/* Start of queue */}
    </Flex>
  );
};

export default CreateTicket;
