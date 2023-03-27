import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { UserDataDBService } from '../user-data-db/user-data-db-service';
import { Project } from './project.entity';
import * as crypto from 'crypto';
import { EncryptionService } from '../encryption/encryption.service';
import { PostgrestService } from '../postgrest/postgrest.service';
import { CreateProjectReq, ProjectResp } from './types';
import { AuthedUser } from '../auth/auth.service';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { Pageable } from '../../utils/utility-types';
import { PROJECTS_PAGINATION_CONFIG } from './projects-pagination.config';

@Injectable()
export class ProjectsService {
  private logger = new Logger(ProjectsService.name);

  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    private userDataDBService: UserDataDBService,
    private encryptionService: EncryptionService,
    private postgrestService: PostgrestService,
  ) {}

  /**
   * Creates a new project in db, the corresponding schema in user data db, and reloads PostgREST.
   */
  async createProject(
    authedUser: AuthedUser,
    workspaceId: number,
    createProjectReq: CreateProjectReq,
  ): Promise<ProjectResp> {
    if (
      !authedUser.allowedWorkspaces
        .map((ws) => ws.workspaceId)
        .includes(workspaceId)
    ) {
      throw new NotFoundException('Workspace not found.');
    }

    // schema name is not exposed to users, hence it doesn't have to be human-friendly.
    const schemaName = `ws_${workspaceId}_${crypto
      .randomBytes(12)
      .toString('hex')}`.toLowerCase();
    const newSchemaDetails = {
      identifier: schemaName,
      owner: schemaName,
      password: crypto.randomBytes(16).toString('hex'),
    };

    const encryptedPayload = this.encryptionService.encrypt(
      newSchemaDetails.password,
    );

    try {
      await this.userDataDBService.createSchemaWithOwner(newSchemaDetails);
    } catch (err) {
      this.logger.log({ err }, 'Error while trying to create a new project.');
      throw new InternalServerErrorException(
        'An error occurred while creating new project.',
      );
    }

    await this.addSchemaAndReloadPostgrestConfig(newSchemaDetails.identifier);

    try {
      let project = new Project();
      project.name = createProjectReq.name.trim();
      project.creatorId = authedUser.id;
      project.workspaceId = workspaceId;
      project.description = createProjectReq.description;
      project.pgSchemaIdentifier = newSchemaDetails.identifier;
      project.pgSchemaOwner = newSchemaDetails.owner;
      project.pgSchemaOwnerEncryptedPW = encryptedPayload.payload;
      project.pgSchemaOwnerEncIV = encryptedPayload.iv;
      project = await this.projectsRepository.save(project);

      return this.toProjectResp(project);
    } catch (err) {
      await this.userDataDBService.dropSchemaAndOwner(newSchemaDetails, true);
      await this.removeSchemaAndReloadPostgrestConfig(
        newSchemaDetails.identifier,
      );
      throw err;
    }
  }

  /**
   * Deletes a project. Doesn't check whether user has the rights to delete a project or not.
   * Will also drop the owner, schema and all objects in the schema for this project.
   * Irreversible action.
   */
  async deleteProject(authedUser: AuthedUser, projectId: number) {
    const project = await this.getProjectEntityOrThrow(projectId);

    if (
      !authedUser.allowedWorkspaces
        .map((ws) => ws.workspaceId)
        .includes(project.workspaceId)
    ) {
      throw new NotFoundException('Project not found.');
    }

    if (!project.id) {
      throw new InternalServerErrorException(
        'Unexpected invalid project state.',
      );
    }

    await this.userDataDBService.dropSchemaAndOwner(
      {
        identifier: project.pgSchemaIdentifier,
        owner: project.pgSchemaOwner,
      },
      true,
    );

    await this.removeSchemaAndReloadPostgrestConfig(project.pgSchemaIdentifier);

    // ON DELETE CASCADE is already set in the database for the following relations:
    // project -> tables, project -> api_tokens, tables -> columns
    await this.projectsRepository.delete(project.id);
  }

  async getProject(projectId: number): Promise<ProjectResp> {
    const project = await this.getProjectEntityOrThrow(projectId);
    return this.toProjectResp(project);
  }

  async getProjectsInWorkspace(
    workspaceId: number,
    paginateQuery: PaginateQuery,
  ): Promise<Pageable<ProjectResp>> {
    const queryBuilder = this.projectsRepository
      .createQueryBuilder('projects')
      .where('projects.workspaceId = :workspaceId', { workspaceId });

    const paginatedEntityResults = await paginate<Project>(
      paginateQuery,
      queryBuilder,
      PROJECTS_PAGINATION_CONFIG,
    );
    const paginatedResp: Pageable<ProjectResp> = {
      ...paginatedEntityResults,
      data: await Promise.all(
        paginatedEntityResults.data.map((projectEntity) =>
          this.toProjectResp(projectEntity),
        ),
      ),
    };
    return paginatedResp;
  }

  async getProjectEntityOrThrow(projectId: number): Promise<Project> {
    const project = await this.projectsRepository.findOne({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    return project;
  }

  private toProjectResp(project: Project): ProjectResp {
    return {
      id: project.id!,
      name: project.name,
      workspaceId: project.workspaceId,
      creatorId: project.workspaceId,
      description: project.description,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }

  private async addSchemaAndReloadPostgrestConfig(schema: string) {
    await this.postgrestService.addDbSchema(schema);
    await this.userDataDBService.reloadPostgrestConfig();
  }

  private async removeSchemaAndReloadPostgrestConfig(schema: string) {
    await this.postgrestService.removeDbSchema(schema);
    await this.userDataDBService.reloadPostgrestConfig();
  }
}
