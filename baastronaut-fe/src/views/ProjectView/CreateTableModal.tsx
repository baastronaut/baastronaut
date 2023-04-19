import { Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { closeAllModals, closeModal, openModal } from '@mantine/modals';
import { showNotification } from '@mantine/notifications';
import { IconCheck } from '@tabler/icons-react';
import { ColumnType } from 'client/types';
import { useEffect } from 'react';
import { useQueryClient } from 'react-query';
import { ErrorAlert, Modal } from 'src/components';
import { useCreateTable } from 'src/hooks';
import { z } from 'zod';

const columnType = z.nativeEnum(ColumnType);

const columnSchema = z.object({
  name: z.string({ required_error: 'Please enter a column name' }),
  description: z.string({
    required_error: 'Please enter a column description',
  }),
  columnType: columnType,
  required: z.boolean(),
});

const defaultColumnValue: z.infer<typeof columnSchema> = {
  name: 'name',
  description: 'name',
  columnType: ColumnType.TEXT,
  required: false,
};

const schema = z.object({
  name: z.string({ required_error: 'Please enter a table name' }),
  description: z.string({ required_error: 'Please enter a description' }),
  columns: columnSchema.array().nonempty(),
});

type SchemaValues = z.infer<typeof schema>;

interface Props {
  workspaceId: number;
  projectId: number;
}

const CreateTableModal = ({ workspaceId, projectId }: Props) => {
  const form = useForm<SchemaValues>({
    initialValues: {
      name: '',
      description: '',
      columns: [defaultColumnValue],
    },
    validate: zodResolver(schema),
  });

  function handleSubmit(values: SchemaValues) {
    const modalId = 'processCreateTable';

    openModal({
      modalId,
      children: (
        <ProcessCreateTable
          workspaceId={workspaceId}
          projectId={projectId}
          params={values}
          onClose={() => closeModal(modalId)}
        />
      ),
      withCloseButton: false,
      closeOnClickOutside: false,
      closeOnEscape: false,
    });
  }

  const columnDefs = form.values.columns;

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <TextInput
          label="Name"
          autoComplete="off"
          placeholder="e.g.Employee"
          {...form.getInputProps('name')}
        />

        <TextInput
          label="Description"
          autoComplete="off"
          placeholder="e.g.A table of employee data"
          {...form.getInputProps('description')}
        />

        <Button type="submit">Create Table</Button>
      </Stack>
    </form>
  );
};

interface ProcessCreateTableProps {
  workspaceId: number;
  projectId: number;
  params: SchemaValues;
  onClose: () => void;
}

function ProcessCreateTable({
  workspaceId,
  projectId,
  params,
  onClose,
}: ProcessCreateTableProps) {
  const client = useQueryClient();
  const { createTable, createTableError, createTableLoading } = useCreateTable(
    { workspaceId, projectId, params },
    {
      onSuccess: () => {
        showNotification({
          color: 'green',
          icon: <IconCheck />,
          message: (
            <Group spacing={0}>
              <Text>Table</Text>&nbsp;
              <Text weight="bold">{params.name}</Text>&nbsp;
              <Text>has been successfully deleted</Text>&nbsp;
            </Group>
          ),
        });

        client.refetchQueries({ stale: true });

        closeAllModals();
      },
    },
  );

  useEffect(() => {
    createTable();
  }, []);

  return (
    <Stack align="center">
      <Text>Creating Table...</Text>

      {createTableLoading && <Modal.Status variant="loading" />}

      {!!createTableError && (
        <>
          <Modal.Status variant="error" />
          <ErrorAlert error={createTableError} />
        </>
      )}

      <Button disabled={createTableLoading} fullWidth onClick={onClose}>
        Back
      </Button>
    </Stack>
  );
}

CreateTableModal.open = function openCreateTableModal(props: Props) {
  const modalId = 'create-table';

  openModal({
    modalId,
    title: <Text weight="bold">Create New Table</Text>,
    children: <CreateTableModal {...props} />,
  });
};

export default CreateTableModal;
