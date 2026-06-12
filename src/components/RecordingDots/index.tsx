import React from "react";
import { Box } from "@mui/material";

interface RecordingDotsProps {
  width: number;
  isRecording: boolean;
}

const RecordingDots = ({ width = 50, isRecording }: RecordingDotsProps) => {
const bars = Array.from({ length: width / 4 });
  return (
    <Box
      width={width}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
      }}
    >
      {isRecording && (
        <Box
          sx={{
            display: "flex",
            gap: '2px',
            height: 24,
            alignItems: "center",
          }}
        >
          {bars.map((_, i) => (
            <Box
              key={i}
              sx={{
                width: 2,
                height: 8,
                backgroundColor: "black",
                borderRadius: 0,
                animation: `bounce 1s ease-in-out infinite`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </Box>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% {
            transform: scaleY(1);
          }
          50% {
            transform: scaleY(2.5);
          }
        }
      `}</style>
    </Box>
  );
};

export default RecordingDots;
