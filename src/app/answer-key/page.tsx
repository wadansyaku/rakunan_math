"use client";

import { useState, useEffect } from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Key, Save, ChevronRight, Loader2, Check } from "lucide-react";

interface Question {
    id: string;
    year: number;
    section: number;
    sub: string;
    sectionTitle?: string;
    correctText?: string;
    unit?: string;
    answerNote?: string;
    difficulty?: number;
}

interface ApiResponse {
    questions: Question[];
    years: number[];
    hierarchy: Record<number, Record<number, Question[]>>;
}

export default function AnswerKeyPage() {
    const [data, setData] = useState<ApiResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState<string>("");
    const [selectedSection, setSelectedSection] = useState<string>("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<{
        correctText: string;
        unit: string;
        answerNote: string;
    }>({ correctText: "", unit: "", answerNote: "" });
    const [isSaving, setIsSaving] = useState(false);

    // データ取得
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/questions/list");
                if (res.ok) {
                    const result = await res.json();
                    setData(result);
                    // デフォルトで最新年度を選択
                    if (result.years.length > 0) {
                        setSelectedYear(String(result.years[0]));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
                toast.error("データの取得に失敗しました");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // 選択された年度の大問リスト
    const sections = selectedYear && data
        ? [...new Set(data.questions.filter(q => q.year === parseInt(selectedYear)).map(q => q.section))].sort((a, b) => a - b)
        : [];

    // 選択された年度・大問の小問リスト
    const currentQuestions = selectedYear && selectedSection && data
        ? data.questions.filter(q => q.year === parseInt(selectedYear) && q.section === parseInt(selectedSection))
        : [];

    const sectionTitle = currentQuestions[0]?.sectionTitle || "";

    // 編集開始
    const startEdit = (q: Question) => {
        setEditingId(q.id);
        setEditValues({
            correctText: q.correctText || "",
            unit: q.unit || "",
            answerNote: q.answerNote || "",
        });
    };

    // 保存
    const handleSave = async (questionId: string) => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/questions/answer", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    questionId,
                    ...editValues,
                }),
            });

            if (!res.ok) throw new Error("更新に失敗しました");

            // ローカル状態を更新
            if (data) {
                setData({
                    ...data,
                    questions: data.questions.map(q =>
                        q.id === questionId
                            ? { ...q, ...editValues }
                            : q
                    ),
                });
            }

            setEditingId(null);
            toast.success("保存しました");
        } catch (error) {
            console.error(error);
            toast.error("保存に失敗しました");
        } finally {
            setIsSaving(false);
        }
    };

    // 統計情報
    const stats = data ? {
        total: data.questions.length,
        withAnswer: data.questions.filter(q => q.correctText).length,
    } : { total: 0, withAnswer: 0 };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Key className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold">正答管理</h1>
                    <p className="text-muted-foreground">
                        問題の正答を登録・編集
                    </p>
                </div>
                <Badge variant="outline" className="ml-auto">
                    {stats.withAnswer} / {stats.total} 登録済み
                </Badge>
            </div>

            {/* セレクター */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">問題を選択</CardTitle>
                    <CardDescription>年度と大問を選んで正答を編集</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-3 items-center">
                        <div className="grid gap-2">
                            <Label>年度</Label>
                            <Select
                                value={selectedYear}
                                onValueChange={(v) => { setSelectedYear(v); setSelectedSection(""); }}
                            >
                                <SelectTrigger className="w-28">
                                    <SelectValue placeholder="選択" />
                                </SelectTrigger>
                                <SelectContent>
                                    {data?.years.map(y => (
                                        <SelectItem key={y} value={String(y)}>{y}年</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <ChevronRight className="h-4 w-4 text-muted-foreground mt-6" />

                        <div className="grid gap-2">
                            <Label>大問</Label>
                            <Select
                                value={selectedSection}
                                onValueChange={setSelectedSection}
                                disabled={!selectedYear}
                            >
                                <SelectTrigger className="w-24">
                                    <SelectValue placeholder="選択" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sections.map(s => (
                                        <SelectItem key={s} value={String(s)}>Q{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {sectionTitle && (
                            <span className="text-sm text-muted-foreground mt-6 truncate max-w-[300px]">
                                {sectionTitle}
                            </span>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 問題リスト */}
            {currentQuestions.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {selectedYear}年 Q{selectedSection} の問題
                        </CardTitle>
                        <CardDescription>
                            {currentQuestions.filter(q => q.correctText).length} / {currentQuestions.length} 件の正答が登録済み
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {currentQuestions.map((q) => (
                            <div
                                key={q.id}
                                className={`p-4 border rounded-lg transition-colors ${editingId === q.id ? "bg-muted/50 border-primary" : "hover:bg-muted/30"
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* 問題ID */}
                                    <div className="w-24 flex-shrink-0">
                                        <span className="font-mono font-bold text-sm">{q.sub}</span>
                                        {q.difficulty && (
                                            <div className="text-yellow-500 text-xs mt-1">
                                                {"★".repeat(q.difficulty)}
                                            </div>
                                        )}
                                    </div>

                                    {/* 正答エリア */}
                                    {editingId === q.id ? (
                                        <div className="flex-1 space-y-3">
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="col-span-2">
                                                    <Label className="text-xs">正答</Label>
                                                    <Input
                                                        value={editValues.correctText}
                                                        onChange={(e) => setEditValues({ ...editValues, correctText: e.target.value })}
                                                        placeholder="正答を入力"
                                                        className="font-mono"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">単位</Label>
                                                    <Input
                                                        value={editValues.unit}
                                                        onChange={(e) => setEditValues({ ...editValues, unit: e.target.value })}
                                                        placeholder="cm等"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="text-xs">メモ</Label>
                                                <Input
                                                    value={editValues.answerNote}
                                                    onChange={(e) => setEditValues({ ...editValues, answerNote: e.target.value })}
                                                    placeholder="備考があれば"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleSave(q.id)}
                                                    disabled={isSaving}
                                                >
                                                    {isSaving ? (
                                                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                    ) : (
                                                        <Save className="h-4 w-4 mr-1" />
                                                    )}
                                                    保存
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setEditingId(null)}
                                                >
                                                    キャンセル
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className="flex-1 cursor-pointer"
                                            onClick={() => startEdit(q)}
                                        >
                                            {q.correctText ? (
                                                <div className="flex items-center gap-2">
                                                    <Check className="h-4 w-4 text-green-500" />
                                                    <span className="font-mono font-bold text-green-600">
                                                        {q.correctText}
                                                    </span>
                                                    {q.unit && (
                                                        <span className="text-muted-foreground">
                                                            ({q.unit})
                                                        </span>
                                                    )}
                                                    {q.answerNote && (
                                                        <span className="text-xs text-muted-foreground ml-2">
                                                            {q.answerNote}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">
                                                    クリックして正答を入力...
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {!selectedSection && selectedYear && (
                <Card className="border-dashed">
                    <CardContent className="py-12 text-center text-muted-foreground">
                        大問を選択してください
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
