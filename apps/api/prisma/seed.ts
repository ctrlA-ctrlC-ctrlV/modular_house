import { PrismaClient } from '@prisma/client';
import { AuthService } from '../src/services/auth.js';
import { logger } from '../src/middleware/logger.js';

const prisma = new PrismaClient();
const authService = new AuthService();

async function createAdminUser() {
  try {
    const email = 'admin@modular.house';
    const password = 'admin123!';
    
    // Check if admin user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      logger.info({ email }, 'Admin user already exists');
      return;
    }

    // Create admin user
    const result = await authService.createUser(email, password, ['admin']);
    
    if (result.success) {
      logger.info({ 
        userId: result.user?.id, 
        email: result.user?.email 
      }, 'Admin user created successfully');
      console.log('Admin user created:');
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
      console.log('You should change this password after first login.');
    } else {
      logger.error({ error: result.error }, 'Failed to create admin user');
    }
  } catch (error) {
    logger.error({ error }, 'Error creating admin user');
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();