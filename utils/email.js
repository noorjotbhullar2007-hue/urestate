const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Send notification email to property owner
const sendMessageNotification = async (ownerEmail, ownerName, senderName, propertyTitle, message) => {
    try {
        const msg = {
            to: ownerEmail,
            from: {
                email: process.env.EMAIL_USER,
                name: 'Urestate'
            },
            subject: `New inquiry on your property "${propertyTitle}"`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 100%; margin: 0 auto; padding: 15px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <div style="background-color: #2563eb; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">Urestate</h1>
                    </div>
                    <div style="padding: 20px;">
                        <h2 style="color: #1f2937;">New Inquiry Received! 🏠</h2>
                        <p style="color: #4b5563; font-size: 14px;">Hi <strong>${ownerName}</strong>,</p>
                        <p style="color: #4b5563; font-size: 14px;">Someone is interested in your property listing on Urestate!</p>
                        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0 0 10px 0;"><strong>Property:</strong> ${propertyTitle}</p>
                            <p style="margin: 0 0 10px 0;"><strong>From:</strong> ${senderName}</p>
                            <p style="margin: 0;"><strong>Message:</strong></p>
                            <p style="margin: 10px 0 0 0; color: #374151; font-style: italic;">"${message}"</p>
                        </div>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.APP_URL}/public/dashboard.html" 
                               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
                                Reply
                            </a>
                        </div>
                        <p style="color: #6b7280; font-size: 12px;">You received this email because someone sent you a message on Urestate.</p>
                    </div>
                    <div style="background-color: #f9fafb; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">© 2026 Urestate. All rights reserved.</p>
                    </div>
                </div>
            `
        };

        await sgMail.send(msg);
        console.log(`Email notification sent to ${ownerEmail}`);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

// Send OTP verification email
const sendOTPEmail = async (email, name, otp) => {
    try {
        const msg = {
            to: email,
            from: {
                email: process.env.EMAIL_USER,
                name: 'Urestate'
            },
            subject: 'Verify your Urestate account',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 100%; margin: 0 auto; padding: 15px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <div style="background-color: #2563eb; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">Urestate</h1>
                    </div>
                    <div style="padding: 20px;">
                        <h2 style="color: #1f2937;">Verify Your Email 📧</h2>
                        <p style="color: #4b5563; font-size: 14px;">Hi <strong>${name}</strong>,</p>
                        <p style="color: #4b5563; font-size: 14px;">Thank you for registering on Urestate! Please use the OTP below to verify your email:</p>
                        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
                            <p style="font-size: 24px; font-weight: bold; color: #2563eb; letter-spacing: 2px; margin: 0; white-space: nowrap;">${otp}</p>
                            <p style="color: #6b7280; font-size: 12px; margin-top: 8px;">This code expires in 10 minutes</p>
                        </div>
                        <p style="color: #6b7280; font-size: 12px;">If you did not create an account on Urestate, please ignore this email.</p>
                    </div>
                    <div style="background-color: #f9fafb; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">© 2026 Urestate. All rights reserved.</p>
                    </div>
                </div>
            `
        };

        await sgMail.send(msg);
        console.log(`OTP email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('Error sending OTP email:', error);
        return false;
    }
};

// Send password reset email
const sendPasswordResetEmail = async (email, name, resetLink) => {
    try {
        const msg = {
            to: email,
            from: {
                email: process.env.EMAIL_USER,
                name: 'Urestate'
            },
            subject: 'Reset your Urestate password',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 100%; margin: 0 auto; padding: 15px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <div style="background-color: #2563eb; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">Urestate</h1>
                    </div>
                    <div style="padding: 20px;">
                        <h2 style="color: #1f2937;">Reset Your Password 🔐</h2>
                        <p style="color: #4b5563; font-size: 14px;">Hi <strong>${name}</strong>,</p>
                        <p style="color: #4b5563; font-size: 14px;">We received a request to reset your password. Click the button below:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetLink}" 
                               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
                                Reset Password
                            </a>
                        </div>
                        <p style="color: #6b7280; font-size: 12px;">This link expires in 1 hour.</p>
                        <p style="color: #6b7280; font-size: 12px;">If you did not request this, please ignore this email.</p>
                    </div>
                    <div style="background-color: #f9fafb; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">© 2026 Urestate. All rights reserved.</p>
                    </div>
                </div>
            `
        };

        await sgMail.send(msg);
        console.log(`Password reset email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('Error sending reset email:', error);
        return false;
    }
};

module.exports = { sendMessageNotification, sendOTPEmail, sendPasswordResetEmail };