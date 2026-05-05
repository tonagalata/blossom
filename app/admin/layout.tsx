import './admin.css'
import AdminNav from './AdminNav'

export const metadata = { title: 'Admin — Events in Bloom' }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell">
      <AdminNav />
      <main className="admin-main">{children}</main>
    </div>
  )
}
