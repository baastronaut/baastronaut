import { Loader, ThemeIcon } from '@mantine/core';
import { IconX } from '@tabler/icons-react';

interface Props {
  variant: 'loading' | 'error';
}
const ModalStatus = ({ variant }: Props) => {
  if (variant === 'loading') {
    return <Loader size="xl" />;
  }

  if (variant === 'error') {
    return (
      <ThemeIcon radius="xl" color="red" variant="outline" size="xl">
        <IconX />
      </ThemeIcon>
    );
  }

  return null;
};

export default ModalStatus;
