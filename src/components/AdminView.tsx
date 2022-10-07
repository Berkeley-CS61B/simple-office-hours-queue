import { useState } from 'react';
import { Assignment, Location } from '@prisma/client';
import { trpc } from '../utils/trpc';
import { Box, Button, Flex, IconButton, Spinner, Switch, Text, useColorModeValue } from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';

/**
 * Component which allows staff to edit the available locations and assignments
 */
const AdminView = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const { isLoading: isAssignmentsLoading } = trpc.useQuery(['admin.getAllAssignments'], {
    refetchOnWindowFocus: false,
    onSuccess: data => {
      setAssignments(data);
    },
  });

  const { isLoading: isLocationsLoading } = trpc.useQuery(['admin.getAllLocations'], {
    refetchOnWindowFocus: false,
    onSuccess: data => {
      setLocations(data);
    },
  });

  const boxColor = useColorModeValue('gray.100', 'gray.700');

  // TODO make these lazy load
  // Todo make name editable and add a delete button and move to a separate component
  return (
    <>
      {isAssignmentsLoading || isLocationsLoading ? (
        <Spinner />
      ) : (
        <Flex m={10} flexDirection='column'>
          <Flex mb={3}>
            <Text fontSize='3xl' fontWeight='semibold'>
              Assignments
            </Text>
            <Button ml={3} mt={1}>Add Assignment</Button>
          </Flex>
          {assignments.map(assignment => (
            <Flex borderRadius={4} mb={2} flexDirection='row' p={2} key={assignment.id} backgroundColor={boxColor}>
              <Text fontWeight='semibold' fontSize='xl'>{assignment.name}</Text>
			  <IconButton size='sm' ml={2} aria-label='Edit assignment' icon={<EditIcon />} />
			  <Text fontSize='large' mt={1.25} ml={5}>Active?</Text>
			  <Switch mt={1.5} ml={3} isChecked={assignment.active} /> 
            </Flex>
          ))}
        </Flex>
      )}
    </>
  );
};

export default AdminView;
