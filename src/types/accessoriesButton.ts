import { TypoProps } from "./chatBot";

export interface AccessoriesButtonProps {
  linkCategory: string;
  linkUrl: string;
  text: string;
  apiUrl: string;
  TypoComponent: React.ComponentType<TypoProps>;
}