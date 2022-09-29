import { useColorMode, IconButton } from "@chakra-ui/react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";

export const DarkModeToggle = () => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <IconButton
      aria-label="Toggle dark mode"
      onClick={toggleColorMode}
      icon={colorMode === "dark" ? <SunIcon /> : <MoonIcon />}
    />
  );
};
