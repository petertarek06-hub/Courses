//src\app\admin\layout.tsx
import { redirect } from 'next/navigation';
import { getAuthUser, hasAdminAccess } from '@/lib/auth';
import AdminShell from './Adminshell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();

  if (!user || !hasAdminAccess(user.role)) {
    redirect('/');
  }

  return <AdminShell>{children}</AdminShell>;
}
