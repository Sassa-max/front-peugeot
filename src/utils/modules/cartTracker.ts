type CartTrackingParams = {
  leadId: string | null;
  carId: string | null;
  apiUrl: string;
  jwt: string;
};

export async function cartTracker({
  leadId,
  carId,
  apiUrl,
  jwt,
}: CartTrackingParams): Promise<boolean> {
  if (!leadId || !carId) {
    console.warn("Missing leadId or carId for cart tracking.");
    return false;
  }

  try {
    const res = await fetch(`${apiUrl}/tracking/lead`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
        "x-client-id": "rrg"
      },
      body: JSON.stringify({
        lead_id: leadId,
        car_id: carId,
        type: 'RESA',
      }),
    });

    if (!res.ok) {
      console.error(`Cart tracking failed: ${res.status}`);
      return false;
    }

    return true;
  } catch (err: any) {
    console.error(`Cart tracking error: ${err.message}`);
    return false;
  }
}
