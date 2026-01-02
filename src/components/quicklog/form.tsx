"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Save, RotateCcw, CheckCircle, XCircle, MinusCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { MISS_TYPES, Result } from "@/lib/constants";
import { getJstDateString } from "@/lib/date";
import { Timer } from "./timer";
import { QuestionSelector, QuestionInfo } from "./question-selector";

const RESULT_OPTIONS: { value: Result; label: string; color: string }[] = [
    { value: "Correct", label: "正解", color: "bg-green-600 hover:bg-green-700" },
    { value: "Partial", label: "部分点", color: "bg-yellow-500 hover:bg-yellow-600 text-black" },
    { value: "Wrong", label: "不正解", color: "bg-red-500 hover:bg-red-600" },
    { value: "Skipped", label: "スキップ", color: "bg-gray-500 hover:bg-gray-600" },
];

export function QuickLogForm() {
    const searchParams = useSearchParams();
    const initialId = searchParams.get("q") || "";

    const [date, setDate] = useState(getJstDateString());
    const [questionId, setQuestionId] = useState(initialId);
    const [result, setResult] = useState<string>("");
    const [missType, setMissType] = useState<string>("");
    const [minutes, setMinutes] = useState("");
    const [memo, setMemo] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const questionIdRef = useRef<HTMLInputElement>(null);

    // 問題選択時のハンドラ
    const handleQuestionSelect = useCallback((q: QuestionInfo) => {
        setQuestionId(q.id);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!questionId || !result) {
            toast.error("問題IDと結果を入力してください");
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch("/api/logs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studyDate: date,
                    questionId,
                    result,
                    missType: missType || null,
                    minutes: minutes ? parseFloat(minutes) : null,
                    memo: memo || null,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "保存に失敗しました");
            }

            toast.success("ログを保存しました", {
                description: `${questionId} - ${result}`,
            });

            // フォームをリセット（日付は維持）
            setQuestionId("");
            setResult("");
            setMissType("");
            setMinutes("");
            setMemo("");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "保存に失敗しました");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setQuestionId("");
        setResult("");
        setMissType("");
        setMinutes("");
        setMemo("");
        questionIdRef.current?.focus();
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">QuickLog</h1>
                <p className="text-muted-foreground">復習記録を素早く入力</p>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>復習ログ入力</CardTitle>
                        <CardDescription>
                            年度→大問→小問を選択、または問題IDを直接入力
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* 日付 */}
                        <div className="grid gap-2">
                            <Label htmlFor="date">日付</Label>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>

                        {/* 問題選択（3ステップUI） */}
                        <QuestionSelector
                            onSelect={handleQuestionSelect}
                            initialId={initialId}
                        />

                        {/* 選択された問題ID表示 */}
                        {questionId && (
                            <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                                <span className="text-sm text-muted-foreground">選択中:</span>
                                <span className="font-mono font-bold text-lg">{questionId}</span>
                            </div>
                        )}

                        {/* 直接入力（折りたたみ可能） */}
                        <details className="text-sm">
                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                IDを直接入力する場合はこちら
                            </summary>
                            <div className="mt-2">
                                <Input
                                    ref={questionIdRef}
                                    placeholder="例: H29-Q4(2)"
                                    value={questionId}
                                    onChange={(e) => setQuestionId(e.target.value)}
                                    autoComplete="off"
                                />
                            </div>
                        </details>

                        {/* 結果 */}
                        <div className="grid gap-2">
                            <Label>結果</Label>
                            <div className="flex gap-2 flex-wrap">
                                {RESULT_OPTIONS.map((opt) => (
                                    <Button
                                        key={opt.value}
                                        type="button"
                                        variant={result === opt.value ? "default" : "outline"}
                                        className={result === opt.value ? opt.color : ""}
                                        onClick={() => setResult(opt.value)}
                                    >
                                        {opt.value === "Correct" && <CheckCircle className="h-4 w-4 mr-1" />}
                                        {opt.value === "Wrong" && <XCircle className="h-4 w-4 mr-1" />}
                                        {opt.value === "Partial" && <MinusCircle className="h-4 w-4 mr-1" />}
                                        {opt.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* ミス分類 */}
                        {(result === "Wrong" || result === "Partial") && (
                            <div className="grid gap-2">
                                <Label htmlFor="missType">ミス分類</Label>
                                <Select value={missType} onValueChange={setMissType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="ミスの種類を選択" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MISS_TYPES.map((type) => (
                                            <SelectItem key={type} value={type}>{type}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* 解答時間 */}
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="minutes">
                                    解答時間 (分)
                                    <span className="text-xs text-muted-foreground font-normal ml-2">※不明なら空欄でOK</span>
                                </Label>
                                <Timer onApply={(m) => setMinutes(m)} />
                            </div>
                            <Input
                                id="minutes"
                                type="number"
                                step="0.1"
                                min="0"
                                placeholder="例: 3.5 (省略可)"
                                value={minutes}
                                onChange={(e) => setMinutes(e.target.value)}
                            />
                        </div>

                        {/* メモ */}
                        <div className="grid gap-2">
                            <Label htmlFor="memo">メモ (任意)</Label>
                            <Input
                                id="memo"
                                placeholder="気づいたことなど"
                                value={memo}
                                onChange={(e) => setMemo(e.target.value)}
                            />
                        </div>

                        {/* ボタン */}
                        <div className="flex gap-2 pt-4">
                            <Button type="submit" disabled={isSubmitting} className="flex-1">
                                <Save className="h-4 w-4 mr-2" /> 保存
                            </Button>
                            <Button type="button" variant="outline" onClick={handleReset}>
                                <RotateCcw className="h-4 w-4 mr-2" /> リセット
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
