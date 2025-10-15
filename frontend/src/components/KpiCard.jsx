// src/components/KpiCard.js
import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledCard = styled(Card)(({ theme, clickable }) => ({
  cursor: clickable ? "pointer" : "default",
  transition: "all 0.3s ease",
  "&:hover": {
    transform: clickable ? "translateY(-4px)" : "none",
    boxShadow: clickable 
      ? "0 8px 16px rgba(0,0,0,0.2)" 
      : theme.shadows[2],
  },
}));

export default function KpiCard({ title, value, clickable = false }) {
  return (
    <StyledCard clickable={clickable}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" component="div" fontWeight="bold">
          {typeof value === 'number' && title.includes('Value') 
            ? `₹${value.toLocaleString()}` 
            : value}
        </Typography>
        {clickable && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="primary">
              Click to view details →
            </Typography>
          </Box>
        )}
      </CardContent>
    </StyledCard>
  );
}
