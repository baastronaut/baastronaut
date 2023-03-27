import { Title } from '@mantine/core';
import { PropsWithChildren } from 'react';

const PageHeader = ({ children }: PropsWithChildren) => {
  return <Title weight="500">{children}</Title>;
};

export default PageHeader;
