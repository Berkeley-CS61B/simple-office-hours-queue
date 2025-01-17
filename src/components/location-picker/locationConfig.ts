interface LocationConfig {
  hasLocationPicker: boolean; // Whether this location supports the visual picker
  staffImagePath?: string; // Path to staff view floor plan
  studentImagePath?: string; // Path to student view floor plan
  name: string; // The name of the location that should match
}

// Map of location IDs to their configuration
// Each location can have different floor plans for staff/students
// Important: make sure the location ID value is for the correct room based on the database
const locationConfigs: Record<number, LocationConfig> = {
  9: {
    // Soda 271
    hasLocationPicker: true,
    staffImagePath: "/location-picker-images/271-staff-v1.png",
    studentImagePath: "/location-picker-images/271-student-v1.png",
    name: "Soda 271",
  },
  10: {
    // Soda 273
    hasLocationPicker: true,
    staffImagePath: "/location-picker-images/273-staff-v1.png",
    studentImagePath: "/location-picker-images/273-student-v1.png",
    name: "Soda 273",
  },
  11: {
    // Soda 275
    hasLocationPicker: true,
    staffImagePath: "/location-picker-images/275-staff-v1.png",
    studentImagePath: "/location-picker-images/275-student-v1.png",
    name: "Soda 275",
  },
};

// Check if a location supports the visual picker and matches the expected name
export const hasLocationPicker = (
  locationId: number,
  locationName?: string,
): boolean => {
  const config = locationConfigs[locationId];
  if (!config?.hasLocationPicker) {
    return false;
  }
  // If locationName is provided, verify it matches the expected name
  if (locationName && config.name !== locationName) {
    return false;
  }
  return true;
};

// Get the appropriate floor plan image based on location and user role
export const getLocationImagePath = (
  locationId: number,
  isStaff: boolean,
): string | undefined => {
  const config = locationConfigs[locationId];
  if (!config) {
    return undefined;
  }

  // Return staff or student view based on user role
  return isStaff ? config.staffImagePath : config.studentImagePath;
};

export default locationConfigs;
