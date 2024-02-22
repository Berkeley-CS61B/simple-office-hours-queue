import {InfoIcon} from "@chakra-ui/icons";
import {
    Box,
    Button,
    Flex,
    FormControl,
    FormLabel, HStack,
    Input,
    Radio,
    RadioGroup,
    Switch,
    Text,
    Textarea,
    Tooltip,
    useToast,
} from "@chakra-ui/react";
import {PersonalQueue, TicketType, Category} from "@prisma/client";
import {Select, SingleValue} from "chakra-react-select";
import Router from "next/router";
import {useEffect, useState} from "react";
import {TicketWithNames} from "../../server/trpc/router/ticket";
import {
    STARTER_CONCEPTUAL_TICKET_DESCRIPTION,
    STARTER_DEBUGGING_TICKET_DESCRIPTION,
} from "../../utils/constants";
import {trpc} from "../../utils/trpc";
import {getTicketUrl, joinArrayAsString, uppercaseFirstLetter} from "../../utils/utils";
import ConfirmPublicToggleModal from "../modals/ConfirmPublicToggleModal";

interface Assignment {
    id: number;
    label: string;
    value: string;
    category?: Category | undefined;
}

interface Location {
    id: number;
    label: string;
    value: string;
}

interface CreateTicketFormProps {
    arePublicTicketsEnabled: boolean;
    personalQueue?: PersonalQueue;
    isEditingTicket?: boolean;
    // Existing ticket is used to prepopulate the form when editing a ticket
    existingTicket?: TicketWithNames;
    setExistingTicket?: (ticket: TicketWithNames) => void;
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
    const [notLabOnlyLocationOptions, setNotLabOnlyLocationOptions] = useState<Location[]>([]);
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
                category: existingTicket.assignmentCategory,

            }
            : undefined,
    );
    const [location, setLocation] = useState<Location | undefined>(
        existingTicket
            ? {
                id: existingTicket.locationId,
                label: existingTicket.locationName,
                value: existingTicket.locationName,
            }
            : undefined,
    );
    const toast = useToast();

    // When a property of the ticket changes, update the existing ticket if it exists
    useEffect(() => {
        if (existingTicket && setExistingTicket) {
            setExistingTicket({
                ...existingTicket,
                description,
                locationDescription,
                assignmentId: assignment?.id ?? existingTicket.assignmentId,
                assignmentName: assignment?.label ?? existingTicket.assignmentName,
                locationId: location?.id ?? existingTicket.locationId,
                locationName: location?.label ?? existingTicket.locationName,
                ticketType: ticketType ?? existingTicket.ticketType,
                isPublic,
            });
        }
    }, [
        description,
        locationDescription,
        assignment,
        location,
        ticketType,
        isPublic,
        existingTicket,
        setExistingTicket,
    ]);


    const createTicketMutation = trpc.ticket.createTicket.useMutation();


    trpc.admin.getActiveAssignments.useQuery({}, {
        refetchOnWindowFocus: false,
        onSuccess: (data) => {
            setAssignmentOptions(
                data.map(
                    (assignment) =>
                        ({
                            label: assignment.name,
                            value: assignment.name,
                            id: assignment.id,
                            category: assignment.category,
                        }) as Assignment,
                ),
            );
        },
    });

    const {refetch} = trpc.admin.getActiveLocations.useQuery({category: assignment?.category}, {
        refetchOnWindowFocus: false,
        onSuccess: (data) => {
            setLocationOptions(
                data.map(
                    (location) =>
                        ({
                            label: location.name,
                            value: location.name,
                            id: location.id,
                        }) as Location,
                ),
            );
        },
    });

    // useEffect(() => {
    //   if (shouldRefetchLocations) {
    //     trpc.admin.getActiveLocations.useQuery({}, {
    //
    //       refetchOnWindowFocus: false,
    //       onSuccess: (data) => {
    //         setLocationOptions(
    //             data.map(
    //                 (location) =>
    //                     ({
    //                       label: location.name,
    //                       value: location.name,
    //                       id: location.id,
    //                     }) as Location,
    //             ),
    //         );
    //       },
    //     });
    //     setShouldRefetchLocations(false); // Reset after refetch
    //      // Ensure cleanup
    //   }
    // }, [shouldRefetchLocations]);


    trpc.admin.getActiveNotLabOnlyLocations.useQuery(undefined, {
        refetchOnWindowFocus: false,
        onSuccess: (data) => {
            setNotLabOnlyLocationOptions(
                data.map(
                    (location) =>
                        ({
                            label: location.name,
                            value: location.name,
                            id: location.id,
                        }) as Location,
                ),
            );
        },
    });


    const handleTicketTypeChange = (newVal: TicketType) => {
        setTicketType(newVal);
        if (newVal === TicketType.DEBUGGING) {
            setDescription(STARTER_DEBUGGING_TICKET_DESCRIPTION);
            setIsPublic(false);
        } else {
            setDescription(STARTER_CONCEPTUAL_TICKET_DESCRIPTION);
            if (arePublicTicketsEnabled) {
                setIsPublic(true);
            }
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
        setAssignment(newVal ?? undefined);
        refetch();
    }

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isEditingTicket) {
            // Edit ticket has it's own submit handler
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
                    toast({
                        title: "Error",
                        description:
                            "Could not create ticket. You may already have a ticket open. If not, refresh and try again.",
                        status: "error",
                        position: "top-right",
                        duration: 5000,
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

    return (
        <Box
            p={8}
            pt={2}
            width="full"
            borderWidth={1}
            borderRadius={8}
            boxShadow="lg"
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
                    </FormControl>
                    <FormControl isRequired isDisabled={ticketType === undefined}>
                        <FormLabel>Description</FormLabel>
                        <Text hidden={ticketType !== TicketType.CONCEPTUAL} mb={2}>
                            Please make sure staff does not have to look at your code to
                            answer your question.
                        </Text>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            name="description"
                            size="md"
                            maxLength={1000}
                        />
                    </FormControl>
                    <FormControl mt={6} isRequired isDisabled={ticketType === undefined}>
                        <FormLabel>Assignment</FormLabel>
                        <Select
                            value={assignment}
                            onChange={handleAssignmentChange}
                            options={assignmentOptions}
                        />
                    </FormControl>

                    <FormControl mt={6} isRequired isDisabled={assignment === undefined}>
                        <HStack>
                            <FormLabel>
                                Location
                            </FormLabel>
                            {assignment !== undefined && assignment.category !== Category.NONE
                                ?
                                <Tooltip
                                    hasArrow
                                    label={`${assignment?.category ? uppercaseFirstLetter(assignment.category) : ""} tickets are limited to ${joinArrayAsString(locationOptions.map((locationOption) => locationOption.value))}.`}
                                    bg="gray.300"
                                    color="black"
                                >
                                    <InfoIcon mr={1} mb={1}/>
                                </Tooltip> :
                                <></>
                            }

                            {/*<FormLabel>*/}
                            {/*    Location*/}
                            {/*    <Tooltip visible={assignment !== undefined && assignment.category !== Category.NONE}*/}
                            {/*             hasArrow*/}
                            {/*             label={`${assignment?.category ? uppercaseFirstLetter(assignment.category) : ""} tickets are limited to ${locationOptions.map((locationOption) => locationOption.value).join(", ")}.` : ""}*/}
                            {/*             bg="gray.300"*/}
                            {/*             color="black">*/}
                            {/*        <InfoIcon ml={2} mb={1}/>*/}
                            {/*    </Tooltip>*/}
                            {/*</FormLabel>*/}
                            {/*<FormLabel>Location*/}
                            {/*<Tooltip*/}
                            {/*    hasArrow*/}
                            {/*    label='Lab rooms may be restricted to lab-related assignments only.'*/}
                            {/*    bg='gray.300'*/}
                            {/*    color='black'*/}
                            {/*>              <InfoIcon ml={2} mb={1} />*/}
                            {/*</Tooltip>*/}
                            {/*</FormLabel>*/}
                            <FormControl width="30%">
                            <Select
                                value={location}
                                onChange={(val) => setLocation(val ?? undefined)}
                                options={locationOptions}
                            />
                            </FormControl>
                        </HStack>
                    </FormControl>
                    <FormControl mt={6} isRequired={isPublic} isDisabled={location === undefined}>
                        <FormLabel>Briefly describe where you are</FormLabel>
                        <Input
                            value={locationDescription}
                            onChange={(e) => setLocationDescription(e.target.value)}
                            type="text"
                            placeholder="Back right corner of the room"
                            name="locationDescription"
                            maxLength={140}
                        />
                    </FormControl>
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
                                <InfoIcon ml={2} mb={1}/>
                            </Tooltip>
                        </FormLabel>
                        <Switch isChecked={isPublic} mt={1} onChange={handleTogglePublic}/>
                    </FormControl>
                    <Button
                        hidden={isEditingTicket}
                        type="submit"
                        width="full"
                        mt={4}
                        colorScheme="whatsapp"
                        isLoading={isButtonLoading}
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
