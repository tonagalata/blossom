import './admin.css'
import './admin-tailwind.css'
import AdminChrome from '@/components/admin/AdminChrome'

export const metadata = { title: 'Admin — Events in Bloom' }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminChrome>{children}</AdminChrome>
}
