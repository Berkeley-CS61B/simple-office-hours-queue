import { useState } from 'react';
import { Box, Flex, Stack, useColorModeValue, Text, useDisclosure, Divider, IconButton, Slide } from '@chakra-ui/react';
import { DarkModeToggle } from './DarkModeToggle';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { UserRole } from '@prisma/client';
import { COURSE_ID, DARK_MODE_COLOR } from '../../utils/constants';
import { trpc } from '../../utils/trpc';
import HamburgerMenu from './HamburgerMenu';
import { HamburgerIcon } from '@chakra-ui/icons';
import AvatarDropdown from './AvatarDropdown';

export const Navbar = () => {
  const { data: session } = useSession();
  const { isOpen, onToggle } = useDisclosure();
  // Start the link at /create-queue and update it if the user has a personal queue
  const [personalQueueLink, setPersonalQueueLink] = useState('/create-queue');

  trpc.queue.getCurrentUserQueue.useQuery(undefined, {
    enabled: session?.user?.role === UserRole.STAFF,
    refetchOnWindowFocus: false,
    onSuccess: queue => {
      if (queue) {
        setPersonalQueueLink(`/queue/${queue.name}`);
      }
    },
  });

  return (
    <Box bg={useColorModeValue('gray.100', DARK_MODE_COLOR)} boxShadow='0 0 2px #4a4a4a' fontSize='md'>
      <Flex pl={4} pr={4} h={16} alignItems='center' justifyContent='space-between'>
        <Flex>
          <Link href='/'>
            <Text className='hover-cursor' mt={2} fontWeight='semibold' fontSize='xl'>
              {COURSE_ID} OH
            </Text>
          </Link>
          <Divider orientation='vertical' height='50px' ml={4} />
        </Flex>

        <Flex alignItems='center' display={['none', 'none', 'flex', 'flex']}>
          <Stack direction='row' spacing={5} alignItems='center'>
            {session?.user?.role === UserRole.STAFF && (
              <Link href={personalQueueLink}>
                <Text fontWeight='semibold' className='hover-cursor'>
                  Personal Queue
                </Text>
              </Link>
            )}
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
        <IconButton
          aria-label='Open Menu'
          size='md'
          mr={2}
          icon={<HamburgerIcon />}
          onClick={onToggle}
          display={['flex', 'flex', 'none', 'none']}
        />
      </Flex>

      <Slide direction='right' in={isOpen} style={{ zIndex: 50 }}>
        <HamburgerMenu onToggle={onToggle} personalQueueLink={personalQueueLink} />
      </Slide>
    </Box>
  );
};
