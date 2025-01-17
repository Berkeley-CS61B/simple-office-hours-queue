import { InfoIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Radio,
  RadioGroup,
  Switch,
  Text,
  Textarea,
  Tooltip,
  useToast,
} from "@chakra-ui/react";
import { Category, PersonalQueue, TicketType } from "@prisma/client";
import { Select, SingleValue } from "chakra-react-select";
import Router from "next/router";
import { useEffect, useState } from "react";
import { TicketWithNames } from "../../server/trpc/router/ticket";
import {
  STARTER_CONCEPTUAL_TICKET_DESCRIPTION,
  STARTER_DEBUGGING_TICKET_DESCRIPTION,
} from "../../utils/constants";
import { trpc } from "../../utils/trpc";
import {
  getTicketUrl,
  joinArrayAsString,
  uppercaseFirstLetter,
  parseCoordinates,
  preprocessLocationDescription,
} from "../../utils/utils";
import { hasLocationPicker } from "../location-picker/locationConfig";
import ConfirmPublicToggleModal from "../modals/ConfirmPublicToggleModal";
import LocationPicker from "../location-picker/LocationPicker";

interface Assignment {
  id: number;
  label: string;
  value: string;
  categoryId?: number | undefined;
  template: string;
}

export interface Location {
  id: number;
  label: string;
  value: string;
  online: boolean;
}

interface CreateTicketFormProps {
  arePublicTicketsEnabled: boolean;
  personalQueue?: PersonalQueue;
  isEditingTicket?: boolean;
  existingTicket?: TicketWithNames;
  setExistingTicket?: React.Dispatch<React.SetStateAction<TicketWithNames>>;
}

