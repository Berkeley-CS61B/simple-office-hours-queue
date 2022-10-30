import { ArrowBackIcon, ArrowForwardIcon, ArrowLeftIcon, ArrowRightIcon } from '@chakra-ui/icons';
import { Box, Button, Flex, Input } from '@chakra-ui/react';
import { Select } from 'chakra-react-select';

interface ActivityTablePaginationProps {
  setPageSize: (size: number) => void;
  gotoPage: (page: number) => void;
  previousPage: () => void;
  nextPage: () => void;
  canPreviousPage: boolean;
  pageOptions: number[];
  canNextPage: boolean;
  pageCount: number;
  pageIndex: number;
  pageSize: number;
}

const ActivityTablePagination = (props: ActivityTablePaginationProps) => {
  const {
    gotoPage,
    canPreviousPage,
    previousPage,
    canNextPage,
    nextPage,
    pageCount,
    pageOptions,
    pageIndex,
    pageSize,
    setPageSize,
  } = props;
  return (
    <Flex justifyContent='flex-end' alignItems='center' transform='translateY(30px)'>
      <Button mr={1} size='sm' onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
        <ArrowLeftIcon />
      </Button>
      <Button mr={1} size='sm' onClick={() => previousPage()} disabled={!canPreviousPage}>
        <ArrowBackIcon />
      </Button>
      <Button mr={1} size='sm' onClick={() => nextPage()} disabled={!canNextPage}>
        <ArrowForwardIcon />
      </Button>
      <Button mr={1} size='sm' onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
        <ArrowRightIcon />
      </Button>
      <Box mr={1}>
        Page{' '}
        <strong>
          {pageIndex + 1} of {pageOptions.length}
        </strong>
      </Box>
      <Box as='span'>
        | Go to page:
        <Input
          ml={1}
          mr={1}
          type='number'
          defaultValue={pageIndex + 1}
          onChange={e => {
            const page = e.target.value ? Number(e.target.value) - 1 : 0;
            gotoPage(page);
          }}
          style={{ width: '100px' }}
        />
      </Box>{' '}
      <Select
        placeholder='#'
        value={pageSize}
        options={[
          { value: 10, label: '10', id: 10 } as any, // Not sure why TS is complaining here
          { value: 20, label: '20', id: 20 } as any,
          { value: 30, label: '30', id: 30 } as any,
          { value: 40, label: '40', id: 40 } as any,
          { value: 50, label: '50', id: 50 } as any,
        ]}
        onChange={e => {
          const newPage = e as any;
          setPageSize(newPage.value);
        }}
      />
    </Flex>
  );
};

export default ActivityTablePagination;
