import {
  Container,
  Box,
  Stack,
  ThemeIcon,
  Title,
  TextInput,
  Button,
  Text,
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { IconRocket, IconStar } from '@tabler/icons-react';
import { ApiClient } from 'client/api-client';
import Link from 'next/link';
import { useMutation } from 'react-query';
import { ErrorAlert } from 'src/components';
import z from 'zod';

const apiClient = new ApiClient();

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  name: z.string().min(1, 'Please enter a name'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

type SchemaValues = z.infer<typeof schema>;

const SignUp = () => {
  const { mutate, error, isSuccess, isLoading } = useMutation(
    (values: SchemaValues) => {
      return apiClient.doFetchReq({
        path: '/register',
        method: 'POST',
        jsonBody: values,
      });
    },
  );

  const form = useForm<SchemaValues>({
    initialValues: {
      email: '',
      name: '',
      password: '',
    },
    validate: zodResolver(schema),
  });

  function handleSubmit() {
    mutate(form.values);
  }

  return (
    <Container size="xs">
      <Stack
        align="center"
        justify="center"
        sx={{
          minHeight: '100vh',
        }}
      >
        {isSuccess ? (
          <SuccessView email={form.values.email} />
        ) : (
          <>
            <ThemeIcon size="xl" radius="xl">
              <IconRocket />
            </ThemeIcon>

            <Title>Sign Up</Title>

            <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
              <Stack sx={{ minWidth: 350 }}>
                <TextInput
                  required
                  label="Email"
                  autoComplete="email"
                  autoFocus
                  {...form.getInputProps('email')}
                  disabled={isLoading}
                />
                <TextInput
                  required
                  label="Name"
                  autoComplete="given-name"
                  {...form.getInputProps('name')}
                  disabled={isLoading}
                />
                <TextInput
                  required
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                  {...form.getInputProps('password')}
                  disabled={isLoading}
                />

                <ErrorAlert error={error} />

                <Stack spacing="xs">
                  <Button type="submit" loading={isLoading}>
                    Sign Up
                  </Button>

                  <Link href="/" passHref legacyBehavior>
                    <Button
                      component="a"
                      variant="outline"
                      disabled={isLoading}
                    >
                      Back to login
                    </Button>
                  </Link>
                </Stack>
              </Stack>
            </form>
          </>
        )}
      </Stack>
    </Container>
  );
};

interface SuccessViewProps {
  email: string;
}
function SuccessView({ email }: SuccessViewProps) {
  return (
    <>
      <ThemeIcon size="xl" color="yellow" radius="xl">
        <IconStar />
      </ThemeIcon>

      <Title align="center">Awesome!</Title>

      <Text align="center">
        A verification email will be sent to{' '}
        <Text weight="bold" display="inline">
          {email}
        </Text>
      </Text>

      <Link href="/" passHref legacyBehavior>
        <Button component="a">Go to login</Button>
      </Link>
    </>
  );
}

export default SignUp;
