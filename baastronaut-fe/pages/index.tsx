import { useEffect, useRef, useState } from 'react';
import {
  Button,
  Container,
  Group,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconRocket } from '@tabler/icons-react';
import { useAuth } from '../components/auth/AuthProvider';
import { useRouter } from 'next/router';
import Link from 'next/link';
import isEmail from 'validator/lib/isEmail';
import isEmpty from 'validator/lib/isEmpty';
import { Routes } from '../utils/constants';
import { ErrorAlert } from 'src/components';

interface FormErrors {
  emailError: boolean;
  passwordError: boolean;
}

const SignIn = () => {
  const { auth, initializing, user, error } = useAuth();
  const [signingIn, setSigningIn] = useState(false);

  const router = useRouter();

  const [formErrors, setFormErrors] = useState<FormErrors>({
    emailError: false,
    passwordError: false,
  });

  const mounted = useRef<boolean>();

  // Guard if page is navigated away while sign in process is still active
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!initializing) {
      if (user) {
        if (router.query?.redirect) {
          router.push(router.query?.redirect as string);
        } else {
          router.push(Routes.PROJECTS);
        }
      }
    }
  }, [initializing, user]);

  const validateEmail = (value: string) => {
    return !isEmpty(value) && isEmail(value);
  };

  const validatePassword = (value: string) => {
    return !isEmpty(value);
  };

  const validateEmailInput = (event: React.ChangeEvent<{ value: string }>) => {
    const { value } = event.target;
    setFormErrors({
      ...formErrors,
      emailError: !validateEmail(value),
    });
  };

  const validatePasswordInput = (
    event: React.ChangeEvent<{ value: string }>,
  ) => {
    const { value } = event.target;
    setFormErrors({
      ...formErrors,
      passwordError: !validatePassword(value),
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = data.get('email')?.toString().trim() || '';
    const password = data.get('password')?.toString() || '';

    const emailValidated = validateEmail(email);
    const passwordValidated = validatePassword(password);
    if (!emailValidated || !passwordValidated) {
      setFormErrors({
        emailError: !emailValidated,
        passwordError: !passwordValidated,
      });
      return;
    }

    setSigningIn(true);

    auth.signIn(email, password).finally(() => {
      setSigningIn(false);
    });
  };

  return (
    <Container size="xs">
      <Stack
        align="center"
        justify="center"
        sx={{
          minHeight: '100vh',
        }}
      >
        <ThemeIcon size="xl" radius="xl">
          <IconRocket />
        </ThemeIcon>

        <Title>Baastronaut</Title>

        <form onSubmit={handleSubmit} noValidate>
          <Stack>
            <TextInput
              required
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              autoFocus
              onChange={validateEmailInput}
              disabled={signingIn}
              error={
                formErrors.emailError ? (
                  <Text>Please enter a valid email</Text>
                ) : null
              }
            />
            <TextInput
              required
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              onChange={validatePasswordInput}
              disabled={signingIn}
              error={
                formErrors.passwordError ? (
                  <Text>Please enter a password.</Text>
                ) : null
              }
            />

            <ErrorAlert error={error} />

            <Button type="submit" fullWidth loading={signingIn}>
              Sign In
            </Button>
            <Group>
              <Link href="/forgot-password">Forgot password?</Link>
              <Link href={Routes.SIGN_UP}>
                {"Don't have an account? Sign Up"}
              </Link>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Container>
  );
};

export default SignIn;
