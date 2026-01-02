"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ChevronRight } from "lucide-react";

export interface QuestionInfo {
    id: string;
    year: number;
    section: number;
    sub: string;
    sectionTitle?: string;
    correctText?: string;
    unit?: string;
    difficulty?: number;
}

interface QuestionSelectorProps {
    onSelect: (q: QuestionInfo) => void;
    initialId?: string;
}

export function QuestionSelector({ onSelect, initialId }: QuestionSelectorProps) {
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
