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
  useColorModeValue,
  useToast,
  Tooltip,
  Flex,
  Text,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { DARK_MODE_COLOR } from "../../utils/constants";
import { trpc } from "../../utils/trpc";

interface NameAndPronunciationPopoverFormPropos {
  name: string;
  pronunciation: string;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  setName: (str: string) => void;
  setPronunciation: (str: string) => void;
}

/**
 * NamePopoverForm for editing user's preferred name
 * @source https://chakra-ui.com/docs/components/popover/usage
 */
const NameAndPronunciationPopoverForm = (
  props: NameAndPronunciationPopoverFormPropos
) => {
  const {
    name,
    pronunciation,
    setName,
    setPronunciation,
    isOpen,
    onOpen,
    onClose,
  } = props;
  const [preferredName, setPreferredName] = useState(name);
  const setPreferredNameMutation = trpc.user.setPreferredName.useMutation();

  const [preferredPronunciation, setPreferredPronunciation] =
    useState(pronunciation);
  const setPreferredPronunciationMutation =
    trpc.user.setPreferredPronunciation.useMutation();
  const toast = useToast();

  useEffect(() => {
    setPreferredName(name);
  }, [name]);

  useEffect(() => {
    setPreferredPronunciation(pronunciation);
  }, [pronunciation]);

  const handleNameAndPronunciationChange = async () => {
    setName(preferredName);
    setPronunciation(preferredPronunciation);

    let nameSuccessful = false;
    let pronunciationSuccessful = false;
    await setPreferredNameMutation
      .mutateAsync({ preferredName })
      .then(() => {
        nameSuccessful = true;
      })
      .catch((err) => {
        toast({
          title: "Error updating name. Refresh and try again.",
          description: err.message,
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "top-right",
        });
        console.error(err);
      });

    await setPreferredPronunciationMutation
      .mutateAsync({ preferredPronunciation })
      .then(() => {
        pronunciationSuccessful = true;
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

    if (nameSuccessful || pronunciationSuccessful) {
        const message = nameSuccessful && pronunciationSuccessful ? "Name and pronunciation updated." : (nameSuccessful ? "Name updated." : "Pronunciation updated.")
        toast({
            title: message,
            status: "success",
            duration: 3000,
            isClosable: true,
            position: "top-right",
          });
    }
  };

  const handlePronunciationChange = async () => {
    setPronunciation(preferredPronunciation);
  };

  const handleCancel = () => {
    // restore to original
    setPreferredName(name);
    setPreferredPronunciation(pronunciation);
    onClose();
  };

  const handleSave = () => {
    handleNameAndPronunciationChange();
    onClose();
  };

  return (
    <>
      <Flex direction="column">
        <Box mr={3}>{name}</Box>
        <Box mr={3}>
          <Text as="i">{pronunciation}</Text>
        </Box>
      </Flex>

      <Popover
        isOpen={isOpen}
        onOpen={onOpen}
        onClose={handleCancel}
        placement="bottom"
        closeOnBlur={false}
      >
        <Tooltip label="Edit preferred name or pronunciation">
          <Box>
            <PopoverTrigger>
              <IconButton
                aria-label="edit-icon"
                size="sm"
                icon={<EditIcon />}
              />
            </PopoverTrigger>
          </Box>
        </Tooltip>
        <PopoverContent
          p={5}
          backgroundColor={useColorModeValue("white", DARK_MODE_COLOR)}
        >
          <PopoverArrow />
          <PopoverCloseButton />
          <Stack spacing={4}>
            <FormControl>
              <FormLabel htmlFor="name">Preferred name</FormLabel>
              <Input
                onChange={(e) => setPreferredName(e.target.value)}
                value={preferredName}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="pronunciation">
                Preferred pronunciation
              </FormLabel>
              <Input
                onChange={(e) => setPreferredPronunciation(e.target.value)}
                value={preferredPronunciation}
                placeholder={"Phonetic pronunciation"}
              />
            </FormControl>
            <ButtonGroup display="flex" justifyContent="flex-end">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                // isDisabled={preferredName.trim().length <= 0}
                colorScheme="whatsapp"
                onClick={handleSave}
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

export default NameAndPronunciationPopoverForm;
