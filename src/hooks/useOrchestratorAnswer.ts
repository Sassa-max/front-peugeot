import { useEffect, useState } from "react";
import { createParser } from "eventsource-parser";

import { OrchestrationResult } from "../utils/formatting";

type UseOrchestratorAnswerParams = {
  setAnswer: React.Dispatch<React.SetStateAction<string>>;
  question: string | null;
  apiUrl: string;
  jwt: string;
  sessionId: string;
  setJwt: React.Dispatch<React.SetStateAction<string>>;
  successForm: boolean | null;
  setSuccessForm: React.Dispatch<React.SetStateAction<boolean | null>>;
};

type UseOrchestratorAnswerResult = {
  loading: boolean;
  error: string | null;
  introText: string;
  orchestrationProgress: string;
  orchestrationResult: OrchestrationResult | null;
};

function decodeSseData(data: string): string {
  return data.replaceAll("__NEWLINE__", "\n");
}

export function useOrchestratorAnswer({
  setAnswer,
  question,
  apiUrl,
  setJwt,
  jwt,
  sessionId,
  successForm,
  setSuccessForm,
}: UseOrchestratorAnswerParams): UseOrchestratorAnswerResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [introText, setIntroText] = useState("");
  const [orchestrationProgress, setOrchestrationProgress] = useState("");
  const [orchestrationResult, setOrchestrationResult] =
    useState<OrchestrationResult | null>(null);

  useEffect(() => {
    if (!question && successForm === null) {
      return;
    }

    let cancelled = false;

    setAnswer("");
    setError(null);
    setIntroText("");
    setOrchestrationProgress("");
    setOrchestrationResult(null);
    setLoading(true);

    const run = async () => {
      try {
        console.info("[ShopperChat] POST", `${apiUrl}/answer`, { query: question });
        const res = await fetch(`${apiUrl}/answer`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-client-id": "shoppergpt",
            Authorization: `Bearer ${jwt || sessionId}`,
          },
          body: JSON.stringify({
            query: question,
            client_id: sessionId,
            form_success: successForm,
          }),
        });

        if (!res.ok || !res.body) {
          throw new Error(`Server error: ${res.status}`);
        }

        const newToken = res.headers.get("X-Session-Token");
        if (newToken) {
          setJwt(newToken);
        }

        const decoder = new TextDecoder();
        const reader = res.body.getReader();

        const parser = createParser((event) => {
          if (event.type !== "event") {
            return;
          }

          const eventType = event.event || "message";
          const data = decodeSseData(event.data);

          if (eventType === "intro") {
            setIntroText((prev) => prev + data);
            return;
          }

          if (eventType === "progress") {
            setOrchestrationProgress(data);
            return;
          }

          if (eventType === "result") {
            try {
              setOrchestrationResult(JSON.parse(data));
            } catch {
              setError("Malformed result event");
            }
            return;
          }

          if (eventType === "done") {
            return;
          }

          // waib-widget pattern: default SSE messages append answer tokens.
          // "answer" kept for backwards compatibility (single-shot full text).
          if (eventType === "answer") {
            setOrchestrationProgress("");
            setAnswer(data);
            return;
          }

          setOrchestrationProgress("");
          setAnswer((prev) => prev + data);
        });

        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          parser.feed(decoder.decode(value, { stream: true }));
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Unknown error";
          console.error(`[ShopperChat] Answer request failed (${apiUrl}/answer):`, message);
          setError(message);
        }
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
  }, [question, setAnswer, successForm, apiUrl, jwt, sessionId, setJwt, setSuccessForm]);

  return {
    loading,
    error,
    introText,
    orchestrationProgress,
    orchestrationResult,
  };
}
