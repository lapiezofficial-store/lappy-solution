'use client';

import React, { useEffect } from 'react';
import AdminPage from '../admin/page';

export default function SecretAdminHQPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lapiez_secret_admin_authorized', 'true');
    }
  }, []);

  return <AdminPage />;
}
