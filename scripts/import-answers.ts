import "dotenv/config";
import { prisma } from '../src/lib/prisma';
import { answerData } from '../data/answer-data';

async function importAnswers() {
    console.log('=== 解答データインポート ===');
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
        } catch (error) {
            // 問題が存在しない場合
            notFound++;
            notFoundIds.push(questionId);
        }
    }

    console.log(`✓ 更新成功: ${updated}件`);
    if (notFound > 0) {
        console.log(`✗ 問題が見つからなかった: ${notFound}件`);
        console.log(`  ID一覧: ${notFoundIds.slice(0, 10).join(', ')}${notFoundIds.length > 10 ? '...' : ''}`);
    }

    // 統計情報を表示
    const stats = await prisma.question.aggregate({
        _count: { id: true },
    });
    const withAnswer = await prisma.question.count({
        where: { correctText: { not: null } },
    });
    console.log(`\n=== 結果 ===`);
    console.log(`総問題数: ${stats._count.id}`);
    console.log(`正答登録済み: ${withAnswer}件 (${((withAnswer / stats._count.id) * 100).toFixed(1)}%)`);
}

importAnswers()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
