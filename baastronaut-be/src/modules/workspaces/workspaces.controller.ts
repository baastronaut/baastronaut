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
import { AuthedRequest } from '../auth/auth.service';
import { Role } from '../users/user-workspace.entity';
import { HasAdminRightsGuard } from './workspace-auth.guard';
import { CORE_MEMBERS, WorkspacesService } from './workspaces.service';

export class InviteMembersReq {
  @IsEmail()
  email: string;
  @IsIn(Array.from(CORE_MEMBERS))
  role: Role;
}

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
  ) {
    await this.workspacesService.inviteMembersToWorkspace(
      workspaceId,
      workspaceInviteReq.invites,
      authedReq.user,
    );
  }
}
