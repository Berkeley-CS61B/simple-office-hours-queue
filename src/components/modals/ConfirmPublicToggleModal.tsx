import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useColorModeValue,
} from "@chakra-ui/react";
import { DARK_GRAY_COLOR, DARK_HOVER_COLOR } from "../../utils/constants";

interface ConfirmPublicToggleModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (value: boolean) => void;
  handleConfirm: () => void;
}

/** Used when a student toggles off "Public" when they have a conceptual question */
const ConfirmPublicToggleModal = (props: ConfirmPublicToggleModalProps) => {
  const { isModalOpen, setIsModalOpen, handleConfirm } = props;
  return (
    <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
      <ModalContent
        backgroundColor={useColorModeValue("", DARK_GRAY_COLOR)}
        boxShadow={`0 0 1px 2px ${DARK_HOVER_COLOR}`}
      >
        <ModalHeader>Confirm Public Toggle</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          We recommend keeping your ticket public so that other students can
          join your ticket and TAs can help you for a longer time.
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleConfirm}>
            Make private
          </Button>
          <Button
            colorScheme="blue"
            mr={3}
            onClick={() => setIsModalOpen(false)}
          >
            Keep Public
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ConfirmPublicToggleModal;
