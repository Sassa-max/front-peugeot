import React from "react";
import { Button } from "@mui/material";
import Icon from "../../../../utils/icons";
import { AccessoriesButtonProps } from "../../../../types/accessoriesButton";

async function trackCtaClick(linkCategory: string, apiUrl: string) {
  try {
    await fetch(`${apiUrl}/tracking/cta`, {
      method: "POST",
      headers: { "Content-Type": "application/json", 'x-client-id': 'rrg' },
      body: JSON.stringify({
        category: linkCategory,
      }),
    });
  } catch (e) {
    console.error("Failed to track CTA click", e);
  }
}

export const AccessoriesButton = ({
  linkUrl,
  text,
  linkCategory,
  apiUrl,
  TypoComponent,
}: AccessoriesButtonProps) => {
  return (
    <Button
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "333px",
        height: "60px",
        backgroundColor: "black",
        color: "white",
        borderRadius: 0,
        textTransform: "none",
        gap: "16px",
        "&:hover": {
          backgroundColor: "black",
        },
      }}
      href={linkUrl}
      target="_blank"
      onClick={() => trackCtaClick(linkCategory, apiUrl)}
    >
      <TypoComponent sx={{ fontSize: "16px", fontWeight: 700 }}>
        {text}
      </TypoComponent>
      <Icon icon="openInNew" />
    </Button>
  );
};

export default AccessoriesButton;
