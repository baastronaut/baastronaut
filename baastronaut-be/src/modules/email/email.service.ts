import { Inject, Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { FRONTEND_PATHS } from '../../utils/constants';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null;

  private logger = new Logger(EmailService.name);

  constructor(
    @Inject('EMAIL_SERVICE') emailService: string,
    @Inject('EMAIL_SECRET') emailSecret: string,
    @Inject('EMAIL_USER') private emailUser: string,
    @Inject('FRONTEND_URL') private frontendUrl: string,
  ) {
    if (!emailService || !emailSecret || !emailUser) {
      this.logger.log(
        'Email credentials not provided completely. Wiring no-op email service.',
      );
      this.transporter = null;
    } else {
      this.transporter = nodemailer.createTransport({
        service: emailService,
        auth: {
          user: emailUser,
          pass: emailSecret,
        },
      });
    }
  }

  async sendVerificationEmail(recipient: string, token: string) {
    const mailOptions = {
      from: this.emailUser,
      to: recipient,
      subject: 'Please verify your email for Baastronaut',
      html: `Click on the link below to verify your email:<br />${this.buildEmailVerificationLink(
        recipient,
        token,
      )}`,
    };

    await this.sendMail(mailOptions);
  }

  async sendWorkspaceInvite(inviteDetails: {
    recipient: string;
    token: string;
    inviter: string;
    workspaceName: string;
    role: string;
  }) {
    const { recipient, inviter, token, workspaceName, role } = inviteDetails;
    const mailOptions = {
      from: this.emailUser,
      to: recipient,
      subject: `You have been invited to join the workspace ${workspaceName}`,
      html: `${inviter} has invited you to join the workspace ${workspaceName} as a ${role}.<br />Click on the link below to join the workspace:<br />${this.buildInviteLink(
        recipient,
        token,
      )}`,
    };

    await this.sendMail(mailOptions);
  }

  private buildInviteLink(email: string, token: string): string {
    const url = new URL(FRONTEND_PATHS.WS_INVITE, this.frontendUrl);
    url.searchParams.append('email', email);
    url.searchParams.append('token', token);
    return url.href;
  }

  private buildEmailVerificationLink(email: string, token: string): string {
    const url = new URL(FRONTEND_PATHS.VERIFY_EMAIL, this.frontendUrl);
    url.searchParams.append('email', email);
    url.searchParams.append('token', token);
    return url.href;
  }

  private async sendMail(mailOptions: Mail.Options) {
    if (!this.transporter) {
      this.logger.log('no-op email service called.');
      return;
    }

    const sendMailRes = await this.transporter.sendMail(mailOptions);
    this.logger.log(sendMailRes, 'sendMailRes');
  }
}
