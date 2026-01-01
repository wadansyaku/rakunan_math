import { NextRequest, NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get("q") || "";

    if (q.length < 2) {
        return NextResponse.json({ questions: [] });
    }

    try {
        const prisma = getPrismaClient();
        const questions = await prisma.question.findMany({
            where: {
                OR: [
                    { id: { contains: q } },
                    { sectionTitle: { contains: q } },
                ],
            },
            select: {
                id: true,
                year: true,
                section: true,
                sub: true,
                sectionTitle: true,
                correctText: true,
                unit: true,
                answerNote: true,
            },
            take: 10,
            orderBy: { id: "asc" },
        });

        return NextResponse.json({ questions });
    } catch (error) {
        console.error("Failed to search questions:", error);
        return NextResponse.json(
            { error: "検索に失敗しました" },
            { status: 500 }
        );
    }
}
