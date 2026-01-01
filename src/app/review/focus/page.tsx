"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, CheckCircle, XCircle, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { getJstDateString } from "@/lib/date";

interface Question {
    id: string;
    sectionTitle: string | null;
    tagGroup: string | null;
    difficulty: number | null;
    correctText: string | null;
    unit: string | null;
    answerNote: string | null;
}

export default function FocusModePage() {
    const router = useRouter();
    const [queue, setQueue] = useState<Question[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [showAnswer, setShowAnswer] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // ログ用state
    const [result, setResult] = useState<string>("");
    const [minutes, setMinutes] = useState("");
    const [memo, setMemo] = useState("");
    const [missType, setMissType] = useState("");

    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        fetchDueQuestions();
    }, []);

    const fetchDueQuestions = async () => {
        try {
            // Reviewページと同じAPIがあれば良いが、今回はclient componentでprisma呼べないので
            // 新たにAPIを作るか、server actionにする必要がある。
            // 簡易的に existing API を拡張するか、review page のロジックをAPI化するのが正攻法。
            // ここでは取り急ぎ /api/questions/due を作るか、既存のsearchを使うには無理がある。
            // -> 時間節約のため、server componentからpropsで渡す構成にしたいが、
            //    Focus Modeは対話的なのでClient Componentが適している。
            //    よって、API Route `/api/review/list` を作成するのがベストだが、
            //    今回は仮に「全件取得してクライアントでフィルタ」は重すぎる。
            //    -> 実装計画にはなかったが `/api/review/due` を作る。
            //    もし手間なら、一旦モックか、既存APIの params 追加で対応。

            // 妥協策: レビューリストAPIを実装していないので、
            // FocusModePage自体はServer Componentでデータを取得し、
            // Client Component (FocusModeClient) に渡す形にするのがNext.js流儀。
            // しかし今回は "use client" で書いてしまったので、あとでリファクタするか、
            // ページ内でデータ取得APIを追加する。

            // 今回はページ内でデータ取得API (GET /api/review/due) を呼ぶ形にする。
            // まだないので、このステップの後にAPIを作る。
            const res = await fetch("/api/review/due");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setQueue(data.questions);
            if (data.questions.length > 0) {
                setCurrentQuestion(data.questions[0]);
            }
        } catch (error) {
            console.error(error);
            toast.error("問題の取得に失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    const handleNext = () => {
        // 次の問題へ
        const nextQueue = queue.slice(1);
        setQueue(nextQueue);
        setCurrentQuestion(nextQueue.length > 0 ? nextQueue[0] : null);

        // 状態リセット
        setShowAnswer(false);
        setResult("");
        setMinutes("");
        setMemo("");
        setMissType("");
        setAiAnalysis(null);
    };

    const handleSave = async (selectedResult: string) => {
        setResult(selectedResult);
        if (!currentQuestion) return;

        try {
            await fetch("/api/logs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studyDate: getJstDateString(),
                    questionId: currentQuestion.id,
                    result: selectedResult,
                    minutes: minutes ? parseFloat(minutes) : null,
                    memo: memo || null,
                    missType: missType || null
                }),
            });

            // AI分析（Wrongの場合）
            if (selectedResult === "Wrong" || selectedResult === "Partial") {
                // 自動でAI分析呼ぶか、ボタン表示するか。UX的にはボタン押下が無難。
            }

            toast.success("記録しました");

            // 正解なら次へ自動遷移、等のUXもありだが、
            // メモ書きたい場合もあるので手動「次へ」ボタンに任せる
        } catch {
            toast.error("保存失敗");
        }
    };

    // AI分析
    const handleAnalyze = async () => {
        if (!currentQuestion || !result) return;
        setIsAnalyzing(true);
        try {
            const res = await fetch("/api/ai/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    questionId: currentQuestion.id,
                    result,
                    missType,
                    memo,
                    correctText: currentQuestion.correctText,
                }),
            });
            const data = await res.json();
            setAiAnalysis(data.analysis || "分析できませんでした");
        } catch {
            setAiAnalysis("分析エラー"); // デモ環境ならAPI側でデモ返すはず
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;
    }

    if (!currentQuestion) {
        return (
            <div className="text-center py-20 space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <h2 className="text-2xl font-bold">復習完了！</h2>
                <p className="text-muted-foreground">今日の分の復習はすべて終わりました。</p>
                <Button onClick={() => router.push("/")}>ホームに戻る</Button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-20">
            {/* ヘッダー */}
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold">集中モード</h1>
                <div className="text-sm text-muted-foreground">残り: {queue.length}問</div>
            </div>

            {/* 問題カード */}
            <Card className="min-h-[300px] flex flex-col justify-center items-center text-center p-6 relative overflow-hidden">
                <div className="absolute top-4 left-4 text-xs font-mono text-muted-foreground">
                    {currentQuestion.id}
                </div>
                {currentQuestion.tagGroup && (
                    <Badge variant="secondary" className="absolute top-4 right-4">
                        {currentQuestion.tagGroup}
                    </Badge>
                )}

                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold">
                        {currentQuestion.sectionTitle || "タイトルなし"}
                    </h2>
                    <div className="flex gap-2 justify-center">
                        {currentQuestion.difficulty && (
                            <span className="text-yellow-500">
                                {"★".repeat(currentQuestion.difficulty)}
                            </span>
                        )}
                    </div>
                </div>

                {!showAnswer && (
                    <Button
                        size="lg"
                        className="mt-8"
                        onClick={() => setShowAnswer(true)}
                    >
                        <Eye className="mr-2 h-4 w-4" />
                        答えを見る
                    </Button>
                )}
            </Card>

            {/* 解答・記録エリア */}
            {showAnswer && (
                <div className="space-y-6 animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <Card className="bg-muted/50">
                        <CardHeader>
                            <CardTitle className="text-lg">正答</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="text-2xl font-bold text-green-700 font-mono">
                                {currentQuestion.correctText}
                                <span className="text-sm ml-2 font-normal text-muted-foreground">
                                    {currentQuestion.unit}
                                </span>
                            </div>
                            {currentQuestion.answerNote && (
                                <p className="text-sm text-muted-foreground">
                                    {currentQuestion.answerNote}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* 結果入力 */}
                    {!result ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Button
                                size="lg"
                                className="bg-green-600 hover:bg-green-700 h-20 text-lg"
                                onClick={() => handleSave("Correct")}
                            >
                                <CheckCircle className="mr-2 h-6 w-6" />
                                正解
                            </Button>
                            <Button
                                size="lg"
                                variant="destructive"
                                className="h-20 text-lg"
                                onClick={() => handleSave("Wrong")}
                            >
                                <XCircle className="mr-2 h-6 w-6" />
                                不正解
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex flex-col gap-3 rounded-lg border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2 font-bold">
                                    結果:
                                    <Badge variant={result === "Correct" ? "default" : "destructive"}>
                                        {result}
                                    </Badge>
                                </div>
                                <Button onClick={handleNext} className="w-full sm:w-auto">
                                    次の問題へ <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>

                            {/* AI分析（誤答時） */}
                            {(result === "Wrong" || result === "Partial") && !aiAnalysis && (
                                <Button
                                    variant="outline"
                                    className="w-full text-purple-600 border-purple-200 hover:bg-purple-50"
                                    onClick={handleAnalyze}
                                    disabled={isAnalyzing}
                                >
                                    {isAnalyzing ? <Loader2 className="animate-spin mr-2" /> : <div className="mr-2">✨</div>}
                                    AIアドバイスをもらう
                                </Button>
                            )}

                            {aiAnalysis && (
                                <Card className="bg-purple-50 p-4 prose text-sm">
                                    <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                                </Card>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
