import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsIn, ValidateNested } from 'class-validator';
import { Role } from '../../utils/constants';
import { AuthedRequest } from '../auth/auth.service';
import { HasAdminRightsGuard } from './workspace-auth.guard';
import { CORE_MEMBERS, WorkspacesService } from './workspaces.service';

export class InviteMembersReq {
  @IsEmail()
  email: string;
  @IsIn(Array.from(CORE_MEMBERS))
  role: Role;
}

export type InviteMembersResp = {
  invitesSent: number;
  invitesAlreadyPending: number;
  invitesAlreadyMember: number;
};

export class WorkspaceMembersInviteReq {
  @ValidateNested()
  @IsArray()
  @Type(() => InviteMembersReq)
  invites: InviteMembersReq[];
}

@UseGuards(HasAdminRightsGuard)
@Controller('workspaces/:workspaceId')
export class WorkspacesController {
  constructor(private workspacesService: WorkspacesService) {}

  @Post('invite-members')
  async inviteMembersToWorkspace(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Body() workspaceInviteReq: WorkspaceMembersInviteReq,
    @Request() authedReq: AuthedRequest,
  ): Promise<InviteMembersResp> {
    const inviteRespDto = await this.workspacesService.inviteMembersToWorkspace(
      workspaceId,
      workspaceInviteReq.invites,
      authedReq.user,
    );

    return {
      invitesSent: inviteRespDto.invitesSent,
      invitesAlreadyPending: inviteRespDto.invitesAlreadyPending,
      invitesAlreadyMember: inviteRespDto.invitesAlreadyMember,
    };
  }
}
