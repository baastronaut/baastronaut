import {
  Burger,
  Card,
  Group,
  Header,
  MantineSize,
  Menu,
  Text,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core';
import { NamedAvatar } from 'src/components';
import { IconLogout, IconRocket } from '@tabler/icons-react';
import { useAuth } from 'components/auth/AuthProvider';
import Link from 'next/link';
import { Routes } from 'utils/constants';
import { Stack } from '@mantine/core';

interface Props {
  breakpoint: MantineSize;
  navbarOpened: boolean;
  toggleNavbar: () => void;
}

const LayoutHeader = ({ breakpoint, navbarOpened, toggleNavbar }: Props) => {
  const leftSide = (
    <Group>
      <ThemeIcon size="lg" radius="xl">
        <IconRocket />
      </ThemeIcon>
      <Text
        size="xl"
        weight="bold"
        sx={(theme) => ({
          [theme.fn.smallerThan('sm')]: {
            display: 'none',
          },
        })}
      >
        Baastronaut
      </Text>
    </Group>
  );

  const burgerLabel = navbarOpened
    ? 'Close navigation bar'
    : 'Open navigation bar';

  const rightSide = (
    <Group>
      <ProfileButton />
      <Burger
        styles={(theme) => ({
          root: {
            [theme.fn.largerThan(breakpoint)]: {
              display: 'none',
            },
          },
        })}
        opened={navbarOpened}
        aria-label={burgerLabel}
        onClick={toggleNavbar}
      />
    </Group>
  );

  return (
    <Header height={60} p="xs">
      <Group position="apart">
        {leftSide}
        {rightSide}
      </Group>
    </Header>
  );
};

function ProfileButton() {
  const { user } = useAuth();

  const { firstName = '', lastName, email } = user || {};

  const userAvatar = <NamedAvatar name={firstName.slice(0, 1)} radius="xl" />;

  return (
    <Menu shadow="md" withArrow transitionProps={{ transition: 'skew-up' }}>
      <Menu.Target>
        <UnstyledButton
          sx={(theme) => ({
            borderRadius: theme.radius.xl,
          })}
          aria-label="Profile menu"
        >
          {userAvatar}
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Card>
          <Group>
            {userAvatar}
            <Stack spacing={0}>
              <Text weight="bold">
                {firstName} {lastName}
              </Text>
              <Text size="sm" color="dimmed">
                {email}
              </Text>
            </Stack>
          </Group>
        </Card>

        <Menu.Divider />

        <Link
          href={Routes.SIGN_OUT}
          passHref
          style={{ textDecoration: 'none' }}
        >
          <Menu.Item icon={<IconLogout size={14} />}>Logout</Menu.Item>
        </Link>
      </Menu.Dropdown>
    </Menu>
  );
}

export default LayoutHeader;
