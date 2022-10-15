import { Button } from "@chakra-ui/react";
import { SiteSettings, SiteSettingsValues } from "@prisma/client";
import useSiteSettings from "../../utils/hooks/useSiteSettings";
import { trpc } from "../../utils/trpc";

const OpenOrCloseQueue = () => {
	const { siteSettings, isLoading } = useSiteSettings();
	const setSiteSettingsMutation = trpc.admin.setSiteSettings.useMutation();

	if (isLoading) return <></>;

	const isQueueOpen = siteSettings?.get(SiteSettings.IS_QUEUE_OPEN) === SiteSettingsValues.TRUE;

	const handleOpenOrCloseQueue = () => {
		const valueToSet = isQueueOpen ? SiteSettingsValues.FALSE : SiteSettingsValues.TRUE;
		setSiteSettingsMutation.mutateAsync({
			[SiteSettings.IS_QUEUE_OPEN]: valueToSet,
		});
	}

	return (
		<Button onClick={handleOpenOrCloseQueue} outlineColor='red.300' outlineOffset={-2} m={4} mb={0}>
			{isQueueOpen ? 'Close' : 'Open'} Queue
		</Button>
	)
}

export default OpenOrCloseQueue;