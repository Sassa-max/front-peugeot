import React, { useRef, useState } from "react";
import { Box, Button, useMediaQuery } from "@mui/material";

import Icon from "../utils/icons";
import SpinningRing from "./SpinningRing";
import { MicRecorderButtonProps } from "../types/micRecorderButton";
import { useWhisperTranscription } from "../hooks/useWhisperTranscription";
import { Stop } from "@mui/icons-material";

const MicRecorderButton = ({
  onTranscript,
  setLoadingTranscription,
  loadingTranscription,
  loading,
  recording,
  setRecording,
  apiUrl,
  finalMsgSent,
}: MicRecorderButtonProps) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const isOnMobile = useMediaQuery("(max-width:899px)");

  const handleRecordClick = async () => {
    if (!recording) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = handleStop;
      mediaRecorderRef.current.start();
      setRecording(true);
    } else {
      mediaRecorderRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      setRecording(false);
    }
  };

  const handleStop = async () => {
    const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
    useWhisperTranscription(
      apiUrl,
      audioBlob,
      setLoadingTranscription,
      onTranscript
    );
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center">
      {loadingTranscription ? (
        <SpinningRing />
      ) : (
        <Button
          sx={{
            width: isOnMobile ? 35 : 40,
            height: isOnMobile ? 35 : 40,
            minWidth: isOnMobile ? 35 : 40,
            backgroundColor: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 0,
            "&.Mui-disabled": {
              opacity: 0.4
            }
          }}
          onClick={handleRecordClick}
          disabled={loading || finalMsgSent}
        >
          {recording ? (
            <Stop sx={{ color: "black" }} />
          ) : (
            <Icon icon="mic" />
          )}
        </Button>
      )}
    </Box>
  );
};

export default MicRecorderButton;
