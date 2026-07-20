const nodemailer = require('nodemailer');

// Create transporter using Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Send notification email to property owner
const sendMessageNotification = async (ownerEmail, ownerName, senderName, propertyTitle, message) => {
    try {
        const mailOptions = {
            from: `"Urestate" <${process.env.EMAIL_USER}>`,
            to: ownerEmail,
            subject: `New inquiry on your property "${propertyTitle}"`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    
                    <div style="background-color: #2563eb; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">Urestate</h1>
                    </div>

                    <div style="padding: 20px;">
                        <h2 style="color: #1f2937;">New Inquiry Received! 🏠</h2>
                        
                        <p style="color: #4b5563;">Hi <strong>${ownerName}</strong>,</p>
                        
                        <p style="color: #4b5563;">Someone is interested in your property listing on Urestate!</p>

                        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0 0 10px 0;"><strong>Property:</strong> ${propertyTitle}</p>
                            <p style="margin: 0 0 10px 0;"><strong>From:</strong> ${senderName}</p>
                            <p style="margin: 0;"><strong>Message:</strong></p>
                            <p style="margin: 10px 0 0 0; color: #374151; font-style: italic;">"${message}"</p>
                        </div>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.APP_URL}/public/dashboard.html" 
                            style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                                Reply
                            </a>
                        </div>

                        <p style="color: #6b7280; font-size: 14px;">You received this email because someone sent you a message on Urestate. Login to your dashboard to reply.</p>
                    </div>

                    <div style="background-color: #f9fafb; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">© 2026 Urestate. All rights reserved.</p>
                    </div>

                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email notification sent to ${ownerEmail}`);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

module.exports = { sendMessageNotification };