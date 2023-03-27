import { Alert, Collapse } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useEffect } from 'react';

interface Props {
  error: unknown;
}

const ErrorAlert = ({ error }: Props) => {
  const errorMessage =
    error instanceof Error ? error.message : 'An error has occurred';

  useEffect(() => {
    if (!errorMessage && error) {
      console.error(error);
    }
  }, [errorMessage, error]);

  return (
    <Collapse in={!!error}>
      <Alert
        variant="outline"
        icon={<IconAlertCircle />}
        color="red"
        title={errorMessage}
        styles={{
          title: {
            marginBottom: 0,
          },
        }}
      >
        {null}
      </Alert>
    </Collapse>
  );
};

export default ErrorAlert;
