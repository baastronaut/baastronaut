import { Stack, StackProps } from '@mantine/core';

const PageStack = ({ children, ...props }: Omit<StackProps, 'spacing'>) => {
  return (
    <Stack spacing="lg" {...props}>
      {children}
    </Stack>
  );
};

export default PageStack;
