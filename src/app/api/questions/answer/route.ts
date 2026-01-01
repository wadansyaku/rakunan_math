import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 問題の正答を更新
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { questionId, correctText, unit, answerNote } = body;

        if (!questionId) {
            return NextResponse.json(
                { error: "questionId is required" },
                { status: 400 }
            );
        }

        const updated = await prisma.question.update({
            where: { id: questionId },
            data: {
                correctText: correctText || null,
                unit: unit || null,
                answerNote: answerNote || null,
            },
        });

        return NextResponse.json({
            success: true,
            question: updated,
        });
    } catch (error) {
        console.error("Failed to update answer:", error);
        return NextResponse.json(
            { error: "正答の更新に失敗しました" },
            { status: 500 }
        );
    }
}
