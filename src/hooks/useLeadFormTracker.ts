import { useState, useCallback, useRef } from "react";

type LeadTrackingParams = {
  leadId: string | null;
  carId: string | null;
  formType: string | null;
  apiUrl: string;
  jwt: string;
};

type UseLeadTrackingResult = {
  successLead: boolean;
  loadLead: boolean;
  errorLead: string | null;
  trackLead: () => Promise<void>;
  reset: () => void;
};

export function useLeadFormTracker({
  leadId,
  carId,
  formType,
  apiUrl,
  jwt,
}: LeadTrackingParams): UseLeadTrackingResult {
  const [successLead, setSuccessLead] = useState(false);
  const [loadLead, setLoadLead] = useState(false);
  const [errorLead, setErrorLead] = useState<string | null>(null);
  const isTrackingRef = useRef(false);

  const trackLead = useCallback(async () => {
    // Validate required parameters
    if (!leadId || !carId || !formType) {
      console.warn("useLeadFormTracker: Missing required parameters", {
        leadId,
        carId,
        formType,
      });
      return;
    }

    // Prevent duplicate calls
    if (isTrackingRef.current) {
      console.warn("useLeadFormTracker: Tracking already in progress");
      return;
    }

    isTrackingRef.current = true;
    setLoadLead(true);
    setErrorLead(null);
    setSuccessLead(false);

    try {
      console.log("useLeadFormTracker", leadId, carId, formType, apiUrl, jwt);
      console.log("typeOfCarId", typeof carId);

      const res = await fetch(`${apiUrl}/tracking/lead`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
          "x-client-id": "rrg",
        },
        body: JSON.stringify({
          lead_id: leadId,
          car_id: carId,
          type: formType,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      setSuccessLead(true);
    } catch (err: any) {
      setErrorLead(err.message || "Unknown error");
    } finally {
      setLoadLead(false);
      isTrackingRef.current = false;
    }
  }, [leadId, carId, formType, apiUrl, jwt]);

  const reset = useCallback(() => {
    setSuccessLead(false);
    setErrorLead(null);
    setLoadLead(false);
    isTrackingRef.current = false;
  }, []);

  return { successLead, loadLead, errorLead, trackLead, reset };
}
