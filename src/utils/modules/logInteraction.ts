type VehicleSummary = {
  brand: string;
  model: string;
  year: number;
  km?: number;
  price: number;
  mileage?: number;
  fuelType?: string;
  transmission?: string;
};

interface LogInteractionOptions {
  event: "card_click" | "go_back";
  clientId?: string;
  vehicleId?: string;
  vehicleSummary?: VehicleSummary;
  vehicleList?: VehicleSummary[];
}

export async function logInteraction(
  apiUrl: string,
  jwt: string,
  {
    event,
    clientId = "rrg",
    vehicleId,
    vehicleSummary,
    vehicleList,
  }: LogInteractionOptions
) {
  const body: Record<string, unknown> = {
    event,
    client_id: clientId,
  };

  if (event === "card_click" && vehicleId && vehicleSummary) {
    body.vehicle_id = vehicleId;
    body.vehicle_summary = vehicleSummary;
  }

  if (event === "go_back" && vehicleList) {
    body.vehicle_list = vehicleList;
  }

  const res = await fetch(`${apiUrl}/log_interaction`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
      "x-client-id": "rrg"
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`logInteraction failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}
