import {
  Button,
  ModalFooter,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useColorModeValue,
  Text,
  Input,
  Switch,
} from '@chakra-ui/react';
import { Dispatch, SetStateAction } from 'react';
import { DARK_GRAY_COLOR, DARK_HOVER_COLOR } from '../../utils/constants';
import { sanitizeString } from '../../utils/utils';

interface EditPersonalQueueModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  changedQueueName: string | undefined;
  setChangedQueueName: Dispatch<SetStateAction<string | undefined>>;
  handleEditQueueName: () => void;
  handleAllowStaffToOpen: () => void;
  isSwitchToggled: boolean;
}

const EditPersonalQueueModal = (props: EditPersonalQueueModalProps) => {
  const {
    isModalOpen,
    setIsModalOpen,
    changedQueueName,
    setChangedQueueName,
    handleAllowStaffToOpen,
    handleEditQueueName,
    isSwitchToggled,
  } = props;

  return (
    <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
      <ModalContent
        backgroundColor={useColorModeValue('', DARK_GRAY_COLOR)}
        boxShadow={`0 0 1px 2px ${DARK_HOVER_COLOR}`}
      >
        <ModalHeader>Edit Personal Queue</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text fontSize='xl' mb={2}>
            Queue name
          </Text>
          <Input
            maxLength={25}
            value={changedQueueName ?? ''}
            onChange={e => setChangedQueueName(sanitizeString(e.target.value))}
          />
          <Button width='100%' mb={4} mt={2} colorScheme='green' onClick={handleEditQueueName}>
            Check validity and change name
          </Button>
          <Text>Allow other staff members to open/close your queue</Text>
          <Switch onChange={handleAllowStaffToOpen} isChecked={isSwitchToggled} />
        </ModalBody>
        <ModalFooter>
          <Button variant='ghost' mr={3} onClick={() => setIsModalOpen(false)}>
            Done
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditPersonalQueueModal;
