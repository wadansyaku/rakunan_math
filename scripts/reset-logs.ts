import { runScript } from "./lib/runner";

runScript("学習ログリセット", async ({ prisma }) => {
    // 1. AnswerLogを全削除
    const deletedLogs = await prisma.answerLog.deleteMany({});
    console.log(`📝 AnswerLog ${deletedLogs.count}件を削除`);

    // 2. Questionの集計フィールドをリセット
    const updatedQuestions = await prisma.question.updateMany({
        data: {
            lastResult: null,
            lastStudyDate: null,
            reviewInterval: null,
            nextReviewDate: null,
        },
    });
    console.log(`📝 Question ${updatedQuestions.count}件のステータスをリセット`);

    return {
        success: true,
        message: "全ての学習ログをリセットしました",
        data: {
            削除ログ数: deletedLogs.count,
            リセット問題数: updatedQuestions.count,
        },
    };
});
