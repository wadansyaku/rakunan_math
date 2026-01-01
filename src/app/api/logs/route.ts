import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addDays, getJstDateString } from "@/lib/date";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            studyDate,
            date,
            questionId,
            result,
            missType,
            minutes,
            memo,
            studentAns,
            autoJudge,
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

        // 復習間隔の計算（SM-2アルゴリズムの簡易版）
        let newInterval = question.reviewInterval || 1;
        if (result === "Correct") {
            newInterval = Math.min(newInterval * 2, 30);
        } else if (result === "Wrong") {
            newInterval = 1;
        } else if (result === "Partial") {
            newInterval = Math.max(1, Math.floor(newInterval * 1.2));
        }

        updateData.reviewInterval = newInterval;
        updateData.nextReviewDate = addDays(normalizedStudyDate, newInterval);

        const [log] = await prisma.$transaction([
            prisma.answerLog.create({
                data: {
                    studyDate: normalizedStudyDate,
                    questionId,
                    result,
                    missType,
                    minutes,
                    memo,
                    studentAns,
                    correctText: question.correctText,
                    autoJudge,
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
