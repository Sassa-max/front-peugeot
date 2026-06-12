import React, { useEffect, useState } from "react";
import { createParser } from "eventsource-parser";

type ToolCall = { name: string; params: Record<string, any> };
type ToolResult = Record<string, any>;

type UseChatbotAnswerResult = {
  toolCalls: ToolCall[] | null;
  toolResults: ToolResult[] | null;
  noOnGoBack: boolean;
  meta: any;
  loading: boolean;
  error: string | null;
};

type ChatbotAnswerParams = {
  setAnswer: React.Dispatch<React.SetStateAction<string>>;
  question: string | null;
  apiUrl: string;
  jwt: string;
  setJwt: React.Dispatch<React.SetStateAction<string>>;
  successForm: boolean;
  setSuccessForm: React.Dispatch<React.SetStateAction<boolean>>;
};

export function useChatbotAnswer({
  setAnswer,
  question,
  apiUrl,
  setJwt,
  jwt,
  successForm,
  setSuccessForm,
}: ChatbotAnswerParams): UseChatbotAnswerResult {
  const [toolCalls, setToolCalls] = useState<ToolCall[] | null>(null);
  const [toolResults, setToolResults] = useState<ToolResult[] | null>(null);
  const [noOnGoBack, setNoOnGoBack] = useState(false);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageId, setMessageId] = useState<string>("");

  useEffect(() => {
    if (!question && successForm === null) return;

    let cancelled = false;
    setAnswer("");
    setToolCalls(null);
    setToolResults(null);
    setError(null);
    setLoading(true);
    const run = async () => {
      try {
        const res = await fetch(`${apiUrl}/answer`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-client-id": "rrg",
            Authorization: `Bearer ${jwt}`,
          },
          body: JSON.stringify({
            query: question,
            client_id: "rrg", //à ne pas changer
            message_id: messageId ?? "",
            form_success: successForm,
          }),
        });

        if (!res.ok || !res.body)
          throw new Error(`Server error: ${res.status}`);

        const newToken = res.headers.get("X-Session-Token");
        if (newToken) {
          setJwt(newToken);
        }
        const decoder = new TextDecoder();
        const reader = res.body.getReader();

        const parser = createParser((event) => {
          if (event.type === "event") {
            const { event: eventType, data } = event;
            if (eventType === "meta") {
              try {
                const metaParsed = JSON.parse(data);
                setMeta(metaParsed);
                setToolCalls(metaParsed?.tool_calls || null);
                setToolResults(metaParsed?.tool_results || null);
                setMessageId(metaParsed?.message_id || "");
                setNoOnGoBack(metaParsed?.tool_metadata?.noOnGoBack || false);
              } catch {
                setError("Malformed meta event");
              }
            } else {
              setAnswer((prev) => prev + data.replaceAll("__NEWLINE__", "\n"));
            }
          }
        });

        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          parser.feed(chunk);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Unknown error");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setSuccessForm(null);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [question, setAnswer, successForm]);

  return { toolCalls, toolResults, noOnGoBack, meta, loading, error };
}
