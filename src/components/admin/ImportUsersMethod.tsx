import { useState } from 'react';
import { InfoIcon } from '@chakra-ui/icons';
import { Flex, Radio, RadioGroup, Spinner, Stack, Text, Tooltip } from '@chakra-ui/react';
import ImportUsers from './ImportUsers';
import { ImportUsersMethodPossiblities } from '../../utils/utils';
import { trpc } from '../../utils/trpc';

/** Lets staff choose if they want to import everyone, or just staff */
const ImportUsersMethod = () => {
  const [signInMethod, setSignInMethod] = useState<typeof ImportUsersMethodPossiblities>();

  trpc.admin.getImportUsersMethod.useQuery(undefined, {
    refetchOnWindowFocus: false,
    onSuccess: method => {
      console.log('data', method);
    //   setSignInMethod(method);
    },
  });

  if (signInMethod === undefined) {
    return <Spinner />;
  }

  return (
    <Flex direction='column'>
      <Text fontSize='xl' mb={1}>
        Sign in method
      </Text>

      {/* <RadioGroup onChange={setSignInMethod} value={signInMethod}>
        <Stack spacing={5} direction='row'>
          <Radio value={ImportUsersMethodPossiblities.IMPORT_STAFF_AND_STUDENTS}>Import students and staff</Radio>
          <Radio value={ImportUsersMethodPossiblities.IMPORT_STAFF}>Only import staff</Radio>
        </Stack>
      </RadioGroup> */}

      <Flex mt={2}>
        <Text mr={2} mb={5} fontSize='xl'>
          Import Users
        </Text>
        <Tooltip
          hasArrow
          label='The CSV should have 2 columns. One for email and one for role (STUDENT or STAFF)'
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
