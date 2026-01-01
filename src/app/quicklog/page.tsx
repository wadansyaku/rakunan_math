"use client";

import { Suspense, useState, useRef, useEffect, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, RotateCcw, CheckCircle, XCircle, MinusCircle, Play, Pause, Square, Sparkles, Loader2, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useSearchParams } from "next/navigation";

import { MISS_TYPES, Result } from "@/lib/constants";
import { getJstDateString } from "@/lib/date";

// タイマーコンポーネント
function Timer({ onApply }: { onApply: (minutes: string) => void }) {
    const [seconds, setSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setSeconds((s) => s + 1);
            }, 1000);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning]);

    const handleStop = () => {
        setIsRunning(false);
        const mins = (seconds / 60).toFixed(1);
        onApply(mins);
    };

    const formatTime = (totalSeconds: number) => {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    return (
        <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
            <div className="font-mono text-xl font-bold w-16 text-center">
                {formatTime(seconds)}
            </div>
            <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setIsRunning(!isRunning)}
            >
                {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={handleStop}
                disabled={seconds === 0}
            >
                <Square className="h-4 w-4 fill-current" />
            </Button>
            <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => { setIsRunning(false); setSeconds(0); }}
            >
                <RotateCcw className="h-4 w-4" />
            </Button>
        </div>
    );
}

const RESULT_OPTIONS: { value: Result; label: string; color: string }[] = [
    { value: "Correct", label: "正解", color: "bg-green-600 hover:bg-green-700" },
    { value: "Partial", label: "部分点", color: "bg-yellow-500 hover:bg-yellow-600 text-black" },
    { value: "Wrong", label: "不正解", color: "bg-red-500 hover:bg-red-600" },
    { value: "Skipped", label: "スキップ", color: "bg-gray-500 hover:bg-gray-600" },
];

interface QuestionInfo {
    id: string;
    year: number;
    section: number;
    sub: string;
    sectionTitle?: string;
    correctText?: string;
    unit?: string;
    difficulty?: number;
}

