import { Ticket, TicketStatus, UserRole } from '@prisma/client'
import TicketCard from './TicketCard'
import { Text, Button, Flex, Box, Tag } from '@chakra-ui/react'
import { uppercaseFirstLetter } from '../utils'
import { useEffect, useState } from 'react'
import { trpc } from '../utils/trpc'

interface TicketListProps {
  tickets: Ticket[]
  ticketStatus: TicketStatus
  userRole: UserRole
}

interface GroupedTicket {
  [key: string]: Ticket[]
}

const TicketList = (props: TicketListProps) => {
  const [isGrouped, setIsGrouped] = useState(false)
  const [groupedTickets, setGroupedTickets] = useState<GroupedTicket>({})
  const { tickets, ticketStatus, userRole } = props
  const approveTicketsMutation = trpc.useMutation('ticket.approveTickets')

  const handleApproveTickets = async (tickets: Ticket[]) => {
    await approveTicketsMutation.mutateAsync({
      ticketIds: tickets.map(ticket => ticket.id),
    })
  }

  const GroupedView = () => {
    return (
      <Flex flexDirection='column'>
        {Object.keys(groupedTickets).map(assignment => (
          <Box key={assignment}>
            <Tag p={2.5} size='lg' mb={3} colorScheme='blue' borderRadius={5}>
              {assignment}
            </Tag>
            <Box>
              {groupedTickets[assignment]!.map((ticket: Ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} userRole={userRole} />
              ))}
            </Box>
          </Box>
        ))}
      </Flex>
    )
  }

  const handleGroupTickets = () => {
    setIsGrouped(!isGrouped)
  }

  useEffect(() => {
    if (isGrouped) {
      const groupedTickets = tickets.reduce((acc: any, ticket) => {
        const key = ticket.assignment
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(ticket)
        return acc
      }, {})
      setGroupedTickets(groupedTickets)
    }
  }, [isGrouped, tickets])

  return (
    <Flex flexDir='column'>
      {tickets.length === 0 ? (
        <Text>No {uppercaseFirstLetter(ticketStatus)} Tickets!</Text>
      ) : (
        <>
          <Button onClick={handleGroupTickets} mb={4} alignSelf='flex-end'>
            Group By Assignment
          </Button>
          {ticketStatus === TicketStatus.PENDING && userRole === UserRole.STAFF && (
            <Button mb={4} alignSelf='flex-end' onClick={() => handleApproveTickets(tickets)}>
              Approve All
            </Button>
          )}
          {isGrouped ? (
            <GroupedView />
          ) : (
            <>
              {tickets.map(ticket => (
                <TicketCard key={ticket.id} ticket={ticket} userRole={userRole} />
              ))}
            </>
          )}
        </>
      )}
    </Flex>
  )
}

export default TicketList
