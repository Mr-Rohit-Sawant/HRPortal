import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🏢 Creating businesses...');

  // Find admin role
  let adminRole = await prisma.role.findFirst({ where: { name: 'admin' } });
  if (!adminRole) {
    adminRole = await prisma.role.create({ data: { name: 'admin', isSystem: true } });
    console.log('Created admin role');
  }

  const pw1 = await bcrypt.hash('Business@1234', 12);
  const pw2 = await bcrypt.hash('Business@1234', 12);

  // ── Business 1 ──────────────────────────────────────────────────────────
  let biz1 = await prisma.business.findUnique({ where: { code: 'BIZ001' } });
  if (!biz1) {
    biz1 = await prisma.business.create({
      data: {
        name: 'Test Business One',
        code: 'BIZ001',
        adminEmail: 'testbusiness1@yopmail.com',
        status: 'ACTIVE',
      },
    });
    console.log(`✅ Created Business 1: ${biz1.id}`);
  } else {
    console.log(`ℹ️  Business 1 already exists: ${biz1.id}`);
  }

  // Create admin user for Business 1
  const existing1 = await prisma.user.findUnique({ where: { email: 'testbusiness1@yopmail.com' } });
  if (!existing1) {
    await prisma.user.create({
      data: {
        email: 'testbusiness1@yopmail.com',
        username: 'testbusiness1',
        passwordHash: pw1,
        firstName: 'Test',
        lastName: 'Business1',
        roleId: adminRole.id,
        businessId: biz1.id,
        status: 'ACTIVE',
      },
    });
    console.log('✅ Created admin user for Business 1');
  } else if (!existing1.businessId) {
    await prisma.user.update({ where: { id: existing1.id }, data: { businessId: biz1.id } });
    console.log('✅ Linked existing user to Business 1');
  }

  // ── Business 2 ──────────────────────────────────────────────────────────
  let biz2 = await prisma.business.findUnique({ where: { code: 'BIZ002' } });
  if (!biz2) {
    biz2 = await prisma.business.create({
      data: {
        name: 'Test Business Two',
        code: 'BIZ002',
        adminEmail: 'testbusiness2@yopmail.com',
        status: 'ACTIVE',
      },
    });
    console.log(`✅ Created Business 2: ${biz2.id}`);
  } else {
    console.log(`ℹ️  Business 2 already exists: ${biz2.id}`);
  }

  // Create admin user for Business 2
  const existing2 = await prisma.user.findUnique({ where: { email: 'testbusiness2@yopmail.com' } });
  if (!existing2) {
    await prisma.user.create({
      data: {
        email: 'testbusiness2@yopmail.com',
        username: 'testbusiness2',
        passwordHash: pw2,
        firstName: 'Test',
        lastName: 'Business2',
        roleId: adminRole.id,
        businessId: biz2.id,
        status: 'ACTIVE',
      },
    });
    console.log('✅ Created admin user for Business 2');
  } else if (!existing2.businessId) {
    await prisma.user.update({ where: { id: existing2.id }, data: { businessId: biz2.id } });
    console.log('✅ Linked existing user to Business 2');
  }

  // ── Link ALL existing data to Business 1 ─────────────────────────────────
  console.log('\n🔗 Linking existing data to Business 1...');

  // Link non-super-admin users without a business
  const usersUpdated = await prisma.user.updateMany({
    where: { isSuperAdmin: false, businessId: null },
    data: { businessId: biz1.id },
  });
  console.log(`✅ Linked ${usersUpdated.count} users to Business 1`);

  const candidatesUpdated = await prisma.candidate.updateMany({
    where: { businessId: null },
    data: { businessId: biz1.id },
  });
  console.log(`✅ Linked ${candidatesUpdated.count} candidates to Business 1`);

  const clientsUpdated = await prisma.client.updateMany({
    where: { businessId: null },
    data: { businessId: biz1.id },
  });
  console.log(`✅ Linked ${clientsUpdated.count} clients to Business 1`);

  const jobsUpdated = await prisma.jobOpening.updateMany({
    where: { businessId: null },
    data: { businessId: biz1.id },
  });
  console.log(`✅ Linked ${jobsUpdated.count} job openings to Business 1`);

  const invoicesUpdated = await prisma.invoice.updateMany({
    where: { businessId: null },
    data: { businessId: biz1.id },
  });
  console.log(`✅ Linked ${invoicesUpdated.count} invoices to Business 1`);

  console.log('\n🎉 Done! Credentials for test businesses:');
  console.log('  Business 1: testbusiness1@yopmail.com / Business@1234');
  console.log('  Business 2: testbusiness2@yopmail.com / Business@1234');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
