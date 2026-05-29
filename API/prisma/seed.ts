import { PrismaClient, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Permissions
  const permissions = [
    // Dashboard
    { module: 'dashboard', action: 'view' },
    // Employees
    { module: 'employees', action: 'view' },
    { module: 'employees', action: 'create' },
    { module: 'employees', action: 'update' },
    { module: 'employees', action: 'delete' },
    { module: 'employees', action: 'toggle_status' },
    // Clients
    { module: 'clients', action: 'view' },
    { module: 'clients', action: 'create' },
    { module: 'clients', action: 'update' },
    { module: 'clients', action: 'delete' },
    { module: 'clients', action: 'view_contacts' },
    // CV Database
    { module: 'cv', action: 'view' },
    { module: 'cv', action: 'create' },
    { module: 'cv', action: 'update' },
    { module: 'cv', action: 'delete' },
    { module: 'cv', action: 'bulk_import' },
    { module: 'cv', action: 'download' },
    // Job Openings
    { module: 'jobs', action: 'view' },
    { module: 'jobs', action: 'create' },
    { module: 'jobs', action: 'update' },
    { module: 'jobs', action: 'delete' },
    // Invoices
    { module: 'invoices', action: 'view' },
    { module: 'invoices', action: 'create' },
    { module: 'invoices', action: 'update' },
    { module: 'invoices', action: 'delete' },
    { module: 'invoices', action: 'send_email' },
    // Settings
    { module: 'settings', action: 'view' },
    { module: 'settings', action: 'theme' },
    { module: 'settings', action: 'roles' },
    { module: 'settings', action: 'fonts' },
    // Audit
    { module: 'audit', action: 'view' },
    // Columns
    { module: 'columns', action: 'manage' },
    // Dropdown options management
    { module: 'dropdown', action: 'manage_options' },
    // Language management
    { module: 'settings', action: 'language' },
    // Role management (granular sub-permissions)
    { module: 'settings', action: 'manage_roles' },
    { module: 'settings', action: 'roles_view' },
    { module: 'settings', action: 'roles_create' },
    { module: 'settings', action: 'roles_edit' },
    { module: 'settings', action: 'roles_delete' },
  ];

  const createdPermissions: Record<string, string> = {};
  for (const perm of permissions) {
    const p = await prisma.permission.upsert({
      where: { module_action: { module: perm.module, action: perm.action } },
      update: {},
      create: { module: perm.module, action: perm.action },
    });
    createdPermissions[`${perm.module}:${perm.action}`] = p.id;
  }

  // Create Super Admin Role
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'super_admin' },
    update: {},
    create: {
      name: 'super_admin',
      description: 'Super Administrator with full access',
      isSystem: true,
    },
  });

  // Create Admin Role
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator with operational access',
      isSystem: true,
    },
  });

  // Create Recruiter Role
  const recruiterRole = await prisma.role.upsert({
    where: { name: 'recruiter' },
    update: {},
    create: {
      name: 'recruiter',
      description: 'Recruiter with limited access',
      isSystem: true,
    },
  });

  // Assign all permissions to super admin
  for (const permId of Object.values(createdPermissions)) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: permId } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: permId },
    });
  }

  // Assign admin permissions
  const adminPermKeys = [
    'dashboard:view', 'employees:view', 'employees:create', 'employees:update', 'employees:toggle_status',
    'clients:view', 'clients:create', 'clients:update', 'clients:view_contacts', 'cv:view', 'cv:create', 'cv:update', 'cv:bulk_import',
    'cv:download', 'jobs:view', 'jobs:create', 'jobs:update', 'invoices:view', 'invoices:create',
    'invoices:update', 'invoices:send_email', 'settings:view', 'columns:manage',
    'dropdown:manage_options', 'settings:manage_roles',
    'settings:roles_view', 'settings:roles_create', 'settings:roles_edit', 'settings:roles_delete',
  ];
  for (const key of adminPermKeys) {
    const permId = createdPermissions[key];
    if (permId) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permId } },
        update: {},
        create: { roleId: adminRole.id, permissionId: permId },
      });
    }
  }

  // Assign recruiter permissions
  const recruiterPermKeys = ['dashboard:view', 'cv:view', 'cv:create', 'cv:update', 'jobs:view', 'clients:view'];
  for (const key of recruiterPermKeys) {
    const permId = createdPermissions[key];
    if (permId) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: recruiterRole.id, permissionId: permId } },
        update: {},
        create: { roleId: recruiterRole.id, permissionId: permId },
      });
    }
  }

  // Create Super Admin User
  const passwordHash = await bcrypt.hash('SuperAdmin@123', 12);
  await prisma.user.upsert({
    where: { email: 'superadmin@hrapp.com' },
    update: {},
    create: {
      email: 'superadmin@hrapp.com',
      username: 'superadmin',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      roleId: superAdminRole.id,
      isSuperAdmin: true,
      status: UserStatus.ACTIVE,
      employeeId: 'EMP-0001',
    },
  });

  // Create default App Settings
  const defaultSettings = [
    { key: 'app_name', value: 'HR Recruitment System', category: 'general' },
    { key: 'app_logo', value: '', category: 'branding' },
    { key: 'primary_color', value: '#1E40AF', category: 'theme' },
    { key: 'accent_color', value: '#3B82F6', category: 'theme' },
    { key: 'sidebar_color', value: '#0F172A', category: 'theme' },
    { key: 'font_family', value: 'Inter', category: 'theme' },
    { key: 'default_theme', value: 'light', category: 'theme' },
    { key: 'gstin', value: '', category: 'company' },
    { key: 'company_name', value: '', category: 'company' },
    { key: 'company_address', value: '', category: 'company' },
    { key: 'invoice_prefix', value: 'INV', category: 'invoice' },
    { key: 'invoice_counter', value: '1', category: 'invoice' },
  ];

  for (const setting of defaultSettings) {
    await prisma.appSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  // Seed default column definitions for CV module
  const cvColumns = [
    { module: 'cv', name: 'status', label: 'Status', dataType: 'STATUS' as any, order: 1, isVisible: true },
    { module: 'cv', name: 'priority', label: 'Priority', dataType: 'PRIORITY' as any, order: 2, isVisible: true },
    { module: 'cv', name: 'current_location', label: 'Location', dataType: 'LOCATION' as any, order: 3, isVisible: true },
    { module: 'cv', name: 'current_ctc', label: 'Current CTC', dataType: 'NUMBER' as any, order: 4, isVisible: true },
    { module: 'cv', name: 'expected_ctc', label: 'Expected CTC', dataType: 'NUMBER' as any, order: 5, isVisible: true },
    { module: 'cv', name: 'notice_period', label: 'Notice Period', dataType: 'NUMBER' as any, order: 6, isVisible: true },
    { module: 'cv', name: 'total_experience', label: 'Experience', dataType: 'NUMBER' as any, order: 7, isVisible: true },
  ];

  for (const col of cvColumns) {
    await prisma.columnDefinition.upsert({
      where: { module_name: { module: col.module, name: col.name } },
      update: {},
      create: col,
    });
  }

  // Seed default column definitions for Jobs module
  const jobColumns = [
    { module: 'jobs', name: 'status', label: 'Status', dataType: 'STATUS' as any, order: 1, isVisible: true },
    { module: 'jobs', name: 'priority', label: 'Priority', dataType: 'PRIORITY' as any, order: 2, isVisible: true },
    { module: 'jobs', name: 'work_location', label: 'Location', dataType: 'LOCATION' as any, order: 3, isVisible: true },
    { module: 'jobs', name: 'assigned_employees', label: 'Assigned To', dataType: 'EMPLOYEE' as any, order: 4, isVisible: true },
    { module: 'jobs', name: 'candidates', label: 'Candidates', dataType: 'CANDIDATES' as any, order: 5, isVisible: true },
    { module: 'jobs', name: 'closing_date', label: 'Closing Date', dataType: 'DATE' as any, order: 6, isVisible: true },
  ];

  for (const col of jobColumns) {
    await prisma.columnDefinition.upsert({
      where: { module_name: { module: col.module, name: col.name } },
      update: {},
      create: col,
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('🔑 Default Super Admin Credentials:');
  console.log('   Email: superadmin@hrapp.com');
  console.log('   Password: SuperAdmin@123');
  console.log('');
  console.log('⚠️  Please change the password after first login!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
