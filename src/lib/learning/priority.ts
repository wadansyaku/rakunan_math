import { diffDays } from "@/lib/date";

export interface PriorityQuestion {
    id: string;
    nextReviewDate: string | null;
    lastResult: string | null;
    difficulty: number | null;
    mustSolve: boolean | null;
}

export interface PriorityBreakdown {
    total: number;
    details: {
        daysOverdue: number;
        overdueScore: number;
        wrongScore: number;
        diffScore: number;
        mustScore: number;
    };
}

export function calculatePriority(q: PriorityQuestion): number {
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

export function getPriorityBreakdown(q: PriorityQuestion): PriorityBreakdown {
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
