const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin
  const adminHash = await bcrypt.hash('Admin@1234', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lockbox.app' },
    update: {},
    create: {
      firstName: 'LockBox',
      lastName: 'Admin',
      email: 'admin@lockbox.app',
      passwordHash: adminHash,
      role: 'ADMIN',
      profileStatus: 'ACTIVE',
    },
  });
  console.log('Admin created:', admin.email);

  // Create test users
  const userHash = await bcrypt.hash('User@1234', 12);

  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice@example.com',
      passwordHash: userHash,
      role: 'USER',
      profileStatus: 'ACTIVE',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      firstName: 'Bob',
      lastName: 'Smith',
      email: 'bob@example.com',
      passwordHash: userHash,
      role: 'USER',
      profileStatus: 'ACTIVE',
    },
  });

  console.log('Test users created:', user1.email, user2.email);

  const fullName = (u) => [u.firstName, u.lastName].filter(Boolean).join(' ');

  // Seed activity logs
  await prisma.activityLog.createMany({
    data: [
      {
        actorUserId: admin.id,
        action: 'SIGNUP',
        entityType: 'USER',
        description: 'Admin account initialized',
      },
      {
        actorUserId: user1.id,
        targetUserId: user1.id,
        action: 'SIGNUP',
        entityType: 'USER',
        description: `${fullName(user1)} created an account`,
      },
      {
        actorUserId: user2.id,
        targetUserId: user2.id,
        action: 'SIGNUP',
        entityType: 'USER',
        description: `${fullName(user2)} created an account`,
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seed complete!');
  console.log('');
  console.log('Credentials:');
  console.log('  Admin:  admin@lockbox.app  / Admin@1234');
  console.log('  User 1: alice@example.com  / User@1234');
  console.log('  User 2: bob@example.com    / User@1234');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
