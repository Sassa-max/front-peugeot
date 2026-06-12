import React from "react";
import { createRoot } from "react-dom/client";
import Typography from "@mui/material/Typography";
import { createTheme, ThemeProvider } from "@mui/material/styles";

import { ShopperChat } from "../ShopperChat";

const theme = createTheme({
  typography: {
    fontFamily: '"Peugeot New", sans-serif',
  },
});

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root not found");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <ShopperChat
        TypoComponent={Typography}
        apiUrl={import.meta.env.VITE_API_URL || "http://localhost:8000"}
      />
    </ThemeProvider>
  </React.StrictMode>
);
