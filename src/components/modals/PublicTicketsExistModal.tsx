import {
	Button,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	Text,
	useColorModeValue,
} from "@chakra-ui/react";
import { UserRole } from "@prisma/client";
import { useEffect, useState } from "react";
import { TicketWithNames } from "../../server/trpc/router/ticket";
import { DARK_GRAY_COLOR, DARK_HOVER_COLOR } from "../../utils/constants";
import TicketCard from "../queue/TicketCard";

interface PublicTicketsExistModalProps {
	publicTickets: TicketWithNames[];
	userId: string;
	userRole: UserRole;
}

const PublicTicketsExistModal = (props: PublicTicketsExistModalProps) => {
	const { publicTickets, userId, userRole } = props;
	const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

	useEffect(() => {
		const publicTicketsExistModalClosed = sessionStorage.getItem(
			"publicTicketsExistModalClosed",
		);
		if (publicTicketsExistModalClosed !== "true") {
			setIsModalOpen(userRole === UserRole.STUDENT && publicTickets.length > 0);
		}
	}, [publicTickets]);

	const handleModalClose = () => {
		setIsModalOpen(false);
		// We don't want to annoy the user with this modal every time a new ticket is created
		sessionStorage.setItem("publicTicketsExistModalClosed", "true");
	};

	return (
		<Modal isOpen={isModalOpen} onClose={handleModalClose} size="4xl">
			<ModalOverlay
				bg="blackAlpha.300"
				backdropFilter="blur(10px) hue-rotate(90deg)"
			/>
			<ModalContent
				backgroundColor={useColorModeValue("", DARK_GRAY_COLOR)}
				boxShadow={`0 0 1px 2px ${DARK_HOVER_COLOR}`}
			>
				<ModalHeader>Public Tickets Exist</ModalHeader>
				<ModalCloseButton />
				<ModalBody>
					<Text mb={2}>
						Joining a public ticket will allow staff members to help you for
						longer time. Please note that these are for conceptual questions
						only!
					</Text>
					{publicTickets.map((ticket, idx) => (
						<TicketCard
							key={ticket.id}
							idx={idx}
							ticket={ticket}
							userRole={userRole}
							userId={userId}
						/>
					))}
				</ModalBody>
				<ModalFooter>
					<Button colorScheme="blue" mr={3} onClick={handleModalClose}>
						Close
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
};

export default PublicTicketsExistModal;
