import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'

const MODEL_ID = 'gemini-2.5-flash-lite'
const MIN_CONTENT_LENGTH = 10
const MAX_TAGS = 5

interface TagsRequestBody {
  title: string
  content: string
}

export async function POST(request: NextRequest) {
  let body: TagsRequestBody

  try {
    body = (await request.json()) as TagsRequestBody
  } catch {
    return NextResponse.json(
      { error: '잘못된 요청 형식입니다.' },
      { status: 400 }
    )
  }

  const { title, content } = body

  if (!content || content.trim().length < MIN_CONTENT_LENGTH) {
    return NextResponse.json(
      { error: '태그를 추천하기에 내용이 너무 짧습니다.' },
      { status: 400 }
    )
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY가 설정되지 않았습니다.' },
      { status: 500 }
    )
  }

  const ai = new GoogleGenAI({ apiKey })

  const prompt = `다음 메모의 제목과 내용을 분석해 핵심 키워드를 태그로 ${MAX_TAGS}개 이하 추출해 주세요.

규칙:
- 태그는 한 단어 또는 붙임표 없는 연결어 (예: "react", "할일", "nextjs")
- 한국어 또는 영문 소문자만 사용
- 공백 없이 작성
- 중복 없이
- 반드시 JSON 배열 형식만 응답 (예: ["react", "학습", "hooks"])
- 다른 설명은 절대 붙이지 마세요

제목: ${title}

내용:
${content}`

  try {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
    })

    const raw = response.text?.trim() ?? ''

    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return NextResponse.json(
        { error: '모델이 올바른 형식의 태그를 반환하지 않았습니다.' },
        { status: 500 }
      )
    }

    let tags: unknown
    try {
      tags = JSON.parse(jsonMatch[0])
    } catch {
      return NextResponse.json(
        { error: '태그 파싱에 실패했습니다.' },
        { status: 500 }
      )
    }

    if (
      !Array.isArray(tags) ||
      !tags.every(t => typeof t === 'string')
    ) {
      return NextResponse.json(
        { error: '모델이 올바른 형식의 태그를 반환하지 않았습니다.' },
        { status: 500 }
      )
    }

    const cleanedTags = (tags as string[])
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0)
      .slice(0, MAX_TAGS)

    return NextResponse.json({ tags: cleanedTags })
  } catch (error) {
    console.error('Gemini API 오류 (tags):', error)

    const message =
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'

    return NextResponse.json(
      { error: `AI 태그 추천에 실패했습니다: ${message}` },
      { status: 500 }
    )
  }
}
