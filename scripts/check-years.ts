
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
    const questions = await prisma.question.groupBy({
        by: ['year'],
        _count: {
            id: true
        }
    });
    console.log("Existing Years in DB:", questions);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
