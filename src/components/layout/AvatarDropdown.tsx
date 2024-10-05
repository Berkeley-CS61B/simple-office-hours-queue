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
} from "@chakra-ui/react";
import { signIn, signOut, useSession } from "next-auth/react";
import { DARK_MODE_COLOR } from "../../utils/constants";
import { uppercaseFirstLetter } from "../../utils/utils";
import NamePopoverForm from "./NamePopoverForm";
import PronunciationPopoverForm from "./PronunciationPopoverForm";
import { useEffect } from "react"


const AvatarDropdown = () => {
  const { data: session, status } = useSession();

  const bgColor = useColorModeValue("white", DARK_MODE_COLOR);
  // This is defined here because the the menu overflow only happens when the popover is open
  const {
    onOpen: onNamePopoverOpen,
    onClose: onNamePopoverClose,
    isOpen: isNamePopoverOpen,
  } = useDisclosure();
  const {
    onOpen: onPronunciationPopoverOpen,
    onClose: onPronunciationPopoverClose,
    isOpen: isPronunciationPopoverOpen,
  } = useDisclosure();

  useEffect(() => {
    console.log(session?.user);
  }, [session]);

  return (
    <Box mt={2}>
      {status === "loading" && <SkeletonCircle />}
      {status === "authenticated" && (
        <Box className={!isNamePopoverOpen && !isPronunciationPopoverOpen ? "first-div-overflow-hidden" : ""}>
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
            <MenuList alignItems={"center"} backgroundColor={bgColor}>
              <br />
              <Center>
                <Avatar size={"2xl"} src={session?.user?.image ?? undefined} />
              </Center>
              <br />
              <Center>
                {session?.user?.name || session?.user?.preferredName ? (
                  <NamePopoverForm
                    name={session?.user.preferredName ?? session?.user?.name}
                    isOpen={isNamePopoverOpen}
                    onOpen={() => {onPronunciationPopoverClose(); onNamePopoverOpen();}}
                    onClose={onNamePopoverClose}
                  />
                ) : (
                  <Text fontSize="xl">{session?.user?.email}</Text>
                )}
              </Center>
              <Center mt={2}>
                <PronunciationPopoverForm
                  pronunciation={session?.user?.preferredPronunciation ?? ""}
                  isOpen={isPronunciationPopoverOpen}
                  onOpen={() => {onNamePopoverClose(); onPronunciationPopoverOpen();}}
                  onClose={onPronunciationPopoverClose}
                />
              </Center>
              <Text
                textAlign="center"
                mt={1}
                mb={2}
                bgGradient="linear(to-l, #BD49FE, #16C6FF)"
                bgClip="text"
                fontSize="xl"
                fontWeight="extrabold"
              >
                {uppercaseFirstLetter(session.user?.role ?? "")}
              </Text>
              <MenuDivider />
              <MenuItem onClick={() => signOut()}>Sign out</MenuItem>
            </MenuList>
          </Menu>
        </Box>
      )}
      {!session && status !== "loading" && (
        <Text className="hover-cursor" onClick={() => signIn("google")}>
          Sign in
        </Text>
      )}
    </Box>
  );
};

export default AvatarDropdown;
