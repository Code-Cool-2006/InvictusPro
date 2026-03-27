import "./App.css";

function Dashboard({ user, userRole }) {
  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.reload();
  };

  const renderAdminDashboard = () => (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Admin Dashboard - Invictus</h1>
        <div className="user-info">
          <span>Welcome, Admin {user.email}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-card">
          <h2>Admin Control Panel</h2>
          <p>Manage the Invictus platform as an administrator.</p>
          <div className="admin-features">
            <div className="feature-card">
              <h3>User Management</h3>
              <p>Manage volunteers, donors, and user accounts</p>
              <button className="feature-btn">Manage Users</button>
            </div>
            <div className="feature-card">
              <h3>System Settings</h3>
              <p>Configure platform settings and preferences</p>
              <button className="feature-btn">System Config</button>
            </div>
            <div className="feature-card">
              <h3>Reports & Analytics</h3>
              <p>View platform statistics and reports</p>
              <button className="feature-btn">View Reports</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  const renderVolunteerDashboard = () => (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Volunteer Dashboard - Invictus</h1>
        <div className="user-info">
          <span>Welcome, Volunteer {user.email}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-card">
          <h2>Volunteer Portal</h2>
          <p>
            Contribute to Invictus causes and track your volunteer activities.
          </p>
          <div className="volunteer-features">
            <div className="feature-card">
              <h3>Available Opportunities</h3>
              <p>Browse and sign up for volunteer opportunities</p>
              <button className="feature-btn">Find Opportunities</button>
            </div>
            <div className="feature-card">
              <h3>My Activities</h3>
              <p>Track your volunteer hours and activities</p>
              <button className="feature-btn">View Activities</button>
            </div>
            <div className="feature-card">
              <h3>Community Events</h3>
              <p>Join community events and gatherings</p>
              <button className="feature-btn">Browse Events</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  const renderDonorDashboard = () => (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Donor Dashboard - Invictus</h1>
        <div className="user-info">
          <span>Welcome, Donor {user.email}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-card">
          <h2>Donation Portal</h2>
          <p>
            Support Invictus causes and track your charitable contributions.
          </p>
          <div className="donor-features">
            <div className="feature-card">
              <h3>Make a Donation</h3>
              <p>Contribute to various Invictus initiatives</p>
              <button className="feature-btn">Donate Now</button>
            </div>
            <div className="feature-card">
              <h3>Donation History</h3>
              <p>View your past donations and impact</p>
              <button className="feature-btn">View History</button>
            </div>
            <div className="feature-card">
              <h3>Tax Receipts</h3>
              <p>Download tax-deductible receipts</p>
              <button className="feature-btn">Get Receipts</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  if (userRole === "Admin") {
    return renderAdminDashboard();
  } else if (userRole === "Volunteer") {
    return renderVolunteerDashboard();
  } else if (userRole === "Donors") {
    return renderDonorDashboard();
  }

  // Default dashboard if role is not set
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Welcome to Invictus Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user.email}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-card">
          <h2>Dashboard Overview</h2>
          <p>You are successfully logged in!</p>
          <div className="user-details">
            <h3>User Information:</h3>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>User ID:</strong> {user.uid}
            </p>
            <p>
              <strong>Email Verified:</strong>{" "}
              {user.emailVerified ? "Yes" : "No"}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
