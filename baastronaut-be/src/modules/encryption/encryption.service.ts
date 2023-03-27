import { Inject, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

export type EncryptedMessage = {
  iv: string;
  payload: string;
};

@Injectable()
export class EncryptionService {
  private algorithm = 'aes-256-cbc';

  constructor(@Inject('BAAS_ENCRYPTION_KEY_HEX') private key: string) {}

  encrypt(value: string): EncryptedMessage {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      this.algorithm,
      Buffer.from(this.key, 'hex'),
      iv,
    );
    let encrypted = cipher.update(Buffer.from(value));
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return {
      iv: iv.toString('hex'),
      payload: encrypted.toString('hex'),
    };
  }

  decrypt(encryptedMessage: EncryptedMessage): string {
    const iv = Buffer.from(encryptedMessage.iv, 'hex');
    const encryptedBuffer = Buffer.from(encryptedMessage.payload, 'hex');
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      Buffer.from(this.key, 'hex'),
      iv,
    );
    let decrypted = decipher.update(encryptedBuffer);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
  }
}
