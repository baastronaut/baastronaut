import { Card, Stack } from '@mantine/core';
import { PropsWithChildren } from 'react';

const PageSection = ({ children }: PropsWithChildren) => {
  return (
    <Card shadow="sm">
      <Stack spacing="md">{children}</Stack>
    </Card>
  );
};

export default PageSection;
