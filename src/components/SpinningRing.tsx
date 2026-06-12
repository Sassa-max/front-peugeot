import React from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";


const SpinningRing = () => {
  const theme = useTheme();
  const isOnMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <>
      <Box
        sx={{
          width: isOnMobile ? 20 : 30,
          height: isOnMobile ? 20 : 30,
          borderRadius: "50%",
          border: "1px solid black",
          borderTopColor: "transparent",
          animation: "ring-spin 1.5s linear infinite",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <style>
        {`
          @keyframes ring-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
};
export default SpinningRing;
