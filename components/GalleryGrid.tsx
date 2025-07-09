import React from 'react'
import Link from 'next/link'
import Image from 'next/legacy/image'
import { getBlockTitle, getPageProperty } from 'notion-utils'
import { mapPageUrl } from '@/lib/map-page-url'
import { mapImageUrl } from '@/lib/map-image-url'
import type * as types from '@/lib/types'
import styles from './GalleryGrid.module.css'

interface GalleryGridProps {
  site: types.SiteConfig
  recordMap: types.ExtendedRecordMap
  collection: any
  collectionView: any
  collectionData: any
}

export function GalleryGrid({
  site,
  recordMap,
  collection,
  collectionView,
  collectionData
}: GalleryGridProps) {
  const { blockIds } = collectionData
  
  return (
    <div className={styles.galleryGrid}>
      {blockIds?.map((blockId: string) => {
        const block = recordMap.block[blockId]?.value
        if (!block) return null

        const title = getBlockTitle(block, recordMap)
        const coverImage = getPageProperty<string>('Cover', block, recordMap)
        const description = getPageProperty<string>('Description', block, recordMap)
        const pageUrl = mapPageUrl(site, recordMap)(blockId)
        
        const imageUrl = coverImage 
          ? mapImageUrl(coverImage, block)
          : null

        return (
          <Link key={blockId} href={pageUrl} className={styles.galleryItem}>
            <div className={styles.imageContainer}>
              {imageUrl && (
                <Image
                  src={imageUrl}
                  alt={title || ''}
                  fill
                  className={styles.image}
                  sizes="(max-width: 768px) 25vw, 10vw"
                />
              )}
              {!imageUrl && (
                <div className={styles.placeholder}>
                  <span>{title?.charAt(0) || '?'}</span>
                </div>
              )}
            </div>
            <div className={styles.caption}>
              <h3 className={styles.title}>{title}</h3>
              {description && (
                <p className={styles.description}>{description}</p>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}