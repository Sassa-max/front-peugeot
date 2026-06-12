export interface MicRecorderButtonProps {
  onTranscript: (t: string) => void;
  setLoadingTranscription: React.Dispatch<React.SetStateAction<boolean>>;
  loadingTranscription: boolean;
  loading: boolean;
  recording: boolean;
  setRecording: React.Dispatch<React.SetStateAction<boolean>>;
  apiUrl: string;
  finalMsgSent: boolean;
}
