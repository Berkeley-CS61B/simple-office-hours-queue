import {
  Button,
  Divider,
  Flex,
  Input,
  Spinner,
  Switch,
  Text,
  useToast,
} from "@chakra-ui/react";
import {
  Assignment,
  Location,
  SiteSettings,
  SiteSettingsValues,
  Template,
} from "@prisma/client";
import { useEffect, useState } from "react";
import useSiteSettings from "../../utils/hooks/useSiteSettings";
import { trpc } from "../../utils/trpc";
import AdminList from "./AdminList";
import CoolDownTimer from "./CooldownTimer";
import ImportUsersMethod from "./ImportUsersMethod";

export interface AssignmentWithTemplates extends Assignment {
  templates: Template[];
}

/**
 * Component which allows staff to edit site settings and locations/assignments
 */
const AdminView = () => {
  const [isPendingStageEnabled, setIsPendingStageEnabled] = useState<boolean>();
  const [arePublicTicketsEnabled, setArePublicTicketsEnabled] =
    useState<boolean>();
  const [studentSupportLink, setStudentSupportLink] = useState("");
  const [assignments, setAssignments] = useState<AssignmentWithTemplates[]>();
  const [locations, setLocations] = useState<Location[]>();

  const { siteSettings } = useSiteSettings();

  const setArePublicTicketsEnabledMutation =
    trpc.admin.setArePublicTicketsEnabled.useMutation();
  const setIsPendingStageEnabledMutation =
    trpc.admin.setIsPendingStageEnabled.useMutation();
  const setStudentSupportLinkMutation =
    trpc.admin.setStudentSupportLink.useMutation();

  const toast = useToast();

  // When the site settings are loaded, set the state to the current values
  useEffect(() => {
    if (siteSettings) {
      setIsPendingStageEnabled(
        siteSettings.get(SiteSettings.IS_PENDING_STAGE_ENABLED) ===
          SiteSettingsValues.TRUE
      );
      setArePublicTicketsEnabled(
        siteSettings.get(SiteSettings.ARE_PUBLIC_TICKETS_ENABLED) ===
          SiteSettingsValues.TRUE
      );
    }
  }, [siteSettings]);

  trpc.admin.getStudentSupportLink.useQuery(undefined, {
    refetchOnWindowFocus: false,
    onSuccess: (link) => {
      setStudentSupportLink(link); // Putting this in state to edit the list
    },
  });

  const { refetch: refetchAssignments } = trpc.admin.getAllAssignments.useQuery(
    undefined,
    {
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        setAssignments(data); // Putting this in state to edit the list
      },
    }
  );

  const { refetch: refetchLocations } = trpc.admin.getAllLocations.useQuery(
    undefined,
    {
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        setLocations(data);
      },
    }
  );

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

  // TODO: validation of link
  const handleStudentSupportLinkSubmit = () => {
    setStudentSupportLinkMutation
      .mutateAsync({ link: studentSupportLink })
      .then(() => {
        toast({
          title: "Success",
          description: "Student support link updated",
          status: "success",
          duration: 5000,
          position: "top-right",
          isClosable: true,
        });
      })
      .catch((err) => {
        toast({
          title: "Error",
          description: err.message,
          status: "error",
          duration: 5000,
          position: "top-right",
          isClosable: true,
        });
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
        refetch={refetchAssignments}
      />
      <AdminList
        assignmentsOrLocationsProps={locations}
        isAssignment={false}
        refetch={refetchLocations}
      />
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
      <Flex direction="column" mt={10} mb={3}>
        <Text fontSize="xl">Student Support Link</Text>
        <Text fontSize="md">
          Put a link to a student support/student-of-concern form for staff to
          access when helping a student out.
        </Text>
        <Flex flexDir="row">
          <Input
            placeholder={"https://forms.gle/"}
            value={studentSupportLink}
            onChange={(e) => setStudentSupportLink(e.target.value)}
            mr={1}
          />
          <Button
            colorScheme="telegram"
            onClick={handleStudentSupportLinkSubmit}
          >
            Confirm
          </Button>
        </Flex>
      </Flex>

      <CoolDownTimer />

      <Divider mt={2} />

      <ImportUsersMethod />
    </Flex>
  );
};

export default AdminView;
