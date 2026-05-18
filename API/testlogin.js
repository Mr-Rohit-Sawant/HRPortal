const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findFirst({ where: { email: 'superadmin@hrapp.com' } }).then(async function(u) {
  if (!u) { console.log('NO USER FOUND'); prisma.$disconnect(); return; }
  console.log('Found:', u.email, '| status:', u.status);
  console.log('Hash:', u.passwordHash.substring(0, 15));
  var ok = await bcrypt.compare('SuperAdmin@123', u.passwordHash);
  console.log('Password matches:', ok);
  prisma.$disconnect();
});
