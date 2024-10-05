import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useColorModeValue,
  Textarea,
  Text
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { DARK_GRAY_COLOR, DARK_HOVER_COLOR } from "../../utils/constants";

interface EditTemplateModalProps {
  
  isModalOpen: boolean;
  setIsModalOpen: (value: boolean) => void;
  handleConfirm: (newTemplate: string) => void;
  template: string | undefined;
  assignmentName: string;
}

/** Used when a student toggles off "Public" when they have a conceptual question */
const EditTemplateModal = (props: EditTemplateModalProps) => {
  const { isModalOpen, setIsModalOpen, handleConfirm, template, assignmentName } = props;

  const [tempTemplate, setTempTemplate] = useState(template);

  useEffect(() => {
    setTempTemplate(template);
  }, [isModalOpen, template]);

  return (
    <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
      <ModalContent
        backgroundColor={useColorModeValue("", DARK_GRAY_COLOR)}
        boxShadow={`0 0 1px 2px ${DARK_HOVER_COLOR}`}
      >
        <ModalHeader>Edit Template for {assignmentName}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
            <Text>
                Include "[this test]" or "[this concept]" as mandatory placeholders for students to fill.
            </Text>
          <Textarea
            value={tempTemplate}
            onChange={(e) => setTempTemplate(e.target.value)}
            placeholder="Fill in template here"
            mt={2}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            mr={3}
            onClick={() => {
              handleConfirm(tempTemplate);
              setIsModalOpen(false);
            }}
          >
            Confirm
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditTemplateModal;
