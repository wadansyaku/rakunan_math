"use client";

import { useState, useCallback } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

interface PreviewData {
    questions: Array<Record<string, unknown>>;
    answerKey: Array<Record<string, unknown>>;
    answerLog: Array<Record<string, unknown>>;
}

interface ImportResult {
    success: boolean;
    counts: {
        questions: number;
        answerKey: number;
        answerLog: number;
    };
    errors: string[];
}

export default function ImportPage() {
    const [files, setFiles] = useState<{ [key: string]: File | null }>({
        questions: null,
        answerKey: null,
        answerLog: null,
    });
    const [preview, setPreview] = useState<PreviewData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);

    const handleFileChange = useCallback(
        (type: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0] || null;
            setFiles((prev) => ({ ...prev, [type]: file }));
            setPreview(null);
            setImportResult(null);
        },
        []
    );

    const handlePreview = async () => {
        if (!files.questions && !files.answerKey && !files.answerLog) {
            toast.error("ファイルを選択してください");
            return;
        }

        setIsLoading(true);

        try {
            const formData = new FormData();
            if (files.questions) formData.append("questions", files.questions);
            if (files.answerKey) formData.append("answerKey", files.answerKey);
            if (files.answerLog) formData.append("answerLog", files.answerLog);

            const res = await fetch("/api/import/preview", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                throw new Error("プレビューの生成に失敗しました");
            }

            const data = await res.json();
            setPreview(data);
            toast.success("プレビューを生成しました");
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "エラーが発生しました"
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleImport = async () => {
        if (!preview) return;

        setIsLoading(true);

        try {
            const res = await fetch("/api/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(preview),
            });

            if (!res.ok) {
                throw new Error("インポートに失敗しました");
            }

            const result: ImportResult = await res.json();
            setImportResult(result);

            if (result.success) {
                toast.success("インポートが完了しました", {
                    description: `問題: ${result.counts.questions}件, 正答: ${result.counts.answerKey}件, ログ: ${result.counts.answerLog}件`,
                });
            } else {
                toast.error("一部のデータでエラーが発生しました");
            }
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "エラーが発生しました"
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Upload className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold">インポート</h1>
                    <p className="text-muted-foreground">
                        CSVファイルからデータを取り込み
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Questions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5" />
                            Questions.csv
                        </CardTitle>
                        <CardDescription>問題バンクデータ</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange("questions")}
                            className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                        />
                        {files.questions && (
                            <Badge variant="secondary" className="mt-2">
                                {files.questions.name}
                            </Badge>
                        )}
                    </CardContent>
                </Card>

                {/* AnswerKey */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5" />
                            AnswerKey.csv
                        </CardTitle>
                        <CardDescription>正答データ</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange("answerKey")}
                            className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                        />
                        {files.answerKey && (
                            <Badge variant="secondary" className="mt-2">
                                {files.answerKey.name}
                            </Badge>
                        )}
                    </CardContent>
                </Card>

                {/* AnswerLog */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5" />
                            AnswerLog.csv
                        </CardTitle>
                        <CardDescription>解答ログデータ</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange("answerLog")}
                            className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                        />
                        {files.answerLog && (
                            <Badge variant="secondary" className="mt-2">
                                {files.answerLog.name}
                            </Badge>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* アクションボタン */}
            <div className="flex gap-4">
                <Button onClick={handlePreview} disabled={isLoading}>
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                    )}
                    プレビュー
                </Button>
                {preview && (
                    <Button onClick={handleImport} disabled={isLoading} variant="default">
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Upload className="h-4 w-4 mr-2" />
                        )}
                        インポート実行
                    </Button>
                )}
            </div>

            {/* 結果表示 */}
            {importResult && (
                <Card
                    className={
                        importResult.success
                            ? "border-green-500/50 bg-green-50 dark:bg-green-950/20"
                            : "border-orange-500/50 bg-orange-50 dark:bg-orange-950/20"
                    }
                >
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {importResult.success ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                                <AlertTriangle className="h-5 w-5 text-orange-600" />
                            )}
                            インポート結果
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <p>問題: {importResult.counts.questions}件</p>
                            <p>正答: {importResult.counts.answerKey}件</p>
                            <p>ログ: {importResult.counts.answerLog}件</p>
                            {importResult.errors.length > 0 && (
                                <div className="mt-4">
                                    <p className="font-medium text-orange-600">エラー:</p>
                                    <ul className="list-disc list-inside text-sm">
                                        {importResult.errors.map((err, i) => (
                                            <li key={i}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* プレビュー */}
            {preview && (
                <Card>
                    <CardHeader>
                        <CardTitle>プレビュー</CardTitle>
                        <CardDescription>
                            インポート前にデータを確認してください
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="questions">
                            <TabsList>
                                <TabsTrigger value="questions">
                                    Questions ({preview.questions.length})
                                </TabsTrigger>
                                <TabsTrigger value="answerKey">
                                    AnswerKey ({preview.answerKey.length})
                                </TabsTrigger>
                                <TabsTrigger value="answerLog">
                                    AnswerLog ({preview.answerLog.length})
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="questions" className="mt-4">
                                <div className="max-h-96 overflow-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>問題ID</TableHead>
                                                <TableHead>年度</TableHead>
                                                <TableHead>大問</TableHead>
                                                <TableHead>小問</TableHead>
                                                <TableHead>タイトル</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {preview.questions.slice(0, 20).map((q, i) => (
                                                <TableRow key={i}>
                                                    <TableCell className="font-mono">
                                                        {String(q.id || "")}
                                                    </TableCell>
                                                    <TableCell>{String(q.year || "")}</TableCell>
                                                    <TableCell>{String(q.section || "")}</TableCell>
                                                    <TableCell>{String(q.sub || "")}</TableCell>
                                                    <TableCell>{String(q.sectionTitle || "")}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>

                            <TabsContent value="answerKey" className="mt-4">
                                <div className="max-h-96 overflow-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>問題ID</TableHead>
                                                <TableHead>正答</TableHead>
                                                <TableHead>単位</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {preview.answerKey.slice(0, 20).map((a, i) => (
                                                <TableRow key={i}>
                                                    <TableCell className="font-mono">
                                                        {String(a.questionId || "")}
                                                    </TableCell>
                                                    <TableCell>{String(a.correctText || "")}</TableCell>
                                                    <TableCell>{String(a.unit || "")}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>

                            <TabsContent value="answerLog" className="mt-4">
                                <div className="max-h-96 overflow-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>日付</TableHead>
                                                <TableHead>問題ID</TableHead>
                                                <TableHead>結果</TableHead>
                                                <TableHead>時間(分)</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {preview.answerLog.slice(0, 20).map((l, i) => (
                                                <TableRow key={i}>
                                                    <TableCell>{String((l as Record<string, unknown>).studyDate || "")}</TableCell>
                                                    <TableCell className="font-mono">
                                                        {String(l.questionId || "")}
                                                    </TableCell>
                                                    <TableCell>{String(l.result || "")}</TableCell>
                                                    <TableCell>{String(l.minutes || "")}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
