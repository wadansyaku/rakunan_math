
import "dotenv/config";
import { execSync } from "child_process";
import { prisma } from "../src/lib/prisma";

async function main() {
    console.log("🚀 Starting Acceptance Test...\n");

    try {
        // 1. Lint Check
        console.log("🔍 Running Lint Check...");
        execSync("npm run lint", { stdio: "inherit" });
        console.log("✅ Lint Check Passed!\n");

        // 2. Build Check
        console.log("🏗️  Running Build Check...");
        // building creates .next folder, which might take time
        execSync("npm run build", { stdio: "inherit" });
        console.log("✅ Build Check Passed!\n");

        // 3. Data Integrity Check
        console.log("💾 Checking Database Integrity...");

        const questionCount = await prisma.question.count();
        console.log(`   - Questions: ${questionCount}`);
        if (questionCount === 0) throw new Error("No questions found in database!");

        const tagCount = await prisma.tagDictionary.count();
        console.log(`   - Tags: ${tagCount}`);
        if (tagCount === 0) throw new Error("No tags found in database!");

        console.log("✅ Database Integrity Check Passed!\n");

        console.log("🎉 ALL CHECKS PASSED! The system is ready.");

    } catch (error) {
        console.error("\n❌ Acceptance Test Failed!");
        console.error(error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
