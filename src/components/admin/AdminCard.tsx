import { CheckIcon, CloseIcon, EditIcon } from "@chakra-ui/icons";
import {
  ButtonGroup,
  Checkbox,
  Editable,
  EditableInput,
  EditablePreview,
  Flex,
  IconButton,
  Input,
  Switch,
  Text,
  useColorModeValue,
  useEditableControls,
  useToast,
} from "@chakra-ui/react";
import { Assignment, Location } from "@prisma/client";
import { UseTRPCMutationResult } from "@trpc/react/shared";
import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { DARK_GRAY_COLOR } from "../../utils/constants";
import { trpc } from "../../utils/trpc";

interface AdminCardProps {
  assignmentOrLocation: Assignment | Location;
  editMutation: UseTRPCMutationResult<any, any, any, any>;
  isHiddenVisible: boolean;
  isAssignment: boolean;
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
  const { assignmentOrLocation, editMutation, isHiddenVisible, isAssignment } =
    props;
  const boxColor = useColorModeValue("gray.100", DARK_GRAY_COLOR);
  const [isActive, setIsActive] = useState(assignmentOrLocation.isActive);
  const [isHidden, setIsHidden] = useState(assignmentOrLocation.isHidden);
  const [isPriority, setIsPriority] = useState(
    isAssignment ? (assignmentOrLocation as Assignment).isPriority : false,
  );
  const [isLabOnly, setIsLabOnly] = useState(isAssignment ? undefined : (assignmentOrLocation as Location).isLabOnly);
  const context = trpc.useContext();
  const toast = useToast();

  const handleNameChange = async (newName: string) => {
    await editMutation.mutateAsync({
      id: assignmentOrLocation.id,
      name: newName,
      isActive: assignmentOrLocation.isActive,
      isHidden: assignmentOrLocation.isHidden,
      isLabOnly: isAssignment ? undefined : (assignmentOrLocation as Location).isLabOnly,
    });
  };

  const handlePriorityChange = async (newPriority: boolean) => {
    setIsPriority(newPriority);
    await editMutation.mutateAsync({
      id: assignmentOrLocation.id,
      name: assignmentOrLocation.name,
      isActive: assignmentOrLocation.isActive,
      isHidden: assignmentOrLocation.isHidden,
      isPriority: newPriority,
    });
  };

  const handleActiveChange = async () => {
    const newActive = !isActive;
    setIsActive(newActive);
    await editMutation
      .mutateAsync({
        id: assignmentOrLocation.id,
        name: assignmentOrLocation.name,
        isActive: newActive,
        isHidden: newActive ? false : isHidden,
        isLabOnly: isAssignment ? undefined : (assignmentOrLocation as Location).isLabOnly,
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
    setIsHidden(!isHidden);
    await editMutation
      .mutateAsync({
        id: assignmentOrLocation.id,
        name: assignmentOrLocation.name,
        isActive: assignmentOrLocation.isActive,
        isHidden: !isHidden,
        isLabOnly: isAssignment ? undefined : (assignmentOrLocation as Location).isLabOnly,
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

  const handleLabOnlyChange = async () => {
    const newLabOnly = !isLabOnly;
    setIsLabOnly(newLabOnly);
    await editMutation
        .mutateAsync({
          id: assignmentOrLocation.id,
          name: assignmentOrLocation.name,
          isActive: isActive,
          isHidden: isHidden,
          isLabOnly: newLabOnly,
        })
        .then(() => {
          context.admin.getAllLocations.invalidate();
          context.admin.getAllAssignments.invalidate();
        })
        .catch(err => {
          toast({
            title: 'Error',
            description: err.message,
            status: 'error',
            duration: 3000,
            isClosable: true,
            position: 'top-right',
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
      <Flex>
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
        <Text fontSize="large" mt={1.5} ml={5}>
          Active?
        </Text>
        <Switch
          onChange={handleActiveChange}
          mt={2.5}
          ml={3}
          isChecked={isActive}
        />
        {isAssignment ? null : <><Text fontSize='large' mt={1.5} ml={5}>
          Accept Lab Tickets Only?
        </Text>
          <Switch onChange={handleLabOnlyChange} mt={2.5} ml={3} isChecked={isLabOnly} /></>
        }
      </Flex>
      <Checkbox
        hidden={!isActive || !isAssignment}
        onChange={() => handlePriorityChange(!isPriority)}
        colorScheme="telegram"
        size="lg"
        ml={2}
        isChecked={isPriority}
      >
        Priority
      </Checkbox>
      {!isActive && (
        <Flex>
          {isHidden ? (
            <FaEyeSlash
              size="20px"
              className="hover-cursor"
              style={{ marginTop: "10px" }}
              onClick={handleHidden}
            />
          ) : (
            <FaEye
              size="20px"
              className="hover-cursor"
              style={{ marginTop: "10px" }}
              onClick={handleHidden}
            />
          )}
        </Flex>
      )}
    </Flex>
  );
};

export default AdminCard;
