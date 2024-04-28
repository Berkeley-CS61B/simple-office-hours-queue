import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  Input,
  Text,
  Tooltip,
  useToast,
} from "@chakra-ui/react";
import { Assignment, Category, Location } from "@prisma/client";
import { CreatableSelect } from "chakra-react-select";
import { useState } from "react";
import { trpc } from "../../utils/trpc";
import AdminCard from "./AdminCard";

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
  const [assignmentCategoryId, setAssignmentCategoryId] = useState<number>();
  const [locationCategoryIds, setLocationCategoryIds] = useState<number[]>();
  const [allCategories, setAllCategories] = useState<Category[]>();

  const toast = useToast();

  const createAssignmentMutation = trpc.admin.createAssignment.useMutation();
  const editAssignmentMutation = trpc.admin.editAssignment.useMutation();
  const createLocationMutation = trpc.admin.createLocation.useMutation();
  const editLocationMutation = trpc.admin.editLocation.useMutation();
  const createCategoryMutation = trpc.admin.createCategory.useMutation();

  const numVisible = assignmentsOrLocations.filter((a) => !a?.isHidden).length;

  const { refetch: refetchCategories } = trpc.admin.getAllCategories.useQuery(
    undefined,
    {
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        setAllCategories(data);
      },
    },
  );

  const handleCreateAssignment = async () => {
    // refetchAssignment();
    if (assignmentCategoryId === undefined) {
      const toastId = "no assignment category chosen";
      if (toast.isActive(toastId)) return;
      toast({
        id: toastId,
        title: "Error",
        description: "Category for assignment must be chosen",
        status: "error",
        duration: 5000,
        position: "top-right",
        isClosable: true,
      });
      return;
    }
    
    await createAssignmentMutation
      .mutateAsync({
        name: createText,
        isPriority: isPriorityChecked,
        categoryId: assignmentCategoryId,
      })
      .then((data) => {
        setAssignmentsOrLocations((prev) => [
          ...(prev ?? []),
          data as Assignment,
        ]);
      })
      .catch((err) => {
        toast({
          title: "Error",
          description: err.message,
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "top-right",
        });
      });
  };

  const handleCreateCategory = async (categoryName: string) => {
    await createCategoryMutation
      .mutateAsync({
        name: categoryName,
      })
      .then(() => refetchCategories())
      .catch((err) =>
        toast({
          title: "Error",
          description: err.message,
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "top-right",
        }),
      );
  };

  const handleCreateLocation = async () => {
    await createLocationMutation
      .mutateAsync({
        name: createText,
        categoryIds: locationCategoryIds ?? [],
      })
      .then((data) => {
        setAssignmentsOrLocations((prev) => [
          ...(prev ?? []),
          data as Location,
        ]);
      })
      .catch((err: PrismaClientKnownRequestError) => {
        const description =
          err.code === "P2002"
            ? `A location with name ${createText} already exists`
            : err.message;
        toast({
          title: "Error",
          description: err.code,
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "top-right",
        });
      });
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
    if (assignmentsOrLocations.map(assignmentOrLocation => assignmentOrLocation.name).includes(createText)) {
      const toastId = isAssignment ? "assignment-not-unique" : "location-not-unique";
      if (toast.isActive(toastId)) return;
      toast({
        id: toastId,
        title: "Error",
        description: `${isAssignment ? 'An assignment' : 'A location'} with name ${createText} already exists`,
        status: "error",
        duration: 5000,
        position: "top-right",
        isClosable: true,
      });
      return;
    }
    // if (isAssignment && assignmentCategoryId === undefined) {
    //   const toastId = "no assignment category chosen";
    //   if (toast.isActive(toastId)) return;
    //   toast({
    //     id: toastId,
    //     title: "Error",
    //     description: "Category for assignment must be chosen",
    //     status: "error",
    //     duration: 5000,
    //     position: "top-right",
    //     isClosable: true,
    //   });
    //   return;
    // }
    // if (!isAssignment && locationCategoryIds?.length === 0 ) {
    //   const toastId = "no location category chosen";
    //   if (toast.isActive(toastId)) return;
    //   toast({
    //     id: toastId,
    //     title: "Error",
    //     description: "Location category or categories must be chosen",
    //     status: "error",
    //     duration: 5000,
    //     position: "top-right",
    //     isClosable: true,
    //   });
    //   return;
    // }
    if (isAssignment) {
      handleCreateAssignment();
    } else {
      handleCreateLocation();
    }
  };

  const handlePriorityChange = () => {
    setIsPriorityChecked((prev) => !prev);
  };

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
            <FormControl ml={2} w="50%">
              {isAssignment ? (
                <CreatableSelect
                placeholder="Select category..."
                  options={allCategories?.map((category) => ({
                    label: category.name,
                    value: category.id,
                  }))}
                  onChange={(newValue) =>
                    setAssignmentCategoryId(newValue?.value)
                  }
                  onCreateOption={(categoryName) => {
                    handleCreateCategory(categoryName);
                  }}
                />
              ) : (
                <CreatableSelect
                  isMulti
                  placeholder="Select categories..."
                  options={allCategories?.map((category) => ({
                    label: category.name,
                    value: category.id,
                  }))}
                  onChange={(newValue) => {
                    setLocationCategoryIds(newValue.map((item) => item.value));
                  }}
                  onCreateOption={(categoryName) => {
                    handleCreateCategory(categoryName);
                  }}
                />
              )}
            </FormControl>
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
