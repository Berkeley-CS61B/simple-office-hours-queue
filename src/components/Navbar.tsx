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
  Image,
} from "@chakra-ui/react";
import { DarkModeToggle } from "./DarkModeToggle";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";

const AvatarDropdown = () => {
  const { data: session, status } = useSession();
  return (
    <>
      {status === "loading" && <SkeletonCircle />}
      {status === "authenticated" && (
        <Menu>
          <MenuButton
            as={Button}
            rounded={"full"}
            variant={"link"}
            cursor={"pointer"}
            minW={0}
          >
            <Avatar size={"sm"} src={session?.user?.image ?? undefined} />
          </MenuButton>
          <MenuList alignItems={"center"}>
            <br />
            <Center>
              <Avatar size={"2xl"} src={session?.user?.image ?? undefined} />
            </Center>
            <br />
            <Center>
              <Text>{session.user?.name}</Text>
            </Center>
            <br />
            <MenuDivider />
            <MenuItem onClick={() => signOut()}>Sign out</MenuItem>
          </MenuList>
        </Menu>
      )}
      {!session && status !== "loading" && (
        <Button border="1px" onClick={() => signIn("google")}>
          Sign in
        </Button>
      )}
    </>
  );
};

export const Navbar = () => {
  return (
    <Box bg={useColorModeValue("gray.100", "gray.900")}>
      <Flex
        pl={10}
        pr={10}
        h={16}
        alignItems="center"
        justifyContent="space-between"
      >
        <Link href="/">
          <Text className='hover-cursor' fontWeight="semibold" fontSize="2xl">
            61B OH
          </Text>
        </Link>

        <Flex alignItems="center">
          <Stack direction="row" spacing={5}>
            <DarkModeToggle />
            <AvatarDropdown />
          </Stack>
        </Flex>
      </Flex>
    </Box>
  );
};
