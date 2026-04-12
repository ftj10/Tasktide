import { useState } from "react";
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Alert,
  InputAdornment,
  IconButton
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { setAuth } from "../app/storage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function LoginPage({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // State to track if the password should be visible
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const endpoint = isRegistering ? "/register" : "/login";

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      if (isRegistering) {
        setIsRegistering(false);
        setError("Registration successful! Please log in.");
        setUsername("");
        setPassword("");
      } else {
        setAuth(data.token, data.username);
        onLoginSuccess();
      }
    } catch (err: any) {
      setError(err.message);
      // Clear ONLY the password if login/register fails
      setPassword("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
      <Paper sx={{ p: 4, width: "100%", maxWidth: 400, textAlign: "center" }} elevation={3}>
        <Typography variant="h5" gutterBottom>
          {isRegistering ? "Create an Account" : "Welcome Back"}
        </Typography>

        {error && (
          <Alert severity={error.includes("successful") ? "success" : "error"} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Username"
            variant="outlined"
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <TextField
            fullWidth
            label="Password"
            // NEW: Toggle between "text" and "password" based on state
            type={showPassword ? "text" : "password"}
            variant="outlined"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            // Add the eye icon button inside the input field
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 2, py: 1.5 }}
            disabled={isLoading}
          >
            {isLoading ? "Please wait..." : isRegistering ? "Register" : "Login"}
          </Button>
        </form>

        <Button
          fullWidth
          variant="text"
          sx={{ mt: 2 }}
          onClick={() => {
            setIsRegistering(!isRegistering);
            setError("");
            // Clear both fields when switching modes
            setUsername("");
            setPassword("");
            setShowPassword(false); // Reset password visibility too
          }}
        >
          {isRegistering
            ? "Already have an account? Log in"
            : "Don't have an account? Register"}
        </Button>
      </Paper>
    </Box>
  );
}