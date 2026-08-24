import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export function NavBar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        Banking App
      </Link>
      <div className="nav-links">
        {isAuthenticated ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/accounts">Accounts</Link>
            <Link to="/loans">Loans</Link>
            <Link to="/credit-score">Credit Score</Link>
            <Link to="/profile">Profile</Link>
            {user?.role === "ADMIN" && <Link to="/admin/audit">Audit</Link>}
            <button type="button" onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
