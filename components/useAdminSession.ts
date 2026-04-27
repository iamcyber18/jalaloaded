'use client';

import { useCallback, useEffect, useState } from 'react';

type AdminRole = 'admin' | 'sub-admin';

type AdminSession = {
  username: string;
  displayName: string;
  role: AdminRole;
  userId?: string;
};

type AdminPermissions = {
  canCreatePosts: boolean;
  canAllowComments: boolean;
  canFeaturePosts: boolean;
  canViewOwnPostsOnly: boolean;
  canChangePassword: boolean;
  canManageSubAdmins: boolean;
  canManageAdverts: boolean;
};

type SessionResponse = {
  session: AdminSession | null;
  permissions: AdminPermissions | null;
};

export function useAdminSession() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [permissions, setPermissions] = useState<AdminPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session', {
        method: 'GET',
        cache: 'no-store',
      });

      if (!res.ok) {
        setSession(null);
        setPermissions(null);
        return;
      }

      const data = (await res.json()) as SessionResponse;
      setSession(data.session ?? null);
      setPermissions(data.permissions ?? null);
    } catch {
      setSession(null);
      setPermissions(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      setLoading(true);

      try {
        const res = await fetch('/api/auth/session', {
          method: 'GET',
          cache: 'no-store',
        });

        if (!isMounted) {
          return;
        }

        if (!res.ok) {
          setSession(null);
          setPermissions(null);
          return;
        }

        const data = (await res.json()) as SessionResponse;
        setSession(data.session ?? null);
        setPermissions(data.permissions ?? null);
      } catch {
        if (!isMounted) {
          return;
        }

        setSession(null);
        setPermissions(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  return { session, permissions, loading, refreshSession };
}
