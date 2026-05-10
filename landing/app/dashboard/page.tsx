import FinanceDashboard from '@/components/dashboard/FinanceDashboard';

export const metadata = {
  title: 'Dashboard — IntelliHire Finance',
  description: 'Your personal finance dashboard with budget, transactions, and analytics.',
};

export default function DashboardPage() {
  return <FinanceDashboard />;
}
