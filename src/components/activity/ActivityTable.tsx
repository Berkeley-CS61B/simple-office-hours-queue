import { ExternalLinkIcon } from '@chakra-ui/icons';
import { Box, Table, TableContainer, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import Link from 'next/link';
import { useMemo } from 'react';
import { useTable, usePagination } from 'react-table';
import { TicketWithNames } from '../../server/trpc/router/ticket';
import { addDurationToTickets, getActivityTableColumns } from '../../utils/utils';
import ActivityTablePagination from './ActivityTablePagination';

interface ActivityTableProps {
  userTickets: {
    createdTickets: TicketWithNames[];
    helpedTickets: TicketWithNames[];
  };
}

// TODO: Take in type (createdTickets, helpedTickets) and use that to determine which tickets to display
const ActivityTable = (props: ActivityTableProps) => {
  const columns = useMemo(() => getActivityTableColumns('Your helped tickets'), []);
  const data = useMemo(() => addDurationToTickets(props.userTickets.helpedTickets), [props.userTickets.helpedTickets]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable({ columns, data }, usePagination);

  return (
	<>
	   <ActivityTablePagination 
	   	gotoPage={gotoPage}
		canPreviousPage={canPreviousPage}
		previousPage={previousPage}
		canNextPage={canNextPage}
		nextPage={nextPage}
		pageCount={pageCount}
		pageOptions={pageOptions}
		pageIndex={pageIndex}
		pageSize={pageSize}
		setPageSize={setPageSize}
	   />
    <TableContainer>
      <Table variant='striped' {...getTableProps()}>
        <Thead>
          {headerGroups.map(headerGroup => (
            <Tr className='activity-table-header' {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <Th pl={0} {...column.getHeaderProps()}>
                  {column.render('Header')}
                </Th>
              ))}
            </Tr>
          ))}
        </Thead>
        <Tbody {...getTableBodyProps()}>
          {page.map((row, i) => {
            prepareRow(row);
            return (
              <Tr {...row.getRowProps()}>
                {row.cells.map(cell => {
                  if (cell.column.id === 'id') {
                    return (
                      <Td pl={0} {...cell.getCellProps()}>
                        <a target='_blank' href={`/ticket/${cell.value}`}>
                          <ExternalLinkIcon />
                        </a>
                      </Td>
                    );
                  }
                  return (
                    <Td pl={2} {...cell.getCellProps()}>
                      {cell.render('Cell')}
                    </Td>
                  );
                })}
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </TableContainer>
	</>
  );
};

export default ActivityTable;
