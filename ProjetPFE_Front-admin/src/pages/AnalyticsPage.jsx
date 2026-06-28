import Header from "../components/common/Header";
import OverviewCards from "../components/analytics/OverviewCards";
import RevenueChart from "../components/analytics/RevenueChart";
import ChannelPerformance from "../components/analytics/ChannelPerformance";
import ProductPerformance from "../components/analytics/ProductPerformance";
import UserRetention from "../components/analytics/UserRetention";
import CustomerSegmentation from "../components/analytics/CustomerSegmentation";

const AnalyticsPage = () => {
  return (
    <div className='flex-1 overflow-auto relative z-10 bg-gray-50 min-h-screen'>
      <Header title="Analytics Dashboard" />

      <main className='max-w-7xl mx-auto py-6 px-4 lg:px-8 space-y-6'>
        <OverviewCards />
        <RevenueChart />

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <div className='space-y-6'>
            <UserRetention />
            <ProductPerformance />
          </div>
          
          <div className='space-y-6'>
            <ChannelPerformance />
            <CustomerSegmentation />
          </div>
        </div>

      </main>
    </div>
  );
};

export default AnalyticsPage;