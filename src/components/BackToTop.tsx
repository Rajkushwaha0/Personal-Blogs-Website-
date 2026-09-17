import { useEffect, useState } from 'react'
import { useRafThrottle } from '../utils/timing'

export function BackToTop() {
  const [visible, setVisible] = useState(false)

  const handleScroll = useRafThrottle(() => {
    // Show the button after scrolling past 350px
    if (window.scrollY > 350) {
      setVisible(true)
    } else {
      setVisible(false)
    }
  })

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    })
  }

  return (
    <button
      type="button"
      className={`back-to-top-btn ${visible ? 'visible' : ''}`}
      onClick={scrollToTop}
      aria-label="Back to top"
      title="Back to top"
    >
      <svg
        className="back-to-top-icon"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="18 15 12 9 6 15" />
      </svg>
      <span className="back-to-top-text">Back to top</span>
    </button>
  )
}
