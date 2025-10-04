import React from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Toolbar,
  Divider,
  Box,
  Typography,
  Button
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Warehouse as WarehouseIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  Receipt as ReceiptIcon,
  Notifications as NotificationsIcon,
  Assessment as AssessmentIcon,
  Logout as LogoutIcon
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";

const drawerWidth = 240;

const Sidebar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Updated navigation items to match your App.jsx routes
  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
    { label: "Customers", path: "/customers", icon: <PeopleIcon /> },
    { label: "Warehouses", path: "/warehouses", icon: <WarehouseIcon /> },
    { label: "Products", path: "/products", icon: <InventoryIcon /> }, // ✅ Added Products
    { label: "Batches", path: "/batches", icon: <InventoryIcon /> }, // ✅ Fixed path
    { label: "Stock Movement", path: "/stock-movements", icon: <TrendingUpIcon /> }, // ✅ Fixed path
    { label: "Sales Invoice", path: "/sales-invoice", icon: <ReceiptIcon /> }, // ✅ Fixed path
    { label: "Alerts", path: "/alerts", icon: <NotificationsIcon /> },
    { label: "Reports", path: "/reports", icon: <AssessmentIcon /> },
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: "border-box",
        },
      }}
    >
      <Toolbar />
      
      {/* User Info Section */}
      {user && (
        <Box sx={{ p: 2, textAlign: "center", backgroundColor: "#f5f5f5" }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {user.name || user.username}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {user.role || "User"}
          </Typography>
        </Box>
      )}

      <Divider />
      
      <List>
        {navItems.map((item) => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />
      
      {/* Logout Button */}
      <Box sx={{ mt: "auto", p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
