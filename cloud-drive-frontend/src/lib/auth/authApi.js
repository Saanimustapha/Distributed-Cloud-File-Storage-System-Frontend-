import { http } from "../api/http";

export async function registerUser(payload) {
  // payload: { email, username, password }
  const { data } = await http.post("/auth/register", payload);
  return data;
}

export async function loginUser({ email, password }) {
  // backend expects x-www-form-urlencoded with username=email
  const form = new URLSearchParams();
  form.set("username", email);
  form.set("password", password);

  const { data } = await http.post("/auth/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return data; // { access_token, token_type }
}
