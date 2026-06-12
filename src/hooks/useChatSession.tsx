import React, { createContext, useContext } from "react";

import { Message } from "../types/chatBot";
import { ShopperChatProps } from "../types/shopperChat";

export type CurrentView = {
  type:
    | "welcome"
    | "searching"
    | "orchestration"
    | "carsList"
    | "carDetails"
    | "leadForm"
    | "extLink";
  progress?: string;
  markdown?: string;
  vehicles?: any[];
  vehicle?: any;
  leadFormDetails?: any;
  viewId?: string;
  linkCategory?: string;
  linkUrl?: string;
  buttonText?: string;
} | null;

export type ChatSessionContextValue = {
  answer: string;
  setAnswer: React.Dispatch<React.SetStateAction<string>>;
  question: string;
  setQuestion: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
  orchestrationProgress: string;
  successForm: boolean | null;
  setSuccessForm: React.Dispatch<React.SetStateAction<boolean | null>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  componentType: string;
  extComponents?: React.ReactNode;
  apiUrl: string;
  TypoComponent: ShopperChatProps["TypoComponent"];
  wasACardClicked: boolean;
  lastMessageId: string | null;
  wasGoBackButtonHit: boolean;
  finalMsgSent: boolean;
  rightPartInteraction: boolean;
  handleRecaptchaOnce: () => Promise<boolean>;
  boxRef: React.RefObject<HTMLDivElement>;
  lastToolType: string | undefined;
  currentView: CurrentView;
  renderProductCard: ShopperChatProps["renderProductCard"];
  renderCarouselMobile: ShopperChatProps["renderCarouselMobile"];
  renderCarDetailsInformation: ShopperChatProps["renderCarDetailsInformation"];
  renderLeadForm: ShopperChatProps["renderLeadForm"];
  handleGetDetails: (vehicle: any) => Promise<void>;
  handleReserve: () => void;
  handleAddToCart: () => void;
  handleSubmit: (
    data?: { user: { subType: string } },
    success?: boolean,
  ) => Promise<void>;
  handleGoBackToList: () => Promise<void>;
  noOnGoBack: boolean;
};

const ChatSessionContext = createContext<ChatSessionContextValue | null>(null);

export function ChatSessionProvider({
  value,
  children,
}: {
  value: ChatSessionContextValue;
  children: React.ReactNode;
}) {
  return (
    <ChatSessionContext.Provider value={value}>
      {children}
    </ChatSessionContext.Provider>
  );
}

export function useChatSession(): ChatSessionContextValue {
  const value = useContext(ChatSessionContext);
  if (!value) {
    throw new Error("useChatSession must be used within ChatSessionProvider");
  }
  return value;
}

export function useChatSessionOptional(): ChatSessionContextValue | null {
  return useContext(ChatSessionContext);
}
