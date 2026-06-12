import React from "react";
import list from "./list";

type IconProps = {
  icon: keyof typeof list;
  alt?: string;
  attrs?: React.SVGProps<SVGSVGElement>;
} & React.HTMLAttributes<HTMLElement>;

const Icon: React.FC<IconProps> = ({
  icon,
  alt = null,
  attrs = {},
  ...props
}) => {
  const IconComponent = list[icon];

  if (IconComponent) {
    return <IconComponent {...attrs} {...props} />;
  }

  if (alt) {
    return <text>{alt}</text>;
  }

  const DefaultIcon = list.default;
  return <DefaultIcon {...attrs} {...props} />;
};

export default Icon;
