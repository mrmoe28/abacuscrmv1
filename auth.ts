
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth.config';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';

// Re-export authOptions for API routes
export { authOptions };

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      isActive: true,
      territory: true,
      phone: true,
    }
  });

  return user;
}

export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

export function canAccessResource(userRole: UserRole, resourceOwner?: string, userId?: string): boolean {
  // Admin can access everything
  if (userRole === 'ADMIN') {
    return true;
  }
  
  // Manager can access most things
  if (userRole === 'MANAGER') {
    return true;
  }
  
  // Users can access their own resources
  if (resourceOwner && userId) {
    return resourceOwner === userId;
  }
  
  return false;
}

export const roleHierarchy: Record<UserRole, number> = {
  'ADMIN': 4,
  'MANAGER': 3,
  'SALES': 2,
  'INSTALLER': 1,
};

export function hasHigherRole(userRole: UserRole, targetRole: UserRole): boolean {
  return roleHierarchy[userRole] > roleHierarchy[targetRole];
}