// 問題選択コンポーネント（3ステップUI）
function QuestionSelector({
    onSelect,
    initialId
}: {
    onSelect: (q: QuestionInfo) => void;
    initialId?: string;
}) {
    const [allQuestions, setAllQuestions] = useState<QuestionInfo[]>([]);
    const [years, setYears] = useState<number[]>([]);
    const [selectedYear, setSelectedYear] = useState<string>("");
    const [selectedSection, setSelectedSection] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);

    // 問題リストを取得
    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const res = await fetch("/api/questions/list");
                if (res.ok) {
                    const data = await res.json();
                    setAllQuestions(data.questions || []);
                    setYears(data.years || []);

                    // 初期IDがあればパース
                    if (initialId) {
                        const match = initialId.match(/^(\d{4})-Q(\d+)/);
                        if (match) {
                            setSelectedYear(match[1]);
                            setSelectedSection(match[2]);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch questions:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchQuestions();
    }, [initialId]);

    // 選択された年度の大問リスト
    const sections = selectedYear
        ? [...new Set(allQuestions.filter(q => q.year === parseInt(selectedYear)).map(q => q.section))].sort((a, b) => a - b)
        : [];

    // 選択された年度・大問の小問リスト
    const subQuestions = selectedYear && selectedSection
        ? allQuestions.filter(q => q.year === parseInt(selectedYear) && q.section === parseInt(selectedSection))
        : [];

    // セクションタイトルを取得
    const sectionTitle = subQuestions[0]?.sectionTitle || `大問${selectedSection}`;

    if (isLoading) {
        return (
            <div className="space-y-3">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="flex items-center gap-2">
                    <div className="h-10 w-28 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                    <div className="h-10 w-24 bg-muted animate-pulse rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <Label className="text-sm font-medium">問題を選択</Label>

            {/* 年度と大問の選択 */}
            <div className="flex flex-wrap items-center gap-2">
                <Select value={selectedYear} onValueChange={(v) => { setSelectedYear(v); setSelectedSection(""); }}>
                    <SelectTrigger className="w-24 sm:w-28">
                        <SelectValue placeholder="年度" />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map(y => (
                            <SelectItem key={y} value={String(y)}>{y}年</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <ChevronRight className="h-4 w-4 text-muted-foreground" />

                <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedYear}>
                    <SelectTrigger className="w-20 sm:w-24">
                        <SelectValue placeholder="大問" />
                    </SelectTrigger>
                    <SelectContent>
                        {sections.map(s => (
                            <SelectItem key={s} value={String(s)}>Q{s}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {selectedSection && (
                    <span className="text-sm text-muted-foreground truncate max-w-full sm:max-w-[200px]">
                        {sectionTitle}
                    </span>
                )}
            </div>

            {/* 小問ボタングリッド */}
            {subQuestions.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 p-3 bg-muted/30 rounded-lg">
                    {subQuestions.map(q => (
                        <Button
                            key={q.id}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="font-mono text-xs h-10 flex flex-col items-center justify-center hover:bg-primary hover:text-primary-foreground"
                            onClick={() => onSelect(q)}
                        >
                            <span>{q.sub}</span>
                            {q.difficulty && (
                                <span className="text-[10px] text-yellow-500">
                                    {"★".repeat(Math.min(q.difficulty, 3))}
                                </span>
                            )}
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
}

function QuickLogForm() {
    const searchParams = useSearchParams();
    const initialId = searchParams.get("q") || "";

    const [date, setDate] = useState(getJstDateString());
    const [questionId, setQuestionId] = useState(initialId);
    const [result, setResult] = useState<string>("");
    const [missType, setMissType] = useState<string>("");
    const [minutes, setMinutes] = useState("");
    const [memo, setMemo] = useState("");
    const [studentAns, setStudentAns] = useState("");
    const [questionInfo, setQuestionInfo] = useState<QuestionInfo | null>(null);
    const [autoJudge, setAutoJudge] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // AI分析用
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

    const questionIdRef = useRef<HTMLInputElement>(null);

    // 問題選択時のハンドラ
    const handleQuestionSelect = useCallback((q: QuestionInfo) => {
        setQuestionId(q.id);
        setQuestionInfo(q);
        // 結果入力にフォーカス
    }, []);

    // 解答の自動判定
    useEffect(() => {
        if (studentAns && questionInfo?.correctText) {
            const normalized = (s: string) => s.trim().replace(/\s+/g, "");
            const isMatch = normalized(studentAns) === normalized(questionInfo.correctText);
            setAutoJudge(isMatch ? "MATCH" : "NO");
        } else {
            setAutoJudge(null);
        }
    }, [studentAns, questionInfo]);

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
                    studentAns: studentAns || null,
                    autoJudge,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "保存に失敗しました");
            }

            toast.success("ログを保存しました", {
                description: `${questionId} - ${result}`,
            });

            // フォームをリセット（日付と年度選択は維持）
            setQuestionId("");
            setResult("");
            setMissType("");
            setMinutes("");
            setMemo("");
            setStudentAns("");
            setQuestionInfo(null);
            setAutoJudge(null);
            setAiAnalysis(null);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "保存に失敗しました");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAIAnalyze = async () => {
        if (!questionId || !result) {
            toast.error("分析には問題IDと結果の入力が必要です");
            return;
        }

        setIsAnalyzing(true);
        setAiAnalysis(null);

        try {
            const res = await fetch("/api/ai/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    questionId,
                    result,
                    missType,
                    memo,
                    correctText: questionInfo?.correctText,
                    studentAns,
                }),
            });

            if (res.status === 503) {
                toast.error("AI機能は現在利用できません");
                return;
            }

            if (!res.ok) throw new Error("分析に失敗しました");

            const data = await res.json();
            setAiAnalysis(data.analysis);
            toast.success("分析が完了しました");
        } catch (error) {
            console.error(error);
            toast.error("エラーが発生しました");
            setAiAnalysis(`
**（デモ応答）**
AI機能の設定が完了していません。

1. **原因分析**: ケアレスミスの可能性
2. **改善アクション**: 計算の途中式を丁寧に書く
3. **励まし**: 次はきっと解けます！
            `);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleReset = () => {
        setQuestionId("");
        setResult("");
        setMissType("");
        setMinutes("");
        setMemo("");
        setStudentAns("");
        setQuestionInfo(null);
        setAutoJudge(null);
        setAiAnalysis(null);
        questionIdRef.current?.focus();
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">QuickLog</h1>
                <p className="text-muted-foreground">解答を素早く記録</p>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>解答ログ入力</CardTitle>
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
                                {questionInfo?.correctText && (
                                    <Badge variant="outline" className="ml-auto text-green-600 border-green-300">
                                        正答: {questionInfo.correctText}{questionInfo.unit && ` (${questionInfo.unit})`}
                                    </Badge>
                                )}
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
                                    placeholder="例: 2022-Q4(2)"
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
                                <Label htmlFor="minutes">解答時間 (分)</Label>
                                <Timer onApply={(m) => setMinutes(m)} />
                            </div>
                            <Input
                                id="minutes"
                                type="number"
                                step="0.1"
                                min="0"
                                placeholder="例: 3.5"
                                value={minutes}
                                onChange={(e) => setMinutes(e.target.value)}
                            />
                        </div>

                        {/* 生徒解答 */}
                        <div className="grid gap-2">
                            <Label htmlFor="studentAns">生徒の解答 (任意)</Label>
                            <div className="flex gap-2 items-center">
                                <Input
                                    id="studentAns"
                                    placeholder="生徒が書いた答え"
                                    value={studentAns}
                                    onChange={(e) => setStudentAns(e.target.value)}
                                />
                                {autoJudge && (
                                    <Badge variant={autoJudge === "MATCH" ? "default" : "destructive"}>
                                        {autoJudge}
                                    </Badge>
                                )}
                            </div>
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

                        {/* AI分析 */}
                        <div className="pt-2">
                            {!aiAnalysis && (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    className="w-full"
                                    onClick={handleAIAnalyze}
                                    disabled={isAnalyzing || !questionId}
                                >
                                    {isAnalyzing ? (
                                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> 分析中...</>
                                    ) : (
                                        <><Sparkles className="h-4 w-4 mr-2 text-purple-500" /> AIで原因と対策を分析</>
                                    )}
                                </Button>
                            )}
                            {aiAnalysis && (
                                <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900 mt-2">
                                    <CardHeader className="py-3">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-purple-800 dark:text-purple-300">
                                            <Sparkles className="h-4 w-4" /> AI分析
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm prose dark:prose-invert max-w-none py-3">
                                        <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                                    </CardContent>
                                </Card>
                            )}
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

export default function QuickLogPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="animate-spin" /></div>}>
            <QuickLogForm />
        </Suspense>
    );
}
