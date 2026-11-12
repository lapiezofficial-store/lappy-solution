import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lapiez Rider App | Delivery Partner',
  description: 'Dedicated delivery partner app for Garhwa & Palamu dispatch, navigation, and payouts.',
  manifest: '/manifest-rider.json',
};

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

