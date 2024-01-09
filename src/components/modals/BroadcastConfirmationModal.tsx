import {
	Button,
	Center,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalFooter,
	ModalHeader,
	useColorModeValue,
} from "@chakra-ui/react";
import { DARK_GRAY_COLOR } from "../../utils/constants";

interface BroadcastConfirmationModalProps {
	isModalOpen: boolean;
	setIsModalOpen: (isOpen: boolean) => void;
	broadcastMsg: string;
	broadcast: () => void;
}

const BroadcastConfirmationModal = (props: BroadcastConfirmationModalProps) => {
	const { isModalOpen, setIsModalOpen, broadcastMsg, broadcast } = props;

	return (
		<Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
			<ModalContent backgroundColor={useColorModeValue("", DARK_GRAY_COLOR)}>
				<ModalHeader>Confirm Broadcast</ModalHeader>
				<ModalCloseButton />
				<ModalBody>
					Are you sure you want to broadcast this message? <br /> <br />{" "}
					<Center>
						<strong>{broadcastMsg}</strong>
					</Center>
				</ModalBody>
				<ModalFooter>
					<Button variant="ghost" mr={3} onClick={() => setIsModalOpen(false)}>
						Cancel
					</Button>
					<Button colorScheme="blue" onClick={broadcast}>
						Confirm
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
};

export default BroadcastConfirmationModal;
