const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.product.count();
  console.log('=== DB PRODUCTS COUNT ===', count);
  const sample = await prisma.product.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, sku: true, image: true, createdAt: true }
  });
  console.log('Recent 10 products in DB:\n', JSON.stringify(sample, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
