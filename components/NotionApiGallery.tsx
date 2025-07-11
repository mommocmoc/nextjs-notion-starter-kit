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
  aspectRatio?: number // 가로/세로 비율 (width/height)
  gridSize?: 'small' | 'medium' | 'large' | 'wide' | 'tall' // 그리드 크기
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
  const [aspectRatio, setAspectRatio] = useState<number | null>(null)
  const [gridSize, setGridSize] = useState<string>('medium')
  const [actualWidth, setActualWidth] = useState<number | null>(null)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const imageContainerRef = React.useRef<HTMLDivElement>(null)
  
  // 비율에 따른 그리드 크기 계산
  const calculateGridSize = (ratio: number) => {
    if (ratio > 1.8) return 'wide'      // 매우 가로로 긴 이미지
    if (ratio > 1.3) return 'large'     // 가로로 긴 이미지  
    if (ratio > 0.8) return 'medium'    // 거의 정사각형
    if (ratio > 0.6) return 'tall'      // 세로로 긴 이미지
    return 'small'                      // 매우 세로로 긴 이미지
  }

  // 적절한 텍스트 너비 계산 (최소/최대 제한 적용)
  const calculateOptimalTextWidth = (containerWidth: number, imageRatio: number) => {
    const actualImageWidth = Math.min(containerWidth, containerWidth * imageRatio)
    
    // 단계별 너비 조정 (레퍼런스 디자인 참고)
    if (actualImageWidth < 120) return 120      // 최소 너비
    if (actualImageWidth > 300) return 300     // 최대 너비
    
    // 단계별 조정 (너무 세밀하지 않게)
    if (actualImageWidth < 150) return 140
    if (actualImageWidth < 200) return 180
    if (actualImageWidth < 250) return 220
    return 260
  }

  // 이미지 로딩 완료 시 비율 계산 및 적절한 너비 측정
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    const ratio = img.naturalWidth / img.naturalHeight
    setAspectRatio(ratio)
    setGridSize(calculateGridSize(ratio))
    
    // 적절한 텍스트 너비 계산
    setTimeout(() => {
      if (imageContainerRef.current) {
        const containerRect = imageContainerRef.current.getBoundingClientRect()
        const optimalWidth = calculateOptimalTextWidth(containerRect.width, ratio)
        setActualWidth(optimalWidth)
      }
    }, 100)
  }

  // 비디오 로딩 완료 시 비율 계산 및 적절한 너비 측정
  const handleVideoLoad = () => {
    if (videoRef.current) {
      const ratio = videoRef.current.videoWidth / videoRef.current.videoHeight
      setAspectRatio(ratio)
      setGridSize(calculateGridSize(ratio))
      
      // 적절한 텍스트 너비 계산
      setTimeout(() => {
        if (imageContainerRef.current) {
          const containerRect = imageContainerRef.current.getBoundingClientRect()
          const optimalWidth = calculateOptimalTextWidth(containerRect.width, ratio)
          setActualWidth(optimalWidth)
        }
      }, 100)
    }
  }
  
  // 비디오 자동 재생 (소리 없이)
  React.useEffect(() => {
    if (videoRef.current && item.mediaType === 'video') {
      // autoPlay 속성이 있지만 추가로 확실히 재생
      videoRef.current.play().catch(console.error)
    }
  }, [item.mediaType])

  // 호버시 처음부터 재생
  React.useEffect(() => {
    if (videoRef.current && item.mediaType === 'video' && isHovered) {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(console.error)
    }
  }, [isHovered, item.mediaType])
  
  return (
    <Link 
      href={item.url} 
      className={`${styles.galleryItem} ${styles[gridSize]}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        ref={imageContainerRef}
        className={styles.imageContainer}
      >
        {item.imageUrl && !imageError ? (
          item.mediaType === 'video' ? (
            <>
              <video
                ref={videoRef}
                className={styles.video}
                autoPlay
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
                  handleVideoLoad()
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
              objectFit="contain"
              className={styles.image}
              sizes="(max-width: 768px) 25vw, 10vw"
              priority={false}
              onLoad={handleImageLoad}
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
      <div 
        className={styles.caption}
        style={{ 
          width: actualWidth ? `${actualWidth}px` : '100%',
          maxWidth: '100%'
        }}
      >
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
        const data = await response.json() as any

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