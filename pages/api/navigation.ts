import type { NextApiRequest, NextApiResponse } from 'next'
import { Client } from '@notionhq/client'

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
})

export interface NavigationItem {
  id: string
  categoryName: string
  displayName: string
  navigationOrder: number
  displayType: 'Single Page' | 'Gallery'
  isActive: boolean
  urlPath: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  // API 응답 캐싱 설정 (5분)
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')

  try {
    const navigationDbId = process.env.NOTION_NAVIGATION_DB_ID

    if (!navigationDbId) {
      return res.status(400).json({ message: 'Navigation Database ID is required. Set NOTION_NAVIGATION_DB_ID environment variable.' })
    }

    // 네비게이션 설정 DB 쿼리
    const response = await notion.databases.query({
      database_id: navigationDbId,
      filter: {
        property: '활성화',
        checkbox: {
          equals: true
        }
      },
      sorts: [
        {
          property: '네비게이션 순서',
          direction: 'ascending'
        }
      ]
    })

    // 네비게이션 데이터 변환
    const navigationItems: NavigationItem[] = response.results.map((page: any) => {
      const properties = page.properties
      
      
      // 카테고리명 - Relation 속성에서 ID 추출
      const categoryRelation = properties['Studio Cowcowwow 블로그']?.relation?.[0]?.id || ''
      
      // 표시 이름 - '표시명' 속성 (Title 타입)
      const displayName = properties['표시명']?.title?.[0]?.plain_text || ''
      
      // categoryName으로 표시명 사용 (실제 카테고리명 역할)
      const categoryName = displayName
      
      // 네비게이션 순서 - '네비게이션 순서' 속성
      const navigationOrder = properties['네비게이션 순서']?.number || 999
      
      // 표시 방식 - '표시 방식' 속성
      const displayType = properties['표시 방식']?.select?.name || 'Gallery'
      
      // 활성화 여부 - '활성화' 속성
      const isActive = properties['활성화']?.checkbox || false
      
      // URL 경로 - 'URL 경로' 속성
      const urlPath = properties['URL 경로']?.rich_text?.[0]?.plain_text || `/${categoryName.toLowerCase()}`

      return {
        id: page.id,
        categoryName,
        displayName,
        navigationOrder,
        displayType: displayType as 'Single Page' | 'Gallery',
        isActive,
        urlPath
      }
    })

    res.status(200).json({
      success: true,
      items: navigationItems.sort((a, b) => a.navigationOrder - b.navigationOrder),
      total: navigationItems.length
    })

  } catch (error) {
    console.error('Navigation API Error:', error)
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch navigation data',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}