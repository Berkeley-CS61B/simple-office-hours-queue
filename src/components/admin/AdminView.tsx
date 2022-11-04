import { useEffect, useState } from 'react';
import { Assignment, Location, SiteSettings, SiteSettingsValues } from '@prisma/client';
import { trpc } from '../../utils/trpc';
import { Button, Flex, Input, Spinner, Switch, Text, Tooltip } from '@chakra-ui/react';
import AdminCard from './AdminCard';
import ImportUsers from './ImportUsers';
import { InfoIcon } from '@chakra-ui/icons';
import useSiteSettings from '../../utils/hooks/useSiteSettings';

/**
 * Component which allows staff to edit the available locations and assignments
 */
const AdminView = () => {
  const [isPendingStageEnabled, setIsPendingStageEnabled] = useState<boolean>();
  const [arePublicTicketsEnabled, setArePublicTicketsEnabled] = useState<boolean>();
  const [assignments, setAssignments] = useState<Assignment[]>();
  const [locations, setLocations] = useState<Location[]>();
  const [assignmentText, setAssignmentText] = useState('');
  const [locationText, setLocationText] = useState<string>('');
  const { siteSettings } = useSiteSettings();

  const createAssignmentMutation = trpc.admin.createAssignment.useMutation();
  const editAssignmentMutation = trpc.admin.editAssignment.useMutation();
  const createLocationMutation = trpc.admin.createLocation.useMutation();
  const editLocationMutation = trpc.admin.editLocation.useMutation();
  const setSiteSettingsMutation = trpc.admin.setSiteSettings.useMutation();
  const deleteAssignmentMutation = trpc.admin.deleteAssignment.useMutation();
  const deleteLocationMutation = trpc.admin.deleteLocation.useMutation();

  useEffect(() => {
    if (siteSettings) {
      setIsPendingStageEnabled(siteSettings.get(SiteSettings.IS_PENDING_STAGE_ENABLED) === SiteSettingsValues.TRUE);
	  setArePublicTicketsEnabled(siteSettings.get(SiteSettings.ARE_PUBLIC_TICKETS_ENABLED) === SiteSettingsValues.TRUE);
    }
  }, [siteSettings]);

  trpc.admin.getAllAssignments.useQuery(undefined, {
    refetchOnWindowFocus: false,
    onSuccess: data => {
      setAssignments(data); // Putting this in state so that we can edit the assignments
    },
  });

  trpc.admin.getAllLocations.useQuery(undefined, {
    refetchOnWindowFocus: false,
    onSuccess: data => {
      setLocations(data);
    },
  });

  const handleCreateAssignment = async () => {
    const data = await createAssignmentMutation.mutateAsync({ name: assignmentText });
    setAssignments(prev => [...prev!, data]);
  };

  const handleCreateLocation = async () => {
    const data = await createLocationMutation.mutateAsync({ name: locationText });
    setLocations(prev => [...prev!, data]);
  };

  const handleDeleteAssignment = async (id: number) => {
	await deleteAssignmentMutation.mutateAsync({ id });
	// We can also just invalidate the query, but this makes the UI feel more responsive
	setAssignments(prev => prev!.filter(assignment => assignment.id !== id)); 
  }

  const handleDeleteLocation = async (id: number) => {
	await deleteLocationMutation.mutateAsync({ id });
	setLocations(prev => prev!.filter(location => location.id !== id));
  }

  // Sets the pending stage to enabled or disabled depending on the current state
  const handleTogglePendingStageEnabled = async () => {
    setIsPendingStageEnabled(prev => !prev);
    const valueToSet = isPendingStageEnabled ? SiteSettingsValues.FALSE : SiteSettingsValues.TRUE;
    await setSiteSettingsMutation.mutateAsync({
      [SiteSettings.IS_PENDING_STAGE_ENABLED]: valueToSet,
    });
  };

  const handleTogglePublicTicketsEnabled = async () => {
	setArePublicTicketsEnabled(prev => !prev);
    const valueToSet = arePublicTicketsEnabled ? SiteSettingsValues.FALSE : SiteSettingsValues.TRUE;
    await setSiteSettingsMutation.mutateAsync({
      [SiteSettings.ARE_PUBLIC_TICKETS_ENABLED]: valueToSet,
    });
  };

  if (assignments === undefined || locations === undefined) {
    return <Spinner />;
  }

  return (
    <Flex ml={4} mt={4} flexDirection='column'>
      <Flex direction='column' w='50%' mb={3}>
        <Text fontSize='3xl' fontWeight='semibold'>
          Assignments
        </Text>
        <Flex>
          <Input onChange={e => setAssignmentText(e.target.value)} value={assignmentText} placeholder='Gitlet' />
          <Button onClick={handleCreateAssignment} ml={3}>
            Create
          </Button>
        </Flex>
      </Flex>
      {assignments.map(assignment => (
        <AdminCard key={assignment.id} assignmentOrLocation={assignment} editMutation={editAssignmentMutation} handleDelete={handleDeleteAssignment} />
      ))}

      <Flex direction='column' w='50%' mt={10} mb={3}>
        <Text fontSize='3xl' fontWeight='semibold'>
          Locations
        </Text>
        <Flex>
          <Input onChange={e => setLocationText(e.target.value)} value={locationText} placeholder='Woz' />
          <Button onClick={handleCreateLocation} ml={3}>
            Create
          </Button>
        </Flex>
      </Flex>
      {locations.map(location => (
        <AdminCard key={location.id} assignmentOrLocation={location} editMutation={editLocationMutation} handleDelete={handleDeleteLocation} />
      ))}

      <Flex direction='column' mt={10} mb={3}>
        <Text fontSize='3xl' fontWeight='semibold'>
          General Settings
        </Text>
        <Flex>
          <Text fontSize='xl'>Pending Stage</Text>
          <Switch ml={2} mr={2} mt={2} isChecked={isPendingStageEnabled} onChange={handleTogglePendingStageEnabled} />
          <Text fontSize='xl'>Public Tickets</Text>
          <Switch ml={2} mt={2} isChecked={arePublicTicketsEnabled} onChange={handleTogglePublicTicketsEnabled} />
        </Flex>
      </Flex>

      <Flex direction='column'>
        <Flex>
          <Text mr={2} mb={5} fontSize='xl'>
            Import Users
          </Text>
          <Tooltip
            hasArrow
            label='The CSV should have 2 columns. One for email and one for role (STUDENT or STAFF)'
            bg='gray.300'
            color='black'
          >
            <InfoIcon mt={2} />
          </Tooltip>
        </Flex>
        <ImportUsers />
      </Flex>
    </Flex>
  );
};

export default AdminView;
