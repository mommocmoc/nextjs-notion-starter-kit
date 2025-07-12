import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useDarkMode } from '@/lib/use-dark-mode'
import type { NavigationItem } from '../pages/api/navigation'
import styles from './OverlayNavigation.module.css'

interface OverlayNavigationProps {
  site?: any
}

export function OverlayNavigation({ site }: OverlayNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([])
  const [loading, setLoading] = useState(true)
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  useEffect(() => {
    const fetchNavigation = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/navigation')
        const data = await response.json() as {
          success: boolean
          items?: NavigationItem[]
          message?: string
        }

        if (data.success) {
          setNavigationItems(data.items || [])
        } else {
          console.error('Failed to load navigation:', data.message)
        }
      } catch (err) {
        console.error('Failed to fetch navigation:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchNavigation()
  }, [])

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.navContent}>
          <Link href="/" className={styles.logo}>
            {site?.name || 'NotionDB to Your Site'}
          </Link>
          
          <div className={styles.navControls}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={styles.menuToggle}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </nav>

      {isMenuOpen && (
        <div className={styles.overlay}>
          <div className={styles.overlayContent}>
            <div className={styles.menuItems}>
              {loading ? (
                <div className={styles.menuItem}>Loading...</div>
              ) : (
                navigationItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.urlPath}
                    className={styles.menuItem}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.displayName}
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}