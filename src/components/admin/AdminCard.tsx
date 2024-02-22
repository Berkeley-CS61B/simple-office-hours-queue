import {CheckIcon, CloseIcon, EditIcon} from "@chakra-ui/icons";
import {
    ButtonGroup,
    Checkbox,
    Editable,
    EditableInput,
    EditablePreview,
    Flex, FormControl,
    IconButton,
    Input,
    Switch,
    Text,
    useColorModeValue,
    useEditableControls,
    useToast,
} from "@chakra-ui/react";

import {Assignment, Category, Location} from "@prisma/client";
import {UseTRPCMutationResult} from "@trpc/react/shared";
import {useState} from "react";
import {FaEye, FaEyeSlash} from "react-icons/fa";
import {DARK_GRAY_COLOR} from "../../utils/constants";
import {trpc} from "../../utils/trpc";
import {MultiValue, Select, SingleValue} from "chakra-react-select";
import {assign} from "next/dist/shared/lib/router/utils/querystring";
import {uppercaseFirstLetter} from "../../utils/utils";


interface AdminCardProps {
    assignmentOrLocation: Assignment | Location;
    editMutation: UseTRPCMutationResult<any, any, any, any>;
    isHiddenVisible: boolean;
    isAssignment: boolean;
}


const EditableControls = () => {
    const {
        isEditing,
        getSubmitButtonProps,
        getCancelButtonProps,
        getEditButtonProps,
    } = useEditableControls();

    return isEditing ? (
        <ButtonGroup ml={4} mt={1} justifyContent="center" size="sm">
            <IconButton
                aria-label="Confirm"
                icon={<CheckIcon/>}
                {...getSubmitButtonProps()}
            />
            <IconButton
                aria-label="Cancel"
                icon={<CloseIcon/>}
                {...getCancelButtonProps()}
            />
        </ButtonGroup>
    ) : (
        <Flex ml={2} mt={1} justifyContent="center">
            <IconButton
                aria-label="Edit"
                size="sm"
                icon={<EditIcon/>}
                {...getEditButtonProps()}
            />
        </Flex>
    );
};

/**
 * Component which represents a single assignment or location
 */
