
import { NextRequest, NextResponse } from "next/server";
import { VertexAI } from "@google-cloud/vertexai";

// 環境変数
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT;
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
const MODEL_ID = process.env.VERTEX_CLAUDE_MODEL || "claude-3-7-sonnet@20250219";

export async function POST(request: NextRequest) {
    // 環境変数が設定されていない場合は早期リターン
    if (!PROJECT_ID) {
        return NextResponse.json(
            { message: "AI機能は利用できません（GOOGLE_CLOUD_PROJECT未設定）" },
            { status: 503 }
        );
    }

    try {
        const body = await request.json();
        const { questionId, result, missType, memo, correctText, studentAns } = body;

        // Vertex AI クライアントの初期化
        const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });
        const generativeModel = vertexAI.getGenerativeModel({
            model: MODEL_ID,
        });

        const prompt = `
あなたは算数の家庭教師です。以下の学習ログを分析し、生徒へのフィードバックと具体的な改善アクションを提案してください。

## 問題情報
- ID: ${questionId}
- 正答: ${correctText || "不明"}

## 生徒の解答状況
- 結果: ${result}
- ミス分類: ${missType || "なし"}
- 生徒の答え: ${studentAns || "なし"}
- メモ: ${memo || "なし"}

## 指示
1. **原因分析**: なぜ間違えたのか（または解けたのか）を推測してください。
2. **改善アクション**: 次に同じミスをしないための具体的な対策を1〜3つ挙げてください。Markdownのリスト形式で出力してください。
3. **励まし**: 短く励ましの言葉を添えてください。

出力はMarkdown形式のみとし、余計な前置きは省いてください。
`;

        const resp = await generativeModel.generateContent(prompt);
        const content = resp.response.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!content) {
            throw new Error("AIからの応答が空でした");
        }

        return NextResponse.json({
            analysis: content,
        });

    } catch (error) {
        console.error("AI Analysis failed:", error);
        return NextResponse.json(
            { message: "AI分析中にエラーが発生しました" },
            { status: 500 }
        );
    }
}
