import { useState } from 'react';
import { Button, Flex, Input, Radio, RadioGroup, Spinner, Stack, Text, useToast } from '@chakra-ui/react';
import ImportUsers from './ImportUsers';
import {
  ImportUsersMethodPossiblities,
  ImportUsersMethodPossiblitiesType,
  sanitizeEmailDomain,
} from '../../utils/utils';
import { trpc } from '../../utils/trpc';
import { EMAIL_DOMAIN_REGEX_OR_EMPTY } from '../../utils/constants';

/** Lets staff choose if they want to import everyone, or just staff */
const ImportUsersMethod = () => {
  const [signInMethod, setSignInMethod] = useState<ImportUsersMethodPossiblitiesType | undefined>();
  const [emailDomain, setEmailDomain] = useState<string>('');
  const isValidDomain = EMAIL_DOMAIN_REGEX_OR_EMPTY.test(emailDomain);

  const setImportUsersMethodMutation = trpc.admin.setImportUsersMethod.useMutation();
  const setEmailDomainMutation = trpc.admin.setEmailDomain.useMutation();
  const isImportStaffAndStudents = signInMethod === ImportUsersMethodPossiblities.IMPORT_STAFF_AND_STUDENTS;
  const context = trpc.useContext();
  const toast = useToast();

  trpc.admin.getEmailDomain.useQuery(undefined, {
    refetchOnWindowFocus: false,
    onSuccess: domain => {
      setEmailDomain(domain);
    },
  });

  trpc.admin.getImportUsersMethod.useQuery(undefined, {
    refetchOnWindowFocus: false,
    onSuccess: method => {
      setSignInMethod(method);
    },
    onError: err => {
      toast({
        title: 'Error',
        description: err.message,
        status: 'error',
        duration: 5000,
        position: 'top-right',
        isClosable: true,
      });
    },
  });

  const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailDomain(sanitizeEmailDomain(e.target.value));
  };

  const handleDomainSubmit = () => {
    if (!isValidDomain) {
      toast({
        title: 'Error',
        description: 'Invalid email domain',
        status: 'error',
        duration: 5000,
        position: 'top-right',
        isClosable: true,
      });
      return;
    }

    setEmailDomainMutation
      .mutateAsync({ domain: emailDomain })
      .then(() => {
        toast({
          title: 'Success',
          description: 'Email domain updated',
          status: 'success',
          duration: 5000,
          position: 'top-right',
          isClosable: true,
        });
      })
      .catch(err => {
        toast({
          title: 'Error',
          description: err.message,
          status: 'error',
          duration: 5000,
          position: 'top-right',
          isClosable: true,
        });
      });
  };

  const handleChangeUserImportMethod = (val: ImportUsersMethodPossiblitiesType) => {
    setSignInMethod(val);
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
          position: 'top-right',
          isClosable: true,
        });
        context.admin.getImportUsersMethod.invalidate();
      });
  };

  if (signInMethod === undefined) {
    return <Spinner />;
  }

  return (
    <Flex direction='column' mt={2}>
      <Text fontSize='xl' mb={1}>
        Sign in method
      </Text>

      <RadioGroup onChange={handleChangeUserImportMethod} value={signInMethod}>
        <Stack spacing={5} direction='row'>
          <Radio value={ImportUsersMethodPossiblities.IMPORT_STAFF_AND_STUDENTS}>Import staff and students</Radio>
          <Radio value={ImportUsersMethodPossiblities.IMPORT_STAFF}>Only import staff</Radio>
        </Stack>
      </RadioGroup>

      <Flex mb={3} mt={3} flexDirection='column' hidden={isImportStaffAndStudents}>
        <Text mb={1}>Only allow students from from email domain (Leave blank for all domains)</Text>
        <Input placeholder='@berkeley.edu' value={emailDomain} onChange={handleDomainChange} maxLength={25} />
        <Button mt={2} colorScheme='telegram' onClick={handleDomainSubmit} disabled={!isValidDomain}>
          Confirm
        </Button>
      </Flex>

      <Flex mt={2}>
        <Text>
          The CSV should have 2 columns. One for email and one for role ({isImportStaffAndStudents ? 'STUDENT OR ' : ''}
          STAFF)
        </Text>
      </Flex>

      <Text mb={2} fontSize='sm' hidden={isImportStaffAndStudents}>
        Please still specify STAFF role when importing staff members.
      </Text>
      <ImportUsers />
    </Flex>
  );
};

export default ImportUsersMethod;
