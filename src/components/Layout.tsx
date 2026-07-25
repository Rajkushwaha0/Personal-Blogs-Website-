import { Link, Outlet } from 'react-router-dom'

export function Layout() {
  return (
    <div className="site">
      <header className="site-header">
        <Link to="/" className="site-brand">
          Raj’s Blogs
        </Link>
        <p className="site-tagline">
          System design, architecture, and backend engineering.
        </p>
      </header>
      <main className="site-main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>Raj’s Blogs · notes on designing systems that hold up</p>
      </footer>
    </div>
  )
}
