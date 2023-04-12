import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { AuthedUser } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { WorkspaceInvite } from './workspace-invites.entity';
import { v4 as uuidV4 } from 'uuid';
import { EmailService } from '../email/email.service';
import { Workspace } from './workspace.entity';
import { Role } from '../../utils/constants';

export const CORE_MEMBERS = new Set<Role>([
  Role.OWNER,
  Role.ADMIN,
  Role.MEMBER,
]);
export class InviteServiceDto {
  email: string;
  role: Role;
}

export type InviteRespDto = {
  invitesSent: number;
  invitesAlreadyPending: number;
  invitesAlreadyMember: number;
};

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
  ): Promise<InviteRespDto> {
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

    const emails = new Set<string>();
    workspaceInvites.forEach((invite) => {
      invite.email = invite.email.trim().toLowerCase();
      if (emails.has(invite.email)) {
        throw new BadRequestException(
          `Duplicated email ${invite.email} found in request body.`,
        );
      }
      emails.add(invite.email);
    });

    const existingUsers = await this.usersService.findByEmails(
      Array.from(emails),
    );
    const existingWorkspaceMemberEmails = existingUsers
      .filter((user) =>
        user.userWorkspaces
          ?.map((userWorkspace) => userWorkspace.workspaceId!)
          .includes(workspaceId),
      )
      .map((user) => user.email.toLowerCase());

    let nonMembers = workspaceInvites.filter(
      (invite) => !existingWorkspaceMemberEmails.includes(invite.email),
    );

    const existingWorkspaceInviteEmails = new Set(
      (
        await this.workspaceInvitesRepository.find({
          where: {
            workspaceId,
            email: In(nonMembers.map((nm) => nm.email)),
          },
        })
      ).map((invite) => invite.email),
    );

    nonMembers = nonMembers.filter(
      (nonMember) => !existingWorkspaceInviteEmails.has(nonMember.email),
    );

    const newInvites = await this.workspaceInvitesRepository.save(
      nonMembers.map((nonMember) => ({
        workspaceId,
        email: nonMember.email,
        token: uuidV4(),
        inviterId: requestingUser.id,
        role: nonMember.role,
        accepted: null,
      })),
    );

    await Promise.all(
      newInvites.map(async (invite) => {
        try {
          await this.emailService.sendWorkspaceInvite({
            recipient: invite.email,
            token: invite.token,
            workspaceName: workspace.name,
            role: invite.role,
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

    return {
      invitesSent: newInvites.length,
      invitesAlreadyPending: nonMembers.length - newInvites.length,
      invitesAlreadyMember: workspaceInvites.length - nonMembers.length,
    };
  }
}
