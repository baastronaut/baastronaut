import {
  Divider,
  Group,
  MantineSize,
  Navbar,
  NavLink,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import {
  IconCode,
  IconFileText,
  IconFolder,
  IconTable,
} from '@tabler/icons-react';
import { NamedAvatar } from 'src/components';
import { useAuth } from 'components/auth/AuthProvider';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Routes } from 'utils/constants';

const links = [
  {
    key: 'projects',
    href: Routes.PROJECTS,
    label: 'Projects',
    icon: <IconFolder />,
  },
  {
    key: 'developer',
    href: Routes.DEVELOPER,
    label: 'Developer',
    icon: <IconCode />,
  },
];

interface Props {
  opened: boolean;
  breakpoint: MantineSize;
}

const LayoutNavbar = ({ opened, breakpoint }: Props) => {
  const router = useRouter();

  return (
    <Navbar
      hiddenBreakpoint={breakpoint}
      hidden={!opened}
      width={{ base: '100%', [breakpoint]: 250 }}
      p="xs"
    >
      <Navbar.Section>
        <WorkspaceButton />
      </Navbar.Section>

      <Divider my="md" size="xs" />

      <Navbar.Section>
        {links.map((link) => {
          const { icon, href, key, label } = link;

          const isActive = router.pathname.toLowerCase() === href.toLowerCase();

          return (
            <Link
              key={key}
              href={href}
              style={{ textDecoration: 'none' }}
              passHref
              legacyBehavior
            >
              <NavLink
                component="a"
                href={href}
                icon={icon}
                label={label}
                active={isActive}
                styles={(theme) => ({
                  root: {
                    borderRadius: theme.radius.md,
                  },
                  label: {
                    fontWeight: 500,
                  },
                })}
              />
            </Link>
          );
        })}
      </Navbar.Section>
    </Navbar>
  );
};

function WorkspaceButton() {
  const { currentWorkspace } = useAuth();

  const { workspaceName = '' } = currentWorkspace || {};

  return (
    <Stack spacing="xs">
      <Text weight="500">Current workspace</Text>
      <UnstyledButton
        sx={(theme) => ({
          width: '100%',
          borderRadius: theme.radius.md,
          padding: theme.spacing.sm,
          color:
            theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,

          '&:hover': {
            backgroundColor:
              theme.colorScheme === 'dark'
                ? theme.colors.dark[8]
                : theme.colors.gray[0],
          },
        })}
      >
        <Group>
          <NamedAvatar name={workspaceName.slice(0, 1)} />
          <Text weight="bold">{workspaceName}</Text>
        </Group>
      </UnstyledButton>
    </Stack>
  );
}

export default LayoutNavbar;
