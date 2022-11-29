import { useEffect, useState } from 'react';
import { Assignment, Location, SiteSettings, SiteSettingsValues } from '@prisma/client';
import { trpc } from '../../utils/trpc';
import { Flex, Spinner, Switch, Text, Tooltip } from '@chakra-ui/react';
import ImportUsers from './ImportUsers';
import { InfoIcon } from '@chakra-ui/icons';
import useSiteSettings from '../../utils/hooks/useSiteSettings';
import AdminList from './AdminList';

/**
 * Component which allows staff to edit site settings and locations/assignments
 */
const AdminView = () => {
  const [isPendingStageEnabled, setIsPendingStageEnabled] = useState<boolean>();
  const [arePublicTicketsEnabled, setArePublicTicketsEnabled] = useState<boolean>();
  const [assignments, setAssignments] = useState<Assignment[]>();
  const [locations, setLocations] = useState<Location[]>();

  const { siteSettings } = useSiteSettings();

  const setSiteSettingsMutation = trpc.admin.setSiteSettings.useMutation();

  useEffect(() => {
    if (siteSettings) {
      setIsPendingStageEnabled(siteSettings.get(SiteSettings.IS_PENDING_STAGE_ENABLED) === SiteSettingsValues.TRUE);
      setArePublicTicketsEnabled(siteSettings.get(SiteSettings.ARE_PUBLIC_TICKETS_ENABLED) === SiteSettingsValues.TRUE);
    }
  }, [siteSettings]);

  const { refetch: refetchAssignments } = trpc.admin.getAllAssignments.useQuery(undefined, {
    refetchOnWindowFocus: false,
    onSuccess: data => {
      setAssignments(data); // Puthing this in state to edit the list
    },
  });

  const { refetch: refetchLocations } = trpc.admin.getAllLocations.useQuery(undefined, {
    refetchOnWindowFocus: false,
    onSuccess: data => {
      setLocations(data);
    },
  });

  const updateAssignmentsOrLocations = (isAssignment: boolean) => {
    if (isAssignment) {
      refetchAssignments().then(data => setAssignments(data.data));
    } else {
      refetchLocations().then(data => setAssignments(data.data));
    }
  };

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
    <Flex ml={4} mr={4} mt={4} flexDirection='column'>
      <AdminList
        assignmentsOrLocationsProps={assignments}
        isAssignment={true}
        updateAssignmentsOrLocations={updateAssignmentsOrLocations}
      />
      <AdminList
        assignmentsOrLocationsProps={locations}
        isAssignment={false}
        updateAssignmentsOrLocations={updateAssignmentsOrLocations}
      />
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
