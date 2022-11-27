import { useState } from 'react';
import {
  Flex,
  Text,
  IconButton,
  Switch,
  useColorModeValue,
  ButtonGroup,
  useEditableControls,
  Editable,
  EditablePreview,
  Input,
  EditableInput,
} from '@chakra-ui/react';
import { CheckIcon, CloseIcon, EditIcon } from '@chakra-ui/icons';
import { Assignment, Location } from '@prisma/client';
import { UseTRPCMutationResult } from '@trpc/react/shared';
import { DARK_GRAY_COLOR } from '../../utils/constants';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

interface AdminCardProps {
  assignmentOrLocation: Assignment | Location;
  editMutation: UseTRPCMutationResult<any, any, any, any>;
}

const EditableControls = () => {
  const { isEditing, getSubmitButtonProps, getCancelButtonProps, getEditButtonProps } = useEditableControls();

  return isEditing ? (
    <ButtonGroup ml={4} mt={1} justifyContent='center' size='sm'>
      <IconButton aria-label='Confirm' icon={<CheckIcon />} {...getSubmitButtonProps()} />
      <IconButton aria-label='Cancel' icon={<CloseIcon />} {...getCancelButtonProps()} />
    </ButtonGroup>
  ) : (
    <Flex ml={2} mt={1} justifyContent='center'>
      <IconButton aria-label='Edit' size='sm' icon={<EditIcon />} {...getEditButtonProps()} />
    </Flex>
  );
};

/**
 * Component which represents a single assignment or location
 */
const AdminCard = (props: AdminCardProps) => {
  const { assignmentOrLocation, editMutation } = props;
  const boxColor = useColorModeValue('gray.100', DARK_GRAY_COLOR);
  const [isChecked, setIsChecked] = useState(assignmentOrLocation.isActive);

  const handleNameChange = (newName: string) => {
    editMutation.mutateAsync({
      id: assignmentOrLocation.id,
      name: newName,
      isActive: assignmentOrLocation.isActive,
      isHidden: assignmentOrLocation.isHidden,
    });
  };

  const handleActiveChange = () => {
    setIsChecked(!isChecked);
    editMutation.mutateAsync({
      id: assignmentOrLocation.id,
      name: assignmentOrLocation.name,
      isActive: !isChecked,
      isHidden: assignmentOrLocation.isHidden,
    });
  };

  const handleHidden = () => {};

  return (
    <Flex borderRadius={4} mb={2} flexDirection='row' p={2} backgroundColor={boxColor} justifyContent='space-between'>
      <Flex>
        <Editable
          onSubmit={handleNameChange}
          textAlign='center'
          fontWeight='semibold'
          display='flex'
          defaultValue={assignmentOrLocation.name}
          fontSize='xl'
          isPreviewFocusable={false}
        >
          <EditablePreview />
          <Input as={EditableInput} />
          <EditableControls />
        </Editable>
        <Text fontSize='large' mt={1.5} ml={5}>
          Active?
        </Text>
        <Switch onChange={handleActiveChange} mt={2.5} ml={3} isChecked={isChecked} />
      </Flex>
      <Flex>
        <FaEye size='20px' className='hover-cursor' style={{ marginTop: '10px' }} onClick={handleHidden} />
      </Flex>
    </Flex>
  );
};

export default AdminCard;
