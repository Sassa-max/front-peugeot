export interface InputChatProps {
  loading: boolean;
  handleSendMessage: (msg?: string) => void;
  loadingTranscription: boolean;
  setLoadingTranscription: React.Dispatch<React.SetStateAction<boolean>>;
  apiUrl: string;
  finalMsgSent: boolean;
}
