import React, { createContext, useContext, useState } from "react";
import { Snackbar, Alert } from "@mui/material";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "info", // "success" | "error" | "warning" | "info"
  });

  const showToast = (message, severity = "info") => {
    setToast({ open: true, message, severity });
  };

  const handleClose = () => {
    setToast(prev => ({ ...prev, open: false }));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleClose} severity={toast.severity} sx={{ width: "100%" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
