import { CheckIcon, CloseIcon, EditIcon } from "@chakra-ui/icons";
import {
  ButtonGroup,
  Checkbox,
  Editable,
  EditableInput,
  EditablePreview,
  Flex,
  FormControl,
  IconButton,
  Input,
  Switch,
  Text,
  useColorModeValue,
  useEditableControls,
  useToast,
  Button,
  Tooltip,
} from "@chakra-ui/react";

import { Assignment, Category, Location } from "@prisma/client";
import { UseTRPCMutationResult } from "@trpc/react/shared";
import { MultiValue, Select, SingleValue } from "chakra-react-select";
import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { DARK_GRAY_COLOR } from "../../utils/constants";
import { trpc } from "../../utils/trpc";
import EditTemplateModal from "../modals/EditTemplateModal";

interface AdminCardProps {
  assignmentOrLocation: Assignment | Location;
  editMutation: UseTRPCMutationResult<any, any, any, any>;
  isHiddenVisible: boolean;
  isAssignment: boolean;
  changeNumVisible: (delta: number) => void;
}

const EditableControls = () => {
  const {
    isEditing,
    getSubmitButtonProps,
    getCancelButtonProps,
    getEditButtonProps,
  } = useEditableControls();

  return isEditing ? (
    <ButtonGroup ml={4} mt={1} justifyContent="center" size="sm">
      <IconButton
        aria-label="Confirm"
        icon={<CheckIcon />}
        {...getSubmitButtonProps()}
      />
      <IconButton
        aria-label="Cancel"
        icon={<CloseIcon />}
        {...getCancelButtonProps()}
      />
    </ButtonGroup>
  ) : (
    <Flex ml={2} mt={1} justifyContent="center">
      <IconButton
        aria-label="Edit"
        size="sm"
        icon={<EditIcon />}
        {...getEditButtonProps()}
      />
    </Flex>
  );
};

/**
 * Component which represents a single assignment or location
 */
