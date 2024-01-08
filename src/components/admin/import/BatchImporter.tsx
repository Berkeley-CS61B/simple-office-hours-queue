import {Importer, ImporterField} from "react-csv-importer";
import {EMAIL_REGEX} from "../../../utils/constants";
import {UserRole} from "@prisma/client";
import {ImportedUser} from "../ImportUsers";
import {useState} from "react";
import {useToast} from "@chakra-ui/react";
import 'react-csv-importer/dist/index.css';

interface BatchImporterProps {
    handleAddUsers: (users: ImportedUser[]) => Promise<void>
}

const BatchImporter = ({handleAddUsers}: BatchImporterProps) => {
    const [invalidEmails, setInvalidEmails] = useState<string[]>([]);
    const [invalidRoles, setInvalidRoles] = useState<string[]>([]);
    const toast = useToast();

    return (
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
                await handleAddUsers(users as unknown as ImportedUser[]);
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

                if (invalidRoles.length > 0) {
                    toast({
                        title: 'Invalid roles',
                        description: `Added valid users. The following roles are invalid: ${invalidRoles.join(', ')}`,
                        status: 'error',
                        isClosable: true,
                        position: 'top-right',
                    });
                }
            }}
        >
            <ImporterField name='email' label='Email'/>
            <ImporterField name='role' label='Role'/>
        </Importer>
    );
}


export default BatchImporter;