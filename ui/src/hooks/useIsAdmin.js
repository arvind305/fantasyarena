import { useAuth } from '../auth/AuthProvider';
import { getAdminEmail } from '../config';

/**
 * Hook to check if the current user is admin.
 * This is a client-side UI gate only — all admin operations
 * are verified server-side in /api/admin/operations.
 */
export function useIsAdmin() {
  const { user } = useAuth();
  const adminEmail = getAdminEmail();
  return user && adminEmail && user.email?.trim().toLowerCase() === adminEmail;
}
