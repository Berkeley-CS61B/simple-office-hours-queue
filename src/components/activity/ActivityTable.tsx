import { ExternalLinkIcon, TriangleDownIcon, TriangleUpIcon } from '@chakra-ui/icons';
import { Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react';
import { useMemo } from 'react';
import { useTable, usePagination, useSortBy } from 'react-table';
import { TicketWithNames } from '../../server/trpc/router/ticket';
import { addDurationToTickets, getActivityTableColumns } from '../../utils/utils';
import ActivityTablePagination from './ActivityTablePagination';

interface ActivityTableProps {
  tickets: TicketWithNames[];
  title: string;
  shouldShowCreatedBy: boolean;
}

/**
 * Table that displays a list of tickets. This will either be tickets that the user has
 * helped or tickets that the user has created.
 */
const ActivityTable = (props: ActivityTableProps) => {
  const { tickets, title, shouldShowCreatedBy } = props;
  const columns = useMemo(() => getActivityTableColumns(title, shouldShowCreatedBy), []);
  const data = useMemo(() => addDurationToTickets(tickets), [tickets]);

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
  } = useTable({ columns, data }, useSortBy, usePagination);

  if (tickets.length === 0) {
    return <Text mt={4}>No tickets found!</Text>;
  }

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
                  <Th pl={0} {...column.getHeaderProps(column.getSortByToggleProps())}>
                    {column.render('Header')}
                    <>
                      {column.isSorted ? (
                        column.isSortedDesc ? (
                          <TriangleDownIcon ml={1} mb={0.5} />
                        ) : (
                          <TriangleUpIcon ml={1} mb={0.5} />
                        )
                      ) : (
                        ''
                      )}
                    </>
                  </Th>
                ))}
              </Tr>
            ))}
          </Thead>
		  
          <Tbody {...getTableBodyProps()}>
            {page.map(row => {
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
                    if (cell.column.id === 'createdAt') {
                      return (
                        <Td pl={0} {...cell.getCellProps()}>
                          {new Date(cell.value).toLocaleString()}
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
