import { useState, useEffect } from "react";
import api from "./api";
import jsPDF from "jspdf";
import { format } from "date-fns";
import "./App.css";

function DonorDashboard({ user }) {
  const [activeSection, setActiveSection] = useState("overview");
  const [donorProfile, setDonorProfile] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState("");
  const [donationType, setDonationType] = useState("money");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("money");

  const loadDonorData = async () => {
    try {
      const { data } = await api.get("/donors/profile");
      setDonorProfile(data);

      const donsResponse = await api.get("/donations/my-donations");
      setDonations(donsResponse.data);
    } catch (error) {
      console.error("Error loading donor data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonorData();
  }, [user]);

  const handleDonate = async (e) => {
    if (e) e.preventDefault();
    
    const payload = {
      category: category,
      description: description,
    };

    if (category === "money") {
      const donationAmount = parseFloat(customAmount);
      if (isNaN(donationAmount) || donationAmount <= 0) {
        alert("Please enter a valid donation amount.");
        return;
      }
      payload.amount = donationAmount;
    } else {
      payload.quantity = parseFloat(quantity);
      payload.unit = unit;
    }

    try {
      await api.post("/donations", payload);
      alert(`Thank you for your generous donation!`);
      setCustomAmount("");
      setDescription("");
      setQuantity("");
      setUnit("");
      loadDonorData();
    } catch (error) {
      console.error("Error making donation:", error);
      alert("Error processing donation. Please try again.");
    }
  };

  const generateReceipt = (donation) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("Donation Receipt", 105, 30, { align: "center" });
    doc.setFontSize(16);
    doc.text("Invictus Organization", 105, 50, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Receipt No: ${donation._id.substring(0, 8).toUpperCase()}`, 20, 70);
    doc.text(`Date: ${format(new Date(donation.date), "PPP")}`, 20, 80);
    doc.text(`Donor: ${donation.donorName}`, 20, 90);
    doc.text(`Email: ${user.email}`, 20, 100);
    if (donorProfile?.panCard) {
      doc.text(`PAN: ${donorProfile.panCard}`, 20, 110);
    }

    doc.line(20, 120, 190, 120);
    doc.text("Description", 20, 130);
    doc.text("Amount", 170, 130);
    doc.line(20, 135, 190, 135);

    doc.text(`Donation for ${donation.category}`, 20, 145);
    doc.text(`${donation.amount ? '$' + donation.amount.toFixed(2) : 'Item Donation'}`, 170, 145);

    doc.line(20, 155, 190, 155);
    doc.setFont(undefined, "bold");
    doc.text("Total", 20, 165);
    doc.text(`${donation.amount ? '$' + donation.amount.toFixed(2) : 'N/A'}`, 170, 165);

    doc.setFont(undefined, "normal");
    doc.setFontSize(10);
    doc.text(
      "This receipt is valid for tax exemption under section 80G.",
      105,
      190,
      { align: "center" }
    );
    doc.text("Thank you for your support!", 105, 200, { align: "center" });

    doc.save(`Invictus_Receipt_${donation._id.substring(0, 8)}.pdf`);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.reload();
  };

  const renderOverview = () => (
    <div className="dashboard-card">
      <h2>Donation Portal</h2>
      <p>Support Invictus causes and track your charitable contributions.</p>
      <div className="donor-features">
        <div
          className="feature-card"
          onClick={() => setActiveSection("donate")}
        >
          <h3>Make a Donation</h3>
          <p>Contribute to various Invictus initiatives</p>
          <button className="feature-btn">Donate Now</button>
        </div>
        <div
          className="feature-card"
          onClick={() => setActiveSection("history")}
        >
          <h3>Donation History</h3>
          <p>View your past donations and impact</p>
          <button className="feature-btn">View History</button>
        </div>
        <div
          className="feature-card"
          onClick={() => setActiveSection("receipts")}
        >
          <h3>Tax Receipts</h3>
          <p>Download tax-deductible receipts</p>
          <button className="feature-btn">Get Receipts</button>
        </div>
        <div
          className="feature-card"
          onClick={() => setActiveSection("profile")}
        >
          <h3>My Profile</h3>
          <p>Update your details and tax info</p>
          <button className="feature-btn">Edit Profile</button>
        </div>
      </div>
    </div>
  );

  const renderDonate = () => (
    <div className="dashboard-card">
      <div className="section-header">
        <button
          className="back-btn"
          onClick={() => setActiveSection("overview")}
        >
          ← Back to Overview
        </button>
        <h2>Make a Donation</h2>
      </div>
      <div className="donate-content">
        <div className="donation-options">
          <div className="option-card">
            <h3>Support Our Cause</h3>
            <form onSubmit={handleDonate}>
              <div className="form-group">
                <label>Category</label>
                <select 
                  className="form-control" 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="money">Money</option>
                  <option value="food">Food</option>
                  <option value="clothes">Clothes</option>
                  <option value="medicine">Medicine</option>
                  <option value="services">Services</option>
                  <option value="others">Others</option>
                </select>
              </div>

              {category === "money" ? (
                <div className="form-group">
                  <label>Amount ($)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Enter amount"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label>Description</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Rice, Blankets, Masks"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Quantity</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Qty"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Unit</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="kg, pcs, etc."
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </>
              )}
              
              <button type="submit" className="action-btn primary" style={{ marginTop: '20px' }}>
                Donate Now
              </button>
            </form>
          </div>
          
          <div className="option-card">
            <h3>Recurring Impact</h3>
            <p>Become a sustaining donor with monthly contributions</p>
            <div className="impact-highlights">
              <h4>Settings</h4>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={donorProfile?.remindersEnabled || false}
                    onChange={async (e) => {
                      try {
                        await api.put("/donors/profile", {
                          remindersEnabled: e.target.checked,
                        });
                        loadDonorData();
                      } catch (err) {
                        console.error("Error updating reminders:", err);
                      }
                    }}
                  />
                  Enable Recurring Reminders
                </label>
                <p className="setting-hint">
                  We'll send you email notifications for your contributions.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="impact-highlights">
          <h3>Your Impact</h3>
          <div className="impact-grid">
            <div className="impact-item">
              <span className="impact-icon">🏠</span>
              <p>$25 provides shelter for one night</p>
            </div>
            <div className="impact-item">
              <span className="impact-icon">🍽️</span>
              <p>$10 feeds a family for a day</p>
            </div>
            <div className="impact-item">
              <span className="impact-icon">📚</span>
              <p>$50 supports educational programs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="dashboard-card">
      <div className="section-header">
        <button
          className="back-btn"
          onClick={() => setActiveSection("overview")}
        >
          ← Back to Overview
        </button>
        <h2>Donation History</h2>
      </div>
      <div className="history-content">
        <div className="donation-stats">
          <div className="stat-card">
            <h3>Total Donated</h3>
            <p className="stat-number">${donorProfile?.totalDonated || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Donations Made</h3>
            <p className="stat-number">{donorProfile?.donationCount || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Impact Score</h3>
            <p className="stat-number">
              {Math.floor((donorProfile?.totalDonated || 0) / 10)}
            </p>
          </div>
        </div>
        <div className="donation-log">
          <h3>Recent Donations</h3>
          {donations.length > 0 ? (
            donations.map((donation) => (
              <div key={donation._id} className="donation-item">
                <div className="donation-info">
                  <h4>{donation.category}</h4>
                  <p>Supporting community initiatives</p>
                  <span>
                    📅 {format(new Date(donation.date), "MMM dd, yyyy")} • $
                    {donation.amount}
                  </span>
                </div>
                <div className="donation-actions">
                  <span className={`donation-status ${donation.status}`}>
                    {donation.status.charAt(0).toUpperCase() +
                      donation.status.slice(1)}
                  </span>
                  <button
                    className="receipt-btn"
                    onClick={() => generateReceipt(donation)}
                  >
                    Receipt
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>No donations found.</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderReceipts = () => (
    <div className="dashboard-card">
      <div className="section-header">
        <button
          className="back-btn"
          onClick={() => setActiveSection("overview")}
        >
          ← Back to Overview
        </button>
        <h2>Tax Receipts</h2>
      </div>
      <div className="receipts-content">
        <div className="receipt-filters">
          <select>
            <option>All Years</option>
            <option>2024</option>
            <option>2023</option>
          </select>
          <button className="action-btn primary">Filter</button>
        </div>
        <div className="receipts-list">
          {donations.length > 0 ? (
            donations.map((donation) => (
              <div key={donation._id} className="receipt-item">
                <div className="receipt-info">
                  <h4>{donation.category} Receipt</h4>
                  <p>
                    Amount: ${donation.amount} • Date:{" "}
                    {format(new Date(donation.date), "PPP")}
                  </p>
                  <span>📄 PDF </span>
                </div>
                <button
                  className="action-btn primary"
                  onClick={() => generateReceipt(donation)}
                >
                  Download
                </button>
              </div>
            ))
          ) : (
            <p>No receipts available.</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Donor Dashboard - Invictus</h1>
        <div className="user-info">
          <span>Welcome, Donor {user.email} (Status: {donorProfile?.status})</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <aside className="dashboard-sidebar">
          <nav className="sidebar-nav">
            <button className={`nav-item ${activeSection === 'overview' ? 'active' : ''}`} onClick={() => setActiveSection('overview')}>Overview</button>
            <button className={`nav-item ${activeSection === 'donate' ? 'active' : ''}`} onClick={() => setActiveSection('donate')}>Donate</button>
            <button className={`nav-item ${activeSection === 'history' ? 'active' : ''}`} onClick={() => setActiveSection('history')}>History</button>
            <button className={`nav-item ${activeSection === 'receipts' ? 'active' : ''}`} onClick={() => setActiveSection('receipts')}>Receipts</button>
            <button className={`nav-item ${activeSection === 'profile' ? 'active' : ''}`} onClick={() => setActiveSection('profile')}>Profile</button>
          </nav>
        </aside>

        <section className="dashboard-content">
          {activeSection === "overview" && renderOverview()}
          {activeSection === "donate" && renderDonate()}
          {activeSection === "history" && renderHistory()}
          {activeSection === "receipts" && renderReceipts()}
          {activeSection === "profile" && (
            <div className="dashboard-card">
              <div className="section-header">
                <h2 className="text-gradient">My Profile</h2>
              </div>
              <div className="profile-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={donorProfile?.name || ""}
                    onChange={(e) => api.put("/donors/profile", { name: e.target.value }).then(loadDonorData)}
                  />
                </div>
                <div className="form-group">
                  <label>PAN Card (for 80G tax benefit)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Enter 10-digit PAN"
                    value={donorProfile?.panCard || ""}
                    onChange={(e) => api.put("/donors/profile", { panCard: e.target.value }).then(loadDonorData)}
                  />
                </div>
                <div className="form-group">
                  <p><strong>Current Status:</strong> {donorProfile?.status}</p>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default DonorDashboard;
