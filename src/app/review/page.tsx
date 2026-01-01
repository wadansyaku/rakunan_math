import { getPrismaClient } from "@/lib/prisma";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { RefreshCw, Play, AlertTriangle, Focus } from "lucide-react";
import Link from "next/link";
import { diffDays, getJstDateString } from "@/lib/date";

export const dynamic = "force-dynamic";

interface Question {
    id: string;
    year: number;
    section: number;
    sub: string;
    sectionTitle: string | null;
    difficulty: number | null;
    mustSolve: boolean | null;
    nextReviewDate: string | null;
    lastResult: string | null;
    tagGroup: string | null;
}

async function getReviewQuestions() {
    const prisma = getPrismaClient();
    const today = getJstDateString();

    // 期限切れの問題を取得
    const dueQuestions = await prisma.question.findMany({
        where: {
            nextReviewDate: {
                lte: today,
            },
        },
        orderBy: [
            { nextReviewDate: "asc" },
            { mustSolve: "desc" },
            { difficulty: "desc" },
        ],
        take: 30,
    });

    // 誤答が多い問題も取得
    const wrongQuestions = await prisma.question.findMany({
        where: {
            lastResult: {
                in: ["Wrong", "Partial"],
            },
            id: {
                notIn: dueQuestions.map((q) => q.id),
            },
        },
        orderBy: [{ mustSolve: "desc" }, { difficulty: "desc" }],
        take: 10,
    });

    // ランダムに5問取得（気分転換用）
    const totalCount = await prisma.question.count();
    const skip = Math.floor(Math.random() * Math.max(0, totalCount - 5));
    const randomQuestions = await prisma.question.findMany({
        take: 5,
        skip: skip,
        include: { _count: { select: { logs: true } } },
    });

    return { dueQuestions, wrongQuestions, randomQuestions };
}

function calculatePriority(q: Question): number {
    let score = 0;

    // 期限切れ日数
    if (q.nextReviewDate) {
        const daysOverdue = Math.max(0, diffDays(q.nextReviewDate));
        score += Math.min(daysOverdue, 30);
    }

    // 直近Wrongに重み
    if (q.lastResult === "Wrong") score += 20;
    else if (q.lastResult === "Partial") score += 10;

    // 難易度
    if (q.difficulty) score += q.difficulty * 2;

    // 必解
    if (q.mustSolve) score += 15;

    return score;
}

function getPriorityBreakdown(q: Question) {
    const daysOverdue = q.nextReviewDate ? Math.max(0, diffDays(q.nextReviewDate)) : 0;

    const overdueScore = Math.min(daysOverdue, 30);
    const wrongScore = q.lastResult === "Wrong" ? 20 : q.lastResult === "Partial" ? 10 : 0;
    const diffScore = (q.difficulty || 0) * 2;
    const mustScore = q.mustSolve ? 15 : 0;

    return {
        total: overdueScore + wrongScore + diffScore + mustScore,
        details: {
            daysOverdue,
            overdueScore,
            wrongScore,
            diffScore,
            mustScore
        }
    };
}

