import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/legacy/image'
import styles from './GalleryGrid.module.css'

interface NotionGalleryItem {
  id: string
  title: string
  imageUrl: string | null
  mediaType: 'image' | 'video'
  description: string
  url: string
  createdTime: string
  lastEditedTime: string
  formattedDate: string
}

interface NotionApiGalleryProps {
  databaseId?: string
}

interface GalleryItemProps {
  item: NotionGalleryItem
}

function GalleryItem({ item }: GalleryItemProps) {
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  
  // 호버시 비디오 재생/정지
  React.useEffect(() => {
    if (videoRef.current && item.mediaType === 'video') {
      if (isHovered) {
        videoRef.current.play().catch(console.error)
      } else {
        videoRef.current.pause()
        videoRef.current.currentTime = 0
      }
    }
  }, [isHovered, item.mediaType])
  
  return (
    <Link 
      href={item.url} 
      className={styles.galleryItem}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.imageContainer}>
        {item.imageUrl && !imageError ? (
          item.mediaType === 'video' ? (
            <>
              <video
                ref={videoRef}
                className={styles.video}
                muted
                loop
                playsInline
                preload="metadata"
                poster=""
                onError={(e) => {
                  console.log('Video load error:', item.imageUrl, e)
                  setImageError(true)
                }}
                onLoadedData={() => {
                  console.log('Video loaded successfully:', item.title)
                }}
                onCanPlay={() => {
                  console.log('Video can play:', item.title)
                }}
              >
                <source src={item.imageUrl} />
                브라우저가 비디오를 지원하지 않습니다.
              </video>
              <div className={styles.playIcon}>▶</div>
            </>
          ) : (
            <Image
              src={item.imageUrl}
              alt={item.title || ''}
              layout="fill"
              objectFit="cover"
              className={styles.image}
              sizes="(max-width: 768px) 25vw, 10vw"
              priority={false}
              onError={() => {
                console.log('Image load error:', item.imageUrl)
                setImageError(true)
              }}
            />
          )
        ) : (
          <div className={styles.placeholder}>
            <span>{item.title?.charAt(0) || '?'}</span>
          </div>
        )}
      </div>
      <div className={styles.caption}>
        <h3 className={styles.title}>{item.title}</h3>
        <p className={styles.date}>{item.formattedDate}</p>
        {item.description && (
          <p className={styles.description}>{item.description}</p>
        )}
      </div>
    </Link>
  )
}

export function NotionApiGallery({ databaseId }: NotionApiGalleryProps) {
  const [items, setItems] = useState<NotionGalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGalleryData = async () => {
      try {
        setLoading(true)
        // databaseId가 있으면 쿼리 파라미터로 전달, 없으면 환경변수 사용
        const url = databaseId 
          ? `/api/notion-gallery?databaseId=${databaseId.replace(/-/g, '')}` 
          : '/api/notion-gallery'
        
        const response = await fetch(url)
        const data = await response.json()

        if (data.success) {
          setItems(data.items)
        } else {
          setError(data.message || 'Failed to load gallery')
        }
      } catch (err) {
        console.error('Failed to fetch gallery:', err)
        setError('Failed to load gallery')
      } finally {
        setLoading(false)
      }
    }

    fetchGalleryData()
  }, [databaseId])

  if (loading) {
    return (
      <div className={styles.galleryGrid}>
        <div className={styles.loadingState}>
          <p>Loading gallery...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.galleryGrid}>
        <div className={styles.errorState}>
          <p>Error: {error}</p>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className={styles.galleryGrid}>
        <div className={styles.emptyState}>
          <p>No gallery items found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.galleryGrid}>
      {items.map((item) => (
        <GalleryItem key={item.id} item={item} />
      ))}
    </div>
  )
}