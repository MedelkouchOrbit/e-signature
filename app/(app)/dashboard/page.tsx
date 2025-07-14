'use client';

import { useClientRender } from '@/hooks/use-client-render';

export default function DashboardPage() {
  const { isClient, isLoading } = useClientRender();

  if (!isClient || isLoading) {
    return <div>Loading...</div>; // Replace with your loading component
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
      <p>This is a client-side rendered page.</p>
      {/* Add your dashboard components here */}
    </div>
  );
}