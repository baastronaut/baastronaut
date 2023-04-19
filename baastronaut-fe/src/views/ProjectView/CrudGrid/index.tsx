import { ActionIcon, Box, Button, Text, createStyles } from '@mantine/core';
import {
  ReactGrid,
  Column,
  Row,
  DefaultCellTypes,
  CellChange,
} from '@silevis/reactgrid';
import {
  ColumnType,
  Table as TableMeta,
  TableRowData,
  ColumnTypeToValueMap,
  ColumnResp,
  TableDataValue,
} from 'client/types';
import { useDeleteTableRow, useTableData, useTableDataInsert } from 'src/hooks';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { useSaveTableEdit } from '../useSaveTableEdit';
import '@silevis/reactgrid/styles.css';
import { z } from 'zod';
import { IconPlus } from '@tabler/icons-react';
import {
  AddColHeaderCellTemplate,
  AddColHeaderCell,
} from './AddColHeaderCellTemplate';
import { DelRowCell, DelRowCellTemplate } from './DelRowTemplate';
import AddColumnModal from './AddColumnModal';
import { useQueryClient } from 'react-query';
import { openConfirmModal } from '@mantine/modals';

interface FormValues {
  data: TableRowData[];
}

const useStyles = createStyles(() => ({
  spreadsheet: {
    '.rg-celleditor': {
      input: {
        border: 'none',
      },
    },
  },
  addColHeaderCell: {
    width: '50%',
  },
}));

interface Props {
  workspaceId: number;
  projectId: number;
  table: TableMeta;
}

const CrudGrid = ({ workspaceId, projectId, table }: Props) => {
  const { classes } = useStyles();
  const tableId = table.id;

  const client = useQueryClient();

  const { tableData, refetchTableData } = useTableData({
    projectId,
    tableId,
  });

  const { insertTableRowData } = useTableDataInsert(
    { projectId, table },
    { onSuccess: () => refetchTableData() },
  );

  const { deleteTableRow } = useDeleteTableRow(
    { projectId, tableId },
    {
      onSuccess: () => {
        client.refetchQueries({ stale: true });
      },
    },
  );

  const form = useForm<FormValues>({
    initialValues: {
      data: tableData || [],
    },
  });

  const visibleColumnKeys = table.columns.map((col) => col.pgColumnIdentifier);
  const { queueRowUpdateSave, savingRowUpdate } = useSaveTableEdit({
    form,
    projectId,
    tableId,
    visibleColumnKeys,
  });

  useEffect(() => {
    if (tableData) {
      // Backend current returns data sorted by updated_at ASC
      // Sorting by ID instead should probably be done by the backend.
      const sortedTableData = [...(tableData || [])].sort((data1, data2) => {
        return data1.id - data2.id;
      });

      const values = { data: sortedTableData };
      form.setValues(values);
      form.resetDirty(values);
    }
  }, [tableData]);

  const headerRow: Row<DefaultCellTypes | AddColHeaderCell> = {
    rowId: 'header',
    cells: [
      ...table.columns.map((col): DefaultCellTypes | AddColHeaderCell => {
        return {
          type: 'header',
          text: col.name,
        };
      }),
      { type: 'addColHeader' },
    ],
  };

  const columns: Column[] = [
    ...table.columns.map(
      (col): Column => ({
        columnId: col.pgColumnIdentifier,
      }),
    ),
    { columnId: 'action', width: 50 },
  ];

  const rows: Row<DefaultCellTypes | AddColHeaderCell | DelRowCell>[] = [
    headerRow,
    ...form.values.data.map((rowData): Row<DefaultCellTypes | DelRowCell> => {
      const rowId = rowData.id;

      return {
        rowId,
        cells: [
          ...table.columns.map((col) => getCell(col, rowData)),
          { type: 'deleteRow', rowId },
        ],
      };
    }),
  ];

  function handleCellChange(cellChanges: CellChange[]) {
    console.log({ cellChanges });
    cellChanges.map((change) => {
      const rowIndex = form.values.data.findIndex(
        (data) => data.id === change.rowId,
      );
      const { type, columnId, newCell } = change;
      const fieldPath = `data.${rowIndex}.${columnId}`;

      if (type === 'text') {
        updateRow(rowIndex, fieldPath, newCell.text);
        return;
      }

      if (type === 'number') {
        const isValid = newCell.validator?.(newCell.value) || true;
        isValid && updateRow(rowIndex, fieldPath, newCell.value);
        return;
      }

      if (type === 'checkbox') {
        updateRow(rowIndex, fieldPath, newCell.checked);
        return;
      }

      if (type === 'date') {
        updateRow(rowIndex, fieldPath, newCell.date?.toISOString());
        return;
      }

      console.log({ change });

      throw new Error(`Cell commit: unknown cell type ${type}`);
    });
  }

  function updateRow(
    rowIndex: number,
    path: string,
    value: string | number | boolean | undefined,
  ) {
    form.setFieldValue(path, value);
    queueRowUpdateSave(rowIndex);
  }

  function handleAddColumn() {
    AddColumnModal.open({
      workspaceId,
      projectId,
      tableId,
    });
  }

  function handleDeleteRow(cell: DelRowCell) {
    openConfirmModal({
      title: <Text weight="bold">Delete Row</Text>,
      children: 'Are you sure you wish to delete the row?',
      confirmProps: {
        color: 'red',
        children: 'Delete',
      },
      cancelProps: {
        children: 'Back',
      },
      onConfirm: () => {
        cell.rowId && deleteTableRow(cell.rowId);
      },
    });
  }

  return (
    <Box className={classes.spreadsheet}>
      <ReactGrid
        rows={rows}
        columns={columns}
        onCellsChanged={handleCellChange}
        enableRangeSelection
        customCellTemplates={{
          addColHeader: new AddColHeaderCellTemplate(handleAddColumn),
          deleteRow: new DelRowCellTemplate(handleDeleteRow),
        }}
      />
      <Box mt="xs">
        <Button
          leftIcon={<IconPlus />}
          variant="subtle"
          onClick={() => insertTableRowData()}
          size="sm"
          compact
        >
          Add Row
        </Button>
      </Box>
    </Box>
  );
};

function getCell(col: ColumnResp, rowData: TableRowData): DefaultCellTypes {
  const type = col.columnType;

  if (type === ColumnType.TEXT) {
    const value = getCellValue(rowData[col.pgColumnIdentifier], type);

    return {
      type: 'text',
      text: value || '',
    };
  }

  if (type === ColumnType.INTEGER) {
    const value = getCellValue(rowData[col.pgColumnIdentifier], type);

    return {
      type: 'number',
      value,
      validator: (value) => z.number().int().safeParse(value).success,
    };
  }

  if (type === ColumnType.FLOAT) {
    const value = getCellValue(rowData[col.pgColumnIdentifier], type);

    return {
      type: 'number',
      value,
    };
  }

  if (type === ColumnType.BOOLEAN) {
    const value = getCellValue(rowData[col.pgColumnIdentifier], type);

    return {
      type: 'checkbox',
      checked: !!value,
    };
  }

  if (type === ColumnType.DATETIME) {
    const value = getCellValue(rowData[col.pgColumnIdentifier], type);
    const date = value ? new Date(value) : undefined;

    return {
      type: 'date',
      date,
    };
  }

  throw new Error(`Unknown column type: ${type}`);
}

// Need this to coerce value into the proper ts type
function getCellValue<T extends ColumnType>(
  value: TableDataValue,
  _type: T,
): ColumnTypeToValueMap[T] {
  return value as ColumnTypeToValueMap[T];
}

export default CrudGrid;
