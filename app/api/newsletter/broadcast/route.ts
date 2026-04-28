import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Newsletter from '@/models/Newsletter';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const session = await getSession();

    // Verify admin access
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subject, html } = await request.json();

    if (!subject || !html) {
      return NextResponse.json({ error: 'Subject and HTML content are required' }, { status: 400 });
    }

    // Ensure email credentials exist
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return NextResponse.json({ error: 'Email configuration is missing. Please set EMAIL_USER and EMAIL_PASS in your environment variables.' }, { status: 500 });
    }

    await dbConnect();

    // Fetch all subscribers
    const subscribers = await Newsletter.find({}, { email: 1 }).lean();
    if (subscribers.length === 0) {
      return NextResponse.json({ error: 'No subscribers found' }, { status: 400 });
    }

    // Extract email addresses
    const emailList = subscribers.map((sub: any) => sub.email);

    // Setup Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify connection configuration
    try {
      await transporter.verify();
    } catch (verifyError) {
      console.error('Nodemailer config error:', verifyError);
      return NextResponse.json({ error: 'Failed to connect to email server. Please check your EMAIL_USER and App Password.' }, { status: 500 });
    }

    // Send individual emails to each subscriber for reliable delivery
    // Gmail silently drops BCC recipients beyond a certain limit
    let successCount = 0;
    let failCount = 0;

    for (const recipientEmail of emailList) {
      try {
        await transporter.sendMail({
          from: `"Jalaloaded" <${process.env.EMAIL_USER}>`,
          to: recipientEmail,
          subject: subject,
          html: html,
        });
        successCount++;
      } catch (sendError) {
        console.error(`Failed to send to ${recipientEmail}:`, sendError);
        failCount++;
      }
    }

    return NextResponse.json({ 
      message: `Broadcast complete. ${successCount} sent, ${failCount} failed.`, 
      recipients: successCount,
      failed: failCount
    }, { status: 200 });

  } catch (error) {
    console.error('Newsletter broadcast error:', error);
    return NextResponse.json({ error: 'Failed to send broadcast' }, { status: 500 });
  }
}
