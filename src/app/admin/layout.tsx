//src\app\admin\layout.tsx
import { redirect } from 'next/navigation';
import { getAuthUser, hasAdminAccess } from '@/lib/auth';
import AdminShell from './Adminshell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();

  // Fallback: if no user, redirect to login (middleware should handle this, but this is a safety net)
  if (!user) {
    redirect('/sign-up-login-screen');
  }

  // Role-based access check
  if (!hasAdminAccess(user.role)) {
    redirect('/');
  }

  return <AdminShell>{children}</AdminShell>;
}
