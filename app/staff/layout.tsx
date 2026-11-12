import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lapiez Staff App | Showroom & Warranty Desk',
  description: 'Dedicated showroom staff terminal for order dispatch, counter handovers, and warranty claims.',
  manifest: '/manifest-staff.json',
};

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

