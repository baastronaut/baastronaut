import { TextInput, Button, Stack, LoadingOverlay } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { closeModal, openModal } from '@mantine/modals';
import { useMutation, useQueryClient } from 'react-query';
import { z } from 'zod';
import { ErrorAlert, Page } from 'src/components';
import { useApiClient } from 'src/hooks';
import { showNotification } from '@mantine/notifications';
import { IconCircleCheck } from '@tabler/icons-react';

const schema = z.object({
  name: z.string({ required_error: 'Please enter a project name' }),
  description: z.string({ required_error: 'Please enter a description' }),
});

type SchemaValues = z.infer<typeof schema>;

interface Props {
  workspaceId: number;
  onClose?: () => void;
}

const CreateProjectModal = ({ workspaceId, onClose }: Props) => {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  const form = useForm<SchemaValues>({
    initialValues: {
      name: '',
      description: '',
    },
    validate: zodResolver(schema),
  });

  const {
    mutate,
    isLoading: isSubmitting,
    error,
  } = useMutation(
    (values: SchemaValues) => {
      return apiClient.doFetchReq({
        method: 'POST',
        path: `workspaces/${workspaceId}/projects`,
        jsonBody: values,
      });
    },
    {
      onSuccess: (_data, variables) => handleSuccess(variables),
    },
  );

  async function handleSuccess(values: SchemaValues) {
    queryClient.refetchQueries({ stale: true });

    showNotification({
      icon: <IconCircleCheck />,
      color: 'green',
      message: `Project ${values.name} created`,
    });

    onClose?.();
  }

  function handleSubmit(values: SchemaValues) {
    mutate(values);
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Page.Stack>
        <TextInput
          label="Name"
          placeholder="e.g. Sample Project"
          autoComplete="off"
          {...form.getInputProps('name')}
        />

        <TextInput
          label="Description"
          autoComplete="off"
          placeholder="Write a beautiful description for your project here"
          {...form.getInputProps('description')}
        />

        <ErrorAlert error={error} />

        <Stack spacing="xs">
          <Button type="submit">Create</Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </Stack>
      </Page.Stack>

      <LoadingOverlay visible={isSubmitting} />
    </form>
  );
};

CreateProjectModal.open = function ({ onClose, ...restProps }: Props) {
  const modalId = 'createProject';

  function handleClose() {
    onClose?.();
    closeModal(modalId);
  }

  openModal({
    modalId,
    title: 'Create Project',
    children: <CreateProjectModal onClose={handleClose} {...restProps} />,
    withCloseButton: false,
    closeOnClickOutside: false,
    closeOnEscape: false,
  });
};

export default CreateProjectModal;
