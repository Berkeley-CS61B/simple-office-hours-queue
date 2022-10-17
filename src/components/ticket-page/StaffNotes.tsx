import { Box, Button, Collapse, Flex, Input, Text, useDisclosure } from '@chakra-ui/react';
import { UserRole } from '@prisma/client';
import { useSession } from 'next-auth/react';
import React, { useState } from 'react';
import { TicketWithNames } from '../../server/trpc/router/ticket';
import { trpc } from '../../utils/trpc';

interface StaffNotesProps {
  ticket: TicketWithNames;
  userRole: UserRole;
}

/**
 * StaffNotes component that displays the TA notes in the ticket page
 */
const StaffNotes = (props: StaffNotesProps) => {
  const { isOpen: isNotesBoxOpen, onToggle: toggleNotesBox } = useDisclosure();
  const { data: session } = useSession();

  const { ticket, userRole } = props;
  const [notesText, setNotesText] = useState('');
  const addStaffNotesMutation = trpc.ticket.setStaffNotes.useMutation();

  const handleSubmitTaNotes = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newNotes =
      ticket.staffNotes === null
        ? session?.user?.name + ': ' + notesText
        : ticket.staffNotes + ' | ' + session?.user?.name + ': ' + notesText;

    await addStaffNotesMutation.mutateAsync({
      ticketId: ticket.id,
      notes: newNotes,
    });
    setNotesText('');
  };

  return (
    <Box hidden={userRole !== UserRole.STAFF} mt={4}>
      <Button onClick={toggleNotesBox}>Toggle Notes</Button>
      <Collapse in={isNotesBoxOpen} animateOpacity>
        <Box p='40px' mr={10} ml={10} mt={4} rounded='md' shadow='md' bg='gray.400'>
          <Text color='black' textAlign='left' mb={2}>
            {ticket.staffNotes ?? 'No notes created for staff'}
          </Text>
          <form onSubmit={handleSubmitTaNotes}>
            <Flex>
              <Input
                color='black'
                value={notesText}
                placeholder='Type a message...'
                onChange={e => setNotesText(e.target.value)}
                _placeholder={{ color: 'black' }}
                mr={4}
              />
              <Button bgColor='green.100' color='black' type='submit' disabled={notesText.length === 0}>
                Add
              </Button>
            </Flex>
          </form>
        </Box>
      </Collapse>
    </Box>
  );
};

export default StaffNotes;
