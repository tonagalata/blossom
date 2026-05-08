import MemberNav from './MemberNav'

export default function MembersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="member-shell">
      <MemberNav />
      <main className="member-main">{children}</main>
    </div>
  )
}
