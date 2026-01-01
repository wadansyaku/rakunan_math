"use client";

import { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, FileDown, Calendar } from "lucide-react";
import { toast } from "sonner";
import { getJstDateString } from "@/lib/date";

export default function ExportPage() {
    const today = getJstDateString();
    const [fromDate, setFromDate] = useState<string>("2022-01-01"); // デフォルトは広く取る
    const [toDate, setToDate] = useState<string>(today);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const params = new URLSearchParams({
                from: fromDate,
                to: toDate,
            });

            const res = await fetch(`/api/export?${params.toString()}`, {
                method: "GET",
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "ダウンロードに失敗しました");
            }

            // CSVファイルをダウンロードさせる
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `rakunan_logs_${fromDate}_to_${toDate}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success("ダウンロードを開始しました");
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "エラーが発生しました");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Download className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold">エクスポート</h1>
                    <p className="text-muted-foreground">
                        学習ログをCSV形式でダウンロード
                    </p>
                </div>
            </div>

            <Card className="max-w-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileDown className="h-5 w-5" />
                        期間を指定してダウンロード
                    </CardTitle>
                    <CardDescription>
                        指定した期間の解答ログを出力します
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="from">開始日</Label>
                            <div className="relative">
                                <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="from"
                                    type="date"
                                    className="pl-9"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="to">終了日</Label>
                            <div className="relative">
                                <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="to"
                                    type="date"
                                    className="pl-9"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            className="w-full"
                            onClick={handleDownload}
                            disabled={isDownloading}
                        >
                            {isDownloading ? (
                                "ダウンロード中..."
                            ) : (
                                <>
                                    <Download className="mr-2 h-4 w-4" />
                                    CSVをダウンロード
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="text-xs text-muted-foreground mt-4">
                        <p>※ 出力される項目:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>実施日 (date)</li>
                            <li>問題ID (questionId)</li>
                            <li>大問タイトル (title)</li>
                            <li>結果 (result)</li>
                            <li>解答時間 (minutes)</li>
                            <li>ミス分類 (missType)</li>
                            <li>メモ (memo)</li>
                            <li>生徒解答 (studentAns)</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
