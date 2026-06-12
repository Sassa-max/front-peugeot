import { useMediaQuery } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { Message } from "../types/chatBot";
import { ChatMessage } from "../types/chatMessage";

export interface ChatHistoryParams {
  apiUrl: string;
  page: number;
  messages: Message[];
  jwt: string;
  setJwt: React.Dispatch<React.SetStateAction<string>>;
}

export function useChatHistory({
  apiUrl,
  page,
  messages,
  setJwt,
  jwt
}: ChatHistoryParams) {
  const isMobile = useMediaQuery("(max-width:899px)");
  const [prevMessages, setPrevMessages] = useState<ChatMessage[]>([]);
  const [loadHistory, setLoadHistory] = useState(true);
  const [errorHistory, setErrorHistory] = useState<string | null>(null);
  const [totalNbrMsgs, setTotalNbrMsgs] = useState<number>(1);
  const [noData, setNoData] = useState(false);

  const fetchedPages = useRef<Set<number>>(new Set());

  async function fetchHistory() {
    setLoadHistory(true);
    setErrorHistory(null);
    if (!noData) {
      try {
        const response = await fetch(
          `${apiUrl}/history?page=${page}&limit=${isMobile ? 6 : 8}`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${jwt}`,
              "x-client-id": "rrg"
            }
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `HTTP ${response.status}`);
        }
        const newToken = response.headers.get("X-Session-Token");
        if (newToken) {
          setJwt(newToken);
        }

        const data = await response.json();

        if (data.messages.length === 0) {
          setNoData(true);
        }
        setPrevMessages(data.messages);
        setTotalNbrMsgs(data.total_messages);

        fetchedPages.current.add(page);
      } catch (err: any) {
        setErrorHistory(err.message || "Failed to load chat history");
      } finally {
        setLoadHistory(false);
      }
    }
  }

  useEffect(() => {
    if (fetchedPages.current.has(page)) return;

    if (messages.length > 1) {
      fetchHistory();
    }
  }, [page, apiUrl, isMobile]);

  return {
    prevMessages,
    loadHistory,
    fetchHistory,
    errorHistory,
    totalNbrMsgs
  };
}
