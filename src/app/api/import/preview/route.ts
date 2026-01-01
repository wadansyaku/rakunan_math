import { NextRequest, NextResponse } from "next/server";

interface ParsedRow {
    [key: string]: string | number | boolean | null;
}

function parseCSV(content: string): ParsedRow[] {
    const lines = content.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row: ParsedRow = {};

        headers.forEach((header, index) => {
            const value = values[index]?.trim() || "";
            // 型変換を試みる
            if (value === "") {
                row[header] = null;
            } else if (value.toLowerCase() === "true") {
                row[header] = true;
            } else if (value.toLowerCase() === "false") {
                row[header] = false;
            } else if (!isNaN(Number(value)) && value !== "") {
                row[header] = Number(value);
            } else {
                row[header] = value.replace(/^"|"$/g, "");
            }
        });

        rows.push(row);
    }

    return rows;
}

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === "," && !inQuotes) {
            result.push(current);
            current = "";
        } else {
            current += char;
        }
    }

    result.push(current);
    return result;
}

function mapQuestionRow(row: ParsedRow): ParsedRow {
    return {
        id: row["問題ID"] || row["id"] || row["ID"] || "",
        year: row["年度"] || row["year"] || 0,
        examType: row["試験区分"] || row["examType"] || null,
        section: row["大問"] || row["section"] || 0,
        sub: row["小問"] || row["sub"] || "",
        sectionTitle: row["大問タイトル"] || row["sectionTitle"] || null,
        tag1: row["タグ1"] || row["tag1"] || null,
        tag2: row["タグ2"] || row["tag2"] || null,
        tag3: row["タグ3"] || row["tag3"] || null,
        tagGroup: row["TagGroup"] || row["tagGroup"] || null,
        difficulty: row["難易度"] || row["difficulty"] || null,
        estMinutes: row["目安時間"] || row["estMinutes"] || null,
        points: row["配点"] || row["points"] || null,
        mustSolve: row["必解"] || row["mustSolve"] || null,
        phase: row["フェーズ"] || row["phase"] || null,
        problemType: row["問題タイプ"] || row["problemType"] || null,
        sourceUrl: row["出典URL"] || row["sourceUrl"] || null,
        fieldKey: row["分野キー"] || row["fieldKey"] || null,
        fieldName: row["分野名"] || row["fieldName"] || null,
        fieldType: row["分野タイプ"] || row["fieldType"] || null,
        correctText: row["正答"] || row["correctText"] || null,
        unit: row["単位"] || row["unit"] || null,
        answerNote: row["正答メモ"] || row["answerNote"] || null,
    };
}

function mapAnswerKeyRow(row: ParsedRow): ParsedRow {
    return {
        questionId: row["問題ID"] || row["questionId"] || row["id"] || "",
        correctText: row["正答"] || row["correctText"] || null,
        unit: row["単位"] || row["unit"] || null,
        note: row["備考"] || row["note"] || null,
    };
}

function mapAnswerLogRow(row: ParsedRow): ParsedRow {
    return {
        studyDate: row["実施日"] || row["日付"] || row["date"] || "",
        questionId: row["問題ID"] || row["questionId"] || "",
        result: row["結果"] || row["result"] || "",
        missType: row["ミス分類"] || row["missType"] || null,
        minutes: row["解答時間"] || row["minutes"] || null,
        cause: row["原因"] || row["cause"] || null,
        action: row["改善アクション"] || row["action"] || null,
        memo: row["メモ"] || row["memo"] || null,
        studentAns: row["生徒解答"] || row["studentAns"] || null,
        correctText: row["正答"] || row["correctText"] || null,
        autoJudge: row["自動判定"] || row["autoJudge"] || null,
    };
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        const questionsFile = formData.get("questions") as File | null;
        const answerKeyFile = formData.get("answerKey") as File | null;
        const answerLogFile = formData.get("answerLog") as File | null;

        const result: {
            questions: ParsedRow[];
            answerKey: ParsedRow[];
            answerLog: ParsedRow[];
        } = {
            questions: [],
            answerKey: [],
            answerLog: [],
        };

        if (questionsFile) {
            const content = await questionsFile.text();
            const rows = parseCSV(content);
            result.questions = rows.map(mapQuestionRow);
        }

        if (answerKeyFile) {
            const content = await answerKeyFile.text();
            const rows = parseCSV(content);
            result.answerKey = rows.map(mapAnswerKeyRow);
        }

        if (answerLogFile) {
            const content = await answerLogFile.text();
            const rows = parseCSV(content);
            result.answerLog = rows.map(mapAnswerLogRow);
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Failed to preview import:", error);
        return NextResponse.json(
            { error: "プレビューの生成に失敗しました" },
            { status: 500 }
        );
    }
}
