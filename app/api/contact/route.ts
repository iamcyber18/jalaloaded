import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required.' }, { status: 400 });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Email configuration missing in .env.local');
      return NextResponse.json({ error: 'Server email configuration is missing.' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://jalaloaded.vercel.app/images/jalaloadedlogo.png" alt="Jalaloaded Logo" style="height: 60px; width: auto; max-width: 100%;" />
        </div>
        <h2 style="color: #FF6B00; margin-top: 0; font-size: 20px; border-bottom: 1px solid #eaeaea; padding-bottom: 10px;">New Contact Submission</h2>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px 0;"><strong>From:</strong> ${name} &lt;${email}&gt;</p>
          <p style="margin: 0;"><strong>Subject:</strong> ${subject || 'No Subject'}</p>
        </div>
        <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: #444;">${message}</div>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0 20px;" />
        <p style="font-size: 11px; color: #888; text-align: center; margin-bottom: 5px;">
          This message was sent from the Jalaloaded Contact Form.
        </p>
        <p style="font-size: 11px; color: #aaa; text-align: center; margin-top: 0;">
          &copy; ${new Date().getFullYear()} Jalaloaded. All rights reserved.
        </p>
      </div>
    `;

    // Send email TO the admin, FROM the admin's gmail (authenticated), but replyTo the sender
    await transporter.sendMail({
      from: `"Jalaloaded Contact Form" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself
      replyTo: email, // If you hit reply, it goes to the user
      subject: `[Jalaloaded Contact] ${subject || 'New Message from ' + name}`,
      html: htmlBody,
    });

    return NextResponse.json({ success: true, message: 'Message sent successfully!' }, { status: 200 });

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ error: 'Failed to send message. Please try again later.' }, { status: 500 });
  }
}
