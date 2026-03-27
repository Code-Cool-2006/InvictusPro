import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import jsPDF from "jspdf";
import { format } from "date-fns";

/* ── Nav items ─────────────────────────────────────── */
const NAV = [
  { key: "overview",  label: "Dashboard",  icon: "dashboard"       },
  { key: "donate",    label: "Donate",     icon: "volunteer_activism" },
  { key: "history",   label: "History",    icon: "receipt_long"    },
  { key: "receipts",  label: "Receipts",   icon: "description"     },
  { key: "profile",   label: "Profile",    icon: "account_circle"  },
];

/* ── Shared input style ─────────────────────────────── */
const inp = "w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/40 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors text-sm";

export default function DonorDashboard({ user, setUser }) {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("overview");
  const [donorProfile,  setDonorProfile]  = useState(null);
  const [donations,     setDonations]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [donating,      setDonating]      = useState(false);
  const [toast,         setToast]         = useState(null);

  // Donation form state
  const [category,     setCategory]     = useState("money");
  const [customAmount, setCustomAmount] = useState("");
  const [description,  setDescription]  = useState("");
  const [quantity,     setQuantity]     = useState("");
  const [unit,         setUnit]         = useState("");

  /* ── Data loading ────────────────────────────────── */
  const loadDonorData = async () => {
    try {
      const [profileRes, donsRes] = await Promise.all([
        api.get("/donors/profile"),
        api.get("/donations/my-donations"),
      ]);
      setDonorProfile(profileRes.data);
      setDonations(donsRes.data);
    } catch (err) {
      console.error("Error loading donor data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDonorData(); }, [user]);

  /* ── Toast ───────────────────────────────────────── */
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  /* ── Handlers ────────────────────────────────────── */
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  const handleDonate = async (e) => {
    e.preventDefault();
    setDonating(true);
    const payload = { category, description };
    if (category === "money") {
      const amt = parseFloat(customAmount);
      if (isNaN(amt) || amt <= 0) { showToast("Enter a valid amount.", "error"); setDonating(false); return; }
      payload.amount = amt;
    } else {
      payload.quantity = parseFloat(quantity);
      payload.unit = unit;
    }
    try {
      await api.post("/donations", payload);
      showToast("Thank you for your generous donation! 🎉");
      setCustomAmount(""); setDescription(""); setQuantity(""); setUnit("");
      loadDonorData();
    } catch (err) {
      showToast(err.response?.data?.message || "Error processing donation.", "error");
    } finally {
      setDonating(false);
    }
  };

  const generateReceipt = (donation) => {
    const doc = new jsPDF();
    doc.setFillColor(11, 19, 38);
    doc.rect(0, 0, 210, 297, "F");
    doc.setTextColor(226, 232, 240);
    doc.setFontSize(22);
    doc.text("Donation Receipt", 105, 30, { align: "center" });
    doc.setFontSize(16);
    doc.text("InvictusPro Community Hub", 105, 44, { align: "center" });
    doc.setFontSize(11);
    doc.text(`Receipt: ${donation._id.substring(0, 8).toUpperCase()}`, 20, 62);
    doc.text(`Date: ${format(new Date(donation.date), "PPP")}`, 20, 72);
    doc.text(`Donor: ${donation.donorName}`, 20, 82);
    doc.text(`Email: ${user?.email || ""}`, 20, 92);
    if (donorProfile?.panCard) doc.text(`PAN: ${donorProfile.panCard}`, 20, 102);
    doc.setDrawColor(45, 212, 191);
    doc.line(20, 110, 190, 110);
    doc.text("Category", 20, 120);
    doc.text("Amount", 170, 120);
    doc.line(20, 125, 190, 125);
    doc.text(`${donation.category}`, 20, 135);
    doc.text(`${donation.amount ? "₹" + donation.amount.toFixed(2) : "Item Donation"}`, 170, 135);
    doc.line(20, 145, 190, 145);
    doc.setFont(undefined, "bold");
    doc.text("Total", 20, 155);
    doc.text(`${donation.amount ? "₹" + donation.amount.toFixed(2) : "N/A"}`, 170, 155);
    doc.setFont(undefined, "normal");
    doc.setFontSize(9);
    doc.text("Valid for tax exemption under section 80G. Thank you for your support!", 105, 180, { align: "center" });
    doc.save(`InvictusPro_Receipt_${donation._id.substring(0, 8)}.pdf`);
  };

  /* ── Overview ────────────────────────────────────── */
  const renderOverview = () => {
    const totalDonated  = donorProfile?.totalDonated  || 0;
    const donationCount = donorProfile?.donationCount || 0;
    const impactScore   = Math.floor(totalDonated / 10);

    return (
      <div className="space-y-6">
        {/* Welcome */}
        <div>
          <h2 className="text-4xl font-extrabold text-slate-100">
            Welcome back, <span className="text-teal-400">{donorProfile?.name || user?.username || "Donor"}</span>
          </h2>
          <p className="text-slate-400 mt-2">
            Your contributions have made a real difference — thank you.
          </p>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { label: "Total Donated",  value: `₹${totalDonated.toLocaleString("en-IN")}`, icon: "payments",       color: "text-teal-400"   },
            { label: "Donations Made", value: donationCount,                        icon: "volunteer_activism", color: "text-blue-400"   },
            { label: "Impact Score",   value: impactScore,                          icon: "star",           color: "text-purple-400" },
          ].map(s => (
            <div key={s.label}
              className="rounded-2xl p-6 bg-slate-900/60 border border-slate-800/40 flex items-center gap-4 hover:border-teal-500/30 transition-colors">
              <span className={`material-symbols-outlined text-3xl ${s.color}`}>{s.icon}</span>
              <div>
                <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Donation Portal quick-entry */}
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/40 p-6">
            <h3 className="text-lg font-bold text-slate-100 mb-4">Donation Portal</h3>
            <div className="mb-3">
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">Amount (₹)</label>
              <input
                type="number"
                placeholder="0.00"
                value={customAmount}
                onChange={e => setCustomAmount(e.target.value)}
                className={inp}
              />
            </div>
            <button
              onClick={async () => {
                if (!customAmount || parseFloat(customAmount) <= 0) {
                  showToast("Enter a valid amount.", "error");
                  return;
                }
                setCategory("money");
                setDonating(true);
                try {
                  await api.post("/donations", { category: "money", amount: parseFloat(customAmount) });
                  showToast("Thank you for your donation! 🎉");
                  setCustomAmount("");
                  loadDonorData();
                } catch (err) {
                  showToast(err.response?.data?.message || "Error processing donation.", "error");
                } finally {
                  setDonating(false);
                }
              }}
              disabled={donating}
              className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {donating
                ? <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Processing…</>
                : <>Confirm Donation</>}
            </button>
          </div>

          {/* Impact score card */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/40 p-6 text-center flex flex-col items-center justify-center">
            <h3 className="text-lg font-bold text-slate-100">Impact Score</h3>
            <p className="text-6xl font-black text-teal-400 mt-4">{impactScore}</p>
            <p className="text-slate-400 text-sm mt-2">based on total donations</p>
          </div>
        </div>

        {/* Quick access */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { key: "donate",   icon: "volunteer_activism", label: "Make a Donation",  desc: "Contribute to our initiatives" },
            { key: "history",  icon: "receipt_long",       label: "Donation History", desc: "View past contributions"       },
            { key: "receipts", icon: "description",        label: "Tax Receipts",     desc: "Download 80G receipts"         },
          ].map(c => (
            <button key={c.key} onClick={() => setActiveSection(c.key)}
              className="text-left rounded-2xl p-5 bg-slate-900/60 border border-slate-800/40 hover:border-teal-500/40 hover:bg-slate-800/50 transition-all group">
              <span className={`material-symbols-outlined text-teal-400 text-3xl group-hover:scale-110 transition-transform inline-block`}>{c.icon}</span>
              <h4 className="text-slate-100 font-bold mt-3">{c.label}</h4>
              <p className="text-slate-400 text-xs mt-1">{c.desc}</p>
            </button>
          ))}
        </div>

        {/* Impact highlights */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/40 p-6">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Your Donations Impact</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: "🏠", text: "$25 provides shelter for one night"     },
              { icon: "🍽️", text: "$10 feeds a family for a day"           },
              { icon: "📚", text: "$50 supports educational programs"       },
            ].map(i => (
              <div key={i.text} className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40">
                <span className="text-2xl">{i.icon}</span>
                <p className="text-sm text-slate-300">{i.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /* ── Donate ──────────────────────────────────────── */
  const renderDonate = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Make a Donation</h2>
        <p className="text-slate-400 text-sm mt-1">Every contribution counts.</p>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/40 p-6">
          <h3 className="text-lg font-bold text-slate-100 mb-5">Support Our Cause</h3>
          <form onSubmit={handleDonate} className="space-y-4">
            {/* Category */}
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className={inp}>
                <option value="money">💵 Money</option>
                <option value="food">🍽️ Food</option>
                <option value="clothes">👕 Clothes</option>
                <option value="medicine">💊 Medicine</option>
                <option value="services">🤝 Services</option>
                <option value="others">📦 Others</option>
              </select>
            </div>

            {category === "money" ? (
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">Amount ($)</label>
                <input type="number" step="0.01" placeholder="0.00" value={customAmount}
                  onChange={e => setCustomAmount(e.target.value)} className={inp} required />
              </div>
            ) : (
              <>
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">Description</label>
                  <input type="text" placeholder="e.g. Rice, Blankets, Masks" value={description}
                    onChange={e => setDescription(e.target.value)} className={inp} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">Quantity</label>
                    <input type="number" placeholder="Qty" value={quantity}
                      onChange={e => setQuantity(e.target.value)} className={inp} required />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">Unit</label>
                    <input type="text" placeholder="kg, pcs…" value={unit}
                      onChange={e => setUnit(e.target.value)} className={inp} required />
                  </div>
                </div>
              </>
            )}

            <button type="submit" disabled={donating}
              className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
              {donating
                ? <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Processing…</>
                : <><span className="material-symbols-outlined text-[18px]">volunteer_activism</span> Donate Now</>}
            </button>
          </form>
        </div>

        {/* Recurring / settings */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/40 p-6 space-y-5">
          <h3 className="text-lg font-bold text-slate-100">Recurring Giving</h3>
          <p className="text-slate-400 text-sm">Become a sustaining donor with monthly contributions.</p>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox"
              checked={donorProfile?.remindersEnabled || false}
              onChange={async e => {
                try {
                  await api.put("/donors/profile", { remindersEnabled: e.target.checked });
                  loadDonorData();
                } catch {}
              }}
              className="mt-0.5 accent-teal-400 w-4 h-4"
            />
            <div>
              <p className="text-sm font-semibold text-slate-200">Enable Recurring Reminders</p>
              <p className="text-xs text-slate-400 mt-0.5">We'll email you for monthly contribution reminders.</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );

  /* ── History ─────────────────────────────────────── */
  const renderHistory = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-100">Donation History</h2>
      <div className="grid sm:grid-cols-3 gap-5">
        {[
          { label: "Total Donated",  value: `₹${(donorProfile?.totalDonated || 0).toLocaleString("en-IN")}`, color: "text-teal-400"   },
          { label: "Donations Made", value: donorProfile?.donationCount || 0,                          color: "text-blue-400"   },
          { label: "Impact Score",   value: Math.floor((donorProfile?.totalDonated || 0) / 10),       color: "text-purple-400" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-5 bg-slate-900/60 border border-slate-800/40 text-center">
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/40 overflow-hidden">
        <div className="p-5 border-b border-slate-800/40">
          <h3 className="font-bold text-slate-100">Recent Donations</h3>
        </div>
        {donations.length === 0
          ? <p className="p-6 text-slate-500 text-sm">No donations yet.</p>
          : donations.map(d => (
            <div key={d._id} className="flex items-center justify-between p-4 border-b border-slate-800/20 last:border-0 hover:bg-slate-800/20 transition-colors">
              <div>
                <p className="font-medium text-slate-100 capitalize">{d.category}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  📅 {format(new Date(d.date), "MMM dd, yyyy")}
                  {d.amount ? ` · ₹${d.amount}` : d.quantity ? ` · ${d.quantity} ${d.unit}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${
                  d.status === "completed" ? "text-green-400 bg-green-400/10" : "text-yellow-400 bg-yellow-400/10"
                }`}>{d.status}</span>
                {d.amount && (
                  <button onClick={() => generateReceipt(d)}
                    className="text-teal-400 hover:text-teal-300 text-xs border border-teal-400/30 hover:border-teal-400 px-3 py-1 rounded-full transition-colors">
                    Receipt
                  </button>
                )}
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );

  /* ── Receipts ────────────────────────────────────── */
  const renderReceipts = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-100">Tax Receipts</h2>
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/40 overflow-hidden">
        <div className="p-5 border-b border-slate-800/40">
          <p className="text-xs text-slate-400">Valid for tax exemption under section 80G</p>
        </div>
        {donations.filter(d => d.amount).length === 0
          ? <p className="p-6 text-slate-500 text-sm">No monetary donations yet — receipts are generated for monetary donations only.</p>
          : donations.filter(d => d.amount).map(d => (
            <div key={d._id} className="flex items-center justify-between p-4 border-b border-slate-800/20 last:border-0">
              <div>
                <p className="font-medium text-slate-100 capitalize">{d.category} Receipt</p>
                <p className="text-xs text-slate-400 mt-0.5">₹{d.amount} · {format(new Date(d.date), "PPP")} · 📄 PDF</p>
              </div>
              <button onClick={() => generateReceipt(d)}
                className="flex items-center gap-1.5 text-sm text-teal-400 border border-teal-500/30 hover:bg-teal-500/10 px-4 py-1.5 rounded-full transition-colors">
                <span className="material-symbols-outlined text-[15px]">download</span>
                Download
              </button>
            </div>
          ))
        }
      </div>
    </div>
  );

  /* ── Profile ─────────────────────────────────────── */
  const renderProfile = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-100">My Profile</h2>
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/40 p-6 space-y-5 max-w-lg">
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">Full Name</label>
          <input type="text" className={inp} defaultValue={donorProfile?.name || ""}
            onBlur={e => api.put("/donors/profile", { name: e.target.value }).then(loadDonorData)} />
        </div>
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">PAN Card (for 80G)</label>
          <input type="text" className={inp} placeholder="Enter 10-digit PAN" defaultValue={donorProfile?.panCard || ""}
            onBlur={e => api.put("/donors/profile", { panCard: e.target.value }).then(loadDonorData)} />
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40">
          <span className="material-symbols-outlined text-teal-400">verified</span>
          <div>
            <p className="text-xs text-slate-400">Donor Status</p>
            <p className="text-sm font-bold text-slate-100 capitalize">{donorProfile?.status || "Active"}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const SECTION = { overview: renderOverview, donate: renderDonate, history: renderHistory, receipts: renderReceipts, profile: renderProfile };

  /* ── Main render ─────────────────────────────────── */
  return (
    <div style={{ fontFamily: "Inter, sans-serif" }} className="min-h-screen bg-[#0b1326] text-[#dae2fd]">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium ${
          toast.type === "error"
            ? "bg-red-500/20 border border-red-500/40 text-red-300"
            : "bg-teal-500/20 border border-teal-500/40 text-teal-300"
        }`}>
          <span className="material-symbols-outlined text-[18px]">{toast.type === "error" ? "error" : "check_circle"}</span>
          {toast.msg}
        </div>
      )}

      {/* ── Sidebar ──────────────────────────────────── */}
      <aside className="fixed left-0 top-0 h-screen w-72 border-r border-slate-800/15 bg-slate-950/60 backdrop-blur-xl z-50 flex flex-col">
        <div className="p-8">
          <h1 className="text-2xl font-black tracking-tighter text-teal-400">InvictusPro</h1>
          <p className="text-xs mt-1 opacity-60 uppercase tracking-widest">Donor Hub</p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {NAV.map(item => (
            <button key={item.key} onClick={() => setActiveSection(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                activeSection === item.key
                  ? "text-teal-400 bg-slate-800/40"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/40"
              }`}>
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="font-semibold text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto space-y-4">
          <button onClick={() => setActiveSection("donate")}
            className="w-full bg-gradient-to-r from-teal-400 to-teal-600 text-black font-bold py-3 rounded-xl text-sm hover:from-teal-300 hover:to-teal-500 transition-all">
            + New Donation
          </button>
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-black font-black text-sm shrink-0">
              {(user?.username || user?.email || "D")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{donorProfile?.name || user?.username || "Donor"}</p>
              <p className="text-xs text-slate-400 capitalize">{donorProfile?.status || "Gold Donor"}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────── */}
      <main className="ml-72">
        {/* Top bar */}
        <header className="sticky top-0 flex justify-between items-center px-8 h-16 bg-slate-900/40 backdrop-blur-md border-b border-white/5 z-10">
          <div className="flex items-center gap-6">
            <h2 className="text-lg font-bold text-slate-100 capitalize">{activeSection}</h2>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-100 text-sm transition-colors">
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Logout
          </button>
        </header>

        {/* Section content */}
        <div className="p-8">
          {loading
            ? <div className="flex items-center gap-2 text-slate-500 py-20 justify-center">
                <span className="material-symbols-outlined animate-spin">progress_activity</span> Loading…
              </div>
            : (SECTION[activeSection] || renderOverview)()
          }
        </div>
      </main>
    </div>
  );
}
