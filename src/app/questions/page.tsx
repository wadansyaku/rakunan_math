import { getPrismaClient } from "@/lib/prisma";
import { TAG_GROUPS } from "@/lib/constants";
import {
    Card,
    CardContent,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { BookOpen, Search, Filter } from "lucide-react";
import { getJstDateString } from "@/lib/date";
import Link from "next/link";
import { Prisma } from "../../generated/prisma/client";

export const dynamic = "force-dynamic";

interface PageProps {
    searchParams: Promise<{
        year?: string;
        tagGroup?: string;
        q?: string;
        mustSolve?: string;
        status?: string;
        due?: string;
        sort?: string;
    }>;
}

export default async function QuestionsPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const prisma = getPrismaClient();
    const today = getJstDateString();

    const status = params.status || "all";
    const dueOnly = params.due === "true";
    const sort = params.sort || "year";

    const whereCondition: Prisma.QuestionWhereInput = {
        ...(params.year && { year: parseInt(params.year) }),
        ...(params.tagGroup && params.tagGroup !== "all" && { tagGroup: params.tagGroup }),
        ...(params.mustSolve === "true" && { mustSolve: true }),
        ...(params.q && {
            OR: [
                { id: { contains: params.q } },
                { sectionTitle: { contains: params.q } },
                { tag1: { contains: params.q } },
                { tag2: { contains: params.q } },
                { tag3: { contains: params.q } },
            ],
        }),
    };

    if (status === "none") {
        whereCondition.lastResult = null;
    } else if (status !== "all") {
        const statusMap: Record<string, string> = {
            correct: "Correct",
            partial: "Partial",
            wrong: "Wrong",
            skipped: "Skipped",
        };
        whereCondition.lastResult = statusMap[status];
    }

    if (dueOnly) {
        whereCondition.nextReviewDate = { lte: today };
    }

    const orderBy: Prisma.QuestionOrderByWithRelationInput[] =
        sort === "due"
            ? [{ nextReviewDate: "asc" }, { year: "desc" }, { section: "asc" }, { sub: "asc" }]
            : sort === "recent"
                ? [{ lastStudyDate: "desc" }, { year: "desc" }, { section: "asc" }, { sub: "asc" }]
                : sort === "logs"
                    ? [{ logs: { _count: "desc" } }, { year: "desc" }, { section: "asc" }, { sub: "asc" }]
                    : [{ year: "desc" }, { section: "asc" }, { sub: "asc" }];

    const questions = await prisma.question.findMany({
        take: 100,
        orderBy,
        where: whereCondition,
        include: {
            _count: {
                select: { logs: true },
            },
        },
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <BookOpen className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold">問題バンク</h1>
                    <p className="text-muted-foreground">
                        {questions.length}件の問題を表示中（最大100件）
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        検索・フィルタ
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7 items-end">
                            <div className="space-y-2 lg:col-span-2">
                                <Label htmlFor="q">キーワード</Label>
                                <Input
                                    id="q"
                                    name="q"
                                    placeholder="ID, タイトル, タグ..."
                                    defaultValue={params.q || ""}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="year">年度</Label>
                                <Input
                                    id="year"
                                    name="year"
                                    type="number"
                                    placeholder="例: 2024"
                                    defaultValue={params.year || ""}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tagGroup">分野</Label>
                                <Select name="tagGroup" defaultValue={params.tagGroup || "all"}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="全分野" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">全分野</SelectItem>
                                        {TAG_GROUPS.map((group) => (
                                            <SelectItem key={group} value={group}>
                                                {group}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">状態</Label>
                                <Select name="status" defaultValue={status}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="全て" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">全て</SelectItem>
                                        <SelectItem value="none">未実施</SelectItem>
                                        <SelectItem value="correct">Correct</SelectItem>
                                        <SelectItem value="partial">Partial</SelectItem>
                                        <SelectItem value="wrong">Wrong</SelectItem>
                                        <SelectItem value="skipped">Skipped</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mustSolve">必解</Label>
                                <Select name="mustSolve" defaultValue={params.mustSolve || "all"}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="全て" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">全て</SelectItem>
                                        <SelectItem value="true">必解のみ</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="due">復習期限</Label>
                                <Select name="due" defaultValue={dueOnly ? "true" : "all"}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="全て" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">全て</SelectItem>
                                        <SelectItem value="true">期限切れのみ</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sort">並び替え</Label>
                                <Select name="sort" defaultValue={sort}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="年度順" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="year">年度順</SelectItem>
                                        <SelectItem value="recent">最近学習した順</SelectItem>
                                        <SelectItem value="due">復習期限順</SelectItem>
                                        <SelectItem value="logs">ログが多い順</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-2 lg:col-span-1">
                                <div className="flex gap-2">
                                    <Button type="submit" className="w-full">
                                        <Search className="w-4 h-4 mr-2" />
                                        検索
                                    </Button>
                                    <Button asChild type="button" variant="outline" className="shrink-0">
                                        <Link href="/questions">クリア</Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[120px]">問題ID</TableHead>
                                <TableHead className="hidden w-[80px] md:table-cell">年度</TableHead>
                                <TableHead>タイトル / 分野</TableHead>
                                <TableHead className="hidden md:table-cell">タグ</TableHead>
                                <TableHead className="w-[100px]">状態</TableHead>
                                <TableHead className="hidden w-[100px] md:table-cell">難易度</TableHead>
                                <TableHead className="hidden w-[80px] text-right md:table-cell">ログ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {questions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        条件に一致する問題が見つかりませんでした。
                                    </TableCell>
                                </TableRow>
                            ) : (
                                questions.map((q) => (
                                    <TableRow key={q.id}>
                                        <TableCell className="font-mono font-bold text-blue-600 dark:text-blue-400">
                                            {q.id}
                                            {q.mustSolve && (
                                                <span className="block text-[10px] text-red-500 font-bold">
                                                    ★必解
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">{q.year}</TableCell>
                                        <TableCell>
                                            <div className="font-medium truncate">{q.sectionTitle || "-"}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {q.tagGroup || "未分類"}
                                            </div>
                                            <div className="mt-1 flex flex-wrap gap-1 md:hidden">
                                                {q.tag1 && (
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {q.tag1}
                                                    </Badge>
                                                )}
                                                {q.tag2 && (
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {q.tag2}
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="flex gap-1 flex-wrap">
                                                {q.tag1 && <Badge variant="outline" className="text-xs">{q.tag1}</Badge>}
                                                {q.tag2 && <Badge variant="outline" className="text-xs">{q.tag2}</Badge>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {q.lastResult ? (
                                                <Badge
                                                    variant={
                                                        q.lastResult === "Correct"
                                                            ? "default" // shadcnでは 'success' がないため default(黒) またはカスタムクラス
                                                            : q.lastResult === "Wrong"
                                                                ? "destructive"
                                                                : "secondary"
                                                    }
                                                    className={
                                                        q.lastResult === "Correct" ? "bg-green-600 hover:bg-green-700" : ""
                                                    }
                                                >
                                                    {q.lastResult}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="flex text-yellow-500 text-sm">
                                                {"★".repeat(q.difficulty || 0)}
                                                <span className="text-gray-300">
                                                    {"★".repeat(5 - (q.difficulty || 0))}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden text-right text-muted-foreground md:table-cell">
                                            {q._count.logs}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
