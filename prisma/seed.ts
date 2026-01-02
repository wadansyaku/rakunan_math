import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pooledUrl =
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.STORAGE_POSTGRES_PRISMA_URL ||
    process.env.STORAGE_POSTGRES_URL ||
    process.env.STORAGE_DATABASE_URL;
const directUrl =
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.DIRECT_URL ||
    process.env.STORAGE_POSTGRES_URL_NON_POOLING ||
    process.env.STORAGE_DATABASE_URL_UNPOOLED;
const connectionString = directUrl || pooledUrl;

if (!connectionString || !connectionString.startsWith("postgres")) {
    throw new Error("DATABASE_URL is missing or invalid. Set DIRECT_URL/POSTGRES_URL_NON_POOLING/DATABASE_URL_UNPOOLED for seed.");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Seeding database...");

    // サンプル問題を作成（復習記録専用アプリ向け）
    const question1 = await prisma.question.upsert({
        where: { id: "H29-Q1(1)" },
        update: {},
        create: {
            id: "H29-Q1(1)",
            year: 2017,
            examType: "本試験",
            section: 1,
            sub: "(1)",
            sectionTitle: "計算問題",
            tag1: "計算",
            tag2: "分数小数",
            tagGroup: "計算",
            difficulty: 2,
            estMinutes: 2,
            points: 5,
            mustSolve: true,
            phase: "基礎",
            reviewInterval: 3,
            nextReviewDate: "2025-01-04",
        },
    });

    const question2 = await prisma.question.upsert({
        where: { id: "H29-Q1(2)" },
        update: {},
        create: {
            id: "H29-Q1(2)",
            year: 2017,
            examType: "本試験",
            section: 1,
            sub: "(2)",
            sectionTitle: "計算問題",
            tag1: "計算",
            tag2: "工夫計算",
            tagGroup: "計算",
            difficulty: 3,
            estMinutes: 3,
            points: 5,
            mustSolve: true,
            phase: "基礎",
            reviewInterval: 1,
            nextReviewDate: "2024-12-30",
        },
    });

    const question3 = await prisma.question.upsert({
        where: { id: "H29-Q6(1)" },
        update: {},
        create: {
            id: "H29-Q6(1)",
            year: 2017,
            examType: "本試験",
            section: 6,
            sub: "(1)",
            sectionTitle: "平面図形",
            tag1: "図形",
            tag2: "相似・比",
            tagGroup: "図形",
            difficulty: 4,
            estMinutes: 5,
            points: 8,
            mustSolve: false,
            phase: "応用",
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
        },
    });

    // タグ辞書を作成（新taxonomy対応）
    const tagData = [
        { tagGroup: "計算", tag: "単位換算", desc: "単位の変換" },
        { tagGroup: "計算", tag: "工夫計算", desc: "計算の工夫" },
        { tagGroup: "計算", tag: "分数小数", desc: "分数・小数の計算" },
        { tagGroup: "図形", tag: "相似・比", desc: "相似比・面積比" },
        { tagGroup: "図形", tag: "角度", desc: "角度を求める問題" },
        { tagGroup: "図形", tag: "立体の切断", desc: "立体の切断" },
        { tagGroup: "文章題", tag: "場合の数", desc: "場合の数" },
        { tagGroup: "文章題", tag: "食塩水", desc: "食塩水・濃度" },
        { tagGroup: "割合", tag: "速さと比", desc: "速さと比" },
        { tagGroup: "割合", tag: "割合・比（基本）", desc: "割合・比の基本" },
        { tagGroup: "整数", tag: "規則性", desc: "規則性" },
        { tagGroup: "整数", tag: "数列", desc: "数列" },
        { tagGroup: "整数", tag: "約数・倍数", desc: "約数・倍数" },
        { tagGroup: "整数", tag: "剰余", desc: "余りに関する問題" },
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
