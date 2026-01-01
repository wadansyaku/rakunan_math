import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pooledUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;
const directUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.DIRECT_URL;
const connectionString = directUrl || pooledUrl;

if (!connectionString || !connectionString.startsWith("postgres")) {
    throw new Error("DATABASE_URL is missing or invalid. Set DIRECT_URL/POSTGRES_URL_NON_POOLING for seed.");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Seeding database...");

    // サンプル問題を作成
    const question1 = await prisma.question.upsert({
        where: { id: "2024-Q1(1)" },
        update: {},
        create: {
            id: "2024-Q1(1)",
            year: 2024,
            examType: "本試験",
            section: 1,
            sub: "(1)",
            sectionTitle: "計算問題",
            tag1: "計算",
            tag2: "四則演算",
            difficulty: 2,
            estMinutes: 2,
            points: 5,
            mustSolve: true,
            phase: "基礎",
            correctText: "42",
            unit: null,
            answerNote: "計算順序に注意",
            reviewInterval: 3,
            nextReviewDate: "2025-01-04",
        },
    });

    const question2 = await prisma.question.upsert({
        where: { id: "2024-Q1(2)" },
        update: {},
        create: {
            id: "2024-Q1(2)",
            year: 2024,
            examType: "本試験",
            section: 1,
            sub: "(2)",
            sectionTitle: "計算問題",
            tag1: "計算",
            tag2: "分数",
            difficulty: 3,
            estMinutes: 3,
            points: 5,
            mustSolve: true,
            phase: "基礎",
            correctText: "5/6",
            unit: null,
            answerNote: "約分を忘れずに",
            reviewInterval: 1,
            nextReviewDate: "2024-12-30", // 期限切れ
        },
    });

    const question3 = await prisma.question.upsert({
        where: { id: "2024-Q2(1)" },
        update: {},
        create: {
            id: "2024-Q2(1)",
            year: 2024,
            examType: "本試験",
            section: 2,
            sub: "(1)",
            sectionTitle: "図形問題",
            tag1: "図形",
            tag2: "面積",
            tagGroup: "平面図形",
            difficulty: 4,
            estMinutes: 5,
            points: 8,
            mustSolve: false,
            phase: "応用",
            correctText: "24",
            unit: "cm²",
            answerNote: "補助線を引く",
        },
    });

    // サンプル解答ログを作成
    await prisma.answerLog.create({
        data: {
            studyDate: "2024-12-25",
            questionId: question1.id,
            result: "Correct",
            minutes: 1.5,
            memo: "問題なし",
            correctText: question1.correctText,
            autoJudge: "MATCH",
        },
    });

    await prisma.answerLog.create({
        data: {
            studyDate: "2024-12-29",
            questionId: question2.id,
            result: "Wrong",
            missType: "計算ミス",
            minutes: 4,
            cause: "約分を忘れた",
            action: "約分の確認を習慣化",
            memo: "もう一度復習",
            studentAns: "10/12",
            correctText: question2.correctText,
            autoJudge: "NO",
        },
    });

    await prisma.answerLog.create({
        data: {
            studyDate: "2025-01-01",
            questionId: question3.id,
            result: "Partial",
            missType: "考え方ミス",
            minutes: 6,
            cause: "補助線の引き方が不適切",
            memo: "別解も確認する",
            correctText: question3.correctText,
        },
    });

    // タグ辞書を作成
    const tagData = [
        { tagGroup: "計算", tag: "四則演算", desc: "足し算、引き算、掛け算、割り算" },
        { tagGroup: "計算", tag: "分数", desc: "分数の計算" },
        { tagGroup: "図形", tag: "面積", desc: "図形の面積を求める問題" },
        { tagGroup: "図形", tag: "体積", desc: "立体の体積を求める問題" },
    ];

    for (const tag of tagData) {
        await prisma.tagDictionary.create({ data: tag });
    }

    // Questionの最終結果を更新
    await prisma.question.update({
        where: { id: question1.id },
        data: { lastResult: "Correct", lastStudyDate: "2024-12-25" },
    });

    await prisma.question.update({
        where: { id: question2.id },
        data: { lastResult: "Wrong", lastStudyDate: "2024-12-29" },
    });

    await prisma.question.update({
        where: { id: question3.id },
        data: { lastResult: "Partial", lastStudyDate: "2025-01-01" },
    });

    console.log("Seed completed!");
    console.log(`Created ${await prisma.question.count()} questions`);
    console.log(`Created ${await prisma.answerLog.count()} answer logs`);
    console.log(`Created ${await prisma.tagDictionary.count()} tag dictionary entries`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
