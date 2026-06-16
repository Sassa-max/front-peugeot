import { TypographyProps } from "@mui/material";

export interface Message {
  id: string;
  name: string;
  object: string;
  components?: any;
  componentType?: string;
}

export interface TypoProps extends TypographyProps {}
export interface ChatUIProps {
  messages?: Message[];
  setMessages?: React.Dispatch<React.SetStateAction<Message[]>>;
  answer?: string;
  setAnswer?: React.Dispatch<React.SetStateAction<string>>;
  question?: string;
  setQuestion?: React.Dispatch<React.SetStateAction<string>>;
  loading?: boolean;
  introText?: string;
  orchestrationProgress?: string;
  componentType?: string;
  externalComponents?: any;
  TypoComponent?: React.ComponentType<TypoProps>;
  apiUrl?: string;
  gradioUrl?: string;
  onStreamUpdate?: (text: string, phase: "progress" | "final") => void;
  toolResults?: any;
  wasACardClicked?: boolean;
  lastMessageId?: string | null;
  wasGoBackButtonHit?: boolean;
  finalMsgSent?: boolean;
  sendForm?: boolean | null;
  rightPartInteraction?: boolean;
  handleRecaptchaOnce?: () => Promise<boolean>;
}
