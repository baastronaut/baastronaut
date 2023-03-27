import { Button, Group, Stack, Text } from '@mantine/core';
import {
  closeAllModals,
  closeModal,
  openConfirmModal,
  openModal,
} from '@mantine/modals';
import { showNotification } from '@mantine/notifications';
import { IconCheck } from '@tabler/icons-react';
import { Project } from 'client/types';
import dayjs from 'dayjs';
import { useEffect } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { ErrorAlert, Modal, Page } from 'src/components';
import { useApiClient } from 'src/hooks';

interface Props {
  workspaceId: number;
  project: Project;
}

const ProjectModal = ({ workspaceId, project }: Props) => {
  const { id, name, description, createdAt } = project;

  function handleDelete() {
    openConfirmModal({
      title: 'Delete Project',
      children: (
        <>
          <Group spacing={0}>
            <Text>Are you sure you want to delete</Text>&nbsp;
            <Text>{name}</Text>
            &nbsp;<Text>?</Text>
          </Group>
          <Text>This action cannot be undone.</Text>
        </>
      ),
      labels: {
        confirm: 'Delete',
        cancel: 'Back',
      },
      confirmProps: {
        color: 'red',
      },
      onConfirm() {
        closeAllModals();

        const modalId = 'processDeleteProject';

        function closeProcessDeleteProject() {
          closeModal(modalId);
        }

        openModal({
          modalId,
          children: (
            <ProcessDeleteProject
              projectId={id}
              projectName={name}
              workspaceId={workspaceId}
              onClose={closeProcessDeleteProject}
            />
          ),
          withCloseButton: false,
          closeOnClickOutside: false,
          closeOnEscape: false,
        });
      },
    });
  }

  return (
    <Page.Stack>
      <Text>{description}</Text>

      <Stack spacing={0}>
        <Text weight="500">Created</Text>
        <Text>{dayjs(createdAt).format('DD/MM/YYYY')}</Text>
      </Stack>

      <Stack spacing={0}>
        <Text weight="500">Last Updated</Text>
        <Text>{dayjs(createdAt).format('DD/MM/YYYY')}</Text>
      </Stack>

      <Button color="red" onClick={handleDelete}>
        Delete Project
      </Button>
    </Page.Stack>
  );
};

interface ProcessDeleteProjectProps {
  projectId: number;
  projectName: string;
  workspaceId: number;
  onClose: () => void;
}

function ProcessDeleteProject({
  projectId,
  projectName,
  workspaceId,
  onClose,
}: ProcessDeleteProjectProps) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  const { mutate, isLoading, error } = useMutation(
    () => {
      return apiClient.doFetchReq({
        method: 'DELETE',
        path: `workspaces/${workspaceId}/projects/${projectId}`,
      });
    },
    {
      onSuccess: () => {
        queryClient.refetchQueries();

        showNotification({
          color: 'green',
          icon: <IconCheck />,
          message: (
            <Group spacing={0}>
              <Text>Project</Text>&nbsp;
              <Text weight="bold">{projectName}</Text>&nbsp;
              <Text>has been successfully deleted</Text>&nbsp;
            </Group>
          ),
        });

        onClose();
      },
    },
  );

  useEffect(() => {
    mutate();
  }, []);

  return (
    <Stack align="center">
      <Text>Deleting Project...</Text>

      {isLoading && <Modal.Status variant="loading" />}

      {!!error && (
        <>
          <Modal.Status variant="error" />
          <ErrorAlert error={error} />
        </>
      )}

      <Button disabled={isLoading} fullWidth onClick={onClose}>
        Close
      </Button>
    </Stack>
  );
}

ProjectModal.open = function ProjectModalOpen(props: Props) {
  const { project } = props;

  openModal({
    title: <Text weight="bold">{project.name}</Text>,
    children: <ProjectModal {...props} />,
  });
};

export default ProjectModal;
