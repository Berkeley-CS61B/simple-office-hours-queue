import {
  Box,
  Flex,
  Avatar,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Stack,
  Center,
  useColorModeValue,
  Text,
  SkeletonCircle,
} from '@chakra-ui/react';
import { DarkModeToggle } from './DarkModeToggle';
import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { UserRole } from '@prisma/client';
import NamePopoverForm from './NamePopoverForm';
import { DARK_MODE_COLOR } from '../../utils/constants';

const AvatarDropdown = () => {
  const { data: session, status } = useSession();
  const bgColor = useColorModeValue('white', DARK_MODE_COLOR);

  return (
    <>
      {status === 'loading' && <SkeletonCircle />}
      {status === 'authenticated' && (
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
                <NamePopoverForm name={session?.user.preferredName ?? session?.user?.name} />
              ) : (
                <Text fontSize='xl'>{session?.user?.email}</Text>
              )}
            </Center>
            <br />
            <MenuDivider />
            <MenuItem onClick={() => signOut()}>Sign out</MenuItem>
          </MenuList>
        </Menu>
      )}
      {!session && status !== 'loading' && (
        <Button border='1px' onClick={() => signIn('google')}>
          Sign in
        </Button>
      )}
    </>
  );
};

export const Navbar = () => {
  const { data: session } = useSession();

  return (
    <Box bg={useColorModeValue('gray.100', '')} boxShadow='0 0 2px #4a4a4a'>
      <Flex pl={4} pr={4} h={16} alignItems='center' justifyContent='space-between'>
        <Link href='/'>
          <Text className='hover-cursor' fontWeight='semibold' fontSize='2xl'>
            61B OH
          </Text>
        </Link>

        <Flex alignItems='center'>
          <Stack direction='row' spacing={5} alignItems='center'>
            {session?.user && (
              <Link href='/activity'>
                <Text fontWeight='semibold' className='hover-cursor'>
                  Activity
                </Text>
              </Link>
            )}
            {session?.user?.role === UserRole.STAFF && (
              <Link href='/admin'>
                <Text fontWeight='semibold' className='hover-cursor'>
                  Admin
                </Text>
              </Link>
            )}
            <DarkModeToggle />
            <AvatarDropdown />
          </Stack>
        </Flex>
      </Flex>
    </Box>
  );
};
