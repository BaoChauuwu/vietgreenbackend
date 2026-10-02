import {
	EMAIL_BRAND,
	resolveEmailLogoSrc,
} from '@app/services/email/email-brand.constants';
import {
	EMAIL_ICON_LOCK_LEAF,
	EMAIL_ICON_WHITE_MARK,
} from '@app/services/email/email-templates/email-template.icons';

export type EmailVerificationOptions = {
	link: string;
	backendDomain: string;
	logoUrlOverride?: string;
};

export const generateEmailVerification = ({
	link,
	backendDomain,
	logoUrlOverride,
}: EmailVerificationOptions): string => {
	const logoSrc = resolveEmailLogoSrc(backendDomain, logoUrlOverride);
	const b = EMAIL_BRAND;
	const year = new Date().getFullYear();

	return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Verify your email — VietGreenX</title>
</head>
<body style="margin:0;padding:0;width:100%;background-color:${b.background};font-family:${b.fontFamily};color:${b.text};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    Verify your VietGreenX email to complete registration. This link expires in 24 hours.
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${b.background};">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;border-radius:16px;overflow:hidden;box-shadow:${b.cardShadow};">
          <tr>
            <td align="center" style="background:${b.headerGradient};padding:40px 32px 36px;">
              <img src="${logoSrc}" alt="VietGreenX" width="120" style="display:block;width:120px;max-width:120px;height:auto;margin:0 auto 18px;border:0;outline:none;" />
              <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#FFFFFF;opacity:0.95;">
                Green agriculture platform
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:${b.surface};padding:40px 44px 32px;">
              <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${b.primary};">
                Account verification
              </p>
              <h1 style="margin:0 0 14px;font-size:28px;font-weight:700;line-height:1.25;color:${b.heading};letter-spacing:-0.03em;">
                Verify your email
              </h1>
              <p style="margin:0 0 36px;font-size:16px;line-height:1.65;color:${b.textMuted};">
                Thank you for signing up for <strong style="color:${b.heading};font-weight:600;">VietGreenX</strong>.
                Click the button below to confirm your email address and finish creating your account.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center" style="border-radius:12px;background:${b.ctaGradient};box-shadow:${b.ctaShadow};">
                          <a href="${link}" target="_blank" rel="noopener noreferrer" style="display:inline-block;text-decoration:none;border-radius:12px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                <td style="padding:16px 8px 16px 28px;vertical-align:middle;line-height:0;">
                                  ${EMAIL_ICON_WHITE_MARK}
                                </td>
                                <td style="padding:16px 32px 16px 4px;vertical-align:middle;font-size:16px;font-weight:700;color:#FFFFFF;white-space:nowrap;font-family:${b.fontFamily};">
                                  Verify email now
                                </td>
                              </tr>
                            </table>
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background-color:${b.primarySoft};border:1px solid ${b.primaryBorder};border-radius:10px;padding:18px 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td width="40" valign="top" style="padding-right:14px;line-height:0;">
                          ${EMAIL_ICON_LOCK_LEAF}
                        </td>
                        <td valign="middle">
                          <p style="margin:0;font-size:14px;line-height:1.65;color:${b.textMuted};">
                            <strong style="color:${b.heading};font-weight:600;">Security note:</strong>
                            This link is valid for <strong style="color:${b.primaryDark};font-weight:700;">24 hours</strong>.
                            Do not share this email or link with anyone.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:${b.textLight};">
                Button not working?
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color:${b.surfaceMuted};border:1px solid ${b.borderLight};border-radius:8px;padding:14px 16px;">
                    <p style="margin:0;font-size:12px;line-height:1.6;font-family:Consolas,'Courier New',monospace;color:${b.primaryDark};word-break:break-all;">
                      <a href="${link}" style="color:${b.primary};text-decoration:underline;">${link}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:${b.surfaceMuted};padding:22px 44px 28px;border-top:1px solid ${b.borderLight};">
              <p style="margin:0 0 8px;font-size:13px;line-height:1.55;color:${b.textLight};text-align:center;">
                Did not request this email? You can ignore it — your account will not be created.
              </p>
              <p style="margin:0;font-size:12px;line-height:1.5;color:${b.textFooter};text-align:center;">
                © ${year} VietGreenX · Your privacy matters to us
              </p>
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;">
          <tr>
            <td align="center" style="padding:20px 16px 0;">
              <p style="margin:0;font-size:11px;line-height:1.5;color:${b.textFooter};">
                Automated message from VietGreenX — please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
