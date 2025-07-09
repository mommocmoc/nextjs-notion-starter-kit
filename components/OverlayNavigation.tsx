import React, { useState } from 'react'
import Link from 'next/link'
import { useDarkMode } from '@/lib/use-dark-mode'
import styles from './OverlayNavigation.module.css'

interface OverlayNavigationProps {
  site: any
}

export function OverlayNavigation({ site }: OverlayNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  const navigationItems = [
    { title: 'Home', href: '/' },
    { title: 'About', href: '/about' },
    { title: 'Works', href: '/works' },
    { title: 'Contact', href: '/contact' }
  ]

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.navContent}>
          <Link href="/" className={styles.logo}>
            {site?.name || 'JHWANSO'}
          </Link>
          
          <div className={styles.navControls}>
            <button 
              onClick={toggleDarkMode} 
              className={styles.themeToggle}
              aria-label="Toggle theme"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            
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
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={styles.menuItem}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}