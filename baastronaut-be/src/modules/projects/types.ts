import { Length } from 'class-validator';
import { IsValidName } from '../../utils/validators';

export class CreateProjectReq {
  @Length(1, 63)
  @IsValidName()
  name: string;

  description: string | null;
}

export type ProjectResp = {
  id: number;
  name: string;
  workspaceId: number;
  creatorId: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};
