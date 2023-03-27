import { Text } from '@mantine/core';
import { useAuth } from 'components/auth/AuthProvider';
import { Layout, Page } from 'src/components';
import { useProjects } from 'src/hooks';
import ProjectApiTokensTable from './ProjectApiTokensTable';

const DeveloperView = () => {
  const { currentWorkspace } = useAuth();
  const { workspaceId } = currentWorkspace || {};

  const { projects, loadingProjects } = useProjects(
    { workspaceId: workspaceId || 0 },
    { enabled: !!workspaceId?.toString() },
  );

  return (
    <Layout>
      <Page.Stack>
        <Page.Heading>Developer</Page.Heading>

        {!workspaceId?.toString() ? (
          <Text weight="500">No workspace selected yet.</Text>
        ) : !projects?.length ? (
          <Text weight="500">No projects to show yet.</Text>
        ) : (
          projects.map((project) => {
            return (
              <ProjectApiTokensTable
                key={project.id}
                workspaceId={workspaceId}
                project={project}
              />
            );
          })
        )}
      </Page.Stack>
    </Layout>
  );
};

export default DeveloperView;
