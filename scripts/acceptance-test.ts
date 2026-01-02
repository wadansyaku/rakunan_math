import { runScript } from "./lib/runner";
import { execSync } from "child_process";

runScript("Acceptance Test", async ({ prisma }) => {
    // 1. Lint Check
    console.log("🔍 Running Lint Check...");
    execSync("npm run lint", { stdio: "inherit" });
    console.log("✅ Lint Check Passed!");

    // 2. Build Check
    console.log("\n🏗️  Running Build Check...");
    execSync("npm run build", { stdio: "inherit" });
    console.log("✅ Build Check Passed!");

    // 3. Data Integrity Check
    console.log("\n💾 Checking Database Integrity...");

    const questionCount = await prisma.question.count();
    console.log(`   - Questions: ${questionCount}`);
    if (questionCount === 0) throw new Error("No questions found in database!");

    const tagCount = await prisma.tagDictionary.count();
    console.log(`   - Tags: ${tagCount}`);
    if (tagCount === 0) throw new Error("No tags found in database!");

    return {
        success: true,
        message: "ALL CHECKS PASSED! The system is ready.",
        data: {
            questions: questionCount,
            tags: tagCount,
        },
    };
});
