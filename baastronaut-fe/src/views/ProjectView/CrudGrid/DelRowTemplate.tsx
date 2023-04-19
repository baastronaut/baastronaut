import { ActionIcon, Box } from '@mantine/core';
import { Compatible, Uncertain, CellTemplate } from '@silevis/reactgrid';
import { IconTrash } from '@tabler/icons-react';

export interface DelRowCell {
  type: 'deleteRow';
  rowId?: number;
}

export class DelRowCellTemplate implements CellTemplate {
  deleteRowHandler: (cell: Compatible<DelRowCell>) => void;

  constructor(_deleteRowHandler: (cell: Compatible<DelRowCell>) => void) {
    this.deleteRowHandler = _deleteRowHandler;
  }

  getCompatibleCell(
    uncertainCell: Uncertain<DelRowCell>,
  ): Compatible<DelRowCell> {
    return { ...uncertainCell, text: '', value: NaN };
  }

  isFocusable() {
    return false;
  }

  render(
    cell: Compatible<DelRowCell>,
    _isInEditMode: boolean,
    onCellChanged: (cell: Compatible<DelRowCell>, commit: boolean) => void,
  ) {
    return (
      <Box mr="auto" ml="auto">
        <ActionIcon
          onClick={() => {
            this.deleteRowHandler(cell);
            onCellChanged({ ...cell }, true);
          }}
          size="xs"
        >
          <IconTrash />
        </ActionIcon>
      </Box>
    );
  }
}
