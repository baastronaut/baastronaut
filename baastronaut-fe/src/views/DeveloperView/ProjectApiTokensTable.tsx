import {
  ActionIcon,
  Button,
  CopyButton,
  Group,
  Table,
  Text,
  TextInput,
  ThemeIcon,
} from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import {
  IconCheck,
  IconCopy,
  IconEye,
  IconEyeOff,
  IconX,
} from '@tabler/icons-react';
import { Project } from 'client/types';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useQueryClient } from 'react-query';
import { NamedAvatar, Page, ProjectApiDocsLink } from 'src/components';
import { useApiToken, useGenerateApiToken } from 'src/hooks';

interface Props {
  workspaceId: number;
  project: Project;
}

const ProjectApiTokensTable = ({ workspaceId, project }: Props) => {
  const { name, id } = project;
  const client = useQueryClient();

  const [showToken, setShowToken] = useState(false);

  const { generateApiToken, generateApiTokenLoading } = useGenerateApiToken({
    workspaceId,
    projectId: id,
  });

  const { apiToken } = useApiToken({
    workspaceId,
    projectId: id,
  });

  const tokenValue = apiToken?.token;

  function doGenerateApiToken() {
    generateApiToken(undefined, {
      onSuccess: () => {
        client.refetchQueries({ stale: true });

        showNotification({
          icon: <IconCheck />,
          color: 'green',
          message: (
            <Text>
              New API token for{' '}
              <Text weight="bold" sx={{ display: 'inline' }}>
                {name}
              </Text>{' '}
              generated
            </Text>
          ),
        });
      },
      onError: () => {
        showNotification({
          icon: <IconX />,
          color: 'red',
          message: `Error occurrded while generating API token for ${name}`,
        });
      },
    });
  }

  return (
    <Page.Section>
      <Group>
        <NamedAvatar name={name} />
        <Text weight="bold">{name}</Text>
      </Group>

      {!!apiToken ? (
        <Table>
          <thead>
            <tr>
              <th>Token Creation</th>
              <th>Read Only</th>
              <th>Token</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>
                <Text color="dimmed">
                  {dayjs(apiToken.updatedAt).format('YYYY-MM-DD HH:mm')}
                </Text>
              </td>
              <td>
                {apiToken.readOnly && (
                  <ThemeIcon
                    color="green"
                    variant="outline"
                    sx={{ border: 'none' }}
                  >
                    <IconCheck />
                  </ThemeIcon>
                )}
              </td>
              <td>
                <Group noWrap>
                  <CopyButton value={tokenValue || ''}>
                    {({ copied, copy }) => (
                      <TextInput
                        styles={{
                          root: {
                            width: '100%',
                          },
                        }}
                        type={showToken ? 'text' : 'password'}
                        readOnly
                        value={tokenValue}
                        rightSection={
                          <ActionIcon
                            onClick={copy}
                            color={copied ? 'green' : undefined}
                          >
                            {copied ? <IconCheck /> : <IconCopy />}
                          </ActionIcon>
                        }
                      />
                    )}
                  </CopyButton>
                  <ActionIcon onClick={() => setShowToken(!showToken)}>
                    {showToken ? <IconEyeOff /> : <IconEye />}
                  </ActionIcon>
                </Group>
              </td>
            </tr>
          </tbody>
        </Table>
      ) : (
        <Text align="center" color="dimmed">
          No API tokens yet
        </Text>
      )}

      <Group>
        <Button
          variant="outline"
          onClick={doGenerateApiToken}
          loading={generateApiTokenLoading}
        >
          Generate New API Token
        </Button>

        <ProjectApiDocsLink projectId={id} workspaceId={workspaceId} />
      </Group>
    </Page.Section>
  );
};

export default ProjectApiTokensTable;
