import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/prisma";

export async function GET() {
    try {
        const prisma = getPrismaClient();
        // 全問題を取得（年度・大問・小問でグループ化用）
        const questions = await prisma.question.findMany({
            select: {
                id: true,
                year: true,
                section: true,
                sub: true,
                sectionTitle: true,
                difficulty: true,
                correctText: true,
                unit: true,
            },
            orderBy: [
                { year: "desc" },
                { section: "asc" },
                { sub: "asc" },
            ],
        });

        // 年度リストを生成
        const years = [...new Set(questions.map(q => q.year))].sort((a, b) => b - a);

        // 年度->大問->小問の階層構造を生成
        const hierarchy: Record<number, Record<number, typeof questions>> = {};
        for (const q of questions) {
            if (!hierarchy[q.year]) {
                hierarchy[q.year] = {};
            }
            if (!hierarchy[q.year][q.section]) {
                hierarchy[q.year][q.section] = [];
            }
            hierarchy[q.year][q.section].push(q);
        }

        return NextResponse.json({
            questions,
            years,
            hierarchy,
        });
    } catch (error) {
        console.error("Failed to fetch questions list:", error);
        return NextResponse.json(
            { error: "問題リストの取得に失敗しました" },
            { status: 500 }
        );
    }
}
