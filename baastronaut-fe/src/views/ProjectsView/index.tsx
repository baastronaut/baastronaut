import {
  ActionIcon,
  Affix,
  Card,
  Group,
  rem,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Transition,
} from '@mantine/core';
import { IconPlus, IconSettings } from '@tabler/icons-react';
import { useAuth } from 'components/auth/AuthProvider';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Layout, NamedAvatar, Page } from 'src/components';
import { useProjects } from 'src/hooks';
import { rangeFromZero } from 'utils';
import { Routes } from 'utils/constants';
import CreateProjectModal from './CreateProjectModal';
import ProjectModal from './ProjectModal';

const ProjectView = () => {
  const { currentWorkspace } = useAuth();
  const workspaceId = currentWorkspace?.workspaceId;

  const { projects, loadingProjects } = useProjects(
    { workspaceId: currentWorkspace?.workspaceId || 0 },
    { enabled: Number.isInteger(workspaceId) },
  );

  function renderLoader() {
    return rangeFromZero(3).map((i) => {
      return <Skeleton key={i} height={130} />;
    });
  }

  function renderProjects() {
    return projects?.map((project) => {
      const { id, name, description } = project;

      function openProjectModal() {
        if (!workspaceId) return;

        ProjectModal.open({ workspaceId, project });
      }

      return (
        <Link
          key={id}
          href={{
            pathname: Routes.PROJECT,
            query: { projectId: id, workspaceId },
          }}
        >
          <Card shadow="md" sx={{ minHeight: '100%' }}>
            <Stack spacing="xs">
              <Group noWrap>
                <NamedAvatar name={name} radius="xl" />
                <Text weight="500">{name}</Text>
              </Group>

              <Text>{description}</Text>

              <ActionIcon
                size="sm"
                sx={(theme) => ({
                  position: 'absolute',
                  right: theme.spacing.sm,
                  top: theme.spacing.sm,
                })}
                onClick={(ev) => {
                  ev.preventDefault();
                  openProjectModal();
                }}
              >
                <IconSettings />
              </ActionIcon>
            </Stack>
          </Card>
        </Link>
      );
    });
  }

  return (
    <Layout>
      <Page.Stack>
        <Page.Heading>Projects</Page.Heading>

        {!loadingProjects && !projects?.length && (
          <Text color="dimmed">
            There are no projects in this workspace yet.
          </Text>
        )}

        <SimpleGrid
          cols={1}
          breakpoints={[
            { minWidth: 'xs', cols: 2 },
            { minWidth: 'sm', cols: 3 },
          ]}
        >
          {loadingProjects && renderLoader()}
          {renderProjects()}
        </SimpleGrid>
      </Page.Stack>

      <CreateProjectButton workspaceId={workspaceId} />
    </Layout>
  );
};

interface CreateProjectButtonProps {
  workspaceId?: number;
}
function CreateProjectButton({ workspaceId }: CreateProjectButtonProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!workspaceId) {
    return null;
  }

  function handleCreateProject() {
    workspaceId &&
      CreateProjectModal.open({
        workspaceId: workspaceId,
      });
  }

  return (
    <Affix position={{ bottom: rem(20), right: rem(20) }}>
      <Transition transition="slide-up" mounted={!!mounted}>
        {(transitionStyles) => (
          <ActionIcon
            color="primary"
            variant="filled"
            radius="xl"
            size="xl"
            sx={(theme) => ({ boxShadow: theme.shadows.md })}
            style={transitionStyles}
            onClick={handleCreateProject}
          >
            <IconPlus />
          </ActionIcon>
        )}
      </Transition>
    </Affix>
  );
}

export default ProjectView;
