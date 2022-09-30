import type { Ticket } from "@prisma/client";
import TicketCard from "./TicketCard";

interface TicketListProps {
  tickets: Ticket[];
}

const TicketList = (props: TicketListProps) => {
  const { tickets } = props;
  return (
    <>
      {tickets.map((ticket) => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </>
  );
};

export default TicketList;
