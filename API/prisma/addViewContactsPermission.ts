import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding clients:view_contacts permission...');

  const perm = await prisma.permission.upsert({
    where: { module_action: { module: 'clients', action: 'view_contacts' } },
    update: {},
    create: { module: 'clients', action: 'view_contacts' },
  });
  console.log(`Permission ID: ${perm.id}`);

  // Assign to super_admin and admin roles
  for (const roleName of ['super_admin', 'admin']) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) { console.warn(`Role ${roleName} not found, skipping`); continue; }
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
      update: {},
      create: { roleId: role.id, permissionId: perm.id },
    });
    console.log(`Assigned to ${roleName}`);
  }

  console.log('Done.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
