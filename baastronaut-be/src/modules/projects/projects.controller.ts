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
import { CreateProjectReq, ProjectResp } from './types';
import { ProjectsService } from './projects.service';
import { AuthedRequest } from '../auth/auth.service';
import {
  HasAdminRightsGuard,
  WorkspaceAuthorizationGuard,
} from '../workspaces/workspace-auth.guard';
import { Paginate, PaginateQuery } from 'nestjs-paginate';
import { Pageable } from '../../utils/utility-types';

@UseGuards(WorkspaceAuthorizationGuard)
@Controller('workspaces/:workspaceId/projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @UseGuards(HasAdminRightsGuard)
  @Post()
  async createProject(
    @Request() authedReq: AuthedRequest,
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Body() createProjectReq: CreateProjectReq,
  ): Promise<ProjectResp> {
    return await this.projectsService.createProject(
      authedReq.user,
      workspaceId,
      createProjectReq,
    );
  }

  @UseGuards(HasAdminRightsGuard)
  @Delete(':projectId')
  async deleteProject(
    @Request() authedReq: AuthedRequest,
    @Param('projectId', ParseIntPipe) projectId: number,
  ) {
    await this.projectsService.deleteProject(authedReq.user, projectId);
    return {
      success: true,
    };
  }

  @Get(':projectId')
  async getProject(
    @Param('projectId', ParseIntPipe) projectId: number,
  ): Promise<ProjectResp> {
    return await this.projectsService.getProject(projectId);
  }

  @Get()
  async getProjects(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Paginate() paginateQuery: PaginateQuery,
  ): Promise<Pageable<ProjectResp>> {
    return await this.projectsService.getProjectsInWorkspace(
      workspaceId,
      paginateQuery,
    );
  }
}
