import React, { useState } from "react";
import {
  Container,
  Box,
  TextField,
  Typography,
  Button,
  Alert,
  Paper,
  CircularProgress
} from "@mui/material";
import axiosClient from "../api/axiosClient";

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    setError("");
    setLoading(true);

    try {
      console.log("Attempting login with:", { username });
      
      const response = await axiosClient.post("/auth/login", {
        username: username.trim(),
        password: password.trim()
      });

      console.log("Login response:", response.data);

      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error("Invalid response from server");
      }

      // Store token and user data
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      console.log("Login successful, calling onLoginSuccess");
      onLoginSuccess(user);

    } catch (err) {
      console.error("Login error:", err);
      
      let errorMessage = "Login failed. Please try again.";
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.status === 401) {
        errorMessage = "Invalid username or password";
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        errorMessage = "Cannot connect to server. Please check if the backend is running.";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: "100%" }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Inventory Tracker
          </Typography>
          
          <Typography component="h2" variant="h6" align="center" color="textSecondary" gutterBottom>
            Sign In
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || !username.trim() || !password.trim()}
            >
              {loading ? <CircularProgress size={24} /> : "Sign In"}
            </Button>
          </Box>

          <Box sx={{ mt: 2, p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
            <Typography variant="body2" color="textSecondary">
              <strong>Demo Credentials:</strong><br />
              Username: admin<br />
              Password: admin123
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
