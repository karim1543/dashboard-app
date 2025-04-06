'use client';
import SalesChart from '@/components/charts/LineChart';
import useChartData from '@/hooks/useChartData';
import { useAuth } from '@/context/AuthContext';
export default function DashboardPage() {
  const { chartData, loading } = useChartData();
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <div>Please log in to view this content</div>;
  }
  if (loading) {
    return <div className="p-6">Loading chart data...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Sales Dashboard</h1>
      
      <div className="bg-white p-4 rounded shadow mb-8">
        {chartData ? (
          <SalesChart data={chartData} />
        ) : (
          <p>No chart data available</p>
        )}
      </div>

      {/* Add your DataTable here */}
    </div>
  );
}