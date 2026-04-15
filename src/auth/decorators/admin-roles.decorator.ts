import { SetMetadata } from '@nestjs/common';
import { AdminRole } from '../../users/enums/admin-role.enum';

export const ADMIN_ROLES_KEY = 'adminRoles';

/**
 * Restringe un endpoint a uno o más adminRoles.
 * Solo funciona para usuarios con userType = ADMIN.
 *
 * Uso:
 *   @AdminRoles(AdminRole.SUPER_ADMIN)          ← solo super admin
 *   @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)  ← ambos
 */
export const AdminRoles = (...roles: AdminRole[]) =>
  SetMetadata(ADMIN_ROLES_KEY, roles);
