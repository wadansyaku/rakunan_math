/**
 * Spaced Repetition (SM-2 Simplified) Logic
 * 
 * 復習間隔計算の一元管理モジュール
 */

import { addDays } from "@/lib/date";

export type ReviewResult = "Correct" | "Partial" | "Wrong" | "Skipped";

export interface ReviewInput {
    currentInterval: number | null;
    result: ReviewResult;
    studyDate: string;
}

export interface ReviewOutput {
    newInterval: number;
    nextReviewDate: string;
}

/**
 * SM-2簡易版アルゴリズムで次回復習日を計算
 * 
 * - Correct: 間隔を2倍（最大30日）
 * - Wrong: 間隔を1日にリセット
 * - Partial: 間隔を1.2倍（最低1日）
 * - Skipped: 間隔維持
 */
export function calculateNextReview(input: ReviewInput): ReviewOutput {
    const currentInterval = input.currentInterval || 1;
    let newInterval: number;

    switch (input.result) {
        case "Correct":
            newInterval = Math.min(currentInterval * 2, 30);
            break;
        case "Wrong":
            newInterval = 1;
            break;
        case "Partial":
            newInterval = Math.max(1, Math.floor(currentInterval * 1.2));
            break;
        case "Skipped":
        default:
            newInterval = currentInterval;
            break;
    }

    return {
        newInterval,
        nextReviewDate: addDays(input.studyDate, newInterval),
    };
}
