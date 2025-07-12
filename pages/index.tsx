import * as React from 'react'
import type { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import { NotionPage } from '@/components/NotionPage'
import { NotionApiGallery } from '@/components/NotionApiGallery'
import { OverlayNavigation } from '@/components/OverlayNavigation'
import { SinglePageView } from '@/components/SinglePageView'
import type { NavigationItem } from './api/navigation'
import { domain } from '@/lib/config'

// Single Page 타입에서 여러 페이지 중 우선순위에 따라 선택하는 함수
function selectSinglePageByPriority(items: any[]): any {
  // 1. 노출 순서가 있는 페이지들을 우선 정렬
  const itemsWithOrder = items.filter(item => 
    item.displayOrder !== undefined && 
    item.displayOrder !== null && 
    !isNaN(item.displayOrder)
  ).sort((a, b) => a.displayOrder - b.displayOrder)
  
  // 2. 노출 순서가 없는 페이지들을 최신순으로 정렬
  const itemsWithoutOrder = items.filter(item => 
    item.displayOrder === undefined || 
    item.displayOrder === null || 
    isNaN(item.displayOrder)
  ).sort((a, b) => new Date(b.lastEditedTime).getTime() - new Date(a.lastEditedTime).getTime())
  
  // 3. 우선순위 적용
  if (itemsWithOrder.length > 0) {
    // 노출 순서가 있는 페이지 중 첫 번째 (가장 낮은 숫자)
    return itemsWithOrder[0]
  } else if (itemsWithoutOrder.length > 0) {
    // 노출 순서가 없으면 가장 최근에 수정된 페이지
    return itemsWithoutOrder[0]
  } else {
    // 모든 페이지가 없으면 첫 번째 페이지
    return items[0]
  }
}

interface HomePageProps {
  homeCategory: NavigationItem | null
  notionPageId?: string
  siteConfig: any
}

export default function HomePage({ homeCategory, notionPageId, siteConfig }: HomePageProps) {
  const pageTitle = homeCategory?.displayName || 'Home'
  const pageDescription = 'Welcome to our website'

  return (
    <>
      <NextSeo
        title={pageTitle}
        description={pageDescription}
        openGraph={{
          title: pageTitle,
          description: pageDescription,
          type: 'website',
        }}
      />
      
      <div className="gallery-layout">
        <OverlayNavigation />
        
        {homeCategory?.displayType === 'Single Page' && notionPageId ? (
          <SinglePageView 
            pageId={notionPageId}
            title={homeCategory.displayName}
          />
        ) : (
          <NotionApiGallery 
            categoryFilter={homeCategory?.id} 
          />
        )}
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // 네비게이션 데이터 조회
    const navigationResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/navigation`)
    const navigationData = await navigationResponse.json() as {
      success: boolean
      items?: NavigationItem[]
    }
    
    let homeCategory = null
    let notionPageId = null
    
    if (navigationData.success && navigationData.items) {
      // Home 카테고리 찾기
      homeCategory = navigationData.items.find((item: NavigationItem) => 
        item.categoryName === 'Home' || item.urlPath === '/'
      )
      
      // Home 카테고리가 없으면 첫 번째 항목 사용
      if (!homeCategory && navigationData.items.length > 0) {
        homeCategory = navigationData.items[0]
      }
      
      // Single Page 타입인 경우 노션 페이지 ID 조회
      if (homeCategory?.displayType === 'Single Page') {
        const contentResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/notion-gallery?category=${homeCategory.id}`
        )
        const contentData = await contentResponse.json() as {
          success: boolean
          items?: any[]
        }
        
        if (contentData.success && contentData.items && contentData.items.length > 0) {
          // 페이지 우선순위에 따라 선택
          const selectedPage = selectSinglePageByPriority(contentData.items)
          notionPageId = selectedPage.id
        }
      }
    }
    
    return {
      props: {
        homeCategory,
        notionPageId,
        siteConfig: {
          domain: process.env.NEXT_PUBLIC_DOMAIN || 'localhost:3000',
          isSearchEnabled: false,
          previewImagesEnabled: true,
          forceRefreshImages: false,
          showTableOfContents: true,
          minTableOfContentsItems: 3,
          defaultPageIcon: null,
          defaultPageCover: null,
          defaultPageCoverPosition: 0.5,
          isLiteMode: false,
          isRedirectToLoginPage: false,
          isShowSocialMediaButtons: false,
          isPageANumberedList: false,
        }
      },
    }
  } catch (error) {
    console.error('Error in getServerSideProps:', error)
    // 에러 발생 시 기본 갤러리 표시
    return {
      props: {
        homeCategory: {
          id: 'default',
          categoryName: 'Home',
          displayName: 'Home',
          navigationOrder: 1,
          displayType: 'Gallery' as 'Gallery',
          isActive: true,
          urlPath: '/'
        },
        notionPageId: null,
        siteConfig: {
          domain: process.env.NEXT_PUBLIC_DOMAIN || 'localhost:3000',
          isSearchEnabled: false,
          previewImagesEnabled: true,
          forceRefreshImages: false,
          showTableOfContents: true,
          minTableOfContentsItems: 3,
          defaultPageIcon: null,
          defaultPageCover: null,
          defaultPageCoverPosition: 0.5,
          isLiteMode: false,
          isRedirectToLoginPage: false,
          isShowSocialMediaButtons: false,
          isPageANumberedList: false,
        }
      },
    }
  }
}
