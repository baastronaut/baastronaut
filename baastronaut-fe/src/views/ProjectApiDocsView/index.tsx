import {
  ActionIcon,
  Button,
  Card,
  Group,
  Skeleton,
  Stack,
  Text,
  useMantineTheme,
} from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { RedocStandalone } from 'redoc';
import { NamedAvatar, Page } from 'src/components';
import { useApiDocs, useApiToken, useProject } from 'src/hooks';
import { Routes } from 'utils/constants';

interface Props {
  workspaceId: number;
  projectId: number;
}

const TableApiView = ({ workspaceId, projectId }: Props) => {
  const router = useRouter();

  const theme = useMantineTheme();
  const { project } = useProject({ workspaceId, projectId });
  const { apiToken, loadingApiToken } = useApiToken({ workspaceId, projectId });

  const apiTokenValue = apiToken?.token;

  const { apiDocs, loadingApiDocs } = useApiDocs(
    { apiUserToken: apiTokenValue || '', projectId },
    { enabled: !!apiToken },
  );

  const projectName = project?.name;

  return (
    <Page.Stack className="fade-in-right">
      <Card>
        <Page.Heading>
          <Group>
            <ActionIcon onClick={() => router.back()}>
              <IconArrowLeft />
            </ActionIcon>
            {projectName && (
              <>
                <NamedAvatar
                  name={projectName}
                  sx={{ display: 'inline-block' }}
                />
                {projectName}
              </>
            )}
            {' — '}
            API Docs
          </Group>
        </Page.Heading>
      </Card>

      {loadingApiToken || loadingApiDocs ? <Skeleton height={300} /> : null}

      {!loadingApiToken && !apiTokenValue && (
        <Card>
          <Stack>
            <Text align="center">
              You will need an API key for this project to see its API
              documentation.
            </Text>
            <Group position="center">
              <Link
                href={{ pathname: Routes.DEVELOPER }}
                passHref
                legacyBehavior
              >
                <Button>Create API Key</Button>
              </Link>
            </Group>
          </Stack>
        </Card>
      )}

      {!!apiDocs && (
        <RedocStandalone
          spec={apiDocs}
          options={{
            theme: {
              colors: {
                gray: {
                  '100': theme.fn.themeColor('gray', 9),
                  '50': theme.fn.themeColor('gray', 4),
                },

                primary: {
                  main: theme.fn.primaryColor(),
                },
                success: {
                  main: theme.fn.themeColor('green'),
                },
                error: {
                  main: theme.fn.themeColor('red'),
                },
              },
              typography: {
                fontFamily: theme.fontFamily,
                fontSize: theme.fontSizes.md,
              },
              spacing: {
                unit: 4,
              },
            },
          }}
        />
      )}
    </Page.Stack>
  );
};

export default TableApiView;
