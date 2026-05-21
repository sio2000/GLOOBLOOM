import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.organism.findFirst();
  if (existing) {
    console.log("[SEED] Organism already exists, skipping.");
    return;
  }

  const organism = await prisma.organism.create({
    data: {
      hydration: 42,
      growth: 8,
      decay: 0,
      mutationLevel: 0,
      beautyLevel: 12,
      biodiversity: 5,
      ecosystemStage: 1,
      mood: "thirsty",
      season: "bloom",
      totalWaterings: 0,
    },
  });

  await prisma.activityLog.create({
    data: {
      type: "milestone",
      message: "The organism was born from digital soil.",
      metadata: JSON.stringify({ stage: 1 }),
    },
  });

  console.log("[SEED] Organism created:", organism.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
