import { Card, Group, Menu, Stack, Text, UnstyledButton } from '@mantine/core';
import { IconLogout } from '@tabler/icons-react';
import { useAuth } from 'components/auth/AuthProvider';
import Link from 'next/link';
import { NamedAvatar } from 'src/components';
import { Routes } from 'utils/constants';

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

export default ProfileButton;
