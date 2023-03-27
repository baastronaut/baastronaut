import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthedUser } from '../auth/auth.service';
import { Role } from '../users/user-workspace.entity';
import { UsersService } from '../users/users.service';
import { WorkspaceInvite } from './workspace-invites.entity';
import { v4 as uuidV4 } from 'uuid';
import { EmailService } from '../email/email.service';
import { Workspace } from './workspace.entity';

export const CORE_MEMBERS = new Set<Role>([
  Role.OWNER,
  Role.ADMIN,
  Role.MEMBER,
]);
export class InviteServiceDto {
  email: string;
  role: Role;
}

@Injectable()
export class WorkspacesService {
  private logger = new Logger(WorkspacesService.name);

  constructor(
    @InjectRepository(Workspace)
    private workspacesRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceInvite)
    private workspaceInvitesRepository: Repository<WorkspaceInvite>,
    private usersService: UsersService,
    private emailService: EmailService,
  ) {}

  async inviteMembersToWorkspace(
    workspaceId: number,
    workspaceInvites: InviteServiceDto[],
    requestingUser: AuthedUser,
  ) {
    if (workspaceInvites.some((invite) => !CORE_MEMBERS.has(invite.role))) {
      throw new BadRequestException(
        `This invite feature is only for these roles: ${Array.from(
          CORE_MEMBERS,
        ).join(', ')}. Use other type of invite for other roles.`,
      );
    }

    const workspace = await this.workspacesRepository.findOne({
      where: {
        id: workspaceId,
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found.');
    }

    workspaceInvites.forEach(
      (invite) => (invite.email = invite.email.trim().toLowerCase()),
    );

    const uniqueEmails = [
      ...new Set(workspaceInvites.map((invite) => invite.email)),
    ];

    const existingUsers = await this.usersService.findByEmails(uniqueEmails);
    const existingWorkspaceMembers = existingUsers.filter((user) =>
      user.userWorkspaces
        ?.map((userWorkspace) => userWorkspace.workspaceId!)
        .includes(workspaceId),
    );
    const existingWorkspaceMemberEmails = existingWorkspaceMembers.map((user) =>
      user.email.toLowerCase(),
    );
    const nonMembers = workspaceInvites.filter(
      (invite) => !existingWorkspaceMemberEmails.includes(invite.email),
    );

    const newInvites = await this.workspaceInvitesRepository.save(
      nonMembers.map((nonMember) => ({
        workspaceId,
        email: nonMember.email,
        token: uuidV4(),
        inviterId: requestingUser.id,
      })),
    );

    await Promise.all(
      newInvites.map(async (invite) => {
        try {
          await this.emailService.sendWorkspaceInvite({
            recipient: invite.email,
            token: invite.token,
            workspaceName: workspace.name,
            inviter:
              [requestingUser.firstName, requestingUser.lastName]
                .filter((s) => s)
                .join(' ') || requestingUser.email,
          });
        } catch (err) {
          this.logger.error(
            { err, inviteId: invite.id },
            'Unable to send workspace invite',
          );
        }
      }),
    );
  }
}
