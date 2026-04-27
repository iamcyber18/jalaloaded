import dbConnect from '@/lib/mongodb';
import Newsletter from '@/models/Newsletter';
import NewsletterBroadcastClient from './NewsletterBroadcastClient';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NewsletterPage() {
  const session = await getSession();
  if (!session || (session.role !== 'admin' && session.role !== 'sub-admin')) {
    redirect('/admin/login');
  }

  await dbConnect();
  const count = await Newsletter.countDocuments();

  return (
    <div className="admin-content-inner">
      <div className="admin-header">
        <h1 className="admin-title">Newsletter Broadcast</h1>
      </div>
      <NewsletterBroadcastClient initialCount={count} />
    </div>
  );
}
