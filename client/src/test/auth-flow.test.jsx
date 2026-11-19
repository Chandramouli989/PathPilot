import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import api from "../api/axios";
import { AuthProvider } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";
import Login from "../pages/Login";

vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="current-path">{location.pathname}</output>;
}

function TestApp({ initialPath = "/private", privateContent = "Private workspace" }) {
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <LocationProbe />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/private" element={<h1>{privateContent}</h1>} />
            <Route path="/dashboard" element={<h1>Dashboard loaded</h1>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
  api.get.mockReset();
  api.post.mockReset();
});

describe("PathPilot frontend authentication flows", () => {
  it("redirects unauthenticated visitors away from protected routes", async () => {
    render(<TestApp />);
    await waitFor(() => expect(screen.getByTestId("current-path")).toHaveTextContent("/login"));
    expect(screen.queryByText("Private workspace")).not.toBeInTheDocument();
  });

  it("shows a session-checking state while restoring a saved session", async () => {
    localStorage.setItem("token", "valid-test-token");
    let resolveProfile;
    api.get.mockReturnValueOnce(new Promise((resolve) => { resolveProfile = resolve; }));

    render(<TestApp />);
    expect(screen.getByText("Checking your session...")).toBeInTheDocument();

    resolveProfile({ data: { user: { name: "Test User", email: "test@example.com" } } });
    expect(await screen.findByText("Private workspace")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith("/users/profile");
  });

  it("clears an invalid saved token and redirects to login", async () => {
    localStorage.setItem("token", "expired-token");
    api.get.mockRejectedValueOnce({ response: { status: 401, data: { message: "Unauthorized" } } });

    render(<TestApp />);
    await waitFor(() => expect(screen.getByTestId("current-path")).toHaveTextContent("/login"));
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("logs in, stores the token, loads the profile and navigates to dashboard", async () => {
    api.post.mockResolvedValueOnce({ data: { token: "new-test-token" } });
    api.get.mockResolvedValueOnce({ data: { user: { name: "Test User", email: "test@example.com" } } });

    render(<TestApp initialPath="/login" />);
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "StrongPass123!" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("Dashboard loaded")).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith("/auth/login", {
      email: "test@example.com",
      password: "StrongPass123!",
    });
    expect(localStorage.getItem("token")).toBe("new-test-token");
  });

  it("shows a useful message when login fails", async () => {
    api.post.mockRejectedValueOnce({ response: { data: { message: "Invalid email or password" } } });

    render(<TestApp initialPath="/login" />);
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "wrong@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "wrong-password" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("Invalid email or password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeEnabled();
    expect(screen.getByTestId("current-path")).toHaveTextContent("/login");
  });

  it("prevents an empty login form from submitting", () => {
    render(<TestApp initialPath="/login" />);
    const email = screen.getByLabelText(/email address/i);
    const password = screen.getByLabelText(/password/i);
    expect(email).toBeRequired();
    expect(password).toBeRequired();
    expect(email).toHaveAttribute("type", "email");
    expect(password).toHaveAttribute("type", "password");
    expect(email).toBeInvalid();
  });
});
