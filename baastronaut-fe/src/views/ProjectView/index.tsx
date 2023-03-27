import {
  ActionIcon,
  Container,
  Group,
  LoadingOverlay,
  Skeleton,
  Stack,
  Tabs,
  Text,
} from '@mantine/core';
import { IconArrowLeft, IconPlus } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import {
  NamedAvatar,
  Page,
  ProfileButton,
  ProjectApiDocsLink,
} from 'src/components';
import { useProject, useTablesByProject } from 'src/hooks';
import { Routes } from 'utils/constants';
import Link from 'next/link';
import CreateTableModal from './CreateTableModal';
import CrudTable from './CrudTable';

interface Props {
  workspaceId: number;
  projectId: number;
}

const ProjectView = ({ workspaceId, projectId }: Props) => {
  const [selectedTable, setSelectedTable] = useState<string | null>();

  const { project, loadingProject } = useProject({ workspaceId, projectId });
  const { tables, loadingTables } = useTablesByProject(
    {
      projectId: projectId,
      workspaceId: workspaceId,
    },
    { enabled: !!project },
  );

  const hasTables = !!tables?.length;

  useEffect(() => {
    if (hasTables) {
      setSelectedTable(`${tables[0].id}`);
    }
  }, [hasTables, tables]);

  if (loadingProject) {
    return <LoadingOverlay visible />;
  }

  if (!project) {
    return (
      <Text align="center" weight="bold">
        Project does not exist
      </Text>
    );
  }

  function renderLoader() {
    return <Skeleton height={250} />;
  }

  function renderTableTabsList() {
    return (
      <Tabs.List>
        {tables?.map((table) => {
          const { id, name } = table;
          return (
            <Tabs.Tab key={id} value={`${id}`}>
              {name}
            </Tabs.Tab>
          );
        })}

        <Stack justify="center">
          <ActionIcon onClick={handleCreateTable} size="sm">
            <IconPlus />
          </ActionIcon>
        </Stack>
      </Tabs.List>
    );
  }

  function renderTableTabsPanel() {
    return (
      <Tabs.List>
        {tables?.map((table) => {
          const { id } = table;

          return (
            <Tabs.Panel key={id} value={`${id}`} py="md">
              {/* <ScrollArea styles={{ root: { minHeight: '60vh' } }}> */}
              <CrudTable projectId={projectId} table={table} />
              {/* </ScrollArea> */}
            </Tabs.Panel>
          );
        })}
      </Tabs.List>
    );
  }

  function handleCreateTable() {
    CreateTableModal.open({
      workspaceId,
      projectId,
    });
  }

  const projectName = project?.name || '';

  return (
    <Container fluid py="md" className="fade-in-right">
      <Page.Stack>
        <Group position="apart">
          <Page.Heading>
            <Group>
              <Link href={Routes.PROJECTS} passHref legacyBehavior>
                <ActionIcon component="a">
                  <IconArrowLeft />
                </ActionIcon>
              </Link>
              <NamedAvatar name={projectName} />
              <span>{projectName}</span>
            </Group>
          </Page.Heading>

          <Group>
            <ProjectApiDocsLink
              workspaceId={workspaceId}
              projectId={projectId}
            />
            <ProfileButton />
          </Group>
        </Group>

        {loadingTables ? (
          renderLoader()
        ) : !hasTables ? (
          <Text color="dimmed" align="center">
            There are no tables in this project yet
          </Text>
        ) : (
          <Tabs
            keepMounted={false}
            variant="outline"
            value={selectedTable}
            onTabChange={setSelectedTable}
            styles={{
              tabLabel: {
                fontWeight: 500,
              },
              panel: {
                minWidth: '100%',
                minHeight: '60vh',
                overflow: 'auto',
              },
            }}
          >
            {renderTableTabsList()}
            {renderTableTabsPanel()}
          </Tabs>
        )}
      </Page.Stack>
    </Container>
  );
};

export default ProjectView;
