import { NextRequest, NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/prisma";
import { addDays, getJstDateString } from "@/lib/date";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: NextRequest) {
    try {
        const prisma = getPrismaClient();
        const body = await request.json();
        const {
            studyDate,
            date,
            questionId,
            result,
            missType,
            minutes,
            memo,
        } = body;

        const normalizedStudyDate = studyDate || date || getJstDateString();

        // バリデーション
        if (!questionId || !result) {
            return NextResponse.json(
                { message: "問題IDと結果は必須です" },
                { status: 400 }
            );
        }
        if (!DATE_RE.test(normalizedStudyDate)) {
            return NextResponse.json(
                { message: "日付の形式が不正です" },
                { status: 400 }
            );
        }

        const validResults = ["Correct", "Partial", "Wrong", "Skipped"];
        if (!validResults.includes(result)) {
            return NextResponse.json(
                { message: "無効な結果です" },
                { status: 400 }
            );
        }

        // 問題の存在確認
        const question = await prisma.question.findUnique({
            where: { id: questionId },
        });

        if (!question) {
            return NextResponse.json(
                { message: `問題 ${questionId} が見つかりません` },
                { status: 404 }
            );
        }

        // ログを作成
        // Questionの集計フィールドを更新
        const updateData: Record<string, unknown> = {
            lastResult: result,
            lastStudyDate: normalizedStudyDate,
        };

        // 復習間隔の計算（SM-2アルゴリズム - 一元化されたモジュールを使用）
        const { calculateNextReview } = await import("@/lib/learning/spaced-repetition");
        const reviewResult = calculateNextReview({
            currentInterval: question.reviewInterval,
            result,
            studyDate: normalizedStudyDate,
        });

        updateData.reviewInterval = reviewResult.newInterval;
        updateData.nextReviewDate = reviewResult.nextReviewDate;

        const [log] = await prisma.$transaction([
            prisma.answerLog.create({
                data: {
                    studyDate: normalizedStudyDate,
                    questionId,
                    result,
                    missType,
                    minutes,
                    memo,
                },
            }),
            prisma.question.update({
                where: { id: questionId },
                data: updateData,
            }),
        ]);

        return NextResponse.json({ success: true, log });
    } catch (error) {
        console.error("Failed to create log:", error);
        return NextResponse.json(
            { message: "ログの保存に失敗しました" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const questionId = searchParams.get("questionId");
    const limit = parseInt(searchParams.get("limit") || "50");

    try {
        const prisma = getPrismaClient();
        const logs = await prisma.answerLog.findMany({
            where: questionId ? { questionId } : undefined,
            orderBy: [{ studyDate: "desc" }, { createdAt: "desc" }],
            take: limit,
            include: {
                question: {
                    select: {
                        id: true,
                        year: true,
                        section: true,
                        sectionTitle: true,
                    },
                },
            },
        });

        return NextResponse.json({ logs });
    } catch (error) {
        console.error("Failed to fetch logs:", error);
        return NextResponse.json(
            { error: "ログの取得に失敗しました" },
            { status: 500 }
        );
    }
}
