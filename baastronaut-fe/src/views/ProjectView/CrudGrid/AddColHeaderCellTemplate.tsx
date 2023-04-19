import { ActionIcon, Box } from '@mantine/core';
import { Compatible, Uncertain, CellTemplate } from '@silevis/reactgrid';
import { IconPlus } from '@tabler/icons-react';

export interface AddColHeaderCell {
  type: 'addColHeader';
}

export class AddColHeaderCellTemplate implements CellTemplate {
  handleClick: () => void;

  constructor(clickHandler: () => void) {
    this.handleClick = () => {
      clickHandler();
    };
  }

  getCompatibleCell(
    uncertainCell: Uncertain<AddColHeaderCell>,
  ): Compatible<AddColHeaderCell> {
    return { ...uncertainCell, text: '', value: NaN };
  }

  isFocusable() {
    return false;
  }

  render(cell: Compatible<AddColHeaderCell>) {
    return (
      <Box mr="auto" ml="auto">
        <ActionIcon
          onClick={() => {
            this.handleClick();
          }}
          size="xs"
        >
          <IconPlus />
        </ActionIcon>
      </Box>
    );
  }
}
