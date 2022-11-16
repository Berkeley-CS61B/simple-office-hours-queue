import { EditIcon } from '@chakra-ui/icons';
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
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import React, { useState } from 'react';
import { trpc } from '../../utils/trpc';

interface NamePopoverFormProps {
  name: string;
}

/**
 * NamePopoverForm for editing user's preferred name
 * @source https://chakra-ui.com/docs/components/popover/usage
 */
const NamePopoverForm = (props: NamePopoverFormProps) => {
  const { name } = props;
  const [preferredName, setPreferredName] = useState(name);
  const { onOpen, onClose, isOpen } = useDisclosure();
  const setPreferredNameMutation = trpc.user.setPreferredName.useMutation();
  const toast = useToast();

  const handleNameChange = async () => {
    onClose();
    await setPreferredNameMutation
      .mutateAsync({ preferredName })
      .then(() => {
        toast({
          title: 'Name updated.',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top-right',
        });
      })
      .catch(err => {
        toast({
          title: 'Error updating name. Refresh and try again.',
          description: err.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
          position: 'top-right',
        });
        console.error(err);
      });
  };

  const handleClose = () => {
    setPreferredName(name);
    onClose();
  };

  return (
    <>
      <Box display='inline-block' mr={3}>
        {preferredName}
      </Box>
      <Popover isOpen={isOpen} onOpen={onOpen} onClose={onClose} placement='bottom' closeOnBlur={false}>
        <PopoverTrigger>
          <IconButton aria-label='edit-icon' size='sm' icon={<EditIcon />} />
        </PopoverTrigger>
        <PopoverContent p={5}>
          <PopoverArrow />
          <PopoverCloseButton />
          <Stack spacing={4}>
            <FormControl>
              <FormLabel htmlFor='name'>Preferred name</FormLabel>
              <Input onChange={e => setPreferredName(e.target.value)} value={preferredName} />
            </FormControl>
            <ButtonGroup display='flex' justifyContent='flex-end'>
              <Button variant='outline' onClick={handleClose}>
                Cancel
              </Button>
              <Button isDisabled={preferredName.length <= 0} colorScheme='whatsapp' onClick={handleNameChange}>
                Save
              </Button>
            </ButtonGroup>
          </Stack>
        </PopoverContent>
      </Popover>
    </>
  );
};

export default NamePopoverForm;
