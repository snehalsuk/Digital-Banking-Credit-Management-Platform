import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="dashboard-page">
      <h1>Welcome{user ? `, ${user.username}` : ""}</h1>
      <p>Role: {user?.role}</p>
      <p>
        This is a placeholder dashboard. Accounts, transactions, loans, and credit-score lookup are built in later
        phases of this project.
      </p>
      <p>
        <Link to="/profile">Manage your KYC profile</Link>
      </p>
    </div>
  );
}
