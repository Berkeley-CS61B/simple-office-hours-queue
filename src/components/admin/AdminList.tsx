import { useState } from 'react';
import { Button, Flex, Input, Text } from '@chakra-ui/react';
import { Assignment, Location } from '@prisma/client';
import { trpc } from '../../utils/trpc';
import AdminCard from './AdminCard';

interface AdminListProps {
  assignmentsOrLocationsProps: Assignment[] | Location[];
  isAssignment: boolean;
  updateAssignmentsOrLocations: (isAssigment: boolean) => void;
}

/**
 * Component for displaying a list of assignments/location
 */
const AdminList = (props: AdminListProps) => {
  const { assignmentsOrLocationsProps, isAssignment, updateAssignmentsOrLocations } = props;
  const [assignmentsOrLocations, setAssignmentsOrLocations] = useState<Assignment[] | Location[]>(
    assignmentsOrLocationsProps,
  );
  const [createText, setCreateText] = useState<string>('');
  const [isHiddenVisible, setIsHiddenVisible] = useState<boolean>(false);

  const createAssignmentMutation = trpc.admin.createAssignment.useMutation();
  const editAssignmentMutation = trpc.admin.editAssignment.useMutation();
  const createLocationMutation = trpc.admin.createLocation.useMutation();
  const editLocationMutation = trpc.admin.editLocation.useMutation();
  const numVisible = assignmentsOrLocations.filter(a => !a.isHidden).length;

  const handleCreateAssignment = async () => {
    const data = await createAssignmentMutation.mutateAsync({ name: createText });
    setAssignmentsOrLocations(prev => [...(prev ?? []), data]);
  };

  const handleCreateLocation = async () => {
    const data = await createLocationMutation.mutateAsync({ name: createText });
    setAssignmentsOrLocations(prev => [...(prev ?? []), data]);
  };

  return (
    <>
      <Flex direction='column' w='100%' mb={3}>
        <Text fontSize='3xl' fontWeight='semibold' mb={2}>
          {isAssignment ? 'Assignments' : 'Locations'}
        </Text>
        <Flex justifyContent='space-between'>
          <Flex w='100%'>
            <Input
              width='50%'
              onChange={e => setCreateText(e.target.value)}
              value={createText}
              placeholder={isAssignment ? 'Gitlet' : 'Woz'}
            />
            <Button onClick={isAssignment ? handleCreateAssignment : handleCreateLocation} ml={3}>
              Create
            </Button>
          </Flex>
          <Button onClick={() => setIsHiddenVisible(!isHiddenVisible)}>
            {isHiddenVisible ? 'Hide' : 'Show'} hidden
          </Button>
        </Flex>
      </Flex>
      {numVisible === 0 && (
        <Text>No visible {isAssignment ? 'assigments' : 'locations'}! You can add or unhide them above.</Text>
      )}
      {assignmentsOrLocations.map(al => (
        <div key={al.id}>
          {(isHiddenVisible || !al.isHidden) && (
            <AdminCard
              assignmentOrLocation={al}
              editMutation={isAssignment ? editAssignmentMutation : editLocationMutation}
              updateAssignmentsOrLocations={updateAssignmentsOrLocations}
            />
          )}
        </div>
      ))}
    </>
  );
};

export default AdminList;
