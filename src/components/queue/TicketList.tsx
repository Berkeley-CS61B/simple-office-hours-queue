import { Box, Button, Flex, Text } from "@chakra-ui/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { TicketStatus, UserRole } from "@prisma/client";
import { Select, SingleValue } from "chakra-react-select";
import Head from "next/head";
import { RefObject, useEffect, useState } from "react";
import { TicketWithNames } from "../../server/trpc/router/ticket";
import { SITE_BASE_TITLE } from "../../utils/constants";
import { trpc } from "../../utils/trpc";
import { uppercaseFirstLetter } from "../../utils/utils";
import HandleAllConfirmationModal from "../modals/HandleAllConfirmationModal";
import TicketCard from "./TicketCard";
import { TabType } from "./TicketQueue";

interface TicketListProps {
  tickets: TicketWithNames[];
  ticketStatus: TabType;
  userRole: UserRole;
  userId: string;
}

/**
 * TicketList component that displays the list of tickets for a given status
 */
const TicketList = (props: TicketListProps) => {
  const { tickets: initialTickets, ticketStatus, userRole, userId } = props;

  const [displayedTickets, setDisplayedTickets] =
    useState<TicketWithNames[]>(initialTickets);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  // const [filterBy, setFilterBy] = useState("-");
  const [categoryFilterBy, setCategoryFilterBy] = useState("-");
  const [locationFilterBy, setLocationFilterBy] = useState("-");
  const approveTicketsMutation = trpc.ticket.approveTickets.useMutation();
  const assignTicketsMutation = trpc.ticket.assignTickets.useMutation();
  const resolveTicketsMutation = trpc.ticket.resolveTickets.useMutation();
  const closeTicketsMutation = trpc.ticket.closeTickets.useMutation();
  const [parent]: [RefObject<HTMLDivElement>, (enabled: boolean) => void] =
    useAutoAnimate();

  useEffect(() => {
    // Apply both category and location filters
    let filteredTickets = initialTickets;

    if (categoryFilterBy !== "-") {
      filteredTickets = filteredTickets.filter(
        (ticket) => ticket.categoryName === categoryFilterBy,
      );
    }

    if (locationFilterBy !== "-") {
      filteredTickets = filteredTickets.filter(
        (ticket) => ticket.locationName === locationFilterBy,
      );
    }

    setDisplayedTickets(filteredTickets);
  }, [initialTickets, categoryFilterBy, locationFilterBy]);

  /** Set filterBy if it exists in sessionStorage */
  useEffect(() => {
    const categoryFilterByFromSessionStorage = sessionStorage.getItem("categoryFilterBy");
    handleCategoryFilter({
      value: categoryFilterByFromSessionStorage ?? "-",
      label: categoryFilterByFromSessionStorage ?? "-",
      id: categoryFilterByFromSessionStorage ?? "-",
    });

    const locationFilterByFromSessionStorage = sessionStorage.getItem("locationFilterBy");
      handleLocationFilter({
        value: locationFilterByFromSessionStorage ?? "-",
        label: locationFilterByFromSessionStorage ?? "-",
        id: locationFilterByFromSessionStorage ?? "-",
      })
  }, []);

  // TODO: need to fix to grab all locations/categories, not just the ones in the present list of tickets.
  // const assignmentList = Array.from(
  //   new Set(initialTickets.map((ticket) => ticket.assignmentName)),
  // );
  const locationList = Array.from(
    new Set(initialTickets.map((ticket) => ticket.locationName)),
  );
  const categoryList = Array.from(
    new Set(initialTickets.map((ticket) => ticket.category))
  )

  const categoryFilterOptions = ["-", ...categoryList].map((option) => ({
    label: option,
    value: option,
    id: option
  }))

  const locationFilterOptions = ["-", ...locationList].map(
    (option) => ({
      label: option,
      value: option,
      id: option,
    }),
  );


  const handleApproveTickets = async (tickets: TicketWithNames[]) => {
    await approveTicketsMutation.mutateAsync({
      ticketIds: tickets.map((ticket) => ticket.id),
    });
  };

  const handleAssignTickets = async (tickets: TicketWithNames[]) => {
    await assignTicketsMutation.mutateAsync({
      ticketIds: tickets.map((ticket) => ticket.id),
    });
  };

  const handleResolveTickets = async (tickets: TicketWithNames[]) => {
    await resolveTicketsMutation.mutateAsync({
      ticketIds: tickets.map((ticket) => ticket.id),
    });
  };

  const handleCloseTickets = async (tickets: TicketWithNames[]) => {
    await closeTicketsMutation.mutateAsync({
      ticketIds: tickets.map((ticket) => ticket.id),
    });
  };

  const handleAllText = () => {
    switch (ticketStatus) {
      case TicketStatus.PENDING:
        return "approve all";
      case TicketStatus.OPEN:
        return "help all";
      case TicketStatus.ASSIGNED:
        return "resolve all";
      default:
        return "Error: Invalid ticket status";
    }
  };

  /** Which method is currently being used */
  const getHandleAllMethod = () => {
    switch (ticketStatus) {
      case TicketStatus.PENDING:
        return () => {
          handleApproveTickets(displayedTickets);
          setIsModalOpen(false);
        };
      case TicketStatus.OPEN:
        return () => {
          handleAssignTickets(displayedTickets);
          setIsModalOpen(false);
        };
      case TicketStatus.ASSIGNED:
        return () => {
          handleResolveTickets(displayedTickets);
          setIsModalOpen(false);
        };
      default:
        return () => {};
    }
  };

  // const handleFilterTickets = (
  //   filterBy: SingleValue<(typeof filterByOptions)[0]>,
  // ) => {
  //   if (filterBy?.value === "-") {
  //     setFilterBy("-");
  //     setDisplayedTickets(initialTickets);
  //     sessionStorage.setItem("filterBy", "-");
  //     return;
  //   }

  //   if (filterBy?.value === undefined) {
  //     setFilterBy("-");
  //     sessionStorage.setItem("filterBy", "-");
  //     return;
  //   }

  //   sessionStorage.setItem("filterBy", filterBy.value);
  //   setFilterBy(filterBy.value);
  //   // Allows filtering by assignmentName or locationName
  //   const newDisplayedTickets = initialTickets.filter(
  //     (ticket) =>
  //       ticket.assignmentName === filterBy.value ||
  //       ticket.locationName === filterBy.value,
  //   );

  //   setDisplayedTickets(newDisplayedTickets);
  // };

  const handleCategoryFilter = (
    filterBy: SingleValue<(typeof categoryFilterOptions)[0]>,
  ) => {
    const filterValue = filterBy?.value ?? "-";
    setCategoryFilterBy(filterValue);
    sessionStorage.setItem("categoryFilterBy", filterValue);
  };

  const handleLocationFilter = (
    filterBy: SingleValue<(typeof locationFilterOptions)[0]>,
  ) => {
    const filterValue = filterBy?.value ?? "-";
    setLocationFilterBy(filterValue);
    sessionStorage.setItem("locationFilterBy", filterValue);
  };

  if (initialTickets.length === 0) {
    return <Text>No {uppercaseFirstLetter(ticketStatus)} Tickets!</Text>;
  }

  return (
    <>
      <Head>
        <title>
          {displayedTickets.length > 0 ? `(${displayedTickets.length})` : ""}{" "}
          {SITE_BASE_TITLE}
        </title>
      </Head>
      <Flex flexDir="column">
        <Flex justifyContent="end" mb={4}>
          {/* <Box width="sm">
            <Select
              value={{ label: filterBy, value: filterBy, id: filterBy }}
              options={filterByOptions}
              placeholder="Filter by..."
              onChange={handleFilterTickets}
            />
          </Box> */}
          <Box width="sm" mr={4}>
          <Select
            value={{ label: categoryFilterBy, value: categoryFilterBy, id: categoryFilterBy }}
            options={categoryFilterOptions}
            placeholder="Filter by Category..."
            onChange={handleCategoryFilter}
          />
        </Box>
        <Box width="sm">
            <Select
              value={{ label: locationFilterBy, value: locationFilterBy, id: locationFilterBy }}
              options={locationFilterOptions}
              placeholder="Filter by Location..."
              onChange={handleLocationFilter}
            />
          </Box>
          <Button
            hidden={
              userRole !== UserRole.STAFF ||
              ticketStatus === "Priority" ||
              ticketStatus === "Public" ||
              ticketStatus === TicketStatus.ABSENT
            }
            mb={4}
            ml={4}
            alignSelf="flex-end"
            onClick={() => setIsModalOpen(true)}
          >
            {`${uppercaseFirstLetter(handleAllText())} ${
              displayedTickets.length
            } displayed`}
          </Button>
          <Button
            hidden={
              userRole !== UserRole.STAFF ||
              ticketStatus === "Priority" ||
              ticketStatus === "Public" ||
              ticketStatus === TicketStatus.ABSENT
            }
            mb={4}
            ml={4}
            alignSelf="flex-end"
            onClick={() => setIsCloseModalOpen(true)}
          >
            {`Close all ${displayedTickets.length} displayed`}
          </Button>
        </Flex>
        <Box ref={parent}>
          {displayedTickets.map((ticket, idx) => (
            <TicketCard
              key={ticket.id}
              idx={idx}
              ticket={ticket}
              userRole={userRole}
              userId={userId}
            />
          ))}
        </Box>
        <HandleAllConfirmationModal
          isModalOpen={isCloseModalOpen}
          setIsModalOpen={setIsCloseModalOpen}
          handleConfirm={() => {
            handleCloseTickets(displayedTickets);
          }}
          handleAllText="close all"
        />
        <HandleAllConfirmationModal
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          handleConfirm={getHandleAllMethod()}
          handleAllText={handleAllText()}
        />
      </Flex>
    </>
  );
};

export default TicketList;
