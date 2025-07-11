import type { NextApiRequest, NextApiResponse } from 'next'
import { Client } from '@notionhq/client'
import { NotionAPI } from 'notion-client'

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
})

const notionClient = new NotionAPI()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  // API 응답 캐싱 설정 (10분)
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200')

  try {
    const { pageId } = req.query

    if (!pageId) {
      return res.status(400).json({ message: 'Page ID is required' })
    }

    // 노션 페이지 recordMap 가져오기
    const recordMap = await notionClient.getPage(pageId as string)

    res.status(200).json({
      success: true,
      recordMap,
    })

  } catch (error) {
    console.error('Notion Page API Error:', error)
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch notion page',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}