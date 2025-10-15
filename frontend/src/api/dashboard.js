import axiosClient from './axiosClient';

export async function getKpis() {
  try {
    // ✅ Get actual counts from detail page endpoints
    const [dashboardData, lowStockData, expiringData] = await Promise.all([
      axiosClient.get("/dashboard/kpis").then(res => res.data),
      axiosClient.get("/stock/low-stock").then(res => res.data),
      axiosClient.get("/stock/expiring-items").then(res => res.data)
    ]);

    // ✅ Filter expiring items for 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const criticalExpiringItems = expiringData.filter(item => {
      const expiryDate = new Date(item.expiry_date);
      return expiryDate <= sevenDaysFromNow;
    });

    return {
      stockValue: dashboardData.stockValue || 0,
      lowStock: lowStockData.length, // ✅ 7 items
      expiringItems: criticalExpiringItems.length, // ✅ 1 item
    };
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    return { stockValue: 0, lowStock: 0, expiringItems: 0 };
  }
}

export function getRecentInvoices() {
  return axiosClient.get("/dashboard/invoices").then(res => res.data);
}
