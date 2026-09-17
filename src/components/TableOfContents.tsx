import { useState, useEffect } from 'react'
import { slugifyHeading } from '../utils/slugify'

type TableOfContentsProps = {
  headings: string[]
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')
  // Mobile accordion collapse state (defaults to closed on small viewports)
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false)

  useEffect(() => {
    if (headings.length === 0) return

    const headingIds = headings.map(slugifyHeading)
    const elements = headingIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)

    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
            break
          }
        }
      },
      {
        rootMargin: '0px 0px -70% 0px',
        threshold: 0.1,
      }
    )

    elements.forEach((el) => observer.observe(el))

    return () => {
      observer.disconnect()
    }
  }, [headings])

  if (headings.length === 0) return null

  const handleHeadingClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const target = document.getElementById(id)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveId(id)
      window.history.pushState(null, '', `#${id}`)
      setIsMobileOpen(false)
    }
  }

  return (
    <aside className="toc-sidebar" aria-label="Table of contents">
      <div className="toc-card">
        <div
          className="toc-header"
          onClick={() => setIsMobileOpen((prev) => !prev)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setIsMobileOpen((prev) => !prev)
            }
          }}
        >
          <span className="toc-title">
            <svg
              className="toc-icon"
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            On this page
          </span>
          <span className="toc-badge">{headings.length}</span>
          <button
            type="button"
            className="toc-mobile-toggle"
            aria-expanded={isMobileOpen}
            aria-label={isMobileOpen ? 'Collapse table of contents' : 'Expand table of contents'}
          >
            {isMobileOpen ? 'Hide ▲' : 'Show ▼'}
          </button>
        </div>

        <nav className={`toc-nav-wrap ${isMobileOpen ? 'mobile-open' : ''}`}>
          <ul className="toc-nav-list">
            {headings.map((heading, index) => {
              const id = slugifyHeading(heading)
              const isActive = activeId === id
              // Clean any existing numbers (e.g. "1. Why normal...") so TOC never double-numbers
              const cleanTitle = heading.replace(/^\d+\.\s*/, '')
              const sectionNumber = index + 1

              return (
                <li key={id} className={`toc-nav-item ${isActive ? 'active' : ''}`}>
                  <a
                    href={`#${id}`}
                    className="toc-link"
                    onClick={(e) => handleHeadingClick(e, id)}
                    title={cleanTitle}
                  >
                    <span className="toc-item-number">{sectionNumber}</span>
                    <span className="toc-item-text">{cleanTitle}</span>
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </aside>
  )
}
