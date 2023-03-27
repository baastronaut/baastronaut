import { Avatar, AvatarProps, useMantineTheme } from '@mantine/core';

const excludedColors = ['dark', 'gray'];

interface Props extends Omit<AvatarProps, 'color'> {
  name: string;
}

const NamedAvatar = ({ name, children, ...restProps }: Props) => {
  const theme = useMantineTheme();
  const colorKeys = Object.keys(theme.colors).filter(
    (color) => !excludedColors.includes(color),
  );

  const defaultDisplay = name.slice(0, 1);
  const color = colorKeys[defaultDisplay.charCodeAt(0) % colorKeys.length];

  return (
    <Avatar color={color} {...restProps}>
      {children ? children : defaultDisplay.toUpperCase()}
    </Avatar>
  );
};

export default NamedAvatar;
