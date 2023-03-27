import { UseFormReturnType } from '@mantine/form';
import { useDebouncedValue } from '@mantine/hooks';
import { TableRowData, TableDataValue } from 'client/types';
import { useEffect, useState } from 'react';
import { useTableDataUpdate } from 'src/hooks';

const queuedRowWait = 2000;

interface FormValues {
  data: TableRowData[];
}

export function useSaveTableEdit({
  form,
  projectId,
  tableId,
  visibleColumnKeys,
}: {
  form: UseFormReturnType<FormValues>;
  projectId: number;
  tableId: number;
  visibleColumnKeys: (string | undefined)[];
}) {
  const { updateTableRowData, updateTableRowDataLoading } = useTableDataUpdate({
    projectId,
    tableId,
  });
  const [queuedRowUpdate, setQueuedRowUpdate] = useState<number[]>([]);
  const [debouncedQueuedRowUpdate] = useDebouncedValue(
    queuedRowUpdate,
    queuedRowWait,
  );

  useEffect(() => {
    if (debouncedQueuedRowUpdate.length) {
      updateRows(debouncedQueuedRowUpdate);
    }
  }, [debouncedQueuedRowUpdate]);

  function updateRows(rows: number[]) {
    const dedupedRows = Array.from(new Set(rows));

    for (const rowIndex of dedupedRows.values()) {
      const values = form.values.data[rowIndex];
      updateRow(values);
    }

    setQueuedRowUpdate([]);
  }

  function updateRow(data: TableRowData) {
    // Remove non visible columns
    const entries = Object.entries(data).reduce((arr, cell) => {
      const [key, value] = cell;

      if (!key || !visibleColumnKeys.includes(key)) return arr;

      const result: Array<[string, TableDataValue]> = [...arr, [key, value]];

      return result;
    }, [] as Array<[string, TableDataValue]>);

    const sanitizedPayload = {
      ...Object.fromEntries<TableDataValue>(
        new Map<string, TableDataValue>(entries),
      ),
    };

    updateTableRowData({ id: data.id, data: sanitizedPayload });
  }

  function queueRowUpdateSave(rowIndex: number) {
    setQueuedRowUpdate([...queuedRowUpdate, rowIndex]);
  }

  return { queueRowUpdateSave, savingRowUpdate: updateTableRowDataLoading };
}
