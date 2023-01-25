import {
  ModalFooter,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  useColorModeValue,
} from '@chakra-ui/react';
import { DARK_GRAY_COLOR } from '../../utils/constants';

interface HandleAllConfirmationModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  handleConfirm: () => void;
  handleAllText: string;
}

const HandleAllConfirmationModal = (props: HandleAllConfirmationModalProps) => {
  const { isModalOpen, setIsModalOpen, handleConfirm, handleAllText } = props;

  return (
    <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
      <ModalContent backgroundColor={useColorModeValue('', DARK_GRAY_COLOR)}>
        <ModalHeader>Confirm</ModalHeader>
        <ModalCloseButton />
        <ModalBody>Are you sure you want to {handleAllText} tickets? </ModalBody>
        <ModalFooter>
          <Button variant='ghost' mr={3} onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button colorScheme='blue' onClick={handleConfirm}>
            Confirm
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default HandleAllConfirmationModal;
