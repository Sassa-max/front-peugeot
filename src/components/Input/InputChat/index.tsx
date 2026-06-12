import { Box, Button, TextField, useMediaQuery } from "@mui/material";
import MicRecorderButton from "../../MicRecorderButton";
import Icon from "../../../utils/icons";
import React, { JSX, useRef, useState } from "react";
import { InputChatProps } from "../../../types/inputChat";
import RecordingDots from "../../RecordingDots";
import CustomTextArea from "../../CustomTextArea";

export const InputChat = ({
  loading,
  handleSendMessage,
  loadingTranscription,
  setLoadingTranscription,
  apiUrl,
  finalMsgSent,
}: InputChatProps): JSX.Element => {
  const isMobile = useMediaQuery("(max-width:899px)"); //Tablets
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [recording, setRecording] = useState(false);
  const [request, setRequest] = useState("");

  const handleTranscript = (text: string) => {
    setRequest((prevRequest: string) => prevRequest + text);
  };

  const handleBoxClick = (e: React.MouseEvent) => {
    // Avoid focusing if the click was on a button inside the Box
    if ((e.target as HTMLElement).closest("button") || finalMsgSent) {
      return; // do nothing if a button was clicked
    }
    inputRef.current?.focus();
  };
  const handleSendByKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !loading) {
      e.preventDefault();
      handleSend();
    }
  };

  // Updated handleSend function - passes message text and clears local state
  const handleSend = () => {
    if (!request.trim()) return;
    handleSendMessage(request); // Pass the message text up
    setRequest(""); // Clear local input
  };

  return (
    <Box
      onClick={handleBoxClick}
      sx={{
        display: "flex",
        alignItems: "center",
        padding: "8px 16px",
        borderRadius: "2px",
        boxShadow: "0px 0px 15px 0px #00000021",
        cursor: "text",
        backgroundColor: "white",
        width: "337px"
      }}
    >
      {/* Text Area Container */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          minHeight: "100%",
        }}
      >
        {recording ? (
          <RecordingDots
            width={inputRef?.current?.offsetWidth}
            isRecording={recording}
          />
        ) : (
          <CustomTextArea
            inputRef={inputRef}
            request={request}
            setRequest={setRequest}
            handleSendByKeyPress={handleSendByKeyPress}
            finalMsgSent={finalMsgSent}
            isMobile={isMobile}
          />
        )}
      </Box>

      {/* Right Side Buttons */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginLeft: "8px",
        }}
      >
        <MicRecorderButton
          onTranscript={handleTranscript}
          loadingTranscription={loadingTranscription}
          setLoadingTranscription={setLoadingTranscription}
          loading={loading}
          recording={recording}
          setRecording={setRecording}
          apiUrl={apiUrl}
          finalMsgSent={finalMsgSent}
        />
        <Button
          onClick={handleSend}
          onTouchStart={
            isMobile
              ? (e) => {
                  if (!(request.length === 0 || loading)) {
                    handleSend();
                  }
                }
              : undefined
          }
          disabled={request.length === 0 || loading || finalMsgSent}
          disableRipple
          disableTouchRipple
          sx={{
            WebkitTapHighlightColor: "transparent",
            outline: "none",
            width: isMobile ? 35 : 40,
            height: isMobile ? 35 : 40,
            bgcolor: "black",
            borderRadius: "50%",
            minWidth: isMobile ? 35 : 40,
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            "&.Mui-disabled": {
              backgroundColor: "rgba(0, 0, 0, 0.6) !important",
            },
            "&:active": {
              transform: "none",
            },
            "&:focus": {
              outline: "none",
            },
            "&:hover": {
              backgroundColor: "black",
            },
            "&:hover.Mui-disabled": {
              backgroundColor: "rgba(0, 0, 0, 0.6) !important",
            },
            touchAction: "manipulation",
          }}
        >
          <Icon icon="arrowUp" />
        </Button>
      </Box>
    </Box>
  );
};

export default InputChat;
