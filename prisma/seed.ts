import { PrismaClient, SiteSettings, UserRole } from '@prisma/client';
import { settingsToDefault } from '../src/utils/utils';
import { EMAIL_REGEX } from '../src/utils/constants';
const prisma = new PrismaClient();

// Update this variable with your email address to add yourself as STAFF
const YOUR_EMAIL_ADDRESS = 'lawrence.wu@berkeley.edu';

async function main() {
  if (!YOUR_EMAIL_ADDRESS.match(EMAIL_REGEX)) {
    throw new Error('Please set YOUR_EMAIL_ADDRESS in seed.ts');
  }

  await prisma.confirmedUser.create({
    data: {
      email: YOUR_EMAIL_ADDRESS,
      role: UserRole.STAFF,
    },
  });

  // Add initial settings
  for (const key of Object.keys(settingsToDefault)) {
    const setting = key as SiteSettings;
    await prisma.settings.upsert({
      where: { setting },
      update: {},
      create: {
        setting,
        value: settingsToDefault[setting],
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log(`Seeding complete. added ${YOUR_EMAIL_ADDRESS} as STAFF and initial settings`);
  })
  .catch(async e => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
