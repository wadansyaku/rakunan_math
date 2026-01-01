import { prisma } from "@/lib/prisma";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Search,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Info,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface CheckResult {
    name: string;
    status: "ok" | "warning" | "error";
    count: number;
    details: Array<{ id: string; message: string }>;
}

async function runHealthChecks(): Promise<CheckResult[]> {
    const results: CheckResult[] = [];

    // 1. 問題IDが空のQuestion
    const emptyIdQuestions = await prisma.question.findMany({
        where: { id: "" },
        select: { id: true, year: true, section: true },
    });
    results.push({
        name: "問題IDが空のQuestion",
        status: emptyIdQuestions.length === 0 ? "ok" : "error",
        count: emptyIdQuestions.length,
        details: emptyIdQuestions.map((q) => ({
            id: q.id || "(empty)",
            message: `Year: ${q.year}, Section: ${q.section}`,
        })),
    });

    // 2. AnswerLogのquestionIdがQuestionsに存在しない
    const allLogs = await prisma.answerLog.findMany({
        select: { id: true, questionId: true },
    });
    const allQuestionIds = new Set(
        (await prisma.question.findMany({ select: { id: true } })).map((q) => q.id)
    );
    const orphanLogs = allLogs.filter((l) => !allQuestionIds.has(l.questionId));
    results.push({
        name: "存在しないQuestionを参照するAnswerLog",
        status: orphanLogs.length === 0 ? "ok" : "warning",
        count: orphanLogs.length,
        details: orphanLogs.slice(0, 10).map((l) => ({
            id: l.id,
            message: `QuestionId: ${l.questionId}`,
        })),
    });

    // 3. result が候補外のAnswerLog
    const validResults = ["Correct", "Partial", "Wrong", "Skipped"];
    const invalidResultLogs = await prisma.answerLog.findMany({
        where: {
            NOT: {
                result: { in: validResults },
            },
        },
        select: { id: true, result: true, questionId: true },
    });
    results.push({
        name: "無効なresultのAnswerLog",
        status: invalidResultLogs.length === 0 ? "ok" : "warning",
        count: invalidResultLogs.length,
        details: invalidResultLogs.slice(0, 10).map((l) => ({
            id: l.id,
            message: `Result: ${l.result}`,
        })),
    });

    // 4. 正答が未登録の問題（年度別）
    const questionsWithoutAnswer = await prisma.question.findMany({
        where: {
            correctText: null,
        },
        select: { id: true, year: true },
        orderBy: { year: "desc" },
    });
    const yearCounts: Record<number, number> = {};
    questionsWithoutAnswer.forEach((q) => {
        yearCounts[q.year] = (yearCounts[q.year] || 0) + 1;
    });
    results.push({
        name: "正答未登録の問題",
        status:
            questionsWithoutAnswer.length === 0
                ? "ok"
                : questionsWithoutAnswer.length < 10
                    ? "warning"
                    : "error",
        count: questionsWithoutAnswer.length,
        details: Object.entries(yearCounts).map(([year, count]) => ({
            id: year,
            message: `${count}件の問題で正答未登録`,
        })),
    });

    // 5. 復習間隔が設定されていない問題
    const noReviewInterval = await prisma.question.count({
        where: { reviewInterval: null },
    });
    results.push({
        name: "復習間隔が未設定の問題",
        status: noReviewInterval === 0 ? "ok" : "warning",
        count: noReviewInterval,
        details: [],
    });

    // 6. 統計情報
    const totalQuestions = await prisma.question.count();
    const totalLogs = await prisma.answerLog.count();
    results.push({
        name: "登録済み問題数",
        status: "ok",
        count: totalQuestions,
        details: [],
    });
    results.push({
        name: "登録済みログ数",
        status: "ok",
        count: totalLogs,
        details: [],
    });

    return results;
}

export default async function HealthCheckPage() {
    const checks = await runHealthChecks();

    const hasErrors = checks.some((c) => c.status === "error");
    const hasWarnings = checks.some((c) => c.status === "warning");

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Search className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold">整合性チェック</h1>
                    <p className="text-muted-foreground">
                        データの欠損や不整合を検知
                    </p>
                </div>
            </div>

            {/* サマリー */}
            <Card
                className={
                    hasErrors
                        ? "border-red-500/50 bg-red-50 dark:bg-red-950/20"
                        : hasWarnings
                            ? "border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20"
                            : "border-green-500/50 bg-green-50 dark:bg-green-950/20"
                }
            >
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {hasErrors ? (
                            <XCircle className="h-5 w-5 text-red-600" />
                        ) : hasWarnings ? (
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        ) : (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                        チェック結果
                    </CardTitle>
                    <CardDescription>
                        {hasErrors
                            ? "エラーが検出されました"
                            : hasWarnings
                                ? "警告が検出されました"
                                : "すべてのチェックに合格しました"}
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* 詳細 */}
            <Card>
                <CardHeader>
                    <CardTitle>チェック項目</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>項目</TableHead>
                                <TableHead>ステータス</TableHead>
                                <TableHead className="text-right">件数</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {checks.map((check, i) => (
                                <TableRow key={i}>
                                    <TableCell className="font-medium">{check.name}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                check.status === "ok"
                                                    ? "default"
                                                    : check.status === "warning"
                                                        ? "secondary"
                                                        : "destructive"
                                            }
                                        >
                                            {check.status === "ok" && (
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                            )}
                                            {check.status === "warning" && (
                                                <AlertTriangle className="h-3 w-3 mr-1" />
                                            )}
                                            {check.status === "error" && (
                                                <XCircle className="h-3 w-3 mr-1" />
                                            )}
                                            {check.status.toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{check.count}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* 詳細表示 */}
            {checks
                .filter((c) => c.details.length > 0)
                .map((check, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Info className="h-5 w-5" />
                                {check.name} - 詳細
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>詳細</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {check.details.map((d, j) => (
                                        <TableRow key={j}>
                                            <TableCell className="font-mono">{d.id}</TableCell>
                                            <TableCell>{d.message}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                ))}
        </div>
    );
}
