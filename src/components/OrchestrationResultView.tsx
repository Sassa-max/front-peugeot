import React from "react";
import { Box } from "@mui/material";

import { parseSimpleMarkdown } from "../utils/modules/markDown";
import { TypoProps } from "../types/chatBot";

type OrchestrationResultViewProps = {
  markdown: string;
  TypoComponent: React.ComponentType<TypoProps>;
};

export function OrchestrationResultView({
  markdown,
  TypoComponent,
}: OrchestrationResultViewProps) {
  if (!markdown.trim()) {
    return null;
  }

  return (
    <Box
      sx={{
        width: "100%",
        height: "30px",
        overflowY: "auto",
        p: 3,
      }}
    >
      <TypoComponent component="div" sx={{ whiteSpace: "pre-wrap", fontSize: 10 }}>
        {parseSimpleMarkdown(markdown)}
      </TypoComponent>
    </Box>
  );
}
