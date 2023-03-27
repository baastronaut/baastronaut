import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordHashService {
  private readonly rounds = 10;

  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.rounds);
  }

  passwordIsCorrect(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
