/**
 * 既存の questions.csv を和暦ID形式に変換するスクリプト
 * 
 * 西暦 -> 和暦変換ルール:
 * - 2017 (平成29年) -> H29
 * - 2018 (平成30年) -> H30
 * - 2019 (平成31年) -> H31 (令和1年だが、H31を使用)
 * - 2020 (令和2年) -> R2
 * - 2021 (令和3年) -> R3
 * - 2022 (令和4年) -> R4
 * - 2023 (令和5年) -> R5
 * - 2024 (令和6年) -> R6
 * - 2025 (令和7年) -> R7
 */

import * as fs from "fs";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

interface QuestionRow {
    [key: string]: string;
}

// 西暦から和暦を取得
function getEraYear(westernYear: number): string {
    if (westernYear <= 2019) {
        // 平成: 1989年(H1) ~ 2019年(H31)
        const heiseiYear = westernYear - 1988;
        return `H${heiseiYear}`;
    } else {
        // 令和: 2019年(R1) ~ 
        // ただし2019年はH31を使用するルールなので、ここでは2020年以降
        const reiwaYear = westernYear - 2018;
        return `R${reiwaYear}`;
    }
}

// 問題IDを和暦形式に変換
function convertId(oldId: string, year: number): string {
    const era = getEraYear(year);
    // 2025-Q1(1) -> R7-Q1(1)
    // 2017-Q8(2)表 -> H29-Q8(2)表
    return oldId.replace(/^\d{4}-/, `${era}-`);
}

async function main() {
    const inputPath = "./data/questions.csv";
    const outputPath = "./data/questions_era.csv";

    console.log("📚 和暦ID変換を開始...\n");

    const content = fs.readFileSync(inputPath, "utf-8");
    const rows: QuestionRow[] = parse(content, {
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
    });

    console.log(`📖 ${rows.length} 問題を読み込みました`);

    // 年度ごとの変換結果をログ
    const yearCounts: Record<string, number> = {};

    // 各行を変換
    const convertedRows = rows.map((row) => {
        const year = parseInt(row["年度"]);
        const oldId = row["問題ID"];
        const newId = convertId(oldId, year);
        const era = getEraYear(year);

        yearCounts[era] = (yearCounts[era] || 0) + 1;

        // 新しい行を作成（IDを更新）
        return {
            ...row,
            "問題ID": newId,
            "和暦": era,  // 新カラム追加
        };
    });

    // 年度ごとの変換結果を表示
    console.log("\n📊 年度別変換結果:");
    const sortedYears = Object.keys(yearCounts).sort((a, b) => {
        // H29, H30, H31, R2, R3... の順にソート
        const aNum = a.startsWith("H") ? parseInt(a.slice(1)) - 100 : parseInt(a.slice(1));
        const bNum = b.startsWith("H") ? parseInt(b.slice(1)) - 100 : parseInt(b.slice(1));
        return aNum - bNum;
    });

    for (const era of sortedYears) {
        console.log(`   ${era}: ${yearCounts[era]} 問題`);
    }

    // CSVに書き出し
    const outputContent = stringify(convertedRows, { header: true });
    fs.writeFileSync(outputPath, outputContent, "utf-8");

    console.log(`\n✅ 変換完了: ${outputPath}`);
    console.log(`   合計: ${convertedRows.length} 問題`);
}

main().catch(console.error);
