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
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
        <h2 style="color: #FF6B00; margin-top: 0;">New Contact Form Submission</h2>
        <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
        <p><strong>Subject:</strong> ${subject || 'No Subject'}</p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
        <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${message}</div>
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
