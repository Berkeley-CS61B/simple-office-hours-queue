import { Button, Flex, FormControl, Input, useToast } from "@chakra-ui/react";
import { UserRole } from "@prisma/client";
import { Select, SingleValue } from "chakra-react-select";
import { useState } from "react";
import { EMAIL_REGEX } from "../../../utils/constants";
import { ImportedUser } from "../ImportUsers";

interface SingleImporterProps {
  handleAddUsers: (users: ImportedUser[]) => Promise<void>;
}

const SingleImporter = ({ handleAddUsers }: SingleImporterProps) => {
  const [email, setEmail] = useState<string>("");
  const [role, setRole] = useState<UserRole | undefined | string>();
  const toast = useToast();

  const handleAddUser = async () => {
    if (!email.match(EMAIL_REGEX)) {
      toast({
        title: "Incorrect email",
        description: `Please input a correct email. ${email} is not correct`,
        status: "error",
        isClosable: true,
        position: "top-right",
      });
      return;
    }
    if (role === undefined || role === "") {
      toast({
        title: "Missing role",
        description: "Please select a role",
        status: "error",
        isClosable: true,
        position: "top-right",
      });
      return;
    }
    const user: ImportedUser = { email: email, role: role as UserRole };
    await handleAddUsers([user])
      .then(() =>
        toast({
          title: "User added",
          description: `${email} added with role ${role}`,
          status: "success",
          isClosable: true,
          position: "top-right",
        }),
      )
      .catch(() =>
        toast({
          title: "Error adding user",
          description: `${email} error adding with role ${role}`,
          status: "error",
          isClosable: true,
          position: "top-right",
        }),
      );

    setEmail("");
  };

  const userRoles = Object.values(UserRole).map((role: UserRole) => ({
    label: role,
    value: role,
  }));

  return (
    <Flex direction="row">
      <Input
        mr={1}
        placeholder="Input email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <FormControl width="20%" mr={1}>
        <Select
          placeholder="Role"
          options={userRoles}
          onChange={(val: SingleValue<{ label: UserRole; value: UserRole }>) =>
            setRole(val?.value)
          }
        />
      </FormControl>
      <Button colorScheme="telegram" onClick={handleAddUser}>
        Import
      </Button>
    </Flex>
  );
};

export default SingleImporter;
