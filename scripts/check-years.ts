
import "dotenv/config";
import { getPrismaClient } from "../src/lib/prisma";

const prisma = getPrismaClient();

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
