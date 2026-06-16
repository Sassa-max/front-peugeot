import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { v4 as uuidv4 } from "uuid";

import { useScrollToBottom } from "../hooks/useAutoScrollToBottom";
import { useChatSessionOptional } from "../hooks/useChatSession";
import {
  parseOrchestrationProgress,
  parseSimpleMarkdown,
} from "../utils/modules/markDown";
import { Box, Button, Stack, useMediaQuery, Modal } from "@mui/material";
import { ChatUIProps, Message } from "../types/chatBot";
import InputChat from "./Input/InputChat";
import LoaderDots from "./LoaderDots";
import Icon from "../utils/icons";

type GradioHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

let cachedGradioApiName: string | null = null;

function messagesToGradioHistory(messages: Message[]): GradioHistoryMessage[] {
  return messages
    .filter((message) => message.id !== "typing")
    .map((message) => ({
      role: message.name === "Vous" ? "user" : "assistant",
      content: message.object,
    }));
}

async function resolveGradioApiName(gradioUrl: string): Promise<string> {
  if (cachedGradioApiName) {
    return cachedGradioApiName;
  }

  try {
    const response = await fetch(`${gradioUrl}/gradio_api/info`);
    if (response.ok) {
      const info = await response.json();
      if (info?.named_endpoints?.chat) {
        cachedGradioApiName = "chat";
        return cachedGradioApiName;
      }

      const endpointName = Object.keys(info?.named_endpoints ?? {}).find(
        (name) => name.toLowerCase().includes("chat"),
      );
      if (endpointName) {
        cachedGradioApiName = endpointName;
        return endpointName;
      }
    }
  } catch {
    // Fall back to the default ChatInterface route name.
  }

  cachedGradioApiName = "chat";
  return cachedGradioApiName;
}

function extractStreamText(payload: unknown): string | null {
  if (typeof payload === "string") {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;

  if (typeof record.msg === "string" && record.output) {
    return extractStreamText(record.output);
  }

  if (record.output) {
    return extractStreamText(record.output);
  }

  if (Array.isArray(record.data)) {
    return extractStreamText(record.data);
  }

  if (Array.isArray(payload)) {
    if (payload.length === 0) {
      return null;
    }

    const lastItem = payload[payload.length - 1];

    if (typeof lastItem === "string") {
      return lastItem;
    }

    if (
      lastItem &&
      typeof lastItem === "object" &&
      "role" in (lastItem as Record<string, unknown>) &&
      (lastItem as { role?: string }).role === "assistant" &&
      typeof (lastItem as { content?: string }).content === "string"
    ) {
      return (lastItem as { content: string }).content;
    }

    if (payload.length === 1) {
      return extractStreamText(payload[0]);
    }

    if (typeof payload[0] === "string" && typeof payload[1] === "string") {
      return payload[1];
    }
  }

  return null;
}

async function* readGradioSseStream(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<unknown> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      if (!chunk.trim()) {
        continue;
      }

      let dataLine = "";

      for (const line of chunk.split("\n")) {
        if (line.startsWith("data:")) {
          dataLine += line.slice(5).trim();
        }
      }

      if (!dataLine) {
        continue;
      }

      try {
        yield JSON.parse(dataLine);
      } catch {
        yield dataLine;
      }
    }
  }
}