const AdminCard = (props: AdminCardProps) => {
  const {
    assignmentOrLocation,
    editMutation,
    isHiddenVisible,
    isAssignment,
    changeNumVisible,
  } = props;
  const boxColor = useColorModeValue("gray.100", DARK_GRAY_COLOR);

  const [name, setName] = useState(assignmentOrLocation.name);
  const [isActive, setIsActive] = useState(assignmentOrLocation.isActive);
  const [isHidden, setIsHidden] = useState(assignmentOrLocation.isHidden);
  const [isPriority, setIsPriority] = useState(
    isAssignment ? (assignmentOrLocation as Assignment).isPriority : false
  );
  const [isOnline, setIsOnline] = useState(
    isAssignment ? false : (assignmentOrLocation as Location).isOnline
  );
  const [assignmentCategoryId, setAssignmentCategoryId] = useState(
    isAssignment ? (assignmentOrLocation as Assignment).categoryId : undefined
  );
  const [template, setTemplate] = useState(
    isAssignment ? (assignmentOrLocation as Assignment).template : undefined
  );
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [locationCategoryIds, setLocationCategoryIds] = useState<number[]>();
  const [allCategories, setAllCategories] = useState<Category[]>();

  const context = trpc.useContext();
  const toast = useToast();

  trpc.admin.getCategoriesForLocation.useQuery(
    {
      locationId: isAssignment
        ? undefined
        : (assignmentOrLocation as Location).id,
    },
    {
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        setLocationCategoryIds(data?.categories.map((category) => category.id));
      },
      enabled: !isAssignment,
    }
  );

  trpc.admin.getAllCategories.useQuery(undefined, {
    refetchOnWindowFocus: false,
    onSuccess: (data) => {
      setAllCategories(data);
    },
  });

  /* Helper method to ensure that we get all the fields of the assignment and locations. Alternative to this would be to edit the mutation in admin.ts to not require these many fields */
  const baseUpdate = () => {
    return {
      id: assignmentOrLocation.id,
      name: name,
      isActive: isActive,
      isHidden: isHidden,
      isPriority: isPriority,
      categoryId: isAssignment ? assignmentCategoryId : undefined,
      categoryIds: isAssignment ? undefined : locationCategoryIds,
      isOnline: isAssignment ? undefined : isOnline,
      template: isAssignment ? template : undefined,
    };
  };

  const handleNameChange = async (newName: string) => {
    setName(newName);
    await editMutation
      .mutateAsync({ ...baseUpdate(), name: newName })
      .then(() => {
        context.admin.getAllLocations.invalidate();
        context.admin.getAllAssignments.invalidate();
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

  const handlePriorityChange = async (newPriority: boolean) => {
    setIsPriority(newPriority);
    await editMutation
      .mutateAsync({
        ...baseUpdate(),
        isPriority: newPriority,
      })
      .then(() => {
        context.admin.getAllLocations.invalidate();
        context.admin.getAllAssignments.invalidate();
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

  const handleTemplateChange = async (newTemplate: string) => {
    setTemplate(newTemplate);
    await editMutation
      .mutateAsync({ ...baseUpdate(), template: newTemplate })
      .then(() => {
        context.admin.getAllLocations.invalidate();
        context.admin.getAllAssignments.invalidate();
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

  const handleOnlineChange = async (newOnline: boolean) => {
    setIsOnline(newOnline);
    await editMutation
      .mutateAsync({ ...baseUpdate(), isOnline: newOnline })
      .then(() => {
        context.admin.getAllLocations.invalidate();
        context.admin.getAllAssignments.invalidate();
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

  const handleActiveChange = async () => {
    const newActive = !isActive;
    setIsActive(newActive);
    await editMutation
      .mutateAsync({
        ...baseUpdate(),
        isActive: newActive,
        isHidden: newActive ? false : isHidden,
      })
      .then(() => {
        context.admin.getAllLocations.invalidate();
        context.admin.getAllAssignments.invalidate();
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

  const handleHidden = async () => {
    if (!isHidden) {
      setIsHidden(true);
      changeNumVisible(-1);
    } else {
      setIsHidden(false);
      changeNumVisible(1);
    }
    await editMutation
      .mutateAsync({
        ...baseUpdate(),
        isHidden: !isHidden,
      })
      .then(() => {
        context.admin.getAllLocations.invalidate();
        context.admin.getAllAssignments.invalidate();
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

  const handleAssignmentCategoryChange = async (categoryId: number) => {
    setAssignmentCategoryId(categoryId);
    await editMutation
      .mutateAsync({
        ...baseUpdate(),
        categoryId: categoryId,
      })
      .then(() => {
        context.admin.getAllLocations.invalidate();
        context.admin.getAllAssignments.invalidate();
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

  const handleLocationCategoriesChange = async (categoryIds: number[]) => {
    setLocationCategoryIds(categoryIds);
    await editMutation
      .mutateAsync({
        ...baseUpdate(),
        categoryIds: categoryIds,
      })
      .then(() => {
        context.admin.getAllLocations.invalidate();
        context.admin.getAllAssignments.invalidate();
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

  if (!isActive && isHidden && !isHiddenVisible) {
    return null;
  }

  return (
    <Flex
      borderRadius={4}
      mb={2}
      flexDirection="row"
      p={2}
      backgroundColor={boxColor}
      justifyContent="space-between"
    >
      <>
        <Flex w="70%">
          <Editable
            onSubmit={handleNameChange}
            textAlign="center"
            fontWeight="semibold"
            display="flex"
            defaultValue={assignmentOrLocation.name}
            fontSize="xl"
            isPreviewFocusable={false}
          >
            <EditablePreview />
            <Input as={EditableInput} />
            <EditableControls />
          </Editable>

          {/*uppercaseFirstLetter(allCategories?.find((category) => category.id === assignmentCategoryId).name)*/}
          <FormControl w={isAssignment ? "30%" : "50%"} ml={5}>
            {isAssignment ? (
              <Select
                options={allCategories?.map((category) => ({
                  label: category.name,
                  value: category.id,
                }))}
                value={
                  assignmentCategoryId !== undefined
                    ? {
                        label: allCategories?.find(
                          (category) => category.id === assignmentCategoryId
                        )?.name,
                        value: assignmentCategoryId,
                      }
                    : { label: "", value: -1 }
                }
                onChange={(
                  newValue: SingleValue<{
                    label: string | undefined;
                    value: number;
                  }>
                ) => handleAssignmentCategoryChange(newValue?.value ?? -1)}
              />
            ) : (
              <Select
                isMulti
                options={allCategories?.map((category) => ({
                  label: category.name,
                  value: category.id,
                }))}
                value={allCategories
                  ?.filter((category) =>
                    locationCategoryIds?.includes(category.id)
                  )
                  ?.map((category) => ({
                    value: category.id,
                    label: category.name,
                  }))}
                onChange={(
                  newValue: MultiValue<{
                    label: string;
                    value: number;
                  }>
                ) =>
                  handleLocationCategoriesChange(
                    newValue.map((item) => item.value)
                  )
                }
              />
            )}
          </FormControl>
          {isAssignment ? (
            <>
              <Button
                ml={5}
                onClick={() => setIsTemplateModalOpen(!isTemplateModalOpen)}
              >
                Edit Template
              </Button>
              <EditTemplateModal
                isModalOpen={isTemplateModalOpen}
                setIsModalOpen={setIsTemplateModalOpen}
                handleConfirm={handleTemplateChange}
                template={template}
                assignmentName={name}
              />
            </>
          ) : (
            <></>
          )}
          <Checkbox
            ml={5}
            hidden={isAssignment}
            onChange={() => handleOnlineChange(!isOnline)}
            colorScheme="telegram"
            size="lg"
            isChecked={isOnline}
          >
            Online
          </Checkbox>
          <Checkbox
            hidden={!isAssignment}
            onChange={() => handlePriorityChange(!isPriority)}
            colorScheme="telegram"
            size="lg"
            ml={5}
            isChecked={isPriority}
          >
            Priority
          </Checkbox>
        </Flex>

        <Flex>
          {!isActive && (
            <>
              <Tooltip
                label={
                  (isHidden ? "Show" : "Hide") +
                  " this " +
                  (isAssignment ? "assignment" : "location")
                }
              >
                <Text as="span">
                  {isHidden ? (
                    <FaEyeSlash
                      size="20px"
                      className="hover-cursor"
                      style={{ marginTop: "10px", marginLeft: "10px" }}
                      onClick={handleHidden}
                    />
                  ) : (
                    <FaEye
                      size="20px"
                      className="hover-cursor"
                      style={{ marginTop: "10px", marginLeft: "10px" }}
                      onClick={handleHidden}
                    />
                  )}
                </Text>
              </Tooltip>
            </>
          )}
          <Text fontSize="large" mt={1.5} ml={5}>
            Active?
          </Text>
          <Switch
            onChange={handleActiveChange}
            mt={2.5}
            ml={3}
            isChecked={isActive}
          />
        </Flex>
      </>
    </Flex>
  );
};

export default AdminCard;
