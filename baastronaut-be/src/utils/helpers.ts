import { BadRequestException } from '@nestjs/common';
import {
  ClassConstructor,
  ClassTransformOptions,
  plainToInstance,
} from 'class-transformer';
import { validate } from 'class-validator';
import { AuthedUser } from '../modules/auth/auth.service';

export type Profile = {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  allowedWorkspaces: {
    workspaceId: number;
    workspaceName: string;
    role: string;
  }[];
};

export function authedUserToProfile(authedUser: AuthedUser): Profile {
  return {
    id: authedUser.id,
    email: authedUser.email,
    firstName: authedUser.firstName,
    lastName: authedUser.lastName,
    allowedWorkspaces: authedUser.allowedWorkspaces.map((ws) => ({
      workspaceId: ws.workspaceId,
      workspaceName: ws.workspaceName,
      role: ws.role,
    })),
  };
}

export async function validateOrThrow<T, V>(
  cls: ClassConstructor<T>,
  plain: V,
  options?: ClassTransformOptions,
) {
  const valErrors = await validate(plainToInstance(cls, plain, options) as any);

  if (valErrors.length > 0) {
    const validationErrors: {
      property: string;
      errorMessages: string[];
    }[] = [];
    valErrors.forEach((error) => {
      const errorMessages: string[] = [];
      const err = {
        property: error.property,
        errorMessages,
      };
      Object.entries(error.constraints || {}).forEach(
        ([constraintName, errorMsg]) => {
          err.errorMessages.push(errorMsg);
        },
      );
      validationErrors.push(err);
    });
    const responseJson = {
      statusCode: 400,
      message: 'Invalid inputs received.',
      error: 'Bad Request',
      validationErrors,
    };
    throw new BadRequestException(responseJson);
  }
}
