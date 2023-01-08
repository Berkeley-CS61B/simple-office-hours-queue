import { useState } from 'react';
import { InfoIcon } from '@chakra-ui/icons';
import { Flex, Radio, RadioGroup, Spinner, Stack, Text, Tooltip, useToast } from '@chakra-ui/react';
import ImportUsers from './ImportUsers';
import { ImportUsersMethodPossiblities } from '../../utils/utils';
import { trpc } from '../../utils/trpc';

/** Lets staff choose if they want to import everyone, or just staff */
const ImportUsersMethod = () => {
  const [signInMethod, setSignInMethod] = useState<string>();
  const setImportUsersMethodMutation = trpc.admin.setImportUsersMethod.useMutation();
  const context = trpc.useContext();
  const toast = useToast();

  trpc.admin.getImportUsersMethod.useQuery(undefined, {
    refetchOnWindowFocus: false,
    onSuccess: method => {
      if (!Object.values(ImportUsersMethodPossiblities).includes(method)) {
        console.log('oh no');
        return;
      }

      setSignInMethod(method);
    },
  });

  const handleChangeUserImportMethod = (val: string) => {
    setSignInMethod(val);
    console.log(val);
    setImportUsersMethodMutation
      .mutateAsync({
        method: val,
      })
      .catch(err => {
        toast({
          title: 'Error',
          description: err.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        context.admin.getImportUsersMethod.invalidate();
      });
  };

  if (signInMethod === undefined) {
    return <Spinner />;
  }

  return (
    <Flex direction='column'>
      <Text fontSize='xl' mb={1}>
        Sign in method
      </Text>

      <RadioGroup onChange={handleChangeUserImportMethod} value={signInMethod}>
        <Stack spacing={5} direction='row'>
          <Radio value={ImportUsersMethodPossiblities.IMPORT_STAFF_AND_STUDENTS}>Import students and staff</Radio>
          <Radio value={ImportUsersMethodPossiblities.IMPORT_STAFF}>Only import staff</Radio>
        </Stack>
      </RadioGroup>

      <Flex mt={2}>
        <Text mr={2} mb={5} fontSize='xl'>
          Import {signInMethod === ImportUsersMethodPossiblities.IMPORT_STAFF ? 'staff' : 'students and staff'}
        </Text>
        <Tooltip
          hasArrow
          label={`The CSV should have 2 columns. One for email and one for role (${
            signInMethod === ImportUsersMethodPossiblities.IMPORT_STAFF_AND_STUDENTS ? 'STUDENT OR ' : ''
          }STAFF)`}
          bg='gray.300'
          color='black'
        >
          <InfoIcon mt={2} />
        </Tooltip>
      </Flex>
      <ImportUsers />
    </Flex>
  );
};

export default ImportUsersMethod;
