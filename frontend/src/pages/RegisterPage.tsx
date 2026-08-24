import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/FormField";
import { AlertIcon } from "../components/common/Icon";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({ username, email, password });
      navigate("/profile");
    } catch {
      setError("Registration failed. Username or email may already be taken.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Create your account" description="Open a Midnight Bank account in under a minute.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={3}
          autoComplete="username"
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          helperText="At least 8 characters."
          autoComplete="new-password"
        />
        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-danger-50 px-3.5 py-2.5 text-sm text-danger-700">
            <AlertIcon size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <Button type="submit" loading={submitting} fullWidth size="lg" className="mt-1">
          Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
