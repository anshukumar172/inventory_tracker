import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline, CircularProgress, Box, Typography } from "@mui/material";
import theme from "./theme";
import { ToastProvider } from "./context/ToastContext";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import CustomerMaster from "./pages/CustomerMaster";
import WarehouseView from "./pages/WarehouseView";
import SalesInvoiceBuilder from "./pages/SalesInvoiceBuilder";
import BatchManagement from "./pages/BatchManagement";
import StockMovement from "./pages/StockMovement";
import AlertsPage from "./pages/AlertsPage";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import ProductMaster from "./pages/productMaster";
// ✅ Import the new pages
import LowStockItems from "./pages/LowStockItems";
import ExpiringItems from "./pages/ExpiringItems";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    console.log("🚀 App mounted - forcing login page");
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      console.log("🔍 Starting authentication check...");
      
      // 🧹 FORCE LOGIN PAGE: Always clear auth on app start
      console.log("🧹 Clearing all authentication data - showing login page");
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      sessionStorage.clear();
      
      setUser(null);
      setLoading(false);
      setAuthChecked(true);
      
      console.log("✅ Auth cleared - login page will be shown");
      return;
      
    } catch (error) {
      console.error("💥 Authentication check error:", error);
      localStorage.clear();
      sessionStorage.clear();
      setUser(null);
    } finally {
      setLoading(false);
      setAuthChecked(true);
    }
  };

  const handleLoginSuccess = (userData) => {
    console.log("✅ Login successful:", userData.username);
    setUser(userData);
  };

  const handleLogout = () => {
    console.log("👋 Logging out...");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    sessionStorage.clear();
    setUser(null);
    // Force refresh to clear any cached data
    window.location.reload();
  };

  // Show loading spinner while checking authentication
  if (loading || !authChecked) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="100vh"
          flexDirection="column"
        >
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2, color: '#666' }}>
            Starting Application...
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: '#999' }}>
            Please wait a moment
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  console.log("🔍 Final render - User authenticated:", !!user);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Route - Login */}
            <Route 
              path="/login" 
              element={
                user ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Login onLoginSuccess={handleLoginSuccess} />
                )
              } 
            />
            
            {/* Protected Routes - Only if user is authenticated */}
            {user ? (
              <Route path="/" element={<MainLayout user={user} onLogout={handleLogout} />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="customers" element={<CustomerMaster />} />
                <Route path="warehouses" element={<WarehouseView />} />
                <Route path="products" element={<ProductMaster />} />
                <Route path="batches" element={<BatchManagement />} />
                <Route path="stock-movements" element={<StockMovement />} />
                <Route path="sales-invoice" element={<SalesInvoiceBuilder />} />
                <Route path="alerts" element={<AlertsPage />} />
                <Route path="reports" element={<Reports />} />
                {/* ✅ NEW ROUTES - Low Stock and Expiring Items */}
                <Route path="low-stock" element={<LowStockItems />} />
                <Route path="expiring-items" element={<ExpiringItems />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            ) : (
              /* Redirect all routes to login if not authenticated */
              <Route path="*" element={<Navigate to="/login" replace />} />
            )}
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
