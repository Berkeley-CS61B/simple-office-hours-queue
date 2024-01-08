import {useState} from "react";
import {UserRole} from "@prisma/client";
import {Button, Flex, Input, Select, useToast} from "@chakra-ui/react";
import {EMAIL_REGEX} from "../../../utils/constants";
import {ImportedUser} from "../ImportUsers";

interface SingleImporterProps {
    handleAddUsers: (users: ImportedUser[]) => Promise<void>
}

const SingleImporter = ({handleAddUsers}: SingleImporterProps) => {
    const [email, setEmail] = useState<string>('');
    const [role, setRole] = useState<UserRole | undefined | string>();
    const toast = useToast();

    const handleAddUser = async () => {
        if (!email.match(EMAIL_REGEX)) {
            toast({
                title: 'Incorrect email',
                description: `Please input a correct email. ${email} is not correct`,
                status: 'error',
                isClosable: true,
                position: 'top-right',
            });
            return;
        } else if ((role === undefined) || (role === '')) {
            toast({
                title: 'Missing role',
                description: 'Please select a role',
                status: 'error',
                isClosable: true,
                position: 'top-right',
            });
            return;
        } else {
            const user: ImportedUser = {email: email, role: role as UserRole}
            await handleAddUsers([user]);
            toast({
                title: 'User added',
                description: `${email} added with role ${role}`,
                status: 'success',
                isClosable: true,
                position: 'top-right',
            });
        }

    }

    return (
        <Flex direction='row'>
            <Input placeholder='Input email' value={email} onChange={e => setEmail(e.target.value)}/>
            <Select placeholder='Select role' value={role} onChange={e => setRole(e.target.value)}>
                <option value={UserRole.STUDENT}>
                    STUDENT
                </option>
                <option value={UserRole.STAFF}>
                    STAFF
                </option>
                <option value={UserRole.INTERN}>
                    INTERN
                </option>
            </Select>
            <Button onClick={handleAddUser}>Import</Button>
        </Flex>
    );
}

export default SingleImporter;