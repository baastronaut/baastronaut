import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { HasAdminRightsGuard } from '../workspaces/workspace-auth.guard';
import { ColumnsService } from './columns.service';
import { AddColumnReq, ColumnResp } from './types';

@Controller(
  'workspaces/:workspaceId/projects/:projectId/tables/:tableId/columns',
)
export class ColumnsController {
  constructor(private columnsService: ColumnsService) {}

  @UseGuards(HasAdminRightsGuard)
  @Post()
  async addTableColumn(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('tableId', ParseIntPipe) tableId: number,
    @Body() addColumnReq: AddColumnReq,
  ): Promise<ColumnResp> {
    return await this.columnsService.addTableColumn(
      projectId,
      tableId,
      addColumnReq,
    );
  }

  /**
   * This will delete the column and all the data in the column and the action
   * is **irreversible**.
   */
  @UseGuards(HasAdminRightsGuard)
  @Delete(':columnId')
  async dropTableColumn(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('tableId', ParseIntPipe) tableId: number,
    @Param('columnId', ParseIntPipe) columnId: number,
  ) {
    await this.columnsService.dropTableColumn(projectId, tableId, columnId);
    return {
      success: true,
    };
  }
}
