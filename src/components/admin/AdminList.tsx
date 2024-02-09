import {
  Box,
  Button,
  Checkbox,
  Flex,
  Input,
  Text,
  Tooltip,
  useToast,
} from "@chakra-ui/react";
import {Assignment, Category, Location, UserRole} from "@prisma/client";
import { useState } from "react";
import { trpc } from "../../utils/trpc";
import AdminCard from "./AdminCard";
import {Select} from "chakra-react-select";

interface AdminListProps {
  assignmentsOrLocationsProps: Assignment[] | Location[];
  isAssignment: boolean;
}

/**
 * Component for displaying a list of assignments/location
 */
const AdminList = (props: AdminListProps) => {
  const { assignmentsOrLocationsProps, isAssignment } = props;
  const [assignmentsOrLocations, setAssignmentsOrLocations] = useState<
    Assignment[] | Location[]
  >(assignmentsOrLocationsProps);
  const [createText, setCreateText] = useState<string>("");
  const [isHiddenVisible, setIsHiddenVisible] = useState<boolean>(false);
  const [isPriorityChecked, setIsPriorityChecked] = useState<boolean>(false);
  const [assignmentCategory, setAssignmentCategory] = useState<Category>();
  const [locationCategories, setLocationCategories] = useState<Category[]>();

  const toast = useToast();

  const createAssignmentMutation = trpc.admin.createAssignment.useMutation();
  const editAssignmentMutation = trpc.admin.editAssignment.useMutation();
  const createLocationMutation = trpc.admin.createLocation.useMutation();
  const editLocationMutation = trpc.admin.editLocation.useMutation();

  const numVisible = assignmentsOrLocations.filter((a) => !a?.isHidden).length;

  const handleCreateAssignment = async () => {
    if (assignmentCategory !== undefined) {
      const data = await createAssignmentMutation
          .mutateAsync({
        name: createText,
        isPriority: isPriorityChecked,
        category: assignmentCategory,
      }).then().catch(err => toast({
        title: 'Error',
        description: err.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      })
    );
      setAssignmentsOrLocations((prev) => [...(prev ?? []), data]);
    }
  };

  const handleCreateLocation = async () => {
    if (locationCategories !== undefined) {
      const data = await createLocationMutation.mutateAsync({
        name: createText ,
        categories: locationCategories
      });
      setAssignmentsOrLocations((prev) => [...(prev ?? []), data]);
    }
  };

  const handleCreate = () => {
    if (createText.length === 0) {
      const toastId = "create-name-error";
      if (toast.isActive(toastId)) return;
      toast({
        id: toastId,
        title: "Error",
        description: "Name must be longer than 0 characters",
        status: "error",
        duration: 5000,
        position: "top-right",
        isClosable: true,
      });
      return;
    }
    if (isAssignment) {
      handleCreateAssignment();
    } else {
      handleCreateLocation();
    }
  };

  const handlePriorityChange = () => {
    setIsPriorityChecked((prev) => !prev);
  };

  const categories = Object.values(Category).map((category: Category) => ({
    label: category,
    value: category,
  }));

  return (
    <>
      <Flex direction="column" w="100%" mb={3}>
        <Text fontSize="3xl" fontWeight="semibold" mb={2}>
          {isAssignment ? "Assignments" : "Locations"}
        </Text>
        <Flex justifyContent="space-between">
          <Flex w="50%">
            <Input
              width="50%"
              onChange={(e) => setCreateText(e.target.value)}
              value={createText}
              placeholder={isAssignment ? "Gitlet" : "Woz"}
            />
            {isAssignment ?
                <Select options={categories} onChange={(newValue) => setAssignmentCategory(newValue?.value)}/>
                :
                <Select isMulti options={categories} onChange={(newValue) => {setLocationCategories(newValue.map((item) => item.value))}}/>}
            <Flex flexDirection="row">
              <Checkbox
                hidden={!isAssignment}
                onChange={handlePriorityChange}
                colorScheme="telegram"
                size="lg"
                ml={2}
                isChecked={isPriorityChecked}
              >
                <Tooltip label="Priority tickets are put in a separate tab">
                  Priority
                </Tooltip>
              </Checkbox>
            </Flex>
            <Button colorScheme="green" onClick={handleCreate} ml={3}>
              Create
            </Button>
          </Flex>
          <Button onClick={() => setIsHiddenVisible(!isHiddenVisible)}>
            {isHiddenVisible ? "Hide" : "Show"} hidden
          </Button>
        </Flex>
      </Flex>
      {numVisible === 0 && (
        <Text>
          No visible {isAssignment ? "assigments" : "locations"}! You can add or
          unhide them above.
        </Text>
      )}
      {assignmentsOrLocations.map((al) => (
        <Box as="div" key={al.id}>
          <AdminCard
            assignmentOrLocation={al}
            editMutation={
              isAssignment ? editAssignmentMutation : editLocationMutation
            }
            isHiddenVisible={isHiddenVisible}
            isAssignment={isAssignment}
          />
        </Box>
      ))}
    </>
  );
};

export default AdminList;
