import {Input, Radio, RadioGroup, Stack, Text, Select, useToast, Flex, Button} from '@chakra-ui/react';
import {SiteSettingsValues, UserRole} from '@prisma/client';
import {BaseSyntheticEvent, useState} from 'react';
import {Importer, ImporterField} from 'react-csv-importer';
import 'react-csv-importer/dist/index.css';
import {trpc} from '../../utils/trpc';
import {EMAIL_REGEX} from '../../utils/constants';
import {
    ImportNumberPossibilities, ImportNumberPossibilitiesType,
    ImportUsersMethodPossiblities,
    ImportUsersMethodPossiblitiesType
} from "../../utils/utils";
import AvatarDropdown from "../layout/AvatarDropdown";

interface ImportedUser {
    email: string;
    role: UserRole;
}

const ImportUsers = () => {
    const [invalidEmails, setInvalidEmails] = useState<string[]>([]);
    const [invlidRoles, setInvalidRoles] = useState<string[]>([]);
    const [importType, setImportType] = useState<ImportNumberPossibilitiesType | undefined>();
    const addUserMutation = trpc.user.addUsers.useMutation();
    const toast = useToast();
    const [singleImportEmail, setSingleImportEmail] = useState<string>('');
    const [singleImportRole, setSingleImportRole] = useState<UserRole | undefined | string>();

    const handleAddUsers = async (users: ImportedUser[]) => {
        console.log(users);
        await addUserMutation.mutateAsync(users);
    };

    const handleAddSingleUser = async () => {
        console.log('adding single user');
        console.log(singleImportRole);

        if (!singleImportEmail.match(EMAIL_REGEX)) {
            console.log('incorrect email!');
            toast({
                title: 'Incorrect email',
                description: `Please input a correct email. ${singleImportEmail} is not correct`,
                status: 'error',
                isClosable: true,
                position: 'top-right',
            });
            return;
        }
        else if ((singleImportRole === undefined) || (singleImportRole === '')){
            console.log('missing role');
            toast({
                title: 'Missing role',
                description: 'Please select a role',
                status: 'error',
                isClosable: true,
                position: 'top-right',
            });
            return;
        }
        else {
            const user: ImportedUser = {email: singleImportEmail, role: singleImportRole as UserRole}
            console.log('User');
            console.log(user);
            await handleAddUsers([user]);
            await handleAddUsers([user]);
            toast({
                title: 'User added',
                description: `${singleImportEmail} added with role ${singleImportRole}`,
                status: 'error',
                isClosable: true,
                position: 'top-right',
            });
        }

    }

    const handleChangeUserImportMethod = (val: ImportNumberPossibilitiesType) => {
        setImportType(val);
    };

    // TODO: set type
    const handleSingleImportRoleChange = (event: BaseSyntheticEvent) => {
        setSingleImportRole(event.target.value);
    }

    return (
        <>
            <Text fontSize='xl' mb={1}>
                Import method
            </Text>
            <RadioGroup onChange={handleChangeUserImportMethod} value={importType}>
                <Stack spacing={5} direction='row'>
                    <Radio value={ImportNumberPossibilities.SINGLE_IMPORT}>
                        Single import
                    </Radio>
                    <Radio value={ImportNumberPossibilities.BATCH_IMPORT}>Batch import</Radio>
                </Stack>
            </RadioGroup>
            {importType === ImportNumberPossibilities.SINGLE_IMPORT ?

                    <Flex direction='row'>
                    <Input placeholder='Email here' value={singleImportEmail} onChange={e => setSingleImportEmail(e.target.value)}/>
                    <Select placeholder='Select role' value={singleImportRole} onChange={handleSingleImportRoleChange}>
                        <option value={UserRole.STUDENT}> Student
                        </option>
                        <option value={UserRole.STAFF}> Staff
                        </option>
                        <option value={UserRole.INTERN}> Intern
                        </option>
                    </Select>
                        <Button onClick={handleAddSingleUser}>Import</Button>
                    </Flex>


                :


                <Importer
                //   chunkSize={10000}
                assumeNoHeaders={false}
                restartable
                processChunk={async rows => {
                    const users = rows.filter(user => {
                        const userRole = user.role as string;
                        const userEmail = user.email as string;

                        // Check if userEmail is valid email
                        if (!userEmail.match(EMAIL_REGEX)) {
                            setInvalidEmails(prev => [...prev, userEmail]);
                            return false;
                        }

                        // Check if user role is valid, meaning it's in the UserRole enum
                        if (!Object.values(UserRole).includes(userRole.toUpperCase() as UserRole)) {
                            setInvalidRoles(prev => [...prev, userRole]);
                            return false;
                        }

                        return true;
                    });

                    handleAddUsers(users as unknown as ImportedUser[]);
                }}
                onComplete={() => {
                    if (invalidEmails.length > 0) {
                        toast({
                            title: 'Invalid emails',
                            description: `Added valid users. The following emails are invalid: ${invalidEmails.join(', ')}`,
                            status: 'error',
                            isClosable: true,
                            position: 'top-right',
                        });
                    }

                    if (invlidRoles.length > 0) {
                        toast({
                            title: 'Invalid roles',
                            description: `Added valid usres. The following roles are invalid: ${invlidRoles.join(', ')}`,
                            status: 'error',
                            isClosable: true,
                            position: 'top-right',
                        });
                    }
                }}
            >
                <ImporterField name='email' label='Email'/>
                <ImporterField name='role' label='Role'/>
            </Importer>}

        </>
    );
};

export default ImportUsers;
