import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'

const MODEL_ID = 'gemini-2.5-flash-lite'
const MIN_CONTENT_LENGTH = 10

interface SummaryRequestBody {
  title: string
  content: string
}

export async function POST(request: NextRequest) {
  let body: SummaryRequestBody

  try {
    body = (await request.json()) as SummaryRequestBody
  } catch {
    return NextResponse.json(
      { error: '잘못된 요청 형식입니다.' },
      { status: 400 }
    )
  }

  const { title, content } = body

  if (!content || content.trim().length < MIN_CONTENT_LENGTH) {
    return NextResponse.json(
      { error: '요약하기에 내용이 너무 짧습니다.' },
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

  const prompt = `다음 메모를 한국어로 2~3문장으로 간결하게 요약해 주세요.
원문에 없는 내용은 추측하거나 추가하지 마세요.
요약 텍스트만 출력하고 다른 설명은 붙이지 마세요.

제목: ${title}

내용:
${content}`

  try {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
    })

    const summary = response.text

    if (!summary) {
      return NextResponse.json(
        { error: '모델이 요약 결과를 반환하지 않았습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Gemini API 오류:', error)

    const message =
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'

    return NextResponse.json(
      { error: `AI 요약에 실패했습니다: ${message}` },
      { status: 500 }
    )
  }
}
