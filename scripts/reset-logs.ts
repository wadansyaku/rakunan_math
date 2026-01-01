import "dotenv/config";
import { prisma } from '../src/lib/prisma';

async function resetLogs() {
    console.log('=== 学習ログ削除スクリプト ===');

    // 1. AnswerLogを全削除
    const deletedLogs = await prisma.answerLog.deleteMany({});
    console.log(`✓ AnswerLog ${deletedLogs.count}件を削除しました`);

    // 2. Questionの集計フィールドをリセット
    const updatedQuestions = await prisma.question.updateMany({
        data: {
            lastResult: null,
            lastStudyDate: null,
            reviewInterval: null,
            nextReviewDate: null,
        },
    });
    console.log(`✓ Question ${updatedQuestions.count}件のステータスをリセットしました`);

    console.log('=== 完了 ===');
}

resetLogs()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
