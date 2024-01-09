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

interface OpenOrCloseQueueModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (value: boolean) => void;
  isQueueOpen: boolean;
  handleOpenOrCloseQueue: (clearQueue: boolean) => void;
}

const OpenOrCloseQueueModal = (props: OpenOrCloseQueueModalProps) => {
  const { isModalOpen, setIsModalOpen, isQueueOpen, handleOpenOrCloseQueue } =
    props;
  return (
    <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
      <ModalContent
        backgroundColor={useColorModeValue("", DARK_GRAY_COLOR)}
        boxShadow={`0 0 1px 2px ${DARK_HOVER_COLOR}`}
      >
        <ModalHeader>{isQueueOpen ? "Close" : "Open"} Queue</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          Are you sure you want to {isQueueOpen ? "close" : "open"} the queue?
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            mr={3}
            onClick={() => handleOpenOrCloseQueue(false)}
          >
            Confirm
          </Button>
          {isQueueOpen && (
            <Button
              colorScheme="green"
              onClick={() => handleOpenOrCloseQueue(true)}
            >
              Confirm and Clear Queue
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default OpenOrCloseQueueModal;
