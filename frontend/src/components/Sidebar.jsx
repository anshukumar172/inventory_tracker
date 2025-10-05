import React, { useEffect, useState } from "react";
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
  Button,
  Badge
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
  Logout as LogoutIcon,
  Inventory2 as Inventory2Icon
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchActiveAlerts } from "../api/alerts";

const drawerWidth = 240;

const Sidebar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [alertCount, setAlertCount] = useState(0);

  // ✅ Navigation items
  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
    { label: "Customers", path: "/customers", icon: <PeopleIcon /> },
    { label: "Warehouses", path: "/warehouses", icon: <WarehouseIcon /> },
    { label: "Products", path: "/products", icon: <InventoryIcon /> },
    { label: "Batches", path: "/batches", icon: <Inventory2Icon /> },
    { label: "Stock Movement", path: "/stock-movements", icon: <TrendingUpIcon /> },
    { label: "Sales Invoice", path: "/sales-invoice", icon: <ReceiptIcon /> },
    { 
      label: "Alerts", 
      path: "/alerts", 
      icon: <NotificationsIcon />,
      showBadge: true 
    },
    { label: "Reports", path: "/reports", icon: <AssessmentIcon /> },
  ];

  // ✅ Load alert count on mount and refresh periodically
  useEffect(() => {
    const loadAlertCount = async () => {
      try {
        const response = await fetchActiveAlerts();
        setAlertCount(response.data?.length || 0);
      } catch (error) {
        console.error('Failed to fetch alert count:', error);
        setAlertCount(0);
      }
    };

    // Load immediately
    loadAlertCount();

    // Refresh every 2 minutes
    const interval = setInterval(loadAlertCount, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

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
              <ListItemIcon>
                {item.showBadge ? (
                  <Badge 
                    badgeContent={alertCount} 
                    color="error"
                    max={99}
                  >
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
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
