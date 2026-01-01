
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const fromDate = searchParams.get("from");
        const toDate = searchParams.get("to");

        if (!fromDate || !toDate) {
            return NextResponse.json(
                { message: "開始日と終了日は必須です" },
                { status: 400 }
            );
        }

        const logs = await prisma.answerLog.findMany({
            where: {
                studyDate: {
                    gte: fromDate,
                    lte: toDate,
                },
            },
            include: {
                question: {
                    select: {
                        sectionTitle: true,
                    },
                },
            },
            orderBy: {
                studyDate: "asc",
            },
        });

        // CSVヘッダー
        const header = [
            "date",
            "questionId",
            "title",
            "result",
            "minutes",
            "missType",
            "memo",
            "studentAns",
        ].join(",");

        // CSVデータ行
        const rows = logs.map((log) => {
            const date = log.studyDate;
            const title = log.question?.sectionTitle || "";
            const escapedTitle = title.includes(",") ? `"${title}"` : title;
            const memo = log.memo || "";
            const escapedMemo = memo.includes(",") ? `"${memo}"` : memo;
            const studentAns = log.studentAns || "";
            const escapedStudentAns = studentAns.includes(",") ? `"${studentAns}"` : studentAns;

            return [
                date,
                log.questionId,
                escapedTitle,
                log.result,
                log.minutes || "",
                log.missType || "",
                escapedMemo,
                escapedStudentAns,
            ].join(",");
        });

        const csvContent = [header, ...rows].join("\n");

        return new NextResponse(csvContent, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="logs_${fromDate}_${toDate}.csv"`,
            },
        });
    } catch (error) {
        console.error("Export failed:", error);
        return NextResponse.json(
            { message: "エクスポートに失敗しました" },
            { status: 500 }
        );
    }
}
