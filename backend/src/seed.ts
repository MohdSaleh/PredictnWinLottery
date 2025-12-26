import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // 1. Create default users
  console.log('Creating users...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const agentPassword = await bcrypt.hash('agent123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password_hash: adminPassword,
      name: 'System Administrator',
      email: 'admin@lottery.com',
      role: 'ADMIN',
      is_active: true,
    },
  });

  const testAgent = await prisma.user.upsert({
    where: { username: 'agent1' },
    update: {},
    create: {
      username: 'agent1',
      password_hash: agentPassword,
      name: 'Test Agent',
      email: 'agent1@lottery.com',
      role: 'AGENT',
      is_active: true,
    },
  });

  console.log(`✅ Created users: admin (${admin.id}), agent1 (${testAgent.id})`);

  // 2. Create exactly 4 default sections (as per DB_SEED_REQUIREMENTS.md)
  console.log('Creating sections...');
  
  const sections = [
    {
      name: 'DEAR 1:00 PM',
      code: 'DEAR_1PM',
      draw_time_local: '13:00',
      cutoff_offset_minutes: 5,
      series_config: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'], // 12 series
    },
    {
      name: 'LSK 3:00 PM',
      code: 'LSK_3PM',
      draw_time_local: '15:00',
      cutoff_offset_minutes: 5,
      series_config: ['A', 'B', 'C', 'D', 'E', 'F'], // 6 series
    },
    {
      name: 'DEAR 6:00 PM',
      code: 'DEAR_6PM',
      draw_time_local: '18:00',
      cutoff_offset_minutes: 5,
      series_config: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'], // 12 series
    },
    {
      name: 'DEAR 8:00 PM',
      code: 'DEAR_8PM',
      draw_time_local: '20:00',
      cutoff_offset_minutes: 5,
      series_config: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'], // 12 series
    },
  ];

  const createdSections = [];
  for (const sectionData of sections) {
    const section = await prisma.section.upsert({
      where: { code: sectionData.code },
      update: {},
      create: sectionData,
    });
    createdSections.push(section);
    console.log(`✅ Created section: ${section.name} (${section.id})`);
  }

  // 3. Create digit groups (1, 2, 3)
  console.log('Creating game groups...');
  
  const gameGroups = [
    { digit_count: 1, name: '1 Digit' },
    { digit_count: 2, name: '2 Digit' },
    { digit_count: 3, name: '3 Digit' },
  ];

  const createdGroups = [];
  for (const groupData of gameGroups) {
    const group = await prisma.gameGroup.upsert({
      where: { digit_count: groupData.digit_count },
      update: {},
      create: groupData,
    });
    createdGroups.push(group);
    console.log(`✅ Created game group: ${group.name} (${group.id})`);
  }

  // 4. Link sections to all digit groups
  console.log('Creating section-group links...');
  for (const section of createdSections) {
    for (const group of createdGroups) {
      await prisma.sectionGroup.upsert({
        where: {
          section_id_group_id: {
            section_id: section.id,
            group_id: group.id,
          },
        },
        update: {},
        create: {
          section_id: section.id,
          group_id: group.id,
          is_active: true,
        },
      });
    }
  }
  console.log('✅ Linked sections to game groups');

  // 5. Create default sales groups (dropdown 1)
  console.log('Creating sales groups...');
  
  const salesGroup = await prisma.salesGroup.upsert({
    where: { name: 'Default Group' },
    update: {},
    create: {
      name: 'Default Group',
      is_active: true,
    },
  });
  console.log(`✅ Created sales group: ${salesGroup.name} (${salesGroup.id})`);

  // 6. Create default sales sub-groups (dropdown 2 / books)
  console.log('Creating sales sub-groups...');
  
  const subGroups = [
    { name: 'Book A', book_code: 'BOOK-A' },
    { name: 'Book B', book_code: 'BOOK-B' },
    { name: 'Book C', book_code: 'BOOK-C' },
  ];

  const createdSubGroups = [];
  for (const subGroupData of subGroups) {
    const subGroup = await prisma.salesSubGroup.upsert({
      where: {
        sales_group_id_name: {
          sales_group_id: salesGroup.id,
          name: subGroupData.name,
        },
      },
      update: {},
      create: {
        sales_group_id: salesGroup.id,
        ...subGroupData,
        is_active: true,
      },
    });
    createdSubGroups.push(subGroup);
    console.log(`✅ Created sales sub-group: ${subGroup.name} (${subGroup.id})`);
  }

  // 7. Create schemes (pricing structures)
  console.log('Creating schemes...');
  
  const schemes = [
    { name: 'SET-1', digit_count: 1, pattern_type: 'SET', base_price: 1.0, payout_rate: 9.0, commission_rate: 10.0 },
    { name: 'SET-2', digit_count: 2, pattern_type: 'SET', base_price: 1.0, payout_rate: 90.0, commission_rate: 10.0 },
    { name: 'SET-3', digit_count: 3, pattern_type: 'SET', base_price: 1.0, payout_rate: 900.0, commission_rate: 10.0 },
    { name: 'ANY-1', digit_count: 1, pattern_type: 'ANY', base_price: 1.0, payout_rate: 9.0, commission_rate: 10.0 },
    { name: 'ANY-2', digit_count: 2, pattern_type: 'ANY', base_price: 1.0, payout_rate: 45.0, commission_rate: 10.0 },
    { name: 'ANY-3', digit_count: 3, pattern_type: 'ANY', base_price: 1.0, payout_rate: 150.0, commission_rate: 10.0 },
    { name: 'BOXK-3', digit_count: 3, pattern_type: 'BOXK', base_price: 1.0, payout_rate: 150.0, commission_rate: 10.0 },
    { name: 'ALL-3', digit_count: 3, pattern_type: 'ALL', base_price: 1.0, payout_rate: 900.0, commission_rate: 10.0 },
  ];

  for (const schemeData of schemes) {
    await prisma.scheme.upsert({
      where: { name: schemeData.name },
      update: {},
      create: schemeData,
    });
    console.log(`✅ Created scheme: ${schemeData.name}`);
  }

  // 8. Create ticket products
  console.log('Creating ticket products...');
  
  const products = ['SET', 'ANY', 'BOXK', 'ALL'];
  for (const productName of products) {
    await prisma.ticketProduct.upsert({
      where: { name: productName },
      update: {},
      create: { name: productName, is_active: true },
    });
    console.log(`✅ Created ticket product: ${productName}`);
  }

  // 9. Create a sales ticket assignment for the test agent
  console.log('Creating sales ticket assignment...');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.salesTicketAssignment.upsert({
    where: {
      user_id_section_id_date_game_group_id_sales_sub_group_id: {
        user_id: testAgent.id,
        section_id: createdSections[0].id, // DEAR 1:00 PM
        date: today,
        game_group_id: createdGroups[2].id, // 3 Digit
        sales_sub_group_id: createdSubGroups[0].id, // Book A
      },
    },
    update: {},
    create: {
      user_id: testAgent.id,
      section_id: createdSections[0].id,
      date: today,
      game_group_id: createdGroups[2].id,
      sales_group_id: salesGroup.id,
      sales_sub_group_id: createdSubGroups[0].id,
      is_console: false,
      is_active: true,
    },
  });
  console.log('✅ Created sales ticket assignment for test agent');

  // 10. Create credit limit for test agent
  console.log('Creating credit limit...');
  
  await prisma.creditLimit.upsert({
    where: { user_id: testAgent.id },
    update: {},
    create: {
      user_id: testAgent.id,
      limit_amount: 10000.0,
      used_amount: 0.0,
      is_active: true,
    },
  });
  console.log('✅ Created credit limit for test agent');

  console.log('\n========================================');
  console.log('✅ Database seed completed successfully!');
  console.log('========================================');
  console.log('\nSeed Summary:');
  console.log(`- Users: 2 (admin, agent1)`);
  console.log(`- Sections: ${createdSections.length} (DEAR 1PM, LSK 3PM, DEAR 6PM, DEAR 8PM)`);
  console.log(`- Game Groups: ${createdGroups.length} (1, 2, 3 digit)`);
  console.log(`- Sales Groups: 1`);
  console.log(`- Sales Sub-Groups: ${createdSubGroups.length}`);
  console.log(`- Schemes: ${schemes.length}`);
  console.log(`- Ticket Products: ${products.length}`);
  console.log('\nTest Credentials:');
  console.log('- Admin: username=admin, password=admin123');
  console.log('- Agent: username=agent1, password=agent123');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
