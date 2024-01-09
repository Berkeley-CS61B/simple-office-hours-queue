import { EditIcon } from "@chakra-ui/icons";
import {
	Box,
	Button,
	ButtonGroup,
	FormControl,
	FormLabel,
	IconButton,
	Input,
	Popover,
	PopoverArrow,
	PopoverCloseButton,
	PopoverContent,
	PopoverTrigger,
	Stack,
	useColorModeValue,
	useToast,
} from "@chakra-ui/react";
import React, { useState } from "react";
import { DARK_MODE_COLOR } from "../../utils/constants";
import { trpc } from "../../utils/trpc";

interface NamePopoverFormProps {
	name: string;
	isOpen: boolean;
	onOpen: () => void;
	onClose: () => void;
}

/**
 * NamePopoverForm for editing user's preferred name
 * @source https://chakra-ui.com/docs/components/popover/usage
 */
const NamePopoverForm = (props: NamePopoverFormProps) => {
	const { name, isOpen, onOpen, onClose } = props;
	const [preferredName, setPreferredName] = useState(name);
	const setPreferredNameMutation = trpc.user.setPreferredName.useMutation();
	const toast = useToast();

	const handleNameChange = async () => {
		onClose();
		await setPreferredNameMutation
			.mutateAsync({ preferredName })
			.then(() => {
				toast({
					title: "Name updated.",
					status: "success",
					duration: 3000,
					isClosable: true,
					position: "top-right",
				});
			})
			.catch((err) => {
				toast({
					title: "Error updating name. Refresh and try again.",
					description: err.message,
					status: "error",
					duration: 3000,
					isClosable: true,
					position: "top-right",
				});
				console.error(err);
			});
	};

	const handleClose = () => {
		setPreferredName(name);
		onClose();
	};

	return (
		<>
			<Box mr={3}>{preferredName}</Box>
			<Popover
				isOpen={isOpen}
				onOpen={onOpen}
				onClose={handleClose}
				placement="bottom"
				closeOnBlur={false}
			>
				<PopoverTrigger>
					<IconButton aria-label="edit-icon" size="sm" icon={<EditIcon />} />
				</PopoverTrigger>
				<PopoverContent
					p={5}
					backgroundColor={useColorModeValue("white", DARK_MODE_COLOR)}
				>
					<PopoverArrow />
					<PopoverCloseButton />
					<Stack spacing={4}>
						<FormControl>
							<FormLabel htmlFor="name">Preferred name</FormLabel>
							<Input
								onChange={(e) => setPreferredName(e.target.value)}
								value={preferredName}
							/>
						</FormControl>
						<ButtonGroup display="flex" justifyContent="flex-end">
							<Button variant="outline" onClick={handleClose}>
								Cancel
							</Button>
							<Button
								isDisabled={preferredName.trim().length <= 0}
								colorScheme="whatsapp"
								onClick={handleNameChange}
							>
								Save
							</Button>
						</ButtonGroup>
					</Stack>
				</PopoverContent>
			</Popover>
		</>
	);
};

export default NamePopoverForm;
