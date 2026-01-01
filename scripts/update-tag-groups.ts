/**
 * TagGroupが空の問題に対して、タグ情報からTagGroupを推測して更新するスクリプト
 * 
 * Usage: npx tsx scripts/update-tag-groups.ts
 */

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
    throw new Error("DATABASE_URL is missing or invalid. Set DIRECT_URL/POSTGRES_URL_NON_POOLING/DATABASE_URL_UNPOOLED for update-tag-groups.");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// キーワードとTagGroupのマッピング（優先度順）
const TAG_MAPPING: Record<string, string[]> = {
    "計算": ["計算", "四則", "逆算", "虫食い", "単位", "数値"],
    "整数・数論": ["整数", "約数", "倍数", "余り", "素数", "素因数", "Ｎ進法", "規則", "数列", "約束記号"],
    "場合の数": ["場合の数", "並べ方", "選び方", "順列", "組み合わせ", "道順", "塗り分け"],
    "割合・比": ["割合", "比", "食塩水", "濃度", "相当算", "売買", "損益"],
    "速さ": ["速さ", "旅人算", "通過算", "流水算", "時計算", "ダイヤグラム"],
    "平面図形": ["平面図形", "図形", "角度", "面積", "長さ", "相似", "合同", "移動", "回転", "円", "おうぎ形"],
    "立体図形": ["立体図形", "体積", "表面積", "展開図", "切断", "投影図", "水量"],
    "文章題": ["文章題", "和差算", "つるかめ", "平均", "仕事算", "ニュートン算", "過不足", "消去算"],
    "グラフ・資料": ["グラフ", "表", "資料", "統計"],
};

async function main() {
    console.log("🚀 Starting TagGroup update...\n");

    const questions = await prisma.question.findMany({
        where: {
            OR: [
                { tagGroup: null },
                { tagGroup: "" },
                { tagGroup: "未分類" } // もし既に入っているなら
            ]
        }
    });

    console.log(`Found ${questions.length} questions without TagGroup.`);

    let updatedCount = 0;

    for (const q of questions) {
        let inferredGroup = null;

        // すべてのタグを結合して検索対象にする
        const tags = [q.tag1, q.tag2, q.tag3].filter(Boolean).join(" ");

        if (!tags) continue;

        for (const [group, keywords] of Object.entries(TAG_MAPPING)) {
            if (keywords.some(k => tags.includes(k))) {
                inferredGroup = group;
                break; // マッチしたら終了（定義順が優先度）
            }
        }

        if (inferredGroup) {
            await prisma.question.update({
                where: { id: q.id },
                data: { tagGroup: inferredGroup }
            });
            // console.log(`   Updated ${q.id}: ${tags} -> ${inferredGroup}`);
            updatedCount++;
        } else {
            // console.log(`   Skipped ${q.id}: ${tags} (No match)`);
            // その他に分類
            await prisma.question.update({
                where: { id: q.id },
                data: { tagGroup: "その他" }
            });
        }
    }

    console.log(`\n✅ Updated ${updatedCount} questions.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
