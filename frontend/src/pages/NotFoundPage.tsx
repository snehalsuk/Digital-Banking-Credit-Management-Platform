import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/common/Button";
import { GaugeIcon } from "../components/common/Icon";

export function NotFoundPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-5 bg-neutral-50 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-600">
        <GaugeIcon size={26} />
      </div>
      <div>
        <p className="text-sm font-semibold tracking-wide text-primary-600">404</p>
        <h1 className="mt-1 text-2xl font-semibold text-neutral-900">Page not found</h1>
        <p className="mt-2 max-w-sm text-sm text-neutral-500">
          The page you're looking for doesn't exist or may have moved.
        </p>
      </div>
      <Link to={isAuthenticated ? "/dashboard" : "/login"}>
        <Button>Back to {isAuthenticated ? "dashboard" : "login"}</Button>
      </Link>
    </div>
  );
}
