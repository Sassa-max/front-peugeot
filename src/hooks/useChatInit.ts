import React, { useEffect, useState } from "react";

export interface ChatInitParams {
  apiUrl: string;
  jwt: string;
  setJwt: React.Dispatch<React.SetStateAction<string>>;
  setSessionId: React.Dispatch<React.SetStateAction<string>>;
}

export function useChatInit({
  apiUrl,
  setJwt,
  jwt,
  setSessionId,
}: ChatInitParams) {
  const [loadInit, setLoadInit] = useState(true);
  const [errorHistory, setErrorHistory] = useState<string | null>(null);

  useEffect(() => {
    if (!apiUrl) {
      setLoadInit(false);
      return;
    }

    async function initSession() {
      setLoadInit(true);
      console.info("[ShopperChat] Initializing session against", apiUrl);
      try {
        const response = await fetch(`${apiUrl}/init?force=true`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${jwt}`,
            "X-Client-Id": "shoppergpt"
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `HTTP ${response.status}`);
        }
        const newToken = response.headers.get("X-Session-Token");
        if (newToken) {
          setJwt(newToken);
        }
        const data = await response.json();
        setSessionId(data.session_id);
        console.info("[ShopperChat] Session ready:", data.session_id);
        // Call tracking/session
        try {
          await fetch(`${apiUrl}/tracking/session`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${jwt || newToken || ""}`,
              "x-client-id": "shoppergpt",
            },
            body: JSON.stringify({ session_id: data.session_id }),
          });
        } catch (trackingError) {
          console.warn("Session tracking skipped:", trackingError);
        }
      } catch (err: any) {
        const message = err.message || "Failed to load chat history";
        console.error(
          `[ShopperChat] Failed to reach API at ${apiUrl}/init:`,
          message
        );
        setErrorHistory(message);
      } finally {
        setLoadInit(false);
      }
    }
    initSession();
  }, []);

  return loadInit;
}
