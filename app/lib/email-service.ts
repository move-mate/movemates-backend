import sgMail from '@sendgrid/mail';

// In a real application, you would integrate with an email service like SendGrid, Mailgun, etc.
// This is a placeholder implementation for demonstration purposes

export async function sendVerificationEmail(
    to: string,
    verificationLink: string
  ): Promise<void> {
    // In development, just log the email
    if (process.env.NODE_ENV === 'development') {
      console.log('---------- EMAIL SENT ----------');
      console.log(`To: ${to}`);
      console.log(`Subject: Verify your email for MoveMates`);
      console.log(`Body: Please verify your email by clicking the link below:`);
      console.log(verificationLink);
      console.log('-------------------------------');
      return;
    }
    
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
    
    const msg = {
      to,
      from: 'noreply@yourdomain.com',
      subject: 'Verify your email for MoveMates',
      text: `Please verify your email by clicking this link: ${verificationLink}`,
      html: `
        <div>
          <h1>Welcome to MoveMates!</h1>
          <p>Please verify your email by clicking the button below:</p>
          <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 4px;">
            Verify Email
          </a>
          <p>If the button doesn't work, you can also click this link: <a href="${verificationLink}">${verificationLink}</a></p>
        </div>
      `,
    };
    
    await sgMail.send(msg);
    
  }