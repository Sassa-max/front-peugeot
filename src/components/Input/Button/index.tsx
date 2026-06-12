import * as React from 'react';

type BackgroundColor =
  | 'bg-secondary'
  | 'bg-black'
  | 'bg-selected'
  | 'bg-main'
  | 'bg-inherit';
type Border = 'border-radius' | 'border-radius-top' | 'border-radius-icon';
type Wheight = 'font-bold' | 'font-semibold' | 'font-normal';
type Padding = 'btn-padding' | 'menu-btn-padding';
type ButtonType = 'submit';
type Underline = 'underline' | 'no-underline';
type Width = 'w-[50px]' | 'w-[40px]';
type Height = 'h-[50px]' | 'h-[40px]';
type Hover = 'hover:bg-secondary';
type TextHover = 'hover:text-white';
type Center = 'button-text-center';

interface ButtonProps {
  width?: Width;
  height?: Height;
  size?: string;
  textSize?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  background?: BackgroundColor;
  color?: string;
  border?: Border;
  padding?: Padding;
  weight?: Wheight;
  type?: ButtonType;
  underline?: Underline;
  name?: string;
  value?: string;
  hover?: Hover;
  textHover?: TextHover;
  center?: Center;
  onClick?: (e: any) => void;
}

export function Button({
  width,
  height,
  children,
  textSize = 'regular',
  size = 'btn-primary',
  disabled = false,
  background = 'bg-secondary',
  color = 'white',
  border = 'border-radius',
  padding,
  weight = 'font-normal',
  underline,
  type = 'submit',
  hover,
  textHover,
  onClick,
  name,
  value,
  center,
}: ButtonProps) {
  let disable = '';
  if (disabled) {
    disable = 'cursor-not-allowed';
  }
  return (
    <button
      name={name}
      value={value}
      type={type}
      onClick={(!disabled && onClick) || ((): void => {})}
      className={`font-sans cursor-pointer ${center} ${width} ${height} ${background} ${color} ${weight} ${border} w-${size} text-${textSize} ${disable} ${padding} ${underline} ${hover} ${textHover}`}
    >
      {children}
    </button>
  );
}

export default Button;
