import { UserRole } from '@prisma/client';
import { Importer, ImporterField } from 'react-csv-importer';
import 'react-csv-importer/dist/index.css';
import { trpc } from '../../utils/trpc';

interface ImportedUser {
  email: string;
  role: UserRole;
}

const EMAIL_REGEX =/^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

const ImportUsers = () => {
  const addUserMutation = trpc.user.addUsers.useMutation();

  const handleAddUsers = async () => {};

  return (
    <Importer
      chunkSize={10000}
      assumeNoHeaders={false}
      restartable
      processChunk={async rows => {
        const users = rows.filter(user => {
          const userRole = user.role as string;
          const userEmail = user.email as string;

          // Check if userEmail is valid email
		  if (!userEmail.match(EMAIL_REGEX)) {
			console.log('Invalid email ' + userEmail);
			return false;
		  }

          // Check if user role is valid, meaning it's in the UserRole enum
          if (!Object.values(UserRole).includes(userRole.toUpperCase() as UserRole)) {
            console.log(
              'Invalid user role',
              userRole + ' for user ' + userEmail + '. User role must be one of ' + Object.values(UserRole),
            );
			return false;
          }
        });
		
		console.log('Adding users', users);
      }}
      onComplete={() => {
        console.log('Success!');
      }}
    >
      <ImporterField name='email' label='Email' />
      <ImporterField name='role' label='Role' />
    </Importer>
  );
};

export default ImportUsers;
