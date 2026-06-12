import React, { useState } from "react";
import axios from "axios";

export const useWhisperTranscription = async (
  apiUrl: string,
  audioBlob: Blob,
  setLoadingTranscription: React.Dispatch<React.SetStateAction<boolean>>,
  onTranscript?: (text: string) => void
) => {
  const formData = new FormData();
  formData.append("file", new File([audioBlob], "recording.webm"));
  formData.append("language", "fr");

  try {
    setLoadingTranscription(true);
    const response = await axios.post(`${apiUrl}/transcription`, formData, {
      headers: { "Content-Type": "multipart/form-data", "x-client-id": "rrg" }
    });
    onTranscript?.(response.data.text);
  } catch (error) {
    console.error("Transcription error:", error);
  } finally {
    setLoadingTranscription(false);
  }

  return;
};
