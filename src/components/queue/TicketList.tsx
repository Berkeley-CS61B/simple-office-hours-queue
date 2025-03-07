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
  const [assignmentFilter, setAssignmentFilter] = useState("-");
  const [locationFilter, setLocationFilter] = useState("-");
  const approveTicketsMutation = trpc.ticket.approveTickets.useMutation();
  const assignTicketsMutation = trpc.ticket.assignTickets.useMutation();
  const resolveTicketsMutation = trpc.ticket.resolveTickets.useMutation();
  const closeTicketsMutation = trpc.ticket.closeTickets.useMutation();
  const [parent]: [RefObject<HTMLDivElement>, (enabled: boolean) => void] =
    useAutoAnimate();

  useEffect(() => {
    // Filter tickets based on both assignment and location filters
    let newDisplayedTickets = [...initialTickets];

    // Apply assignment filter if not set to "-" (all)
    if (assignmentFilter !== "-") {
      newDisplayedTickets = newDisplayedTickets.filter(
        (ticket) => ticket.assignmentName === assignmentFilter,
      );
    }

    // Apply location filter if not set to "-" (all)
    if (locationFilter !== "-") {
      newDisplayedTickets = newDisplayedTickets.filter(
        (ticket) => ticket.locationName === locationFilter,
      );
    }

    setDisplayedTickets(newDisplayedTickets);
  }, [initialTickets, assignmentFilter, locationFilter]);

  /** Set filters if they exist in sessionStorage */
  useEffect(() => {
    const assignmentFilterFromStorage =
      sessionStorage.getItem("assignmentFilter");
    const locationFilterFromStorage = sessionStorage.getItem("locationFilter");

    if (assignmentFilterFromStorage) {
      setAssignmentFilter(assignmentFilterFromStorage);
    }

    if (locationFilterFromStorage) {
      setLocationFilter(locationFilterFromStorage);
    }
  }, []);

  // Get unique assignments from tickets
  const assignmentList = Array.from(
    new Set(initialTickets.map((ticket) => ticket.assignmentName)),
  );

  const assignmentFilterOptions = ["-", ...assignmentList].map((option) => ({
    label: option === "-" ? "All Assignments" : option,
    value: option,
    id: option,
  }));

  // Get unique locations from tickets
  const ticketLocationList = Array.from(
    new Set(initialTickets.map((ticket) => ticket.locationName)),
  );

  // Fetch all active locations from the server
  const [allLocations, setAllLocations] = useState<string[]>([]);

  // Query to get all active locations
  trpc.admin.getActiveLocations.useQuery(
    {},
    {
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        const locationNames = data.map((location) => location.name);
        setAllLocations(locationNames);
      },
    },
  );

  // Combine ticket locations with all locations, removing duplicates by using a Set
  const locationList = Array.from(
    new Set([...ticketLocationList, ...allLocations]),
  );

  const locationFilterOptions = ["-", ...locationList].map((option) => ({
    label: option === "-" ? "All Locations" : option,
    value: option,
    id: option,
  }));

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

  const handleAssignmentFilter = (
    selectedFilter: SingleValue<typeof assignmentFilterOptions[0]>,
  ) => {
    const filterValue = selectedFilter?.value ?? "-";
    setAssignmentFilter(filterValue);
    sessionStorage.setItem("assignmentFilter", filterValue);
  };

  const handleLocationFilter = (
    selectedFilter: SingleValue<typeof locationFilterOptions[0]>,
  ) => {
    const filterValue = selectedFilter?.value ?? "-";
    setLocationFilter(filterValue);
    sessionStorage.setItem("locationFilter", filterValue);
  };

  const clearFilters = () => {
    setAssignmentFilter("-");
    setLocationFilter("-");
    sessionStorage.setItem("assignmentFilter", "-");
    sessionStorage.setItem("locationFilter", "-");
  };

  if (
    initialTickets.length === 0 &&
    assignmentFilter === "-" &&
    locationFilter === "-"
  ) {
    return <Text>No {uppercaseFirstLetter(ticketStatus)} Tickets!</Text>;
  }

  // Show special message when filtering with no matching tickets
  if (
    displayedTickets.length === 0 &&
    (assignmentFilter !== "-" || locationFilter !== "-")
  ) {
    let filterMessage = "";

    if (assignmentFilter !== "-" && locationFilter !== "-") {
      filterMessage = `${assignmentFilter} in ${locationFilter}`;
    } else if (assignmentFilter !== "-") {
      filterMessage = assignmentFilter;
    } else if (locationFilter !== "-") {
      filterMessage = locationFilter;
    }

    return (
      <>
        <Head>
          <title>{SITE_BASE_TITLE}</title>
        </Head>
        <Flex flexDir="column">
          <Flex justifyContent="space-between" mb={4} wrap="wrap" gap={2}>
            <Box width={{ base: "100%", md: "sm" }}>
              <Select
                value={{
                  label:
                    locationFilter === "-" ? "All Locations" : locationFilter,
                  value: locationFilter,
                  id: locationFilter,
                }}
                options={locationFilterOptions}
                onChange={handleLocationFilter}
              />
            </Box>

            <Box width={{ base: "100%", md: "sm" }}>
              <Select
                value={{
                  label:
                    assignmentFilter === "-"
                      ? "All Assignments"
                      : assignmentFilter,
                  value: assignmentFilter,
                  id: assignmentFilter,
                }}
                options={assignmentFilterOptions}
                onChange={handleAssignmentFilter}
              />
            </Box>
            {(assignmentFilter !== "-" || locationFilter !== "-") && (
              <Button size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </Flex>
          <Text>
            No {uppercaseFirstLetter(ticketStatus)} Tickets for {filterMessage}!
          </Text>
        </Flex>
      </>
    );
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
        <Flex justifyContent="space-between" mb={4} wrap="wrap" gap={2}>
          <Box width={{ base: "100%", md: "sm" }}>
            <Select
              value={{
                label:
                  locationFilter === "-" ? "All Locations" : locationFilter,
                value: locationFilter,
                id: locationFilter,
              }}
              options={locationFilterOptions}
              onChange={handleLocationFilter}
            />
          </Box>
          <Box width={{ base: "100%", md: "sm" }}>
            <Select
              value={{
                label:
                  assignmentFilter === "-"
                    ? "All Assignments"
                    : assignmentFilter,
                value: assignmentFilter,
                id: assignmentFilter,
              }}
              options={assignmentFilterOptions}
              onChange={handleAssignmentFilter}
            />
          </Box>

          {(assignmentFilter !== "-" || locationFilter !== "-") && (
            <Button size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
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
