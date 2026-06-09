import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.project.findFirst();
  if (existing) {
    console.log('Seed skipped — data already present.');
    return;
  }
  await prisma.project.create({
    data: {
      title: 'Contoh: Klasifikasi Sentimen Ulasan Aplikasi',
      topic: 'Analisis sentimen menggunakan Naive Bayes',
      studyProgram: 'Teknik Informatika',
      researchMethod: 'Kuantitatif - Machine Learning',
    },
  });
  console.log('Seeded sample project.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
