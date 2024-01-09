import { Flex, Heading, Text } from "@chakra-ui/react";
import { COURSE_ID } from "../../utils/constants";

/**
 * Sign in page UI.
 */
const Landing = () => {
	return (
		<Flex direction="column" align="center" justify="center" p={8}>
			<Heading as="h1" size="xl" mb={4}>
				Welcome to the {COURSE_ID} Office Hours Queue
			</Heading>
			<Text mb={4}>
				Please sign in with your school email above to join or manage the queue.
			</Text>
		</Flex>
	);
};

export default Landing;
