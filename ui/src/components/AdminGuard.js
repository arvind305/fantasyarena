import { useIsAdmin } from '../hooks/useIsAdmin';

/**
 * Wraps admin pages — shows "Access Denied" for non-admin users.
 * This is a client-side UI gate only — all admin operations
 * are verified server-side in /api/admin/operations.
 */
export default function AdminGuard({ children }) {
  const isAdmin = useIsAdmin();
  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="card text-center py-12">
          <p className="text-red-400">Access Denied</p>
        </div>
      </div>
    );
  }
  return children;
}
