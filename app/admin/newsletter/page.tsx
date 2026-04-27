import dbConnect from '@/lib/mongodb';
import Newsletter from '@/models/Newsletter';
import NewsletterBroadcastClient from './NewsletterBroadcastClient';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';

export const dynamic = 'force-dynamic';

export default async function NewsletterPage() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    redirect('/admin/login');
  }

  await dbConnect();
  const count = await Newsletter.countDocuments();

  return (
    <div className="jl">
      <AdminSidebar />

      <div className="main">
        <div className="topbar">
          <div>
            <div className="page-title">Newsletter Broadcast</div>
            <div className="admin-subtitle">
              Send an email blast to all your active subscribers.
            </div>
          </div>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', height: 'calc(100vh - 80px)' }}>
          <NewsletterBroadcastClient initialCount={count} />
        </div>
      </div>
    </div>
  );
}
