import { getPrismaClient } from "@/lib/prisma";
import { TAG_GROUPS } from "@/lib/constants";
import { getJstDateString, getRecentDateStrings } from "@/lib/date";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  ClipboardList,
  Clock,
  Target,
  Trophy,
  History,
} from "lucide-react";
import { ActivityChart } from "@/components/dashboard/activity-chart";

export const dynamic = "force-dynamic";

export default async function Home() {
  const prisma = getPrismaClient();
  const today = getJstDateString();
  const recentDates = getRecentDateStrings(14, today);

  // 並列でデータ取得
  const [
    totalLogs,
    logsToday,
    dueQuestions,
    recentLogs,
    allQuestionStats,
    activityCounts,
  ] = await Promise.all([
    prisma.answerLog.count(),
    prisma.answerLog.count({
      where: {
        studyDate: today,
      },
    }),
    prisma.question.count({
      where: {
        nextReviewDate: {
          lte: today,
        },
      },
    }).catch(() => 0), // スキーマエラー回避（activeカラムがない場合）
    prisma.answerLog.findMany({
      take: 5,
      orderBy: [{ studyDate: "desc" }, { createdAt: "desc" }],
      include: {
        question: {
          select: { sectionTitle: true, difficulty: true },
        },
      },
    }),
    prisma.question.findMany({
      select: { tagGroup: true, lastResult: true },
    }),
    prisma.answerLog.groupBy({
      by: ["studyDate"],
      where: { studyDate: { in: recentDates } },
      _count: { _all: true },
    }),
  ]);

  // TagGroupごとの統計
  const tagStats = TAG_GROUPS.map((tag) => {
    const qs = allQuestionStats.filter((q) => q.tagGroup === tag);
    const total = qs.length;
    const correct = qs.filter((q) => q.lastResult === "Correct").length;
    const progress = total > 0 ? (correct / total) * 100 : 0;
    return { tag, total, correct, progress };
  }).filter(s => s.total > 0); // データがあるものだけ表示

  const activityCountMap = new Map(
    activityCounts.map((item) => [item.studyDate, item._count._all])
  );
  const activityData = recentDates.map((date) => ({
    date,
    count: activityCountMap.get(date) ?? 0,
  }));

  const formatDisplayDate = (date: string) => date.replaceAll("-", "/");

  return (
    <div className="space-y-8">
      {/* ヒーローセクション */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日の実施数</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logsToday}</div>
            <p className="text-xs text-muted-foreground">
              目標まであと {Math.max(0, 5 - logsToday)} 問
            </p>
            <Progress value={(logsToday / 5) * 100} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">復習待ち</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{dueQuestions}</div>
            <p className="text-xs text-muted-foreground">
              期限切れの問題
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">累計ログ</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLogs}</div>
            <p className="text-xs text-muted-foreground">
              学習の積み重ね
            </p>
          </CardContent>
        </Card>
      </section>

      {/* アクティビティチャート */}
      <ActivityChart data={activityData} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* 分野別進捗 */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>分野別進捗 (正答率)</CardTitle>
            <CardDescription>
              各分野の習熟度を確認しましょう
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tagStats.map((stat) => (
                <div key={stat.tag} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{stat.tag}</span>
                    <span className="text-muted-foreground">
                      {stat.correct} / {stat.total} ({Math.round(stat.progress)}%)
                    </span>
                  </div>
                  <Progress value={stat.progress} className="h-2" />
                </div>
              ))}
              {tagStats.length === 0 && (
                <div className="text-center text-muted-foreground py-4">データがありません</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* クイックアクションと直近ログ */}
        <div className="col-span-3 space-y-4">
          {/* クイックアクション */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-100 dark:border-blue-900">
            <CardHeader>
              <CardTitle className="text-blue-700 dark:text-blue-300">アクション</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button asChild size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
                <Link href="/quicklog">
                  <ClipboardList className="mr-2 h-5 w-5" />
                  答え合わせをする (QuickLog)
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/review">
                  <Clock className="mr-2 h-4 w-4" />
                  復習リストを確認
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* 直近の活動 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                直近の活動
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    まだログがありません
                  </p>
                ) : (
                  recentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex flex-col gap-2 border-b pb-2 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-sm">
                          {log.questionId}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-full sm:max-w-[180px]">
                          {log.question?.sectionTitle || "タイトルなし"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            log.result === "Correct"
                              ? "outline" // successがないのでoutline + class
                              : "destructive"
                          }
                          className={
                            log.result === "Correct"
                              ? "border-green-500 text-green-600 bg-green-50"
                              : ""
                          }
                        >
                          {log.result}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDisplayDate(log.studyDate)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
