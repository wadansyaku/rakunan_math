import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getJstDateString } from "@/lib/date";

export async function GET() {
    try {
        const today = getJstDateString();

        // 期限切れの問題を取得
        const dueQuestions = await prisma.question.findMany({
            where: {
                nextReviewDate: {
                    lte: today,
                },
            },
            orderBy: [
                { nextReviewDate: "asc" },
                { mustSolve: "desc" },
                { difficulty: "desc" },
            ],
            take: 50,
        });

        return NextResponse.json({
            questions: dueQuestions,
        });
    } catch (error) {
        console.error("Failed to fetch due questions:", error);
        return NextResponse.json(
            { error: "復習リストの取得に失敗しました" },
            { status: 500 }
        );
    }
}
