import { runScript } from "./lib/runner";
import { answerData } from "../data/answer-data";

runScript("解答データインポート", async ({ prisma }) => {
    console.log(`入力データ: ${Object.keys(answerData).length}件`);

    let updated = 0;
    let notFound = 0;
    const notFoundIds: string[] = [];

    for (const [questionId, data] of Object.entries(answerData)) {
        try {
            const result = await prisma.question.update({
                where: { id: questionId },
                data: {
                    correctText: data.correctText,
                    unit: data.unit || null,
                    answerNote: data.note || null,
                },
            });
            if (result) {
                updated++;
            }
        } catch {
            notFound++;
            notFoundIds.push(questionId);
        }
    }

    if (notFound > 0) {
        console.log(`⚠️ 問題が見つからなかった: ${notFound}件`);
        console.log(`  ID一覧: ${notFoundIds.slice(0, 10).join(", ")}${notFoundIds.length > 10 ? "..." : ""}`);
    }

    // 統計情報
    const stats = await prisma.question.aggregate({
        _count: { id: true },
    });
    const withAnswer = await prisma.question.count({
        where: { correctText: { not: null } },
    });

    return {
        success: notFound === 0,
        message: `更新成功: ${updated}件`,
        data: {
            総問題数: stats._count.id,
            正答登録済み: `${withAnswer}件 (${((withAnswer / stats._count.id) * 100).toFixed(1)}%)`,
        },
    };
});
