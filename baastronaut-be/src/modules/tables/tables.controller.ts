import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Paginate, PaginateQuery } from 'nestjs-paginate';
import { Pageable } from '../../utils/utility-types';
import { AuthedRequest } from '../auth/auth.service';
import { HasAdminRightsGuard } from '../workspaces/workspace-auth.guard';
import { ProjectAuthorizationGuard } from '../projects/project-auth.guard';
import { TablesService } from './tables.service';
import {
  CreateFtsGroupReq,
  CreateTableReq,
  FtsGroupResp,
  TableResp,
} from './types';
import { FtsGroup } from './fts-group.entity';

@UseGuards(ProjectAuthorizationGuard)
@Controller('workspaces/:workspaceId/projects/:projectId/tables')
export class TablesController {
  constructor(private tablesService: TablesService) {}

  @UseGuards(HasAdminRightsGuard)
  @Post()
  async createTableInProject(
    @Request() req: AuthedRequest,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() createTableReq: CreateTableReq,
  ): Promise<TableResp> {
    return await this.tablesService.createTableInProject(
      projectId,
      createTableReq,
      req.user,
    );
  }

  @Get()
  async getTablesInProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Paginate() paginateQuery: PaginateQuery,
  ): Promise<Pageable<TableResp>> {
    return await this.tablesService.getTablesInProject(
      projectId,
      paginateQuery,
    );
  }

  @Get(':tableId')
  async getTable(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('tableId', ParseIntPipe) tableId: number,
  ): Promise<TableResp> {
    return await this.tablesService.getTable(projectId, tableId);
  }

  @UseGuards(HasAdminRightsGuard)
  @Delete(':tableId')
  async deleteTable(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('tableId', ParseIntPipe) tableId: number,
  ) {
    await this.tablesService.deleteTable(projectId, tableId);
    return {
      success: true,
    };
  }

  // NOT READY
  // @UseGuards(HasAdminRightsGuard)
  // @Post(':tableId/fts')
  // async createTableFtsGroup(
  //   @Param('projectId', ParseIntPipe) projectId: number,
  //   @Param('tableId', ParseIntPipe) tableId: number,
  //   @Body() createFtsGroupReq: CreateFtsGroupReq,
  // ): Promise<FtsGroupResp> {
  //   const ftsGroup = await this.tablesService.createTableFtsGroup(
  //     projectId,
  //     tableId,
  //     createFtsGroupReq,
  //   );

  //   return toFtsGroupResp(ftsGroup);
  // }
}

function toFtsGroupResp(ftsGroup: FtsGroup): FtsGroupResp {
  return {
    id: ftsGroup.id,
    tableId: ftsGroup.tableId,
    name: ftsGroup.name,
    description: ftsGroup.description,
    columns: (ftsGroup.columns || []).map((c) => ({
      ftsGroupId: c.ftsGroupId,
      columnId: c.columnId,
      weight: c.weight,
      createdAt: c.createdAt.toISOString(),
    })),
    createdAt: ftsGroup.createdAt.toISOString(),
    updatedAt: ftsGroup.updatedAt.toISOString(),
  };
}
