const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  await prisma.transactionTag.deleteMany();
  await prisma.goalProgress.deleteMany();
  await prisma.wealthSnapshot.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.userChallenge.deleteMany();
  await prisma.bookMember.deleteMany();
  await prisma.order.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.savingGoal.deleteMany();
  await prisma.aiLog.deleteMany();
  await prisma.aiReport.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log('All dev data cleared');
}

main().finally(() => prisma.$disconnect());
