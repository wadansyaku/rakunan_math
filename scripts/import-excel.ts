/**
 * Excel/CSVから抽出したデータをDBにインポートするスクリプト
 * 
 * Usage: npm run import:excel
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient({});

interface QuestionRow {
    年度: string;
    試験区分: string;
    大問: string;
    小問: string;
    問題ID: string;
    大問タイトル: string;
    タグ1: string;
    タグ2: string;
    タグ3: string;
    "難易度(1-5)": string;
    "目安時間(元データ)": string;
    配点: string;
    必解: string;
    "フェーズ(前半/後半)": string;
    "問題タイプ(計算/図形/文章…)": string;
    "メモ(解法/典型/ミス)": string;
    出典URL: string;
    "TagGroup(集計)": string;
    "正答(テキスト)": string;
    単位: string;
    "正答メモ(AnswerKey備考)": string;
}

interface AnswerKeyRow {
    年度: string;
    大問: string;
    小問: string;
    "問題ID(固定)": string;
    "正答(テキスト)": string;
    単位: string;
    備考: string;
}

interface TagRow {
    TagGroup: string;
    TagCode: string;
    Tag: string;
    説明: string;
    "例（問題タイプ）": string;
    備考: string;
}

function parseNumber(val: string | undefined): number | null {
    if (!val || val === "" || val === "0") return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
}

function parseBoolean(val: string | undefined): boolean {
    return val === "Y" || val === "true" || val === "TRUE" || val === "1";
}

async function main() {
    const dataDir = path.join(__dirname, "../data");

    console.log("🚀 Starting import...\n");

    if (process.env.RESET_DB !== "true") {
        throw new Error("RESET_DB=true を指定してください（安全のため既存データの削除は明示指定が必要です）");
    }

    // 既存データをクリア
    console.log("🗑️  Clearing existing data...");
    await prisma.answerLog.deleteMany();
    await prisma.question.deleteMany();
    await prisma.tagDictionary.deleteMany();
    console.log("   Done\n");

    // 1. TagDictionary をインポート
    console.log("📚 Importing Tag Dictionary...");
    const tagsContent = fs.readFileSync(path.join(dataDir, "tags.csv"), "utf-8");
    const tags: TagRow[] = parse(tagsContent, { columns: true, skip_empty_lines: true });

    for (const tag of tags) {
        await prisma.tagDictionary.create({
            data: {
                tagGroup: tag.TagGroup,
                tagCode: tag.TagCode || null,
                tag: tag.Tag,
                desc: tag.説明 || null,
                examples: tag["例（問題タイプ）"] || null,
                note: tag.備考 || null,
            },
        });
    }
    console.log(`   Imported ${tags.length} tags\n`);

    // 2. Questions をインポート
    console.log("📝 Importing Questions...");
    const questionsContent = fs.readFileSync(path.join(dataDir, "questions.csv"), "utf-8");
    const questions: QuestionRow[] = parse(questionsContent, { columns: true, skip_empty_lines: true });

    let importedQuestions = 0;
    for (const q of questions) {
        if (!q.問題ID) continue;

        try {
            await prisma.question.create({
                data: {
                    id: q.問題ID,
                    year: parseInt(q.年度) || 0,
                    examType: q.試験区分 || null,
                    section: parseInt(q.大問) || 0,
                    sub: q.小問 || "",
                    sectionTitle: q.大問タイトル || null,
                    tag1: q.タグ1 || null,
                    tag2: q.タグ2 || null,
                    tag3: q.タグ3 || null,
                    tagGroup: q["TagGroup(集計)"] || null,
                    difficulty: parseNumber(q["難易度(1-5)"]) ? Math.round(parseNumber(q["難易度(1-5)"])!) : null,
                    estMinutes: parseNumber(q["目安時間(元データ)"]),
                    points: parseNumber(q.配点),
                    mustSolve: parseBoolean(q.必解),
                    phase: q["フェーズ(前半/後半)"] || null,
                    problemType: q["問題タイプ(計算/図形/文章…)"] || null,
                    sourceUrl: q.出典URL || null,
                    correctText: q["正答(テキスト)"] || null,
                    unit: q.単位 || null,
                    answerNote: q["正答メモ(AnswerKey備考)"] || null,
                },
            });
            importedQuestions++;
        } catch (err) {
            console.error(`   Error importing ${q.問題ID}:`, err);
        }
    }
    console.log(`   Imported ${importedQuestions} questions\n`);

    // 3. AnswerKey をインポート（Questionsの正答を更新）
    console.log("🔑 Importing Answer Keys...");
    const answerKeyContent = fs.readFileSync(path.join(dataDir, "answerkey.csv"), "utf-8");
    const answerKeys: AnswerKeyRow[] = parse(answerKeyContent, { columns: true, skip_empty_lines: true });

    let updatedAnswers = 0;
    for (const a of answerKeys) {
        const questionId = a["問題ID(固定)"];
        if (!questionId) continue;

        try {
            const existing = await prisma.question.findUnique({ where: { id: questionId } });
            if (existing) {
                await prisma.question.update({
                    where: { id: questionId },
                    data: {
                        correctText: a["正答(テキスト)"] || existing.correctText,
                        unit: a.単位 || existing.unit,
                        answerNote: a.備考 || existing.answerNote,
                    },
                });
                updatedAnswers++;
            }
        } catch (err) {
            console.error(`   Error updating ${questionId}:`, err);
        }
    }
    console.log(`   Updated ${updatedAnswers} answer keys\n`);

    // 4. Lists.json を読み込んで定数ファイルを生成
    console.log("📋 Generating constants...");
    const listsContent = fs.readFileSync(path.join(dataDir, "lists.json"), "utf-8");
    const lists = JSON.parse(listsContent);

    const constantsCode = `// 自動生成: Excel Lists シートから
// Generated: ${new Date().toISOString()}

export const RESULT_OPTIONS = ${JSON.stringify(lists.results, null, 2)} as const;

export const MISS_TYPES = ${JSON.stringify(lists.missTypes, null, 2)} as const;

export const TAG_GROUPS = ${JSON.stringify(lists.tagGroups, null, 2)} as const;

export type Result = typeof RESULT_OPTIONS[number];
export type MissType = typeof MISS_TYPES[number];
export type TagGroup = typeof TAG_GROUPS[number];
`;

    fs.writeFileSync(path.join(__dirname, "../src/lib/constants.ts"), constantsCode);
    console.log("   Generated src/lib/constants.ts\n");

    // 統計を出力
    const stats = {
        questions: await prisma.question.count(),
        tags: await prisma.tagDictionary.count(),
        questionsWithAnswers: await prisma.question.count({ where: { correctText: { not: null } } }),
    };

    console.log("✅ Import completed!");
    console.log(`   Total questions: ${stats.questions}`);
    console.log(`   Questions with answers: ${stats.questionsWithAnswers}`);
    console.log(`   Tag dictionary entries: ${stats.tags}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
