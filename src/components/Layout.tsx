import { Link, Outlet, useLocation } from 'react-router-dom'

export function Layout() {
  const location = useLocation()
  const isHome = location.pathname === '/' || location.pathname === ''

  return (
    <div className="site">
      {isHome && (
        <header className="site-header">
          <div className="site-header-container">
            <div className="site-header-left">
              <Link to="/" className="site-brand">
                <span>Raj’s Blogs</span>
                <span className="site-role">(Backend Engineer)</span>
              </Link>
            </div>

            <div className="site-header-right">
              <div className="connect-links">
                <a
                  href="mailto:rajkush8090@gmail.com"
                  className="connect-btn connect-email"
                  title="Email: rajkush8090@gmail.com"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <span>Gmail</span>
                </a>
                <a
                  href="https://www.linkedin.com/in/raj-kushwaha-92611b20a/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="connect-btn connect-linkedin"
                  title="Connect on LinkedIn"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                  </svg>
                  <span>LinkedIn</span>
                </a>
              </div>
            </div>
          </div>
        </header>
      )}
      <main className="site-main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>Raj’s Blogs · notes on designing systems that hold up</p>
      </footer>
    </div>
  )
}