async function streamGradioChat(
  gradioUrl: string,
  message: string,
  history: GradioHistoryMessage[],
  onChunk: (text: string) => void,
): Promise<string> {
  const apiName = await resolveGradioApiName(gradioUrl);
  const startResponse = await fetch(`${gradioUrl}/gradio_api/call/${apiName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: [message, history],
    }),
  });

  if (!startResponse.ok) {
    throw new Error(`Gradio error: ${startResponse.status}`);
  }

  const { event_id: eventId } = await startResponse.json();
  const streamResponse = await fetch(
    `${gradioUrl}/gradio_api/call/${apiName}/${eventId}`,
  );

  if (!streamResponse.ok || !streamResponse.body) {
    throw new Error(`Gradio stream error: ${streamResponse.status}`);
  }

  let latestText = "";

  for await (const eventPayload of readGradioSseStream(streamResponse.body)) {
    const nextText = extractStreamText(eventPayload);
    if (nextText && nextText !== latestText) {
      latestText = nextText;
      onChunk(latestText);
    }
  }

  return latestText;
}

export const ChatUI = ({
  messages: externalMessages,
  setMessages: externalSetMessages,
  answer: externalAnswer = "",
  setAnswer: externalSetAnswer,
  question: externalQuestion,
  setQuestion: externalSetQuestion,
  loading: externalLoading = false,
  introText: externalIntroText = "",
  orchestrationProgress: externalOrchestrationProgress = "",
  componentType: externalComponentType = "",
  externalComponents,
  TypoComponent: externalTypoComponent,
  apiUrl: externalApiUrl = "",
  gradioUrl = "",
  onStreamUpdate,
  wasACardClicked: externalWasACardClicked = false,
  lastMessageId: externalLastMessageId = null,
  wasGoBackButtonHit: externalWasGoBackButtonHit = false,
  finalMsgSent: externalFinalMsgSent = false,
  sendForm: externalSendForm = null,
  rightPartInteraction: externalRightPartInteraction = false,
  handleRecaptchaOnce: externalHandleRecaptchaOnce,
}: ChatUIProps) => {
  const session = useChatSessionOptional();
  const usesGradio = Boolean(gradioUrl);
  const [internalAnswer, setInternalAnswer] = useState("");
  const [internalLoading, setInternalLoading] = useState(false);
  const streamAbortRef = useRef<AbortController | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const lastMessageRef = useRef<HTMLDivElement | null>(null);

  const messages = session?.messages ?? externalMessages ?? [];
  const setMessages = session?.setMessages ?? externalSetMessages!;
  const TypoComponent = session?.TypoComponent ?? externalTypoComponent!;
  const answer = usesGradio
    ? internalAnswer
    : (session?.answer ?? externalAnswer);
  const setAnswer = usesGradio
    ? setInternalAnswer
    : (session?.setAnswer ?? externalSetAnswer!);
  const question = session?.question ?? externalQuestion;
  const setQuestion = session?.setQuestion ?? externalSetQuestion;
  const loading = usesGradio
    ? internalLoading
    : (session?.loading ?? externalLoading);
  const introText = session?.introText ?? externalIntroText;
  const orchestrationProgress =
    session?.orchestrationProgress ?? externalOrchestrationProgress;
  const sendForm = session?.successForm ?? externalSendForm;
  const componentType = session?.componentType ?? externalComponentType;
  const apiUrl = session?.apiUrl ?? externalApiUrl;
  const wasACardClicked = session?.wasACardClicked ?? externalWasACardClicked;
  const lastMessageId = session?.lastMessageId ?? externalLastMessageId;
  const wasGoBackButtonHit =
    session?.wasGoBackButtonHit ?? externalWasGoBackButtonHit;
  const finalMsgSent = session?.finalMsgSent ?? externalFinalMsgSent;
  const rightPartInteraction =
    session?.rightPartInteraction ?? externalRightPartInteraction;
  const handleRecaptchaOnce =
    session?.handleRecaptchaOnce ?? externalHandleRecaptchaOnce;

  const typingMessageRef = useRef<Message | null>(null);
  const messageRefs = useRef<{ [key: string]: HTMLDivElement }>({});
  const [messageHeights, setMessageHeights] = useState<{
    [key: string]: number;
  }>({});
  const [request, setRequest] = useState("");
  const isOnMobile = useMediaQuery("(max-width:899px)");
  const isMobileRRG = useMediaQuery("(max-width: 960px");
  const [loadingTranscription, setLoadingTranscription] = useState(false);
  const [messageId, setMessageId] = useState<string | null>(null);
  const needsComponent = !!componentType;

  const helpCues = [
    "Génère 3 concepts créatifs pour le lancement de la Peugeot 408 auprès des CSP+\u00A0",
    "Quelles sont les dernières tendances marketing dans le secteur automobile en 2026\u00A0?",
    "Qui sont les personas avec qui je peux discuter de la marque Peugeot\u00A0?",
    "Analyse le positionnement de Peugeot face à Renault et Volkswagen sur le segment électrique en 2026\u00A0?",
  ];

  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const isThinking = loading && Boolean(orchestrationProgress);

  let displayedTyping: Message | null = null;
  if (answer && !isThinking) {
    displayedTyping = {
      id: "typing",
      name: "Assistant LAION",
      object: answer,
    };
    typingMessageRef.current = displayedTyping;
  } else {
    typingMessageRef.current = null;
  }

  React.useEffect(() => {
    if (usesGradio) {
      return;
    }

    if (!loading && (question || sendForm) && answer) {
      const finalMsg: Message = {
        id: uuidv4(),
        name: "Assistant LAION",
        object: answer,
      };
      setMessageId(finalMsg.id);
      setMessages([...messages, finalMsg]);
      setQuestion?.("");
      setAnswer("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, question, answer, sendForm, usesGradio]);

  React.useEffect(() => {
    if (!messageId || (needsComponent && !externalComponents)) return;
    const normalizedComponents = Array.isArray(externalComponents)
      ? externalComponents
      : [externalComponents];
    setMessages((prevMessages: Message[]) => {
      return prevMessages.map((msg) => {
        if (msg.id === messageId) {
          return { ...msg, components: normalizedComponents, componentType };
        }
        return msg;
      });
    });
    setMessageId(null);
  }, [
    messageId,
    componentType,
    externalComponents,
    needsComponent,
    setMessages,
  ]);

  React.useEffect(() => {
    if (!lastMessageId && (!wasACardClicked || !wasGoBackButtonHit)) return;
    const normalizedComponents = Array.isArray(externalComponents)
      ? externalComponents
      : [externalComponents];
    setMessages((prevMessages: Message[]) => {
      return prevMessages.map((msg) => {
        if (msg.id === lastMessageId) {
          return { ...msg, components: normalizedComponents, componentType };
        }
        return msg;
      });
    });
  }, [
    componentType,
    externalComponents,
    lastMessageId,
    setMessages,
    wasACardClicked,
    wasGoBackButtonHit,
  ]);

  useEffect(() => {
    const stored = localStorage.getItem("acceptedTerms");
    if (stored) {
      const { timestamp } = JSON.parse(stored);
      const oneDay = 24 * 60 * 60 * 1000;
      if (Date.now() - timestamp < oneDay) {
        setAcceptedTerms(true);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      streamAbortRef.current?.abort();
    };
  }, []);

  const finalizeGradioAnswer = (
    finalText: string,
    currentMessages: Message[],
  ) => {
    if (!finalText.trim()) {
      return;
    }

    const finalMsg: Message = {
      id: uuidv4(),
      name: "Assistant RRG",
      object: finalText,
    };

    setMessages([...currentMessages, finalMsg]);
    setInternalAnswer("");
    onStreamUpdate?.(finalText, "final");
  };

  const handleSendMessage = async (msg?: string) => {
    const toSend = msg;
    if (!toSend?.trim()) return;

    if (handleRecaptchaOnce) {
      const captchaPassed = await handleRecaptchaOnce();
      if (!captchaPassed) {
        const errorMessage: Message = {
          id: Date.now().toString() + "_error",
          name: "Assistant RRG",
          object:
            "Désolé, votre message n'a pas pu être envoyé pour des raisons de sécurité. Veuillez réessayer dans quelques instants.",
        };

        setMessages([...messages, errorMessage]);
        setRequest("");
        return;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      name: "Vous",
      object: toSend!,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setRequest("");

    if (usesGradio) {
      streamAbortRef.current?.abort();
      const abortController = new AbortController();
      streamAbortRef.current = abortController;

      setInternalLoading(true);
      setInternalAnswer("");
      onStreamUpdate?.("", "progress");

      try {
        const history = messagesToGradioHistory(messages);
        const finalText = await streamGradioChat(
          gradioUrl,
          toSend,
          history,
          (chunk) => {
            if (abortController.signal.aborted) {
              return;
            }
            setInternalAnswer(chunk);
            onStreamUpdate?.(chunk, "progress");
          },
        );

        if (!abortController.signal.aborted) {
          finalizeGradioAnswer(finalText, nextMessages);
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          const errorMessage: Message = {
            id: `${Date.now()}_gradio_error`,
            name: "Assistant RRG",
            object:
              "Je n'ai pas pu joindre l'assistant. Vérifiez que le serveur Gradio est démarré (`make start-ui` dans ermes_llm).",
          };
          setMessages([...nextMessages, errorMessage]);
          console.error(error);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setInternalLoading(false);
        }
      }

      return;
    }

    setQuestion?.(toSend!);
  };

  const finalMessages = [
    ...messages,
    ...(typingMessageRef.current ? [typingMessageRef.current] : []),
  ];

  const lastMsgId = finalMessages[finalMessages.length - 1]?.id;
  const lastMessageHeight = lastMsgId ? messageHeights[lastMsgId] : undefined;

  const scrollTrigger = [
    answer.length,
    orchestrationProgress.length,
    messages.length,
    loading ? 1 : 0,
    lastMessageHeight ?? 0,
    rightPartInteraction ? 1 : 0,
  ].join("|");

  useScrollToBottom(
    scrollContainerRef,
    scrollTrigger,
    loading ? "auto" : "smooth",
  );

  useEffect(() => {
    const newHeights: { [key: string]: number } = {};
    let hasChanges = false;

    Object.entries(messageRefs.current).forEach(([id, element]) => {
      if (element) {
        const height = element.offsetHeight;
        newHeights[id] = height;
        if (messageHeights[id] !== height) {
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      setMessageHeights(newHeights);
    }
  }, [finalMessages, messageHeights]);

  const handleCueSelected = async (message: string) => {
    setRequest(message);
    await handleSendMessage(message);
  };

  const chatBackground =
    "radial-gradient(134.82% 95.39% at 134.82% 119.86%, #0C0043 50.27%, #000000 100%)";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-around",
        alignItems: "center",
        width: "100%",
        height: "100%",
        background: chatBackground,
        color: "#fff",
      }}
    >
      {!isOnMobile && (
        <Modal
          open={!acceptedTerms}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
          slotProps={{
            backdrop: {
              sx: {
                backgroundColor: "#F2F2F2",
                backdropFilter: "blur(1px)",
              },
            },
          }}
          sx={{
            "&:focus": {
              outline: "none",
            },
            "& .MuiModal-backdrop": {
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            },
          }}
        >
          <Box
            padding="32px"
            sx={{
              width: "576px",
              borderRadius: "5px",
              position: "absolute",
              backgroundColor: "white",
              bottom: "40px",
              left: "40px",
              outline: "none",
              border: "none",
              "&:focus": {
                outline: "none",
              },
            }}
          >
            <Stack gap="24px">
              <TypoComponent fontSize="28px" fontWeight="bold">
                Avant de commencer
              </TypoComponent>
              <TypoComponent fontSize="16px" lineHeight="21px">
                En utilisant cet assistant conversationnel, vous reconnaissez
                avoir pris connaissance de notre{" "}
                <a
                  href="https://www.retail-renault-group.fr/vos-donnees-personnelles"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "black",
                    fontWeight: "bold",
                    textDecoration: "none",
                  }}
                >
                  politique de confidentialité
                </a>
                .
              </TypoComponent>
              <Box display="flex" justifyContent="flex-end">
                <Button
                  sx={{
                    width: "104px",
                    height: "48px",
                    borderRadius: 0,
                    backgroundColor: "#D8C4A0",
                    color: "black",
                    textTransform: "none",
                    "&:hover": {
                      backgroundColor: "rgb(202,174,125)",
                    },
                  }}
                  onClick={() => {
                    const data = { timestamp: Date.now() };
                    localStorage.setItem("acceptedTerms", JSON.stringify(data));
                    setAcceptedTerms(true);
                  }}
                >
                  <TypoComponent fontSize="16px" fontWeight="bold">
                    Accepter
                  </TypoComponent>
                </Button>
              </Box>
            </Stack>
          </Box>
        </Modal>
      )}
      {isOnMobile && (
        <Modal
          open={!acceptedTerms}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
          slotProps={{
            backdrop: {
              sx: {
                backgroundColor: "#F2F2F2",
                backdropFilter: "blur(1px)",
              },
            },
          }}
          sx={{
            "&:focus": {
              outline: "none",
            },
            "& .MuiModal-backdrop": {
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            },
          }}
        >
          <Box
            padding="16px"
            bgcolor="white"
            borderRadius="10px"
            sx={{
              position: "absolute",
              bottom: 0,
              zIndex: 1000,
              outline: "none",
              border: "none",
              "&:focus": {
                outline: "none",
              },
            }}
          >
            <Stack gap="24px">
              <TypoComponent fontSize="28px" fontWeight="bold">
                Avant de commencer
              </TypoComponent>
              <TypoComponent fontSize="16px" lineHeight="21px">
                En utilisant cet assistant conversationnel, vous reconnaissez
                avoir pris connaissance de notre politique de confidentialité.
              </TypoComponent>
              <Box display="flex" justifyContent="center">
                <Button
                  sx={{
                    width: "104px",
                    height: "48px",
                    borderRadius: 0,
                    backgroundColor: "#D8C4A0",
                    color: "black",
                    textTransform: "none",
                  }}
                  onClick={() => {
                    const data = { timestamp: Date.now() };
                    localStorage.setItem("acceptedTerms", JSON.stringify(data));
                    setAcceptedTerms(true);
                  }}
                >
                  <TypoComponent fontSize="16px" fontWeight="bold">
                    Accepter
                  </TypoComponent>
                </Button>
              </Box>
            </Stack>
          </Box>
        </Modal>
      )}
      <Box
        ref={scrollContainerRef}
        className="chat-scroll-container"
        sx={{
          flex: 1,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          overflowX: "hidden",
          position: isOnMobile ? "auto" : "relative",
          pt: isOnMobile ? 2 : 0,
        }}
      >
        {finalMessages.map((msg, index) => {
          const isAssistant = msg.name !== "Vous";
          const isLastMessage = index === finalMessages.length - 1;

          return (
            <motion.div
              key={msg.id}
              ref={(el) => {
                if (el) {
                  messageRefs.current[msg.id] = el;
                  if (isLastMessage) {
                    lastMessageRef.current = el;
                  }
                } else {
                  delete messageRefs.current[msg.id];
                }
              }}
              style={{
                display: "flex",
                flexDirection: "column",
                padding: isOnMobile ? 8 : 12,
                paddingRight: isOnMobile ? 16 : 24,
                paddingLeft: isOnMobile ? 16 : 24,
                alignItems: isAssistant ? "flex-start" : "flex-end",
              }}
              initial={!isAssistant ? { opacity: 0, y: 20 } : undefined}
              animate={!isAssistant ? { opacity: 1, y: 0 } : undefined}
              transition={!isAssistant ? { duration: 0.2, delay: 0.1 } : {}}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: isAssistant ? "flex-start" : "flex-end",
                  alignItems: "center",
                  gap: isAssistant ? "7px" : "0px",
                  width: "100%",
                }}
              >
                {isAssistant && (
                  <Icon
                    icon="assistantLAIon"
                    attrs={{ width: "25px", height: "30px" }}
                  />
                )}
                <TypoComponent
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: 28,
                    color: "#fff",
                    fontSize: 14,
                  }}
                >
                  {msg.name}
                </TypoComponent>
              </Box>
              <Box
                sx={{
                  minWidth: "10px",
                  maxWidth: isAssistant
                    ? isOnMobile
                      ? "100%"
                      : "450px"
                    : isOnMobile
                      ? "80%"
                      : "65%",
                  p: isAssistant
                    ? isOnMobile
                      ? "8px 8px"
                      : "10px 22px"
                    : "10px 22px",
                  borderRadius: isAssistant ? 0 : "10px",
                  backgroundColor: isAssistant ? "transparent" : "#F0F0F0",
                  color: "text.primary",
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                }}
              >
                <TypoComponent
                  component="div"
                  sx={{
                    color: isAssistant ? "#fff" : "inherit",
                    fontSize: "14px",
                    lineHeight: 1.5,
                  }}
                >
                  {parseSimpleMarkdown(msg.object)}
                </TypoComponent>
                {msg?.components &&
                  isAssistant &&
                  isOnMobile &&
                  (msg?.componentType === "carsList" ? (
                    msg.components[0]
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        width: "100%",
                        py: "10px",
                        pt: "20px",
                      }}
                    >
                      {msg.components[0]}
                    </Box>
                  ))}
              </Box>
              {messages.length < 2 && !isOnMobile && (
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "16px",
                    padding: "10px 22px",
                  }}
                >
                  {helpCues.map((el, i) => (
                    <Button
                      key={i}
                      component="div"
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        width: "45%",
                        minHeight: "89px",
                        p: "16px",
                        borderRadius: "10px",
                        borderWidth: 0,
                        backgroundColor: "#FAFAFA",
                        color: "black",
                        whiteSpace: "break-spaces",
                        textAlign: "center",
                        "&:hover": {
                          backgroundColor: "black",
                          color: "white",
                        },
                      }}
                      onClick={() => handleCueSelected(el)}
                    >
                      <TypoComponent
                        sx={{
                          textTransform: "none",
                          fontSize: 14,
                          fontWeight: 400,
                        }}
                      >
                        {el}
                      </TypoComponent>
                    </Button>
                  ))}
                </Box>
              )}
            </motion.div>
          );
        })}
        {loading && isThinking && (
          <motion.div
            key="thinking-steps"
            style={{
              display: "flex",
              flexDirection: "column",
              padding: isOnMobile ? "8px 16px" : "12px 24px",
              alignItems: "flex-start",
            }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                mb: 0.5,
              }}
            >
              <Icon
                icon="assistantLAIon"
                attrs={{ width: "25px", height: "30px" }}
              />
              <TypoComponent
                variant="caption"
                sx={{
                  height: 28,
                  color: "#fff",
                  fontSize: 14,
                }}
              >
                Assistant LAION
              </TypoComponent>
            </Box>
            <Box
              sx={{
                pl: isOnMobile ? "0" : "35px",
                maxWidth: isOnMobile ? "100%" : "450px",
                overflowY: "auto",
                maxHeight: "100px",
              }}
            >
              {parseOrchestrationProgress(orchestrationProgress, "thinking")}
            </Box>
          </motion.div>
        )}
        {loading && !isThinking && !typingMessageRef.current && (
          <motion.div
            key="loading-bubble"
            style={{
              display: "flex",
              flexDirection: "column",
              paddingTop: 10,
              paddingBottom: 10,
              alignItems: "flex-start",
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{ width: "100%", p: 4, boxSizing: "border-box" }}>
              <LoaderDots TypoComp={TypoComponent} />
            </Box>
          </motion.div>
        )}
      </Box>
      {introText && (
        <Box
          sx={{
            px: isOnMobile ? "16px" : "24px",
            py: "8px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: "7px",
            }}
          >
            <Icon
              icon="assistantLAIon"
              attrs={{ width: "25px", height: "30px" }}
            />
            <TypoComponent
              component="div"
              sx={{
                color: "rgba(255,255,255,0.75)",
                fontSize: "13px",
                lineHeight: 1.5,
                fontStyle: "italic",
              }}
            >
              {introText}
            </TypoComponent>
          </Box>
        </Box>
      )}
      {messages.length < 2 && isOnMobile && (
        <Box
          sx={{
            display: "flex",
            gap: "16px",
            overflowX: "auto",
            flexWrap: "nowrap",
            overflowY: "hidden",
            width: "92%",
            rowGap: "8px",
            padding: "16px",
            opacity: acceptedTerms ? 1 : 0.5,
            pointerEvents: acceptedTerms ? "auto" : "none",
          }}
        >
          {helpCues.map((el, i) => (
            <Button
              key={i}
              component="div"
              sx={{
                minWidth: "254px",
                height: "73px",
                borderRadius: "10px",
                backgroundColor: "#FAFAFA",
                color: "black",
                whiteSpace: "break-spaces",
              }}
              onClick={() => handleCueSelected(el)}
            >
              <TypoComponent sx={{ textTransform: "none", fontSize: 15 }}>
                {el}
              </TypoComponent>
            </Button>
          ))}
        </Box>
      )}
      <Box
        padding={`${isOnMobile ? "16px" : "24px"}`}
        sx={{ display: "flex", justifyContent: "center", width: "90%" }}
      >
        <Box
          sx={{
            opacity: acceptedTerms ? 1 : 0.5,
            pointerEvents: acceptedTerms ? "auto" : "none",
          }}
        >
          <InputChat
            loading={loading}
            handleSendMessage={handleSendMessage}
            loadingTranscription={loadingTranscription}
            setLoadingTranscription={setLoadingTranscription}
            apiUrl={apiUrl}
            finalMsgSent={finalMsgSent}
          />
        </Box>
      </Box>
    </Box>
  );
};
