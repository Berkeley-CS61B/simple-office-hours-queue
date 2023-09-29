import { Flex, Spinner, Tag } from '@chakra-ui/react';
import { TicketWithNames } from '../../server/trpc/router/ticket';
import { trpc } from '../../utils/trpc';
import { Select } from 'chakra-react-select';

interface TicketLocationProps {
  ticket: TicketWithNames;
}

interface SelectLocation {
  id: number;
  label: string;
  value: string;
}

/** Specifies location of ticket and allows them to be edited */
const TicketLocation = (props: TicketLocationProps) => {
  const { ticket } = props;
  const editTicketLocationMutation = trpc.ticket.editTicketLocation.useMutation();

  const { data: activeLocations, isLoading: isGetActiveLocationsLoading } = trpc.admin.getActiveLocations.useQuery(
    undefined,
    {
      refetchOnWindowFocus: false,
    },
  );

  const locationOptions = activeLocations?.map(
    location => ({ label: location.name, value: location.name, id: location.id } as SelectLocation),
  );

  const currentLocation = {
    id: ticket.locationId,
    label: ticket.locationName,
    value: ticket.locationName,
  } as SelectLocation;

  const handleLocationChange = async (newLocation: SelectLocation | null) => {
    if (newLocation === null) return;

    await editTicketLocationMutation.mutateAsync({
      ticketId: ticket.id,
      locationId: newLocation.id,
    });
  };

  if (editTicketLocationMutation.isLoading || isGetActiveLocationsLoading) {
    return <Spinner />;
  }

  return (
    <Tag p={2.5} size='md' colorScheme='orange' borderRadius={5}>
      {/* {currentLocation.label} */}
      <Select value={currentLocation} onChange={handleLocationChange} options={locationOptions} />
    </Tag>
  );
};

export default TicketLocation;
