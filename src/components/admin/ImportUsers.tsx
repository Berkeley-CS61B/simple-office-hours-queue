import { useToast } from '@chakra-ui/react';
import { UserRole } from '@prisma/client';
import { useState } from 'react';
import { Importer, ImporterField } from 'react-csv-importer';
import 'react-csv-importer/dist/index.css';
import { trpc } from '../../utils/trpc';
import { EMAIL_REGEX } from '../../utils/constants';

interface ImportedUser {
  email: string;
  role: UserRole;
}

const ImportUsers = () => {
  const [invalidEmails, setInvalidEmails] = useState<string[]>([]);
  const [invlidRoles, setInvalidRoles] = useState<string[]>([]);
  const addUserMutation = trpc.user.addUsers.useMutation();
  const toast = useToast();

  const handleAddUsers = async (users: ImportedUser[]) => {
    await addUserMutation.mutateAsync(users);
  };

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

        handleAddUsers(users as unknown as ImportedUser[]);
      }}
      onComplete={() => {
        if (invalidEmails.length > 0) {
          toast({
            title: 'Invalid emails',
            description: `Added valid users. The following emails are invalid: ${invalidEmails.join(', ')}`,
            status: 'error',
            isClosable: true,
          });
        }

        if (invlidRoles.length > 0) {
          toast({
            title: 'Invalid roles',
            description: `Added valid usres. The following roles are invalid: ${invlidRoles.join(', ')}`,
            status: 'error',
            isClosable: true,
          });
        }
      }}
    >
      <ImporterField name='email' label='Email' />
      <ImporterField name='role' label='Role' />
    </Importer>
  );
};

export default ImportUsers;
