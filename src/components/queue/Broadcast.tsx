import { useChannel } from "@ably-labs/react-hooks";
import {
	Button,
	Flex,
	Input,
	useColorModeValue,
	useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import BroadcastConfirmationModal from "../modals/BroadcastConfirmationModal";

/**
 * Broadcast component that allows staff to broadcast messages everyone
 */
const Broadcast = () => {
	const [channel] = useChannel("broadcast", () => {});
	const [broadcastMsg, setBroadcastMsg] = useState<string>("");
	const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
	const toast = useToast();

	const broadcast = () => {
		setIsModalOpen(false);
		channel.publish({
			name: "broadcast",
			data: broadcastMsg,
		});
		setBroadcastMsg("");
	};

	const handleModalOpen = () => {
		if (broadcastMsg.trim() === "") {
			toast({
				title: "Please enter a message to broadcast",
				position: "top-right",
				status: "error",
				duration: 3000,
				isClosable: true,
			});
			return;
		}
		setIsModalOpen(true);
	};

	return (
		<Flex borderColor={useColorModeValue("", "whiteAlpha.500")}>
			<Input
				m={4}
				placeholder="Broadcast Message"
				value={broadcastMsg}
				onChange={(e) => setBroadcastMsg(e.target.value)}
				_placeholder={{ color: useColorModeValue("gray.500", "white") }}
			/>
			<Button m={4} onClick={handleModalOpen}>
				Broadcast
			</Button>

			<BroadcastConfirmationModal
				isModalOpen={isModalOpen}
				setIsModalOpen={setIsModalOpen}
				broadcastMsg={broadcastMsg}
				broadcast={broadcast}
			/>
		</Flex>
	);
};

export default Broadcast;
