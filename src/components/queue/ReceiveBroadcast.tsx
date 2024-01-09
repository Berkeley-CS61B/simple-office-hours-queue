import { useChannel } from "@ably-labs/react-hooks";
import { useToast } from "@chakra-ui/react";
import { UserRole } from "@prisma/client";
import { useSession } from "next-auth/react";
import useNotification from "../../utils/hooks/useNotification";

/*
 * Listen for broadcast messages from staff. Note: This assumes Ably is connected.
 * This component isn't required but it's cleaner to have it in a separate component.
 */
const ReceiveBroadcast = () => {
	const toast = useToast();
	const { showNotification } = useNotification();
	const { data: session } = useSession();

	useChannel("broadcast", "broadcast", (msg) => {
		const toastId = "broadcast";
		if (toast.isActive(toastId)) return;
		toast({
			id: toastId,
			title: msg.data,
			position: "top",
			status: "info",
			duration: 8000,
			isClosable: true,
			containerStyle: {
				zIndex: 9999,
				width: "95vw",
				maxWidth: "100%",
			},
		});

		// Send a notification when a broadcast is received
		showNotification(undefined, msg.data);
	});

	useChannel("staff-broadcast", (msg) => {
		if (
			session?.user?.role !== UserRole.STAFF &&
			session?.user?.role !== UserRole.INTERN
		) {
			return;
		}

		const toastId = "staff-broadcast";
		if (toast.isActive(toastId)) return;
		toast({
			id: toastId,
			title: msg.data,
			position: "top",
			status: "warning",
			duration: 8000,
			isClosable: true,
			containerStyle: {
				zIndex: 9999,
				width: "95vw",
				maxWidth: "100%",
			},
		});

		// Send a notification when a broadcast is received
		showNotification(undefined, msg.data);
	});

	return <></>;
};

export default ReceiveBroadcast;
