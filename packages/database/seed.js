const { prisma, ReportStatus, FraudType, Channel, RiskLevel, AdminRole } = require('./dist');

async function main() {
  // Crear usuarios admin de prueba
  const adminUsers = [
    {
      email: 'admin@sn8.com',
      passwordHash: '$2b$10$YourHashedPasswordHere', // placeholder - en producción usar bcrypt
      role: AdminRole.admin,
    },
    {
      email: 'moderator@sn8.com',
      passwordHash: '$2b$10$YourHashedPasswordHere', // placeholder
      role: AdminRole.moderator,
    },
  ];

  for (const user of adminUsers) {
    await prisma.adminUser.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }

  console.log('✅ Usuarios admin creados:');
  console.log('   - admin@sn8.com (rol: admin)');
  console.log('   - moderator@sn8.com (rol: moderator)');
  console.log('   Nota: Las contraseñas deben configurarse manualmente en la BD');
  console.log('');

  const normalizedPhone = '+573102345678';
  const displayPhone = '+57 310***678';

  const target = await prisma.reportTarget.upsert({
    where: { normalizedPhone },
    update: {},
    create: {
      normalizedPhone,
      displayPhoneMasked: displayPhone,
      riskScoreSnapshot: 28,
      riskLevelSnapshot: RiskLevel.medium,
      totalApprovedReports: 2,
      lastReportAt: new Date(),
    },
  });

  await prisma.report.createMany({
    data: [
      {
        targetId: target.id,
        reporterIpHash: 'abc123',
        reportedName: 'Carlos P.',
        amountCents: 15000000n,
        incidentDate: new Date('2026-03-25'),
        fraudType: FraudType.fake_voucher,
        channel: Channel.whatsapp,
        description: 'Me envió un comprobante falso de Nequi.',
        status: ReportStatus.approved,
        dedupHash: 'hash1',
      },
      {
        targetId: target.id,
        reporterIpHash: 'def456',
        reportedName: 'Anónimo',
        amountCents: 5000000n,
        incidentDate: new Date('2026-03-28'),
        fraudType: FraudType.attempt,
        channel: Channel.facebook_marketplace,
        description: 'Intentó estafar con comprobante editado.',
        status: ReportStatus.approved,
        dedupHash: 'hash2',
      },
    ],
  });

  console.log('Seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
