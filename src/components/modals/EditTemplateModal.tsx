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
  Text,
  Heading,
  Box,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { DARK_GRAY_COLOR, DARK_HOVER_COLOR } from "../../utils/constants";
import { Template } from "@prisma/client";

import { uppercaseFirstLetter } from "../../utils/utils";

interface EditTemplateModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (value: boolean) => void;
  handleConfirm: (newTemplates: Template[]) => void;
  templates: Template[];
  assignmentName: string;
}

/** Used when a staff wants to edit the template associated with an assignment or lab  */
const EditTemplateModal = (props: EditTemplateModalProps) => {
  const {
    isModalOpen,
    setIsModalOpen,
    handleConfirm,
    templates,
    assignmentName,
  } = props;

  const [tempContents, setTempContents] = useState<string[]>();

  useEffect(() => {
    setTempContents(templates?.map((template) => template.contents));
  }, [templates]);

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
            Include "[this test]" or "[this concept]" as mandatory placeholders
            for students to fill.
          </Text>

          {tempContents?.map((tempContent: string, index: number) => (
            <Box mt={3} key={index}>
              <Heading size="sm">
                {uppercaseFirstLetter(templates?.[index].type ?? "")} template
              </Heading>
              <Textarea
                key={index}
                value={tempContent}
                onChange={(e) => {
                  const updatedContents = [...tempContents];
                  updatedContents[index] = e.target.value;
                  setTempContents(updatedContents);
                }}
                placeholder="Fill in template here"
                mt={2}
              />
            </Box>
          ))}
        </ModalBody>
        <ModalFooter>
          <Button
            variant="ghost"
            mr={3}
            onClick={() => {
              setIsModalOpen(false);
              setTempContents(templates?.map((template) => template.contents));
            }}
          >
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            mr={3}
            onClick={() => {
              const newTemplates: Template[] = templates.map(
                (template, index) => {
                  return { ...template, contents: tempContents?.[index] };
                }
              );
              handleConfirm(newTemplates);
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
