import { Divider, Flex, Spinner, Switch, Text } from "@chakra-ui/react";
import {
  Assignment,
  Location,
  SiteSettings,
  SiteSettingsValues,
} from "@prisma/client";
import { useEffect, useState } from "react";
import useSiteSettings from "../../utils/hooks/useSiteSettings";
import { trpc } from "../../utils/trpc";
import AdminList from "./AdminList";
import ImportUsersMethod from "./ImportUsersMethod";

/**
 * Component which allows staff to edit site settings and locations/assignments
 */
const AdminView = () => {
  const [isPendingStageEnabled, setIsPendingStageEnabled] = useState<boolean>();
  const [arePublicTicketsEnabled, setArePublicTicketsEnabled] =
    useState<boolean>();
  const [assignments, setAssignments] = useState<Assignment[]>();
  const [locations, setLocations] = useState<Location[]>();

  const { siteSettings } = useSiteSettings();

  const setArePublicTicketsEnabledMutation =
    trpc.admin.setArePublicTicketsEnabled.useMutation();
  const setIsPendingStageEnabledMutation =
    trpc.admin.setIsPendingStageEnabled.useMutation();

  // When the site settings are loaded, set the state to the current values
  useEffect(() => {
    if (siteSettings) {
      setIsPendingStageEnabled(
        siteSettings.get(SiteSettings.IS_PENDING_STAGE_ENABLED) ===
          SiteSettingsValues.TRUE,
      );
      setArePublicTicketsEnabled(
        siteSettings.get(SiteSettings.ARE_PUBLIC_TICKETS_ENABLED) ===
          SiteSettingsValues.TRUE,
      );
    }
  }, [siteSettings]);

  trpc.admin.getAllAssignments.useQuery(undefined, {
    refetchOnWindowFocus: false,
    onSuccess: (data) => {
      setAssignments(data); // Putting this in state to edit the list
    },
  });

  trpc.admin.getAllLocations.useQuery(undefined, {
    refetchOnWindowFocus: false,
    onSuccess: (data) => {
      setLocations(data);
    },
  });

  // Sets the pending stage to enabled or disabled depending on the current state
  const handleTogglePendingStageEnabled = async () => {
    const valueToSet = !isPendingStageEnabled;
    setIsPendingStageEnabled(valueToSet);
    await setIsPendingStageEnabledMutation.mutateAsync({
      shouldBeEnabled: valueToSet,
    });
  };

  const handleTogglePublicTicketsEnabled = async () => {
    const valueToSet = !arePublicTicketsEnabled;
    setArePublicTicketsEnabled(valueToSet);
    await setArePublicTicketsEnabledMutation.mutateAsync({
      shouldBeEnabled: valueToSet,
    });
  };

  if (assignments === undefined || locations === undefined) {
    return <Spinner />;
  }

  return (
    <Flex ml={4} mr={4} mt={4} flexDirection="column">
      <AdminList
        assignmentsOrLocationsProps={assignments}
        isAssignment={true}
      />
      <AdminList assignmentsOrLocationsProps={locations} isAssignment={false} />
      <Flex direction="column" mt={10} mb={3}>
        <Text fontSize="3xl" fontWeight="semibold">
          Settings
        </Text>
        <Flex>
          <Text fontSize="xl">Pending Stage</Text>
          <Switch
            ml={2}
            mr={2}
            mt={2}
            isChecked={isPendingStageEnabled}
            onChange={handleTogglePendingStageEnabled}
          />
          <Text fontSize="xl">Public Tickets</Text>
          <Switch
            ml={2}
            mt={2}
            isChecked={arePublicTicketsEnabled}
            onChange={handleTogglePublicTicketsEnabled}
          />
        </Flex>
      </Flex>

      <Divider />

      <ImportUsersMethod />
    </Flex>
  );
};

export default AdminView;
