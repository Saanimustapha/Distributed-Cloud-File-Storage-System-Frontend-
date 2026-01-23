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

import { loginUser } from "../../lib/auth/authApi";
import { tokenStorage } from "../../lib/auth/tokenStorage";

// ---- helpers ----
function getApiErrorMessage(err) {
  // FastAPI usually returns { detail: "..." } or { detail: [...] }
  const detail = err?.response?.data?.detail;
  if (!detail) return "Something went wrong. Please try again.";

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    // pydantic validation errors
    const first = detail[0];
    const msg = first?.msg || "Validation error.";
    return msg;
  }

  return "Request failed. Please try again.";
}

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      // expects { access_token, token_type }
      tokenStorage.set(data.access_token);
      navigate("/app/drive", { replace: true });
    },
  });

  const onSubmit = (values) => mutation.mutate(values);

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
                Sign in
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Access your Cloud Drive account.
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
                    label="Password"
                    type="password"
                    autoComplete="current-password"
                    fullWidth
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    {...register("password")}
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
                        <span>Signing in...</span>
                      </Stack>
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                </Stack>
              </Box>

              <Divider />

              <Typography variant="body2" color="text.secondary">
                Don&apos;t have an account?{" "}
                <Link component={RouterLink} to="/register" underline="hover">
                  Create one
                </Link>
              </Typography>

              <Typography variant="caption" color="text.secondary">
                Tip: Your backend login uses form-urlencoded and expects <b>username=email</b>.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
