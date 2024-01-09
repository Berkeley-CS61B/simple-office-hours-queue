import { Radio, RadioGroup, Stack, Text } from "@chakra-ui/react";
import { UserRole } from "@prisma/client";
import { useState } from "react";
import { trpc } from "../../utils/trpc";
import {
	ImportNumberPossibilities,
	ImportNumberPossibilitiesType,
} from "../../utils/utils";
import BatchImporter from "./import/BatchImporter";
import SingleImporter from "./import/SingleImporter";

export interface ImportedUser {
	email: string;
	role: UserRole;
}

const ImportUsers = () => {
	const [importType, setImportType] = useState<ImportNumberPossibilitiesType>(
		ImportNumberPossibilities.SINGLE_IMPORT,
	);
	const addUserMutation = trpc.user.addUsers.useMutation();

	const handleAddUsers = async (users: ImportedUser[]) => {
		await addUserMutation.mutateAsync(users);
	};

	return (
		<>
			<Text fontSize="xl" mb={1}>
				Import method
			</Text>
			<RadioGroup
				onChange={(val: ImportNumberPossibilitiesType) => setImportType(val)}
				value={importType}
			>
				<Stack spacing={5} direction="row">
					<Radio value={ImportNumberPossibilities.SINGLE_IMPORT}>
						Single import
					</Radio>
					<Radio value={ImportNumberPossibilities.BATCH_IMPORT}>
						Batch import
					</Radio>
				</Stack>
			</RadioGroup>
			{importType === ImportNumberPossibilities.BATCH_IMPORT ? (
				<BatchImporter handleAddUsers={handleAddUsers} />
			) : (
				<SingleImporter handleAddUsers={handleAddUsers} />
			)}
		</>
	);
};

export default ImportUsers;
