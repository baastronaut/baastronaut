import {
  Button,
  Checkbox,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { closeAllModals, closeModal, openModal } from '@mantine/modals';
import { showNotification } from '@mantine/notifications';
import { IconCheck } from '@tabler/icons-react';
import { ColumnType } from 'client/types';
import { useEffect } from 'react';
import { useQueryClient } from 'react-query';
import { ErrorAlert, Modal } from 'src/components';
import { useAddTableColumn } from 'src/hooks';
import { z } from 'zod';

const columnType = z.nativeEnum(ColumnType);

const schema = z.object({
  name: z.string({ required_error: 'Please enter a column name' }),
  description: z.string({
    required_error: 'Please enter a column description',
  }),
  columnType: columnType,
  required: z.boolean(),
});

type SchemaValues = z.infer<typeof schema>;

const defaultColumnValue: z.infer<typeof schema> = {
  name: '',
  description: '',
  columnType: ColumnType.TEXT,
  required: false,
};

interface Props {
  workspaceId: number;
  projectId: number;
  tableId: number;
}

const AddColumnModal = ({ workspaceId, projectId, tableId }: Props) => {
  const form = useForm<SchemaValues>({
    initialValues: defaultColumnValue,
    validate: zodResolver(schema),
  });

  const selectDataLabel: Record<ColumnType, string> = {
    [ColumnType.TEXT]: 'Text',
    [ColumnType.INTEGER]: 'Number',
    [ColumnType.FLOAT]: 'Decimal',
    [ColumnType.BOOLEAN]: 'True/false',
    [ColumnType.DATETIME]: 'Date',
  };

  const selectData = Object.entries(selectDataLabel).map(([value, label]) => {
    return { value, label };
  });

  function handleSubmit(values: SchemaValues) {
    const modalId = 'processCreateTable';

    openModal({
      modalId,
      children: (
        <ProcessAddTableColumn
          workspaceId={workspaceId}
          projectId={projectId}
          tableId={tableId}
          params={values}
          onClose={() => closeModal(modalId)}
        />
      ),
      withCloseButton: false,
      closeOnClickOutside: false,
      closeOnEscape: false,
    });
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <TextInput
          label="Column Name"
          placeholder="e.g. Employee ID"
          autoComplete="off"
          {...form.getInputProps('name')}
        />

        <TextInput
          label="Column Description"
          autoComplete="off"
          placeholder="e.g. ID of employee in company"
          {...form.getInputProps('description')}
        />

        <Checkbox
          label="Required"
          {...form.getInputProps('required', { type: 'checkbox' })}
        />

        <Select
          label="Type"
          data={selectData}
          {...form.getInputProps('columnType')}
        />

        <Button type="submit">Save</Button>
      </Stack>
    </form>
  );
};

interface ProcessAddTableColumnProps {
  workspaceId: number;
  projectId: number;
  tableId: number;
  params: SchemaValues;
  onClose: () => void;
}

function ProcessAddTableColumn({
  workspaceId,
  projectId,
  tableId,
  params,
  onClose,
}: ProcessAddTableColumnProps) {
  const client = useQueryClient();
  const { addTableColumn, addTableColumnError, addTableColumnLoading } =
    useAddTableColumn(
      { workspaceId, projectId, tableId },
      {
        onSuccess: () => {
          showNotification({
            color: 'green',
            icon: <IconCheck />,
            message: (
              <Group spacing={0}>
                <Text>Column</Text>&nbsp;
                <Text weight="bold">{params.name}</Text>&nbsp;
                <Text>has been successfully added</Text>&nbsp;
              </Group>
            ),
          });

          client.refetchQueries({ stale: true });

          closeAllModals();
        },
      },
    );

  useEffect(() => {
    addTableColumn(params);
  }, []);

  return (
    <Stack align="center">
      <Text>Creating Table...</Text>

      {addTableColumnLoading && <Modal.Status variant="loading" />}

      {!!addTableColumnError && (
        <>
          <Modal.Status variant="error" />
          <ErrorAlert error={addTableColumnError} />
        </>
      )}

      <Button disabled={addTableColumnLoading} fullWidth onClick={onClose}>
        Back
      </Button>
    </Stack>
  );
}

AddColumnModal.open = function openCreateTableModal(props: Props) {
  const modalId = 'add-table-column';

  openModal({
    modalId,
    title: <Text weight="bold">New Column</Text>,
    children: <AddColumnModal {...props} />,
  });
};

export default AddColumnModal;