const AdminCard = (props: AdminCardProps) => {
    const {assignmentOrLocation, editMutation, isHiddenVisible, isAssignment} =
        props;
    const boxColor = useColorModeValue("gray.100", DARK_GRAY_COLOR);
    const [isActive, setIsActive] = useState(assignmentOrLocation.isActive);
    const [isHidden, setIsHidden] = useState(assignmentOrLocation.isHidden);
    const [isPriority, setIsPriority] = useState(
        isAssignment ? (assignmentOrLocation as Assignment).isPriority : false,
    );

    const [isLabOnly, setIsLabOnly] = useState(isAssignment ? undefined : (assignmentOrLocation as Location).isLabOnly);
    const [assignmentCategory, setAssignmentCategory] = useState(isAssignment ? (assignmentOrLocation as Assignment).category : undefined);
    const [locationCategories, setLocationCategories] = useState<Category[]>();

    const context = trpc.useContext();
    const toast = useToast();

    trpc.admin.getCategoriesForLocation.useQuery({locationId: (isAssignment ? undefined : (assignmentOrLocation as Location).id)}, {
        refetchOnWindowFocus: false,
        onSuccess: (data) => {
            setLocationCategories(data.map((result) => result.category));
        },
    })

    const handleNameChange = async (newName: string) => {
        await editMutation.mutateAsync({
            id: assignmentOrLocation.id,
            name: newName,
            isActive: assignmentOrLocation.isActive,
            isHidden: assignmentOrLocation.isHidden,
            category: isAssignment ? (assignmentOrLocation as Assignment).category : undefined,
            categories: isAssignment ? undefined : categories,
        });
    };

    const handlePriorityChange = async (newPriority: boolean) => {
        setIsPriority(newPriority);
        await editMutation.mutateAsync({
            id: assignmentOrLocation.id,
            name: assignmentOrLocation.name,
            isActive: assignmentOrLocation.isActive,
            isHidden: assignmentOrLocation.isHidden,
            isPriority: newPriority,
            category: isAssignment ? (assignmentOrLocation as Assignment).category : undefined,
            categories: isAssignment ? undefined : categories,
        });
    };

    const handleActiveChange = async () => {
        const newActive = !isActive;
        setIsActive(newActive);
        await editMutation
            .mutateAsync({
                id: assignmentOrLocation.id,
                name: assignmentOrLocation.name,
                isActive: newActive,
                isHidden: newActive ? false : isHidden,
                category: isAssignment ? (assignmentOrLocation as Assignment).category : undefined,
                categories: isAssignment ? undefined : categories,
            })
            .then(() => {
                context.admin.getAllLocations.invalidate();
                context.admin.getAllAssignments.invalidate();
            })
            .catch((err) => {
                toast({
                    title: "Error",
                    description: err.message,
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                    position: "top-right",
                });
            });
    };

    const handleHidden = async () => {
        setIsHidden(!isHidden);
        await editMutation
            .mutateAsync({
                id: assignmentOrLocation.id,
                name: assignmentOrLocation.name,
                isActive: assignmentOrLocation.isActive,
                isHidden: !isHidden,
                category: isAssignment ? (assignmentOrLocation as Assignment).category : undefined,
                categories: isAssignment ? undefined : categories,
            })
            .then(() => {
                context.admin.getAllLocations.invalidate();
                context.admin.getAllAssignments.invalidate();
            })
            .catch((err) => {
                toast({
                    title: "Error",
                    description: err.message,
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                    position: "top-right",
                });
            });
    };

    const handleLabOnlyChange = async () => {
        const newLabOnly = !isLabOnly;
        setIsLabOnly(newLabOnly);
        await editMutation
            .mutateAsync({
                id: assignmentOrLocation.id,
                name: assignmentOrLocation.name,
                isActive: isActive,
                isHidden: isHidden,
                isLabOnly: newLabOnly,
            })
            .then(() => {
                context.admin.getAllLocations.invalidate();
                context.admin.getAllAssignments.invalidate();
            })
            .catch(err => {
                toast({
                    title: 'Error',
                    description: err.message,
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                    position: 'top-right',
                });
            });
    };

    const handleAssignmentCategoryChange = async (category: Category | undefined) => {
        setAssignmentCategory(category);
        await editMutation
            .mutateAsync({
                id: assignmentOrLocation.id,
                name: assignmentOrLocation.name,
                isActive: isActive,
                isHidden: isHidden,
                category: category,
            })
            .then(() => {
                context.admin.getAllLocations.invalidate();
                context.admin.getAllAssignments.invalidate();
            })
            .catch(err => {
                toast({
                    title: 'Error',
                    description: err.message,
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                    position: 'top-right',
                });
            });
    };

    const handleLocationCategoriesChange = async (categories: Category[]) => {
        setLocationCategories(categories);
        await editMutation
            .mutateAsync({
                id: assignmentOrLocation.id,
                name: assignmentOrLocation.name,
                isActive: isActive,
                isHidden: isHidden,
                categories: categories,
            })
            .then(() => {
                context.admin.getAllLocations.invalidate();
                context.admin.getAllAssignments.invalidate();
            })
            .catch(err => {
                toast({
                    title: 'Error',
                    description: err.message,
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                    position: 'top-right',
                });
            });
    };

    const categories = Object.values(Category).map((category: Category) => ({
        label: uppercaseFirstLetter(category.toString()),
        value: category,
    }));

    if (!isActive && isHidden && !isHiddenVisible) {
        return null;
    }

    return (
        <Flex
            borderRadius={4}
            mb={2}
            flexDirection="row"
            p={2}
            backgroundColor={boxColor}
            justifyContent="space-between"
        >
            <>
                <Flex w="50%">
                    <Editable
                        onSubmit={handleNameChange}
                        textAlign="center"
                        fontWeight="semibold"
                        display="flex"
                        defaultValue={assignmentOrLocation.name}
                        fontSize="xl"
                        isPreviewFocusable={false}
                    >
                        <EditablePreview/>
                        <Input as={EditableInput}/>
                        <EditableControls/>
                    </Editable>
                    <Text fontSize="large" mt={1.5} ml={5}>
                        Active?
                    </Text>
                    <Switch
                        onChange={handleActiveChange}
                        mt={2.5}
                        ml={3}
                        isChecked={isActive}
                    />

                    <FormControl w={isAssignment ? "30%" : "50%"} ml={2}>
                        {isAssignment ?
                            <Select options={categories} value={assignmentCategory !== undefined ? {label: uppercaseFirstLetter(assignmentCategory.toString()), value: assignmentCategory} : {label: "", value: ""}}
                                    onChange={(newValue: SingleValue<{
                                        label: string | undefined,
                                        value: Category | undefined
                                    }>) => handleAssignmentCategoryChange(newValue?.value)}/>
                            : <Select
                                isMulti
                                options={categories.filter((category) => category.value !== Category.NONE )}
                                value={locationCategories?.map((locationCategory: Category) => {
                                    return {value: locationCategory, label: uppercaseFirstLetter(locationCategory.toString())}
                                })}
                                onChange={(newValue: MultiValue<{
                                    label: string,
                                    value: Category
                                }>) => handleLocationCategoriesChange(newValue.map((item) => item.value))}/>
                        }
                    </FormControl>

                </Flex>
                <Checkbox
                    hidden={!isActive || !isAssignment}
                    onChange={() => handlePriorityChange(!isPriority)}
                    colorScheme="telegram"
                    size="lg"
                    ml={2}
                    isChecked={isPriority}
                >
                    Priority
                </Checkbox>
                {!isActive && (
                    <Flex>
                        {isHidden ? (
                            <FaEyeSlash
                                size="20px"
                                className="hover-cursor"
                                style={{marginTop: "10px"}}
                                onClick={handleHidden}
                            />
                        ) : (
                            <FaEye
                                size="20px"
                                className="hover-cursor"
                                style={{marginTop: "10px"}}
                                onClick={handleHidden}
                            />
                        )}
                    </Flex>
                )}

            </>
        </Flex>

    );
};

export default AdminCard;
