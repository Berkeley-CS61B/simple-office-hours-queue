import { useChannel } from '@ably-labs/react-hooks';
import { useToast } from '@chakra-ui/react';

/*
 * Listen for broadcast messages from staff. Note: This assumes Ably is connected.
 */
const ReceiveBroadcast = () => {

	const toast = useToast();

	const [channel, ably] = useChannel('broadcast', 'broadcast', msg => {
	  // TODO add queue id
	  toast({
		title: msg.data,
		position: 'top',
		status: 'info',
		duration: 3000,
		isClosable: true,
		containerStyle: {
		  zIndex: 9999,
		  width: '800px',
		  maxWidth: '100%',
		},
	  });
	});

	return (
		<div></div>
	);
}

export default ReceiveBroadcast;