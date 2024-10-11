import { EditIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  ButtonGroup,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  Popover,
  PopoverArrow,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  Stack,
  Tooltip,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import { DARK_MODE_COLOR } from "../../utils/constants";
import { trpc } from "../../utils/trpc";

interface PronunciationPopoverFormProps {
  pronunciation: string;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

/**
 * NamePopoverForm for editing user's preferred name
 * @source https://chakra-ui.com/docs/components/popover/usage
 */
const PronunciationPopoverForm = (props: PronunciationPopoverFormProps) => {
  const { pronunciation, isOpen, onOpen, onClose } = props;
  const [preferredPronunciation, setPreferredPronunciation] =
    useState(pronunciation);
  const setPreferredPronunciationMutation =
    trpc.user.setPreferredPronunciation.useMutation();
  const toast = useToast();

  const handlePronunciationChange = async () => {
    onClose();
    await setPreferredPronunciationMutation
      .mutateAsync({ preferredPronunciation })
      .then(() => {
        toast({
          title: "Pronunciation updated.",
          status: "success",
          duration: 3000,
          isClosable: true,
          position: "top-right",
        });
      })
      .catch((err) => {
        toast({
          title: "Error updating pronunciation. Refresh and try again.",
          description: err.message,
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "top-right",
        });
        console.error(err);
      });
  };

  const handleClose = () => {
    setPreferredPronunciation(pronunciation);
    onClose();
  };

  return (
    <>
      
      <Box mr={preferredPronunciation === "" ? 0 : 3}>{preferredPronunciation === "" ? "": preferredPronunciation}</Box>
      <Popover
        isOpen={isOpen}
        onOpen={onOpen}
        onClose={handleClose}
        placement="bottom"
        closeOnBlur={false}
      >
        
        <PopoverTrigger>
          {preferredPronunciation === "" ? <Button>Add Pronunciation</Button>: <Tooltip label="Edit Pronunciation"><IconButton aria-label="edit-icon" size="sm" icon={<EditIcon />} /></Tooltip>}
          
        </PopoverTrigger>
        
        <PopoverContent
          p={5}
          backgroundColor={useColorModeValue("white", DARK_MODE_COLOR)}
        >
          <PopoverArrow />
          <PopoverCloseButton />
          <Stack spacing={4}>
            <FormControl>
              <FormLabel htmlFor="name">Preferred pronunciation </FormLabel>
              <Input
                onChange={(e) => {setPreferredPronunciation(e.target.value);}}
                value={preferredPronunciation}
              />
            </FormControl>
            <ButtonGroup display="flex" justifyContent="flex-end">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                colorScheme="whatsapp"
                onClick={handlePronunciationChange}
              >
                Save
              </Button>
            </ButtonGroup>
          </Stack>
        </PopoverContent>
      </Popover>
    </>
  );
};

export default PronunciationPopoverForm;