const CreateTicketForm = (props: CreateTicketFormProps) => {
  const {
    arePublicTicketsEnabled,
    personalQueue,
    isEditingTicket,
    existingTicket,
    setExistingTicket,
  } = props;
  const [ticketType, setTicketType] = useState<TicketType | undefined>(
    existingTicket?.ticketType,
  );
  const [description, setDescription] = useState<string>(
    existingTicket?.description ?? "",
  );
  const [locationDescription, setLocationDescription] = useState<string>(
    existingTicket?.locationDescription ?? "",
  );
  const [assignmentOptions, setAssignmentOptions] = useState<Assignment[]>([]);
  const [locationOptions, setLocationOptions] = useState<Location[]>([]);
  const [isPublicModalOpen, setIsPublicModalOpen] = useState<boolean>(false);
  const [isPublic, setIsPublic] = useState<boolean>(
    existingTicket?.isPublic ?? false,
  );
  const [isButtonLoading, setIsButtonLoading] = useState<boolean>(false);
  const [assignment, setAssignment] = useState<Assignment | undefined>(
    existingTicket
      ? {
          id: existingTicket.assignmentId,
          label: existingTicket.assignmentName,
          value: existingTicket.assignmentName,
          categoryId: existingTicket.assignmentCategoryId,
          template: existingTicket.template,
        }
      : undefined,
  );
  const [location, setLocation] = useState<Location | undefined>(
    existingTicket
      ? {
          id: existingTicket.locationId,
          label: existingTicket.locationName,
          value: existingTicket.locationName,
          online: existingTicket.isOnline,
        }
      : undefined,
  );
  const [allCategories, setAllCategories] = useState<Category[]>();

  const toast = useToast();

  // When a property of the ticket changes, update the existing ticket if it exists
  useEffect(() => {
    if (existingTicket && setExistingTicket) {
      setExistingTicket((prev: TicketWithNames) => {
        // Only update if there's a change
        if (
          prev.description !== description ||
          prev.locationDescription !== locationDescription ||
          prev.assignmentId !== (assignment?.id ?? prev.assignmentId) ||
          // Add other necessary checks
          prev.isPublic !== isPublic
        ) {
          return {
            ...prev,
            description,
            locationDescription,
            assignmentId: assignment?.id ?? prev.assignmentId,
            assignmentName: assignment?.label ?? prev.assignmentName,
            locationId: location?.id ?? prev.locationId,
            locationName: location?.label ?? prev.locationName,
            ticketType: ticketType ?? prev.ticketType,
            isPublic,
          };
        }
        return prev;
      });
    }
  }, [
    description,
    locationDescription,
    assignment,
    location,
    ticketType,
    isPublic,
    setExistingTicket,
  ]);

  const createTicketMutation = trpc.ticket.createTicket.useMutation();

  trpc.admin.getActiveAssignments.useQuery(
    {},
    {
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        setAssignmentOptions(
          data.map(
            (assignment) =>
              ({
                label: assignment.name,
                value: assignment.name,
                id: assignment.id,
                categoryId: assignment.categoryId,
                template: assignment.template,
              } as Assignment),
          ),
        );
      },
    },
  );

  const { refetch } = trpc.admin.getActiveLocations.useQuery(
    { categoryId: assignment?.categoryId },
    {
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        setLocationOptions(
          data.map(
            (location) =>
              ({
                label: location.name,
                value: location.name,
                id: location.id,
                online: location.isOnline,
              } as Location),
          ),
        );
      },
    },
  );

  trpc.admin.getAllCategories.useQuery(undefined, {
    refetchOnWindowFocus: false,
    onSuccess: (data) => {
      setAllCategories(data);
    },
  });

  const { data: cooldownPeriod } = trpc.admin.getCoolDownTime.useQuery(
    undefined,
    {
      refetchOnWindowFocus: false,
    },
  );

  const handleTicketTypeChange = (newVal: TicketType) => {
    setTicketType(newVal);
    if (newVal === TicketType.DEBUGGING) {
      setIsPublic(false);
    } else {
      if (arePublicTicketsEnabled) {
        setIsPublic(true);
      }
    }
    changeDescription(assignment, newVal);
  };

  const changeDescription = (
    assignment: Assignment | undefined,
    ticketType: TicketType | undefined,
  ) => {
    if (assignment === undefined || assignment?.template === "") {
      if (ticketType == TicketType.DEBUGGING) {
        setDescription(STARTER_DEBUGGING_TICKET_DESCRIPTION);
      } else {
        setDescription(STARTER_CONCEPTUAL_TICKET_DESCRIPTION);
      }
    } else {
      setDescription(assignment.template);
    }
  };

  const handleTogglePublic = () => {
    if (ticketType === TicketType.CONCEPTUAL && isPublic) {
      setIsPublicModalOpen(true);
      return;
    }
    setIsPublic(!isPublic);
  };

  const handleAssignmentChange = (newVal: SingleValue<Assignment>) => {
    setLocation(undefined); // todo look at this
    setAssignment(newVal ?? undefined);
    refetch();
    changeDescription(newVal ?? undefined, ticketType ?? undefined);
  };

  const handleLocationChange = (newVal: SingleValue<Location>) => {
    setLocation(newVal ?? undefined);
    setLocationDescription(""); // Always clear location description on change
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isEditingTicket) {
      return;
    }

    if (!assignment || !location || !ticketType) {
      toast({
        title: "Error",
        description: "Please select an assignment and location",
        status: "error",
        position: "top-right",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Add validation for location picker
    if (hasLocationPicker(location.id)) {
      const coordinates = parseCoordinates(locationDescription);
      if (
        !coordinates ||
        coordinates.x === undefined ||
        coordinates.y === undefined
      ) {
        toast({
          title: "Error",
          description:
            "Please click on the map to indicate where you are sitting",
          status: "error",
          position: "top-right",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
    }

    // If description has "[this test]" or "[this concept]" in it, toast and return
    if (
      description.includes("[this test]") ||
      description.includes("[this concept]")
    ) {
      toast({
        title: "Error",
        description:
          "Please replace [this concept] or [this test] with the the specific concept or test",
        status: "error",
        position: "top-right",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Prevents spamming the button
    setIsButtonLoading(true);

    await createTicketMutation
      .mutateAsync({
        description: description.trim(),
        assignmentId: assignment.id,
        locationId: location.id,
        locationDescription: locationDescription.trim(),
        personalQueueName: personalQueue?.name,
        ticketType,
        isPublic,
      })
      .then((ticket) => {
        if (!ticket) {
          const coolDownText = cooldownPeriod
            ? `You must wait ${cooldownPeriod} minutes since your last ticket was resolved.`
            : "";
          toast({
            title: "Error",
            description: `Could not create ticket. You may already have a ticket open. If not, refresh and try again. ${coolDownText}`,
            status: "error",
            position: "top-right",
            duration: 10000,
            isClosable: true,
          });
          return;
        }
        setDescription("");
        // Resets the select options
        setAssignment("" as unknown as Assignment);
        setLocation("" as unknown as Location);
        toast({
          title: "Ticket created",
          description: "Your help request has been created",
          status: "success",
          duration: 3000,
          isClosable: true,
          position: "top-right",
        });
        Router.push(getTicketUrl(ticket.id));
      });

    setIsButtonLoading(false);
  };

  const getCategoryTooltipText = (
    categories: Category[],
    assignment: Assignment,
  ) => {
    const category = categories.find(
      (category) => category.id === assignment.categoryId,
    );
    if (category === undefined) {
      return "This assignment can be taken in any room.";
    }

    if (locationOptions.length === 0) {
      return `There are no rooms that can take ${category.name} tickets.`;
    }

    return `${category.name} tickets are limited to 
    ${joinArrayAsString(
      locationOptions.map((locationOption) => locationOption.value),
    )}.`;
  };

  return (
    <Box
      p={8}
      pt={2}
      width="full"
      borderWidth={1}
      borderRadius={8}
      boxShadow="lg"
      mt={5}
    >
      <Box my={4} textAlign="left">
        <form onSubmit={onSubmit}>
          <FormControl isRequired>
            <Flex>
              <FormLabel>Ticket Type</FormLabel>
              <RadioGroup onChange={handleTicketTypeChange} value={ticketType}>
                {Object.keys(TicketType).map((type) => (
                  <Radio mr={2} key={type} value={type}>
                    {uppercaseFirstLetter(type)}
                  </Radio>
                ))}
              </RadioGroup>
            </Flex>
            <Text hidden={ticketType !== TicketType.CONCEPTUAL} mb={2}>
              For conceptual questions, staff will not look at code or help with
              debugging.
            </Text>
          </FormControl>
          <FormControl mt={2} isRequired isDisabled={ticketType === undefined}>
            <FormLabel>Assignment</FormLabel>
            <Select
              value={assignment}
              onChange={handleAssignmentChange}
              options={assignmentOptions}
            />
          </FormControl>
          <FormControl
            mt={2}
            isRequired
            isDisabled={ticketType === undefined || assignment === undefined}
          >
            <FormLabel>Description</FormLabel>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              name="description"
              size="md"
              maxLength={1000}
            />
          </FormControl>

          <FormControl mt={6} isRequired isDisabled={assignment === undefined}>
            <HStack>
              <FormLabel margin={0}>Location</FormLabel>
              {allCategories !== undefined && assignment !== undefined && (
                <Tooltip
                  hidden={allCategories.length === 0}
                  hasArrow
                  label={getCategoryTooltipText(allCategories, assignment)}
                  bg="gray.300"
                  color="black"
                >
                  <InfoIcon mr={1} mb={1} />
                </Tooltip>
              )}
              <Box width="30%">
                <Select
                  value={location === undefined ? null : location}
                  onChange={handleLocationChange}
                  options={locationOptions}
                />
              </Box>
            </HStack>
          </FormControl>
          {/* Show either location picker or location description textbox conditionally. */}
          {location && (
            <>
              {hasLocationPicker(location.id) ? (
                <div>
                  <FormControl
                    mt={6}
                    display="flex"
                    flexDirection="column"
                    isRequired
                    isInvalid={!locationDescription}
                  >
                    <FormLabel>Click where you are!</FormLabel>
                    <Box mb={4}>
                      <LocationPicker
                        key={`location-picker-${location.id}`}
                        onChange={({ x, y }) => {
                          setLocationDescription(
                            `x: ${x.toFixed(2)}, y: ${y.toFixed(2)}`,
                          );
                        }}
                        location={location}
                        initialCoordinates={parseCoordinates(
                          existingTicket?.locationDescription ?? undefined,
                        )}
                      />
                    </Box>
                    {!locationDescription && (
                      <Text color="red.500" fontSize="sm" mt={2}>
                        Please click on the map to indicate your location
                      </Text>
                    )}
                  </FormControl>
                </div>
              ) : (
                <FormControl mb={4}>
                  <FormLabel>Location Description</FormLabel>
                  <Textarea
                    value={preprocessLocationDescription(locationDescription)} // Remove coordinates, if any.
                    onChange={(e) => setLocationDescription(e.target.value)}
                    placeholder="Please provide a description of where you are sitting..."
                  />
                </FormControl>
              )}
            </>
          )}
          <FormControl
            mt={6}
            display="flex"
            hidden={!arePublicTicketsEnabled}
            isDisabled={
              ticketType === TicketType.DEBUGGING || ticketType === undefined
            }
          >
            <FormLabel>
              Public
              <Tooltip
                hasArrow
                label="Public tickets can be joined by other students. This is great for group work
               or conceptual questions! If your ticket is public, we are more likely to 
               help you for a longer time."
                bg="gray.300"
                color="black"
              >
                <InfoIcon ml={2} mb={1} />
              </Tooltip>
            </FormLabel>
            <Switch isChecked={isPublic} mt={1} onChange={handleTogglePublic} />
          </FormControl>
          <Button
            hidden={isEditingTicket}
            type="submit"
            width="full"
            mt={4}
            colorScheme="whatsapp"
            isLoading={isButtonLoading}
            isDisabled={
              !assignment ||
              !location ||
              !ticketType ||
              !description ||
              (hasLocationPicker(location?.id) &&
                !parseCoordinates(locationDescription)) ||
              isButtonLoading
            }
          >
            Request Help
          </Button>
        </form>
      </Box>
      <ConfirmPublicToggleModal
        isModalOpen={isPublicModalOpen}
        setIsModalOpen={setIsPublicModalOpen}
        handleConfirm={() => {
          setIsPublicModalOpen(false);
          setIsPublic(false);
        }}
      />
    </Box>
  );
};

export default CreateTicketForm;
