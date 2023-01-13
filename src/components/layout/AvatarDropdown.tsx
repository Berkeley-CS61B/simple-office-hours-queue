import {
  Avatar,
  Box,
  Button,
  Center,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  SkeletonCircle,
  Text,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { DARK_MODE_COLOR } from '../../utils/constants';
import { uppercaseFirstLetter } from '../../utils/utils';
import NamePopoverForm from './NamePopoverForm';

const AvatarDropdown = () => {
  const { data: session, status } = useSession();
  const bgColor = useColorModeValue('white', DARK_MODE_COLOR);
  // This is defined here because the the menu overflow only happens when the popover is open
  const { onOpen: onPopoverOpen, onClose: onPopoverClose, isOpen: isPopoverOpen } = useDisclosure();

  return (
    <>
      {status === 'loading' && <SkeletonCircle />}
      {status === 'authenticated' && (
        <Box className={!isPopoverOpen ? 'first-div-overflow-hidden' : ''}>
          <Menu>
            <MenuButton as={Button} rounded={'full'} variant={'link'} cursor={'pointer'} minW={0}>
              <Avatar size={'sm'} src={session?.user?.image ?? undefined} />
            </MenuButton>
            <MenuList alignItems={'center'} backgroundColor={bgColor}>
              <br />
              <Center>
                <Avatar size={'2xl'} src={session?.user?.image ?? undefined} />
              </Center>
              <br />
              <Center>
                {session?.user?.name || session?.user?.preferredName ? (
                  <NamePopoverForm
                    name={session?.user.preferredName ?? session?.user?.name}
                    isOpen={isPopoverOpen}
                    onOpen={onPopoverOpen}
                    onClose={onPopoverClose}
                  />
                ) : (
                  <Text fontSize='xl'>{session?.user?.email}</Text>
                )}
              </Center>
              <Text
                textAlign='center'
                mt={1}
                mb={2}
                bgGradient='linear(to-l, #BD49FE, #16C6FF)'
                bgClip='text'
                fontSize='xl'
                fontWeight='extrabold'
              >
                {uppercaseFirstLetter(session.user?.role ?? '')}
              </Text>
              <MenuDivider />
              <MenuItem onClick={() => signOut()}>Sign out</MenuItem>
            </MenuList>
          </Menu>
        </Box>
      )}
      {!session && status !== 'loading' && (
        <Text className='hover-cursor' onClick={() => signIn('google')}>
          Sign in
        </Text>
      )}
    </>
  );
};

export default AvatarDropdown;
