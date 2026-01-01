import { NextRequest, NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/prisma";

interface QuestionData {
    id: string;
    year: number;
    examType?: string | null;
    section: number;
    sub: string;
    sectionTitle?: string | null;
    tag1?: string | null;
    tag2?: string | null;
    tag3?: string | null;
    tagGroup?: string | null;
    difficulty?: number | null;
    estMinutes?: number | null;
    points?: number | null;
    mustSolve?: boolean | string | null;
    phase?: string | null;
    problemType?: string | null;
    sourceUrl?: string | null;
    fieldKey?: string | null;
    fieldName?: string | null;
    fieldType?: string | null;
    correctText?: string | null;
    unit?: string | null;
    answerNote?: string | null;
}

interface AnswerKeyData {
    questionId: string;
    correctText?: string | null;
    unit?: string | null;
}

interface AnswerLogData {
    studyDate: string;
    questionId: string;
    result: string;
    missType?: string | null;
    minutes?: number | null;
    cause?: string | null;
    action?: string | null;
    memo?: string | null;
    studentAns?: string | null;
    correctText?: string | null;
    autoJudge?: string | null;
}

interface ImportBody {
    questions: QuestionData[];
    answerKey: AnswerKeyData[];
    answerLog: AnswerLogData[];
}

export async function POST(request: NextRequest) {
    try {
        const prisma = getPrismaClient();
        const body: ImportBody = await request.json();
        const errors: string[] = [];
        const counts = {
            questions: 0,
            answerKey: 0,
            answerLog: 0,
        };

        // Questions のインポート
        if (body.questions && body.questions.length > 0) {
            for (const q of body.questions) {
                if (!q.id || q.id === "") {
                    errors.push(`問題IDが空のレコードをスキップしました`);
                    continue;
                }

                try {
                    await prisma.question.upsert({
                        where: { id: String(q.id) },
                        update: {
                            year: Number(q.year) || 0,
                            examType: q.examType ? String(q.examType) : null,
                            section: Number(q.section) || 0,
                            sub: String(q.sub || ""),
                            sectionTitle: q.sectionTitle ? String(q.sectionTitle) : null,
                            tag1: q.tag1 ? String(q.tag1) : null,
                            tag2: q.tag2 ? String(q.tag2) : null,
                            tag3: q.tag3 ? String(q.tag3) : null,
                            tagGroup: q.tagGroup ? String(q.tagGroup) : null,
                            difficulty: q.difficulty ? Number(q.difficulty) : null,
                            estMinutes: q.estMinutes ? Number(q.estMinutes) : null,
                            points: q.points ? Number(q.points) : null,
                            mustSolve: q.mustSolve === true || q.mustSolve === "true",
                            phase: q.phase ? String(q.phase) : null,
                            problemType: q.problemType ? String(q.problemType) : null,
                            sourceUrl: q.sourceUrl ? String(q.sourceUrl) : null,
                            fieldKey: q.fieldKey ? String(q.fieldKey) : null,
                            fieldName: q.fieldName ? String(q.fieldName) : null,
                            fieldType: q.fieldType ? String(q.fieldType) : null,
                            correctText: q.correctText ? String(q.correctText) : null,
                            unit: q.unit ? String(q.unit) : null,
                            answerNote: q.answerNote ? String(q.answerNote) : null,
                        },
                        create: {
                            id: String(q.id),
                            year: Number(q.year) || 0,
                            examType: q.examType ? String(q.examType) : null,
                            section: Number(q.section) || 0,
                            sub: String(q.sub || ""),
                            sectionTitle: q.sectionTitle ? String(q.sectionTitle) : null,
                            tag1: q.tag1 ? String(q.tag1) : null,
                            tag2: q.tag2 ? String(q.tag2) : null,
                            tag3: q.tag3 ? String(q.tag3) : null,
                            tagGroup: q.tagGroup ? String(q.tagGroup) : null,
                            difficulty: q.difficulty ? Number(q.difficulty) : null,
                            estMinutes: q.estMinutes ? Number(q.estMinutes) : null,
                            points: q.points ? Number(q.points) : null,
                            mustSolve: q.mustSolve === true || q.mustSolve === "true",
                            phase: q.phase ? String(q.phase) : null,
                            problemType: q.problemType ? String(q.problemType) : null,
                            sourceUrl: q.sourceUrl ? String(q.sourceUrl) : null,
                            fieldKey: q.fieldKey ? String(q.fieldKey) : null,
                            fieldName: q.fieldName ? String(q.fieldName) : null,
                            fieldType: q.fieldType ? String(q.fieldType) : null,
                            correctText: q.correctText ? String(q.correctText) : null,
                            unit: q.unit ? String(q.unit) : null,
                            answerNote: q.answerNote ? String(q.answerNote) : null,
                        },
                    });
                    counts.questions++;
                } catch (err) {
                    errors.push(`問題 ${q.id} のインポートに失敗: ${err}`);
                }
            }
        }

        // AnswerKey のインポート（既存のQuestionのcorrectTextを更新）
        if (body.answerKey && body.answerKey.length > 0) {
            for (const a of body.answerKey) {
                if (!a.questionId) continue;

                try {
                    const question = await prisma.question.findUnique({
                        where: { id: String(a.questionId) },
                    });

                    if (question) {
                        await prisma.question.update({
                            where: { id: String(a.questionId) },
                            data: {
                                correctText: a.correctText ? String(a.correctText) : null,
                                unit: a.unit ? String(a.unit) : null,
                            },
                        });
                        counts.answerKey++;
                    } else {
                        errors.push(`問題 ${a.questionId} が見つかりません`);
                    }
                } catch (err) {
                    errors.push(`正答 ${a.questionId} の更新に失敗: ${err}`);
                }
            }
        }

        // AnswerLog のインポート
        if (body.answerLog && body.answerLog.length > 0) {
            for (const l of body.answerLog) {
                if (!l.questionId || !l.studyDate || !l.result) continue;

                try {
                    // 問題の存在確認
                    const question = await prisma.question.findUnique({
                        where: { id: String(l.questionId) },
                    });

                    if (!question) {
                        errors.push(`問題 ${l.questionId} が見つかりません（ログ）`);
                        continue;
                    }

                    await prisma.answerLog.create({
                        data: {
                            studyDate: String(l.studyDate),
                            questionId: String(l.questionId),
                            result: String(l.result),
                            missType: l.missType ? String(l.missType) : null,
                            minutes: l.minutes ? Number(l.minutes) : null,
                            cause: l.cause ? String(l.cause) : null,
                            action: l.action ? String(l.action) : null,
                            memo: l.memo ? String(l.memo) : null,
                            studentAns: l.studentAns ? String(l.studentAns) : null,
                            correctText: l.correctText ? String(l.correctText) : null,
                            autoJudge: l.autoJudge ? String(l.autoJudge) : null,
                        },
                    });
                    counts.answerLog++;
                } catch (err) {
                    errors.push(`ログのインポートに失敗: ${err}`);
                }
            }
        }

        return NextResponse.json({
            success: errors.length === 0,
            counts,
            errors,
        });
    } catch (error) {
        console.error("Failed to import:", error);
        return NextResponse.json(
            { error: "インポートに失敗しました" },
            { status: 500 }
        );
    }
}
