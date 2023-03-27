import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { AuthedRequest } from '../auth/auth.service';

/**
 * This guard requires a "projectId" parameter in the path.
 * It checks whether user has access to the project referenced by the value of projectId.
 */
@Injectable()
export class ProjectAuthorizationGuard implements CanActivate {
  constructor(private projectsService: ProjectsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest() as AuthedRequest;
    const { user } = request;
    const projectId = parseInt(request.params?.projectId);
    if (!projectId || isNaN(projectId)) {
      throw new NotFoundException('Project not found.');
    }

    const project = await this.projectsService.getProjectEntityOrThrow(
      projectId,
    );

    if (
      !user.allowedWorkspaces
        .map((ws) => ws.workspaceId)
        .includes(project.workspaceId)
    ) {
      throw new NotFoundException('Project not found.');
    }

    return true;
  }
}
