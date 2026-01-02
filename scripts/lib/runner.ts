/**
 * Shared Script Runner Utility
 * 
 * 全スクリプトで共通のエラーハンドリングとログ出力を提供
 */

import "dotenv/config";
import { getPrismaClient } from "../../src/lib/prisma";

export interface ScriptContext {
    prisma: ReturnType<typeof getPrismaClient>;
}

export interface ScriptResult {
    success: boolean;
    message?: string;
    data?: unknown;
}

/**
 * スクリプトを実行するラッパー関数
 * - 環境変数の読み込み
 * - Prismaクライアントの初期化と終了処理
 * - エラーハンドリングと統一されたログ出力
 */
export async function runScript(
    name: string,
    fn: (ctx: ScriptContext) => Promise<ScriptResult>
): Promise<void> {
    const startTime = Date.now();
    console.log(`\n${"=".repeat(50)}`);
    console.log(`🚀 ${name}`);
    console.log(`${"=".repeat(50)}\n`);

    const prisma = getPrismaClient();

    try {
        const result = await fn({ prisma });

        if (result.success) {
            console.log(`\n✅ ${result.message || "完了しました"}`);
        } else {
            console.log(`\n⚠️ ${result.message || "警告がありました"}`);
        }

        if (result.data) {
            console.log(`\n📊 結果:`, result.data);
        }
    } catch (error) {
        console.error(`\n❌ エラーが発生しました:`);
        console.error(error);
        process.exitCode = 1;
    } finally {
        await prisma.$disconnect();
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`\n⏱️ 実行時間: ${elapsed}秒`);
        console.log(`${"=".repeat(50)}\n`);
    }
}
