import {
	Button,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalFooter,
	ModalHeader,
	useColorModeValue,
} from "@chakra-ui/react";
import { useState } from "react";
import { TicketWithNames } from "../../server/trpc/router/ticket";
import { DARK_GRAY_COLOR } from "../../utils/constants";
import CreateTicketForm from "../queue/CreateTicketForm";

interface EditTicketModalProps {
	isModalOpen: boolean;
	setIsModalOpen: (isOpen: boolean) => void;
	onSubmit: (_: TicketWithNames) => void;
	ticket: TicketWithNames;
}

/** Allows users to modify their ticket description, location, and assignment */
const EditTicketModal = (props: EditTicketModalProps) => {
	const { isModalOpen, setIsModalOpen, onSubmit, ticket } = props;
	const [existingTicket, setExistingTicket] = useState<TicketWithNames>(ticket);

	return (
		<Modal
			size="2xl"
			isOpen={isModalOpen}
			onClose={() => setIsModalOpen(false)}
		>
			<ModalContent backgroundColor={useColorModeValue("", DARK_GRAY_COLOR)}>
				<ModalHeader>Edit Ticket</ModalHeader>
				<ModalCloseButton />
				<ModalBody>
					<CreateTicketForm
						arePublicTicketsEnabled={true}
						isEditingTicket={true}
						existingTicket={existingTicket}
						setExistingTicket={setExistingTicket}
					/>
				</ModalBody>
				<ModalFooter>
					<Button variant="ghost" mr={3} onClick={() => setIsModalOpen(false)}>
						Cancel
					</Button>
					<Button colorScheme="blue" onClick={() => onSubmit(existingTicket)}>
						Confirm
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
};

export default EditTicketModal;
