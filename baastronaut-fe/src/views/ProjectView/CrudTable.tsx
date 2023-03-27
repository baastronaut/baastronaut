import {
  Checkbox,
  Table,
  Text,
  createStyles,
  ThemeIcon,
  Center,
  NumberInput,
  Box,
  Button,
  InputProps,
} from '@mantine/core';
import Spreadsheet, {
  DataEditor,
  DataEditorProps,
  DataViewer,
  DataViewerProps,
  HeaderRowProps,
  TableProps,
} from 'react-spreadsheet';
import {
  ColumnType,
  Table as TableMeta,
  TableRowData,
  ColumnTypeToValueMap,
} from 'client/types';
import { useTableData, useTableDataInsert } from 'src/hooks';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { IconCheck, IconX } from '@tabler/icons-react';
import { useSaveTableEdit } from './useSaveTableEdit';
import { DateTimePicker } from '@mantine/dates';
import dayjs from 'dayjs';

const dateFormat = 'DD MMM YYYY hh:mm A';

interface CellData {
  type: ColumnType;
  rowId: number;
  cellKey: string;
  value: ColumnTypeToValueMap[this['type']];
}

interface FormValues {
  data: TableRowData[];
}

const useStyles = createStyles((theme) => ({
  spreadsheet: {
    '&.Spreadsheet': {
      '--outline-color': theme.fn.primaryColor(),
      minWidth: '30%',
    },
  },
}));

interface Props {
  projectId: number;
  table: TableMeta;
}

const CrudTable = ({ projectId, table }: Props) => {
  const { classes } = useStyles();
  const tableId = table.id;

  const { tableData, refetchTableData } = useTableData({
    projectId,
    tableId,
  });

  const { insertTableRowData } = useTableDataInsert(
    { projectId, table },
    { onSuccess: () => refetchTableData() },
  );

  const columnLabels = table.columns.map((col) => col.name);

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

  const tableDataMatrix = form.values.data.map((rowData) => {
    return table.columns.map((col) => {
      const cellKey = col.pgColumnIdentifier;

      return {
        type: col.columnType,
        rowId: rowData.id,
        cellKey,
        value: rowData[cellKey],
      };
    });
  });

  function TableComp({ children, ...props }: TableProps) {
    return (
      <Table withBorder {...props}>
        {children}
        <tr>
          <td>
            <Box className="Spreadsheet__data-viewer">
              <Button
                size="sm"
                compact
                variant="subtle"
                onClick={() => insertTableRowData()}
              >
                + Add Row
              </Button>
            </Box>
          </td>
        </tr>
      </Table>
    );
  }

  function handleCellCommit(
    _prevCell: CellData | null,
    nextCell: CellData | null,
  ) {
    if (!nextCell) return;

    const { rowId, cellKey, value } = nextCell;

    const affectedRowIndex = form.values.data.findIndex(
      (data) => data.id === rowId,
    );
    const affectedRow = form.values.data[affectedRowIndex];

    if (affectedRow && affectedRow[cellKey] !== value) {
      form.setFieldValue(`data.${affectedRowIndex}.${cellKey}`, value);
      queueRowUpdateSave(affectedRowIndex);
    }
  }

  return (
    <Spreadsheet<CellData>
      columnLabels={columnLabels}
      HeaderRow={HeaderRow}
      Table={TableComp}
      onCellCommit={handleCellCommit}
      hideRowIndicators
      DataEditor={DataEditorComp}
      DataViewer={DataViewerComp}
      data={tableDataMatrix}
      className={classes.spreadsheet}
    />
  );
};

function HeaderRow(props: HeaderRowProps) {
  return (
    <Text
      component="tr"
      weight="500"
      sx={{
        '.Spreadsheet__header': {
          fontWeight: 500,
        },
      }}
      {...props}
    />
  );
}

function DataEditorComp({
  cell,
  onChange,
  ...props
}: DataEditorProps<CellData>) {
  if (!cell) {
    return null;
  }

  const inputCommonProps: Partial<InputProps & { autoFocus: boolean }> = {
    autoFocus: true,
    size: 'sm',
    m: -2,
    radius: 0,
    styles: (theme) => ({
      input: {
        ':focus': {
          borderWidth: '2px',
          boxShadow: theme.shadows.xl,
        },
      },
    }),
  };

  const { type, rowId, cellKey } = cell;

  if (type === ColumnType.BOOLEAN) {
    const value = getCellValue(cell, type);

    return (
      <Center sx={{ height: '100%' }}>
        <Checkbox
          checked={value}
          onChange={(ev) =>
            onChange({ type, rowId, cellKey, value: ev.currentTarget.checked })
          }
        />
      </Center>
    );
  }

  if (type === ColumnType.INTEGER || type === ColumnType.FLOAT) {
    const value = getCellValue(cell, type);

    return (
      <NumberInput
        {...inputCommonProps}
        step={type === ColumnType.FLOAT ? 0.01 : undefined}
        precision={type === ColumnType.FLOAT ? 5 : undefined}
        value={value}
        onChange={(value) =>
          onChange({
            type,
            rowId,
            cellKey,
            value,
          })
        }
      />
    );
  }

  if (type === ColumnType.DATETIME) {
    const value = getCellValue(cell, type);

    return (
      <DateTimePicker
        value={value ? new Date(value) : undefined}
        placeholder="Tap again to open date picker"
        valueFormat={dateFormat}
        {...inputCommonProps}
        onChange={(value) => {
          onChange({
            type,
            rowId,
            cellKey,
            value: value?.toISOString() || '',
          });
        }}
        popoverProps={{
          transitionProps: {
            transition: 'pop',
          },
          defaultOpened: true,
        }}
      />
    );
  }

  return (
    <DataEditor
      cell={cell}
      {...props}
      onChange={(changedCell) => {
        onChange({
          type,
          rowId,
          cellKey,
          value: changedCell.value,
        });
      }}
    />
  );
}

function DataViewerComp({ cell, ...props }: DataViewerProps<CellData>) {
  const defaultDataViewer = <DataViewer cell={cell} {...props} />;

  if (!cell) {
    return defaultDataViewer;
  }

  const { type } = cell;

  if (type === ColumnType.BOOLEAN) {
    const isChecked = getCellValue(cell, type);

    return (
      <Center sx={{ height: '100%' }}>
        <ThemeIcon
          variant="outline"
          size="sm"
          sx={{ border: 'none' }}
          color={isChecked ? 'green' : 'red'}
        >
          {isChecked ? <IconCheck /> : <IconX />}
        </ThemeIcon>
      </Center>
    );
  }

  if (type === ColumnType.DATETIME) {
    const value = getCellValue(cell, type);

    return (
      <DataViewer
        cell={{
          ...cell,
          value: value ? dayjs(value).format(dateFormat) : '',
        }}
        {...props}
      />
    );
  }

  return defaultDataViewer;
}

// Need this to coerce value into the proper ts type
function getCellValue<T extends ColumnType>(
  cell: CellData,
  _type: T,
): ColumnTypeToValueMap[T] {
  return cell.value as ColumnTypeToValueMap[T];
}

export default CrudTable;
