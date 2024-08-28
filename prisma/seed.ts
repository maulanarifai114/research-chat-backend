import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  //#region User
  await prisma.user.createMany({
    skipDuplicates: true,
    data: [{ name: 'Test' }],
  });
  //#endregion

  console.log('Success seeding data!');
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
