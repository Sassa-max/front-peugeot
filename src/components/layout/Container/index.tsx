import { Box } from "@mui/material";
import * as React from "react";

type BackgroundColor = "bg-white" | "bg-selected" | "bg-main" | "bg-black";
type Height =
  | "h-screen"
  | "h-56"
  | "h-[65px]"
  | "h-full"
  | "h-auto"
  | "h-[270px]"
  | "h-[400px]"
  | "h-[455px]";
type Border =
  | "border-radius"
  | "border-radius-top"
  | "header-border-radius"
  | "lg:border-radius border-radius-top"
  | "lg:border-radius border-radius-bottom";
type MarginButtom = "mb-12" | "mb-3.5";
type Padding =
  | "sup-container-padding"
  | "container-padding"
  | "modal-padding"
  | "header-padding"
  | "first-padding"
  | "p-0"
  | "lg:container-range-padding container-range-padding-mobile"
  | "lg:container-range-padding container-range-padding-mobile-footer"
  | "lg:p-0 container-range-padding-mobile"
  | "container-range-padding"
  | "second-padding";
type Width =
  | "w-[600px]"
  | "w-full"
  | "w-[580px]"
  | "w-[605px]"
  | "w-[50%]"
  | "lg:w-[50%] w-full";
type Position = "relative";
type Margin = "m-auto";
type Gap = "gap-12";
type Align = "text-center";

interface ContainerProps {
  backgroundColor?: BackgroundColor;
  border?: Border;
  padding?: Padding;
  height?: Height;
  marginBottom?: MarginButtom;
  children: React.ReactNode;
  width?: Width;
  position?: Position;
  margin?: Margin;
  display?: string;
  gap?: Gap;
  align?: Align;
}

export function Container({
  backgroundColor,
  border,
  padding,
  height,
  children,
  marginBottom,
  width,
  position,
  margin,
  display,
  gap,
  align,
}: ContainerProps) {
  return (
    <Box
      sx={{
        zIndex: 10,
        height,
        align,
        border,
        backgroundColor,
        padding,
        marginBottom,
        width,
        position,
        margin,
        display,
        gap,
      }}
    >
      {children}
    </Box>
  );
}

export default Container;
