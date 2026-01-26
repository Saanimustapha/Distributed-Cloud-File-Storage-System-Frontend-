import React from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Link,
  Stack,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";

import { registerUser } from "../../lib/auth/authApi";

// ---- helpers ----
function getApiErrorMessage(err) {
  // Network / CORS / backend down
  if (!err?.response) {
    return err?.message || "Network error (check backend URL + CORS + Docker port mapping).";
  }

  const status = err.response.status;
  const data = err.response.data;

  const detail = data?.detail;
  if (typeof detail === "string") return `${status}: ${detail}`;
  if (Array.isArray(detail)) return `${status}: ${detail?.[0]?.msg || "Validation error"}`;

  if (typeof data?.message === "string") return `${status}: ${data.message}`;

  return `${status}: Request failed`;
}


const schema = z
  .object({
    email: z.string().email("Enter a valid email address"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username is too long"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password is too long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((val) => val.password === val.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function RegisterPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "", username: "", password: "", confirmPassword: "" },
    mode: "onTouched",
  });

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      navigate("/login", { replace: true });
    },
  });

  const onSubmit = (values) => {
    // backend expects { email, username, password }
    mutation.mutate({
      email: values.email,
      username: values.username,
      password: values.password,
    });
  };

  const loading = isSubmitting || mutation.isPending;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        bgcolor: "background.default",
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Card elevation={4}>
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={2}>
              <Typography variant="h4" fontWeight={700}>
                Create account
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Register to start using Cloud Drive.
              </Typography>

              {(mutation.isError || mutation.error) && (
                <Alert severity="error">{getApiErrorMessage(mutation.error)}</Alert>
              )}

              <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <Stack spacing={2}>
                  <TextField
                    label="Email"
                    type="email"
                    autoComplete="email"
                    fullWidth
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    {...register("email")}
                  />

                  <TextField
                    label="Username"
                    autoComplete="username"
                    fullWidth
                    error={!!errors.username}
                    helperText={errors.username?.message}
                    {...register("username")}
                  />

                  <TextField
                    label="Password"
                    type="password"
                    autoComplete="new-password"
                    fullWidth
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    {...register("password")}
                  />

                  <TextField
                    label="Confirm password"
                    type="password"
                    autoComplete="new-password"
                    fullWidth
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword?.message}
                    {...register("confirmPassword")}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    fullWidth
                    sx={{ py: 1.2 }}
                  >
                    {loading ? (
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <CircularProgress size={18} />
                        <span>Creating account...</span>
                      </Stack>
                    ) : (
                      "Create account"
                    )}
                  </Button>
                </Stack>
              </Box>

              <Divider />

              <Typography variant="body2" color="text.secondary">
                Already have an account?{" "}
                <Link component={RouterLink} to="/login" underline="hover">
                  Sign in
                </Link>
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
