import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'

// Lazy load route components for smaller initial bundle and faster first contentful paint
const HomePage = lazy(() =>
  import('./pages/HomePage').then((m) => ({ default: m.HomePage }))
)
const PostPage = lazy(() =>
  import('./pages/PostPage').then((m) => ({ default: m.PostPage }))
)

const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

/**
 * ScrollToTop guarantees that opening any article or navigating between pages
 * always resets the scroll position to the very top (0, 0) instead of inheriting
 * the previous page's scroll offset.
 */
function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    } else {
      const id = hash.replace('#', '')
      const element = document.getElementById(id)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [pathname, hash])

  return null
}

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route
            index
            element={
              <Suspense fallback={<div className="page-loading-skeleton" />}>
                <HomePage />
              </Suspense>
            }
          />
          <Route
            path="posts/:slug"
            element={
              <Suspense fallback={<div className="page-loading-skeleton" />}>
                <PostPage />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
