import React from "react";
import {
  Box,
  Divider,
  InputBase,
  Typography,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import AppsOutlinedIcon from "@mui/icons-material/AppsOutlined";

import Icon from "../utils/icons";

type MenuItem = {
  label: string;
  badge?: number;
  children?: string[];
};

const QUICK_LINKS = [
  { label: "Library", icon: <MenuBookOutlinedIcon sx={{ fontSize: 22 }} /> },
  { label: "Applications", icon: <AppsOutlinedIcon sx={{ fontSize: 22 }} /> },
] as const;

const MENU_ITEMS: MenuItem[] = [
  {
    label: "Strategy and brainstorming",
    badge: 2,
    children: ["2008 April campaign results", "Weekly brand monitoring"],
  },
  { label: "Market info" },
  { label: "Customer insights" },
  { label: "Brand & guidelines" },
  { label: "Marketing Plans" },
  { label: "Campaigns & Assets", badge: 1 },
  { label: "Data & Media" },
  { label: "Funnels & KPIs" },
  { label: "Website" },
  { label: "Social media" },
];

function NotificationBadge({ count }: { count: number }) {
  return (
    <Box
      sx={{
        width: 20,
        height: 20,
        borderRadius: "100%",
        bgcolor: "#e30613",
        color: "#fff",
        fontSize: "0.7rem",
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {count}
    </Box>
  );
}

function NavRow({
  label,
  badge,
  children,
  showDivider = true,
}: MenuItem & { showDivider?: boolean }) {
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          py: 1.75,
          px: 2.5,
        }}
      >
        <Typography
          sx={{
            fontSize: "11px",
            fontWeight: 700,
            lineHeight: 1.3,
            color: "#fff",
          }}
        >
          {label}
        </Typography>
        {badge !== undefined ? <NotificationBadge count={badge} /> : null}
      </Box>

      {children?.map((child) => (
        <Typography
          key={child}
          sx={{
            px: 2.5,
            pl: 3.5,
            pb: '10px',
            fontSize: "11px",
            fontWeight: 400,
            lineHeight: 1.4,
            color: "rgba(255,255,255,0.88)",
          }}
        >
          {child}
        </Typography>
      ))}

      {showDivider ? (
        <Divider sx={{ borderColor: "rgba(255,255,255,0.28)" }} />
      ) : null}
    </Box>
  );
}

export function LAIonSidebar() {
  return (
    <Box
      component="nav"
      aria-label="LAIon navigation"
      sx={{
        width: "20%",
        minWidth: 240,
        maxWidth: 300,
        height: "100%",
        bgcolor: "#000",
        color: "#fff",
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        flexShrink: 0,
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      <Box
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          pt: 2.5,
          pb: 1,
          minHeight: 48,
        }}
      >
        <Box
          component="button"
          type="button"
          aria-label="Back"
          sx={{
            position: "absolute",
            left: 20,
            top: "50%",
            transform: "translateY(-50%)",
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.85)",
            bgcolor: "transparent",
            color: "#fff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            p: 0,
          }}
        >
          <ArrowBackIosNewIcon sx={{ fontSize: 14 }} />
        </Box>

        <Typography
          component="span"
          sx={{
            fontWeight: 700,
            fontSize: 20,
            letterSpacing: "0.01em",
            color: "#fff",
          }}
        >
          L<span style={{ fontSize: 28 }}>AI</span>ON
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          py: 1.5,
          px: 2,
        }}
      >
        <Icon icon="assistantLAIon" attrs={{ width: "108px", height: "118px" }} />
      </Box>

      <Box sx={{ px: 2.5, pb: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            border: "1px solid rgba(255,255,255,0.85)",
            px: 1.5,
            py: 0.75,
            gap: 1,
          }}
        >
          <InputBase
            placeholder="Recherche"
            sx={{
              flex: 1,
              color: "#fff",
              fontSize: "0.95rem",
              "& input::placeholder": {
                color: "rgba(255,255,255,0.75)",
                opacity: 1,
                fontSize: "11px",
              },
              height: "24px",
            }}
          />
          <Icon icon="search" attrs={{ width: "18px", height: "18px" }} />
        </Box>
      </Box>

      <Box sx={{ px: 2.5, pb: 5, gap: "10px" }}>
        {QUICK_LINKS.map((item) => (
          <Box
            key={item.label}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "30px",
              py: "1px",
              cursor: "pointer",
            }}
          >
            {item.icon}
            <Typography sx={{ fontSize: "11px", fontWeight: 500 }}>
              {item.label}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ flex: 1 }}>
        {MENU_ITEMS.map((item, index) => (
          <NavRow
            key={item.label}
            {...item}
            showDivider={index < MENU_ITEMS.length - 1}
          />
        ))}
      </Box>
    </Box>
  );
}
