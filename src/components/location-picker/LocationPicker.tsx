import { Box, Image, useColorModeValue } from "@chakra-ui/react";
import { UserRole } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { getLocationImagePath } from "./locationConfig";
import { Location } from "../queue/CreateTicketForm";

interface LocationPickerProps {
  onChange: (coordinates: { x: number; y: number }) => void;
  initialCoordinates?: { x: number; y: number };
  disabled?: boolean;
  location: Location;
}

const LocationPicker = ({
  onChange,
  initialCoordinates,
  disabled = false,
  location,
}: LocationPickerProps) => {
  const { data: session } = useSession();
  const [coordinates, setCoordinates] = useState<{
    x: number;
    y: number;
  } | null>(initialCoordinates || null);
  const isStaff = session?.user?.role === UserRole.STAFF;

  // Get the appropriate image path based on user role (staff/student)
  const locationId = location?.id;
  const imagePath = getLocationImagePath(locationId, isStaff);
  const imageSrc = imagePath;

  // Update coordinates if initialCoordinates prop changes
  useEffect(() => {
    if (initialCoordinates) {
      setCoordinates(initialCoordinates);
    } else {
      // Reset to null when location changes and no initialCoordinates
      setCoordinates(null);
    }
  }, [initialCoordinates, location?.id]);

  // Track image loading state to prevent visual glitches
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  // Track if image is wider than tall for responsive sizing
  const [isHorizontal, setIsHorizontal] = useState(true);

  // Handle clicks on the image to update coordinates
  const handleImageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;

    const rect = event.currentTarget.getBoundingClientRect();
    let x = ((event.clientX - rect.left) / rect.width) * 100;
    let y = ((event.clientY - rect.top) / rect.height) * 100;

    // Ensure coordinates stay within bounds
    x = Math.min(Math.max(x, 0), 100);
    y = Math.min(Math.max(y, 0), 100);

    // Invert coordinates for staff view
    if (isStaff) {
      x = 100 - x;
      y = 100 - y;
    }

    const newCoordinates = { x, y };
    setCoordinates(newCoordinates);
    onChange(newCoordinates);
  };

  // Determine image orientation on load for proper sizing
  const handleImageLoad = (
    event: React.SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    const img = event.currentTarget;
    setIsImageLoaded(true);
    setIsHorizontal(img.naturalWidth >= img.naturalHeight);
  };

  // Adjust container width based on image orientation
  const maxWidth = isHorizontal ? "500px" : "300px";

  return (
    <Box
      position="relative"
      cursor={disabled ? "default" : coordinates ? "pointer" : "crosshair"}
      maxWidth={maxWidth}
      margin="0 auto"
      role="button"
      aria-label="Pick location on room layout"
      borderRadius="lg"
      overflow="hidden"
      boxShadow="lg"
    >
      <Image
        src={imageSrc}
        alt="Room layout"
        width="100%"
        height="auto"
        userSelect="none"
        objectFit="cover"
        onLoad={handleImageLoad}
        style={{
          opacity: isImageLoaded ? 1 : 0,
          transition: "opacity 0.3s ease-in-out",
        }}
      />
      {isImageLoaded && coordinates && (
        <>
          <Box
            position="absolute"
            left={`${isStaff ? 100 - coordinates.x : coordinates.x}%`}
            top={`${isStaff ? 100 - coordinates.y : coordinates.y}%`}
            transform="translate(-50%, -50%)"
            fontSize="32px"
            aria-label="Selected location marker"
          >
            👋
          </Box>
        </>
      )}
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        onClick={handleImageClick}
      />
    </Box>
  );
};

export default LocationPicker;
