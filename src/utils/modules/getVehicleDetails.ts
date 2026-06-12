// services/vehicleService.ts
import axios from "axios";

export async function fetchVehicleDetails(
  apiUrl: string,
  jwt: string,
  vehicleId: string,
  internalType = "car.used"
) {
  try {
    const response = await axios.get(`${apiUrl}/vehicle/${vehicleId}`, {
      params: { internal_type: internalType },
      headers: {
        Authorization: `Bearer ${jwt}`,
        "x-client-id": "rrg"
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Error fetching vehicle details:", error);
    throw new Error(
      error.response?.data?.detail || "Failed to fetch vehicle details"
    );
  }
}