export default async function ReviewPage() {
    const { dueQuestions, wrongQuestions, randomQuestions } = await getReviewQuestions();

    // 優先度でソート
    const sortedDue = [...dueQuestions].sort(
        (a, b) => calculatePriority(b) - calculatePriority(a)
    );

    return (
        <div className="space-y-6">

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <RefreshCw className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold">復習リスト</h1>
                        <p className="text-muted-foreground">
                            期限切れ・誤答優先で今日やる問題
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link href="/review/focus">
                        <Button variant="secondary">
                            <Focus className="h-4 w-4 mr-2" />
                            集中モード
                        </Button>
                    </Link>
                    <Link href="/quicklog">
                        <Button>
                            <Play className="h-4 w-4 mr-2" />
                            ログを記録
                        </Button>
                    </Link>
                </div>
            </div>

            {/* 期限切れ問題 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        期限切れ問題
                    </CardTitle>
                    <CardDescription>
                        {sortedDue.length}件の問題が復習期限を過ぎています
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {sortedDue.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            🎉 期限切れの問題はありません！
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>問題ID</TableHead>
                                    <TableHead>タイトル</TableHead>
                                    <TableHead>タグ</TableHead>
                                    <TableHead>難易度</TableHead>
                                    <TableHead>最終結果</TableHead>
                                    <TableHead>期限</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedDue.map((q) => (
                                    <TableRow key={q.id}>
                                        <TableCell className="font-mono font-medium">
                                            {q.id}
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate">
                                            {q.sectionTitle || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {q.tagGroup && (
                                                <Badge variant="secondary">{q.tagGroup}</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {q.difficulty && (
                                                <Badge
                                                    variant={
                                                        q.difficulty >= 4
                                                            ? "destructive"
                                                            : "secondary"
                                                    }
                                                >
                                                    {"★".repeat(q.difficulty)}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {q.lastResult && (
                                                <Badge
                                                    variant={
                                                        q.lastResult === "Correct"
                                                            ? "default"
                                                            : q.lastResult === "Partial"
                                                                ? "secondary"
                                                                : "destructive"
                                                    }
                                                    className={
                                                        q.lastResult === "Correct"
                                                            ? "bg-green-600 hover:bg-green-700"
                                                            : ""
                                                    }
                                                >
                                                    {q.lastResult}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {q.nextReviewDate ? q.nextReviewDate.replaceAll("-", "/") : "-"}
                                        </TableCell>
                                        <TableCell>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Badge variant="outline" className="cursor-help">
                                                            {calculatePriority(q)}
                                                        </Badge>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="text-xs">
                                                        <div className="font-bold mb-1">優先度スコア内訳</div>
                                                        {(() => {
                                                            const breakdown = getPriorityBreakdown(q);
                                                            return (
                                                                <ul className="list-disc list-inside space-y-0.5">
                                                                    <li>期限切れ: {breakdown.details.daysOverdue}日 (+{breakdown.details.overdueScore})</li>
                                                                    <li>直近結果: {q.lastResult || "-"} (+{breakdown.details.wrongScore})</li>
                                                                    <li>難易度: {q.difficulty || "-"} (+{breakdown.details.diffScore})</li>
                                                                    <li>必解: {q.mustSolve ? "Yes" : "No"} (+{breakdown.details.mustScore})</li>
                                                                </ul>
                                                            );
                                                        })()}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </TableCell>
                                        <TableCell>
                                            <Link href={`/quicklog?q=${q.id}`}>
                                                <Button size="sm" variant="outline">
                                                    記録
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                {/* 誤答の問題 */}
                <Card>
                    <CardHeader>
                        <CardTitle>苦手克服（誤答のみ）</CardTitle>
                        <CardDescription>
                            直近で間違えた問題を再挑戦
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {wrongQuestions.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">
                                誤答の問題はありません
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>問題ID</TableHead>
                                        <TableHead>結果</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {wrongQuestions.map((q) => (
                                        <TableRow key={q.id}>
                                            <TableCell className="font-mono">{q.id}</TableCell>
                                            <TableCell>
                                                <Badge variant="destructive">{q.lastResult}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Link href={`/quicklog?q=${q.id}`}>
                                                    <Button size="sm" variant="outline">
                                                        記録
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* ランダムチャレンジ */}
                <Card>
                    <CardHeader>
                        <CardTitle>ランダムチャレンジ</CardTitle>
                        <CardDescription>
                            ランダムに5問を表示します
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>問題ID</TableHead>
                                    <TableHead>分野</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {randomQuestions.map((q) => (
                                    <TableRow key={q.id}>
                                        <TableCell className="font-mono">{q.id}</TableCell>
                                        <TableCell>{q.tagGroup || "-"}</TableCell>
                                        <TableCell>
                                            <Link href={`/quicklog?q=${q.id}`}>
                                                <Button size="sm" variant="outline">
                                                    記録
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
