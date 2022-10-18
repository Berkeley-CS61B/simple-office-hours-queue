import { useChannel } from '@ably-labs/react-hooks';
import { useToast } from '@chakra-ui/react';
import useNotification from '../../utils/hooks/useNotification';

/*
 * Listen for broadcast messages from staff. Note: This assumes Ably is connected.
 * This component isn't required but it's cleaner to have it in a separate component.
 */
const ReceiveBroadcast = () => {

	const toast = useToast();
	const { showNotification } = useNotification();

	useChannel('broadcast', 'broadcast', msg => {
	  // TODO add queue id
	  toast({
		title: msg.data,
		position: 'top',
		status: 'info',
		duration: 3000,
		isClosable: true,
		containerStyle: {
		  zIndex: 9999,
		  width: '95vw',
		  maxWidth: '100%',
		},
	  });

	  // Send a notification when a broadcast is received
	  showNotification(undefined, msg.data);
	});

	return (
		<></>
	);
}

export default ReceiveBroadcast;