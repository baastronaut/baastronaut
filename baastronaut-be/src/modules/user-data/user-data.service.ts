import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../projects/project.entity';
import { Table } from '../tables/table.entity';
import * as jose from 'jose';

export type ProjectPgDetails = {
  id: number;
  pgSchemaOwner: string;
  pgSchemaIdentifier: string;
};

export type TablePgDetails = {
  id: number;
  pgTableIdentifier: string;
  projectPgDetails: ProjectPgDetails;
};

function toProjectPgDetails(project: Project): ProjectPgDetails {
  return {
    id: project.id!,
    pgSchemaOwner: project.pgSchemaOwner,
    pgSchemaIdentifier: project.pgSchemaIdentifier,
  };
}

@Injectable()
export class UserDataService {
  constructor(
    @InjectRepository(Project) private projectsRepository: Repository<Project>,
    @InjectRepository(Table) private tablesRepository: Repository<Table>,
    @Inject('PGRST_JWT_PRIVATE_KEY_JWK')
    private pgrstJwtPrivateKeyJWK: jose.KeyLike,
  ) {}

  async getProjectPgDetails(projectId: number): Promise<ProjectPgDetails> {
    const project = await this.projectsRepository.findOne({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project does not exist.');
    }

    return toProjectPgDetails(project);
  }

  async getTablePgDetails(
    projectId: number,
    tableId: number,
  ): Promise<TablePgDetails> {
    const table = await this.tablesRepository.findOne({
      where: {
        id: tableId,
        projectId,
      },
      relations: {
        project: true,
      },
    });

    if (!table) {
      throw new NotFoundException('Table does not exist.');
    }

    return {
      id: table.id!,
      pgTableIdentifier: table.pgTableIdentifier,
      projectPgDetails: toProjectPgDetails(table.project!),
    };
  }

  /**
   * We are using PostgREST with Postgres' Row-Level Security. We need the email in the token
   * for verification because of the RLS policy we put on tables when creating them.
   * The value in email ensures that user can only add or update rows with creator = their own email.
   */
  async createSignedJwtForPgrst(role: string, email: string): Promise<string> {
    if (!role || !email) {
      throw new InternalServerErrorException('An internal error occurred.');
    }

    return await this.jwtSignPayload({
      role,
      email,
    });
  }

  /**
   * Creates a token without email while setting "apiUser: true" in the payload.
   * Not having email field essentially creates a read-only access token.
   * We currently support only read-only api accesses because it is simpler. If we
   * want to allow api tokens with write access, we need 1) a way to indicate this
   * in the token payload, 2) update modification policy for all tables, old and new,
   * to check for it. This is done in user-data-db-service's createTableWithRowLevelSecurity()
   * for new tables. For old tables, we would need to update their existing policy.
   *
   * Another option (which has its own pitfalls) is to create a separate Postgres user for each
   * api token, and if it is a read-only token, only grant select privileges to the user. The issue
   * is we need to run the "grant" command everytime user creates a new table as these privileges are
   * not applied to tables created later.
   */
  async createReadOnlyApiUserSignedJwtForPgrst(role: string): Promise<string> {
    if (!role) {
      throw new InternalServerErrorException('An internal error occurred.');
    }
    return await this.jwtSignPayload({
      role,
      apiUser: true,
    });
  }

  private async jwtSignPayload(payload: any): Promise<string> {
    return await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'RS512' })
      .setIssuedAt()
      .setIssuer('app')
      .sign(this.pgrstJwtPrivateKeyJWK);
  }
}
