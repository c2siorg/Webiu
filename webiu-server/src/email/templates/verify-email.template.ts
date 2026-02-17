export const getVerifyEmailTemplate = (
  frontendBaseUrl: string,
  verificationToken: string,
): string => `
  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
    <h2>Welcome to Webiu!</h2>
    <p>
      Thank you for registering. Please verify your email address to activate your account.
    </p>
    <p>
      Click the link below to verify your email:
    </p>
    <a 
      href="${frontendBaseUrl}/api/v1/auth/verify-email?token=${verificationToken}" 
      style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #007BFF; text-decoration: none; border-radius: 5px; font-weight: bold;"
    >
      Verify Email
    </a>
    <p>
      If you didn't register with us, please ignore this email.
    </p>
    <p>Thanks,</p>
    <p>The Webiu Team</p>
  </div>
`;
