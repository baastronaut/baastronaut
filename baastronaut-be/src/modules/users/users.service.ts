import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PasswordHashService } from '../password-hash/password-hash.service';
import { Workspace } from '../workspaces/workspace.entity';
import { Role, UserWorkspace } from './user-workspace.entity';
import { User } from './user.entity';
import { v4 as uuidV4 } from 'uuid';
import { EmailService } from '../email/email.service';
import { IsEmail, IsString, Length, MaxLength } from 'class-validator';
import { IsNotBlank } from '../../utils/validators';

const TOKEN_VALID_HOURS = 48;
const EMAIL_MAX_LENGTH = 300;
const NAME_MAX_LENGTH = 300;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 20;

export class RegisterUserReq {
  @IsEmail()
  @MaxLength(EMAIL_MAX_LENGTH)
  email: string;

  @IsString()
  @MaxLength(NAME_MAX_LENGTH)
  @IsNotBlank()
  name: string;

  @IsString()
  @Length(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH)
  @IsNotBlank()
  password: string;
}

export class VerifyEmailReq {
  @IsEmail()
  @MaxLength(EMAIL_MAX_LENGTH)
  email: string;

  @IsString()
  @IsNotBlank()
  token: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectDataSource() private dataSource: DataSource,
    private passwordHashService: PasswordHashService,
    private emailService: EmailService,
  ) {}

  async register(registerUserReq: RegisterUserReq): Promise<User> {
    const email = registerUserReq.email.trim().toLowerCase();

    const savedUser = await this.dataSource.transaction(async (manager) => {
      const usersRepository = manager.getRepository(User);
      const workspacesRepository = manager.getRepository(Workspace);
      const userWorkspacesRepository = manager.getRepository(UserWorkspace);

      const existingUser = await this.findOneByEmailJoinWorkspaces(
        email,
        usersRepository,
      );
      if (existingUser) {
        throw new BadRequestException(`Email ${email} already exists.`);
      }

      const verifyTokenExpiresAt = new Date();
      verifyTokenExpiresAt.setHours(
        verifyTokenExpiresAt.getHours() + TOKEN_VALID_HOURS,
      );

      const newUser = new User();
      newUser.email = email;
      newUser.firstName = registerUserReq.name.trim();
      newUser.passwordHash = await this.passwordHashService.hashPassword(
        registerUserReq.password,
      );
      newUser.verified = false;
      newUser.verifyToken = uuidV4();
      newUser.verifiedAt = null;
      newUser.verifyTokenExpiresAt = verifyTokenExpiresAt;
      newUser.accountDisabled = false;
      newUser.accountDisabledAt = null;
      newUser.resetPasswordToken = null;
      newUser.resetPasswordTokenExpiresAt = null;
      await usersRepository.save(newUser);

      const workspace = new Workspace();
      workspace.name = newUser.firstName;
      await workspacesRepository.save(workspace);

      const userWorkspace = new UserWorkspace();
      userWorkspace.workspace = workspace;
      userWorkspace.user = newUser;
      userWorkspace.role = Role.OWNER;
      await userWorkspacesRepository.save(userWorkspace);

      return newUser;
    });

    await this.emailService.sendVerificationEmail(
      savedUser.email,
      savedUser.verifyToken!,
    );
    return savedUser;
  }

  async verifyEmail(verifyEmailReq: VerifyEmailReq) {
    const user = await this.findOneByEmailJoinWorkspaces(verifyEmailReq.email);
    if (!user) {
      throw new BadRequestException('Invalid request.');
    }

    if (!user.verifyToken || user.verifyToken !== verifyEmailReq.token) {
      throw new BadRequestException('Invalid token.');
    }

    const tokenExpires = user.verifyTokenExpiresAt?.getTime();
    if (
      user.verifyToken === verifyEmailReq.token &&
      (!tokenExpires || tokenExpires < new Date().getTime())
    ) {
      throw new BadRequestException('Token expired.');
    }

    await this.usersRepository.update(user.id, {
      verified: true,
      verifiedAt: new Date(),
      verifyToken: null,
      verifyTokenExpiresAt: null,
    });
  }

  async findByIdJoinWorkspaces(id: number): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: {
        id,
      },
      relations: {
        userWorkspaces: {
          workspace: true,
        },
      },
    });
  }

  async findOneByEmailJoinWorkspaces(
    email: string,
    repository?: Repository<User>,
  ): Promise<User | null> {
    if (!repository) {
      repository = this.usersRepository;
    }
    return repository
      .createQueryBuilder('users')
      .where('lower(users.email) = :email', {
        email: email.trim().toLowerCase(),
      })
      .leftJoinAndSelect('users.userWorkspaces', 'userWorkspaces')
      .leftJoinAndSelect('userWorkspaces.workspace', 'workspace')
      .getOne();
  }

  async findByEmails(emails: string[]): Promise<User[]> {
    if (!emails || !emails.length) {
      return [];
    }

    const queryBuilder = this.usersRepository
      .createQueryBuilder('users')
      .where('lower(users.email) IN (:...emails)', {
        emails: emails.map((e) => e.trim().toLowerCase()),
      })
      .leftJoinAndSelect('users.userWorkspaces', 'userWorkspaces');

    return queryBuilder.getMany();
  }
}
