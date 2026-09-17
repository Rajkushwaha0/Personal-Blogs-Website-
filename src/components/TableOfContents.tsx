import { useState, useEffect } from 'react'
import { slugifyHeading } from '../utils/slugify'

type TableOfContentsProps = {
  headings: string[]
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')
  // Initially hidden by default so readers can choose to open it if they wish
  const [isOpen, setIsOpen] = useState<boolean>(false)

  useEffect(() => {
    if (headings.length === 0) return

    const headingIds = headings.map(slugifyHeading)
    const elements = headingIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)

    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible heading
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
            break
          }
        }
      },
      {
        rootMargin: '0px 0px -65% 0px',
        threshold: 0.1,
      }
    )

    elements.forEach((el) => observer.observe(el))

    return () => {
      observer.disconnect()
    }
  }, [headings])

  if (headings.length === 0) return null

  return (
    <nav className="toc-container" aria-label="Table of contents">
      <div className="toc-header" onClick={() => setIsOpen((prev) => !prev)}>
        <span className="toc-title">
          <svg
            className="toc-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          Index & Outline ({headings.length} sections)
        </span>
        <button
          type="button"
          className="toc-toggle-btn"
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Collapse table of contents' : 'Expand table of contents'}
        >
          {isOpen ? 'Hide ▲' : 'Show ▼'}
        </button>
      </div>

      {isOpen && (
        <ol className="toc-list">
          {headings.map((heading) => {
            const id = slugifyHeading(heading)
            const isActive = activeId === id

            return (
              <li key={id} className={`toc-item ${isActive ? 'active' : ''}`}>
                <a
                  href={`#${id}`}
                  className="toc-link"
                  onClick={(e) => {
                    e.preventDefault()
                    const target = document.getElementById(id)
                    if (target) {
                      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      setActiveId(id)
                      window.history.pushState(null, '', `#${id}`)
                    }
                  }}
                >
                  {heading}
                </a>
              </li>
            )
          })}
        </ol>
      )}
    </nav>
  )
}
