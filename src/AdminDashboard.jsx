import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

const NAV_ITEMS = [
  { key: "overview",    label: "Overview",    icon: "dashboard" },
  { key: "activities", label: "Activities",  icon: "event" },
  { key: "users",      label: "Users",       icon: "group" },
  { key: "reports",    label: "Reports",     icon: "bar_chart" },
  { key: "settings",   label: "Settings",    icon: "settings" },
];

const STATUS_COLOR = {
  admin:     "text-purple-400 bg-purple-400/10",
  volunteer: "text-teal-400 bg-teal-400/10",
  donor:     "text-blue-400 bg-blue-400/10",
  pending:   "text-yellow-400 bg-yellow-400/10",
};

export default function AdminDashboard({ user, setUser }) {
  const [activeSection, setActiveSection] = useState("overview");
  const [users, setUsers]       = useState([]);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({ totalDonations: 0, activeVolunteers: 0, totalUsers: 0 });
  const [newActivity, setNewActivity] = useState({
    title: "", description: "", date: "",
    location: "", needed: "", skills: "", hours: "",
  });
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [drawerLoading, setDrawerLoading]         = useState(false);
  const [drawerError, setDrawerError]             = useState(null);
  const [toast, setToast]                         = useState(null); // { msg, type: 'success'|'error' }

  const navigate = useNavigate();

  const loadAdminData = async () => {
    try {
      const [usersRes, donsRes, volsRes, actsRes] = await Promise.all([
        api.get("/users/all"),
        api.get("/donations/all"),
        api.get("/volunteers/all"),
        api.get("/activities"),
      ]);
      setUsers(usersRes.data);
      setActivities(actsRes.data);
      const total = donsRes.data.reduce((acc, d) => acc + (d.amount || 0), 0);
      setStats({
        totalDonations: total,
        activeVolunteers: volsRes.data.length,
        totalUsers: usersRes.data.length,
      });
    } catch (err) {
      console.error("Error loading admin data:", err);
    }
  };

  useEffect(() => { loadAdminData(); }, []);

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/users/${userId}`);
      loadAdminData();
    } catch (err) { console.error("Error deleting user:", err); }
  };

  const handleViewProfile = async (userId) => {
    setDrawerLoading(true);
    setDrawerError(null);
    setSelectedVolunteer(null);
    try {
      const res = await api.get(`/volunteers/by-user/${userId}`);
      setSelectedVolunteer(res.data);
    } catch (err) {
      setDrawerError(err.response?.data?.message || "No volunteer profile found for this user.");
      setSelectedVolunteer({});
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleCreateActivity = async (e) => {
    e.preventDefault();
    try {
      const activityData = {
        ...newActivity,
        skills: newActivity.skills.split(",").map(s => s.trim()).filter(Boolean),
      };
      await api.post("/activities", activityData);
      setNewActivity({ title: "", description: "", date: "", location: "", needed: "", skills: "", hours: "" });
      loadAdminData();
    } catch (err) {
      console.error("Error creating activity:", err);
      alert("Error creating activity.");
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCompleteActivity = async (activityId, userId) => {
    try {
      const res = await api.post(`/activities/${activityId}/complete/${userId}`);
      showToast(res.data?.message || "Activity marked as completed. Certificate email sent! ✅");
      loadAdminData();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to mark activity as complete.";
      showToast(msg, "error");
      console.error("Error completing activity:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  /* ── Shared input style ── */
  const inp = "w-full px-4 py-3 rounded-lg bg-slate-800/60 border border-slate-700/40 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors text-sm";

  /* ────────────────────────── SECTION RENDERERS ────────────────────────── */

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Stats */}
      <section className="grid sm:grid-cols-3 gap-6">
        {[
          { label: "Total Donations",    value: `$${stats.totalDonations.toLocaleString()}`, change: "+12.5%", color: "text-green-400" },
          { label: "Active Volunteers",  value: stats.activeVolunteers.toLocaleString(),      change: "+4.2%",  color: "text-blue-400"  },
          { label: "Total Users",        value: stats.totalUsers.toLocaleString(),            change: "+18%",   color: "text-purple-400" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-6 bg-slate-900/60 border border-slate-800/40 backdrop-blur-sm hover:border-teal-500/30 transition-colors">
            <p className="text-xs text-slate-400 uppercase tracking-wider">{s.label}</p>
            <h3 className="text-3xl font-extrabold text-slate-100 mt-2">{s.value}</h3>
            <p className={`text-sm mt-1 font-medium ${s.color}`}>{s.change} this month</p>
          </div>
        ))}
      </section>

      {/* Quick-access cards */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { key: "users",      icon: "group",      label: "User Management",    desc: "Manage volunteers, donors & accounts" },
          { key: "settings",   icon: "settings",   label: "System Settings",    desc: "Configure platform preferences"       },
          { key: "reports",    icon: "bar_chart",  label: "Reports & Analytics",desc: "View platform statistics & reports"   },
          { key: "activities", icon: "event",      label: "Activity Tracking",  desc: "Manage volunteer attendance"          },
        ].map(c => (
          <button
            key={c.key}
            onClick={() => setActiveSection(c.key)}
            className="text-left rounded-2xl p-5 bg-slate-900/60 border border-slate-800/40 hover:border-teal-500/40 hover:bg-slate-800/50 transition-all group"
          >
            <span className="material-symbols-outlined text-teal-400 text-3xl group-hover:scale-110 transition-transform inline-block">{c.icon}</span>
            <h4 className="text-slate-100 font-bold mt-3">{c.label}</h4>
            <p className="text-slate-400 text-xs mt-1">{c.desc}</p>
          </button>
        ))}
      </section>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-0">
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/40 overflow-hidden">
        <div className="p-6 border-b border-slate-800/40">
          <h2 className="text-lg font-bold text-slate-100">User Management</h2>
          <p className="text-slate-400 text-sm mt-1">{users.length} registered accounts · click a row to view volunteer details</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wider bg-slate-900/40">
                <th className="px-6 py-3">Username</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u._id} className={`border-t border-slate-800/30 hover:bg-slate-800/30 transition-colors cursor-pointer ${i % 2 === 0 ? "" : "bg-slate-900/20"}`}
                  onClick={() => handleViewProfile(u._id)}
                >
                  <td className="px-6 py-4 font-medium text-slate-100">{u.username}</td>
                  <td className="px-4 py-4 text-slate-400">{u.email}</td>
                  <td className="px-4 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${STATUS_COLOR[u.role] || "text-slate-400 bg-slate-700/30"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewProfile(u._id)}
                        className="text-teal-400 hover:text-teal-300 text-xs border border-teal-400/30 hover:border-teal-400 px-3 py-1 rounded-full transition-colors"
                      >
                        View Profile
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u._id)}
                        className="text-red-400 hover:text-red-300 text-xs border border-red-400/30 hover:border-red-400 px-3 py-1 rounded-full transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-500">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Volunteer detail drawer ── */}
      {(selectedVolunteer !== null || drawerLoading) && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedVolunteer(null)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Panel */}
          <div
            className="relative w-full max-w-lg h-full overflow-y-auto"
            style={{ background: "rgba(10,18,40,0.97)", borderLeft: "1px solid rgba(148,163,184,0.12)" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800/40">
              <h3 className="text-lg font-bold text-slate-100">Volunteer Profile</h3>
              <button onClick={() => setSelectedVolunteer(null)}
                className="p-1.5 rounded-full hover:bg-slate-700/40 text-slate-400 hover:text-slate-100 transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Loading */}
            {drawerLoading && (
              <div className="flex items-center justify-center py-24 text-slate-500">
                <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                Loading profile…
              </div>
            )}

            {/* Error */}
            {!drawerLoading && drawerError && (
              <div className="p-6">
                <p className="text-slate-400 text-sm">{drawerError}</p>
              </div>
            )}

            {/* Content */}
            {!drawerLoading && !drawerError && selectedVolunteer && (
              <div className="p-6 space-y-6">

                {/* Identity */}
                <section className="space-y-3">
                  <h4 className="text-xs text-slate-400 uppercase tracking-wider">Personal Info</h4>
                  {[
                    { label: "Name",    val: selectedVolunteer.name    },
                    { label: "Email",   val: selectedVolunteer.email   },
                    { label: "Phone",   val: selectedVolunteer.phone   },
                    { label: "Address", val: selectedVolunteer.address },
                  ].map(row => row.val ? (
                    <div key={row.label} className="flex gap-3">
                      <span className="text-xs text-slate-400 w-16 shrink-0">{row.label}</span>
                      <span className="text-sm text-slate-100">{row.val}</span>
                    </div>
                  ) : null)}
                </section>

                {/* Stats */}
                <section>
                  <h4 className="text-xs text-slate-400 uppercase tracking-wider mb-3">Stats</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Hours",   val: selectedVolunteer.totalHours        || 0, color: "text-teal-400"   },
                      { label: "Events",  val: selectedVolunteer.eventsAttended    || 0, color: "text-blue-400"  },
                      { label: "Certs",   val: selectedVolunteer.certificatesEarned|| 0, color: "text-purple-400" },
                    ].map(s => (
                      <div key={s.label} className="rounded-xl bg-slate-800/40 py-3 text-center">
                        <p className={`text-xl font-extrabold ${s.color}`}>{s.val}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Skills */}
                {selectedVolunteer.skills?.length > 0 && (
                  <section>
                    <h4 className="text-xs text-slate-400 uppercase tracking-wider mb-3">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedVolunteer.skills.map(s => (
                        <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">{s}</span>
                      ))}
                    </div>
                  </section>
                )}

                {/* Availability */}
                {selectedVolunteer.availability && (
                  <section>
                    <h4 className="text-xs text-slate-400 uppercase tracking-wider mb-3">Availability</h4>
                    <div className="space-y-1.5">
                      {Object.entries(selectedVolunteer.availability).map(([day, s]) => {
                        const sched = s?.available !== undefined ? s : s; // handles Map or plain object
                        const avail = sched?.available ?? sched?.get?.('available');
                        if (!avail) return null;
                        const start = sched?.startTime ?? sched?.get?.('startTime') ?? '';
                        const end   = sched?.endTime   ?? sched?.get?.('endTime')   ?? '';
                        return (
                          <div key={day} className="flex items-center gap-3 text-sm">
                            <span className="text-teal-400 capitalize w-24">{day}</span>
                            <span className="text-slate-300">{start} – {end}</span>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Activities */}
                {selectedVolunteer.activities?.length > 0 && (
                  <section>
                    <h4 className="text-xs text-slate-400 uppercase tracking-wider mb-3">Activity Log</h4>
                    <div className="space-y-2">
                      {selectedVolunteer.activities.map((act, i) => (
                        <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-slate-800/40 text-sm">
                          <div>
                            <p className="text-slate-100 font-medium">{act.title}</p>
                            <p className="text-xs text-slate-500">{act.date} · {act.hours} hrs</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            act.status === "completed" ? "text-green-400 bg-green-400/10" :
                            act.status === "upcoming"  ? "text-blue-400  bg-blue-400/10"  :
                                                         "text-yellow-400 bg-yellow-400/10"
                          }`}>{act.status}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* ID Proof */}
                <section>
                  <h4 className="text-xs text-slate-400 uppercase tracking-wider mb-3">ID Proof</h4>
                  {selectedVolunteer.idProofUrl ? (
                    <a
                      href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${selectedVolunteer.idProofUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-teal-400 border border-teal-500/30 px-4 py-2 rounded-full hover:bg-teal-500/10 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                      View uploaded ID
                    </a>
                  ) : (
                    <p className="text-sm text-slate-500">No ID proof uploaded yet.</p>
                  )}
                </section>

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Create Activity form */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/40 p-6">
        <h2 className="text-lg font-bold text-slate-100 mb-5">New Volunteer Activity</h2>
        <form onSubmit={handleCreateActivity} className="space-y-4">
          <input className={inp} type="text"   placeholder="Title *"    value={newActivity.title}       onChange={e => setNewActivity({...newActivity, title: e.target.value})}       required />
          <textarea className={`${inp} h-24 resize-none`}               placeholder="Description *"      value={newActivity.description} onChange={e => setNewActivity({...newActivity, description: e.target.value})} required />
          <div className="grid grid-cols-2 gap-3">
            <input className={inp} type="date"   value={newActivity.date}     onChange={e => setNewActivity({...newActivity, date: e.target.value})}     required />
            <input className={inp} type="text"   placeholder="Location *"     value={newActivity.location}  onChange={e => setNewActivity({...newActivity, location: e.target.value})}  required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className={inp} type="number" placeholder="Volunteers needed" value={newActivity.needed} onChange={e => setNewActivity({...newActivity, needed: e.target.value})} required />
            <input className={inp} type="number" step="0.5" placeholder="Hours"  value={newActivity.hours}  onChange={e => setNewActivity({...newActivity, hours: e.target.value})}  required />
          </div>
          <input className={inp} type="text" placeholder="Skills (comma-separated)"  value={newActivity.skills}  onChange={e => setNewActivity({...newActivity, skills: e.target.value})} />
          <button type="submit" className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-black font-bold py-3 rounded-xl transition-all">
            Publish Activity
          </button>
        </form>
      </div>

      {/* Placeholder config panel */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/40 p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-100">Platform Settings</h2>
        {["Allow new registrations", "Email notifications", "Maintenance mode"].map(s => (
          <label key={s} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 cursor-pointer hover:bg-slate-800/60 transition-colors">
            <span className="text-slate-300 text-sm">{s}</span>
            <div className="w-10 h-5 bg-teal-500/30 rounded-full border border-teal-500/40 flex items-center px-0.5">
              <div className="w-4 h-4 bg-teal-400 rounded-full" />
            </div>
          </label>
        ))}
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-6">
        {[
          { label: "Total Donations",   value: `$${stats.totalDonations.toLocaleString()}`, icon: "payments",  color: "text-green-400"  },
          { label: "Active Volunteers", value: stats.activeVolunteers,                       icon: "volunteer_activism", color: "text-blue-400"  },
          { label: "Total Users",       value: stats.totalUsers,                             icon: "diversity_3", color: "text-purple-400" },
        ].map(m => (
          <div key={m.label} className="rounded-2xl p-6 bg-slate-900/60 border border-slate-800/40 flex items-center gap-4">
            <span className={`material-symbols-outlined text-4xl ${m.color}`}>{m.icon}</span>
            <div>
              <p className="text-xs text-slate-400">{m.label}</p>
              <p className={`text-2xl font-extrabold ${m.color}`}>{m.value}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-4">
        <button className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-black font-semibold rounded-full text-sm transition-colors">Export PDF</button>
        <button className="px-5 py-2 border border-slate-600 hover:border-teal-400 text-slate-300 hover:text-teal-400 rounded-full text-sm transition-colors">Export CSV</button>
        <button className="px-5 py-2 border border-slate-600 hover:border-teal-400 text-slate-300 hover:text-teal-400 rounded-full text-sm transition-colors">Schedule Report</button>
      </div>
    </div>
  );

  const renderActivities = () => (
    <div className="space-y-5">
      {activities.length === 0 && (
        <p className="text-slate-500 text-center py-12">No activities created yet.</p>
      )}
      {activities.map(act => (
        <div key={act._id} className="rounded-2xl bg-slate-900/60 border border-slate-800/40 overflow-hidden">
          <div className="p-5 flex justify-between items-start">
            <div>
              <h3 className="font-bold text-slate-100">{act.title}</h3>
              <p className="text-slate-400 text-sm mt-1">📅 {act.date} &nbsp;·&nbsp; 👥 {act.attendees?.length ?? 0} attendees</p>
            </div>
          </div>
          {act.attendees?.length > 0 && (
            <div className="border-t border-slate-800/40">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-xs text-slate-400 uppercase bg-slate-900/40">
                    <th className="px-5 py-2">User ID</th>
                    <th className="px-5 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {act.attendees.map(aId => (
                    <tr key={aId} className="border-t border-slate-800/30 hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3 text-slate-300 font-mono text-xs">{aId}</td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => handleCompleteActivity(act._id, aId)}
                          className="text-xs bg-teal-500/10 text-teal-400 border border-teal-500/30 hover:bg-teal-500/20 px-3 py-1 rounded-full transition-colors"
                        >
                          Mark Completed
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  /* ────────────────────────── MAIN RENDER ────────────────────────── */
  return (
    <div style={{ fontFamily: "Inter, sans-serif" }} className="min-h-screen bg-[#0b1326] text-slate-100">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />

      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium transition-all ${
          toast.type === "error"
            ? "bg-red-500/20 border border-red-500/40 text-red-300"
            : "bg-teal-500/20 border border-teal-500/40 text-teal-300"
        }`}>
          <span className="material-symbols-outlined text-[18px]">
            {toast.type === "error" ? "error" : "check_circle"}
          </span>
          {toast.msg}
        </div>
      )}

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-72 hidden md:flex flex-col"
        style={{ background: "rgba(10,18,40,0.75)", backdropFilter: "blur(20px)", borderRight: "1px solid rgba(148,163,184,0.08)" }}>
        <div className="p-8">
          <h1 className="text-2xl font-black text-teal-400">InvictusPro</h1>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">Admin Panel</p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              onClick={() => setActiveSection(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-all ${
                activeSection === item.key
                  ? "text-teal-400 bg-teal-400/10"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/40"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-6 space-y-3">
          <div className="px-4 py-3 rounded-xl bg-slate-800/40 text-xs">
            <p className="text-slate-400">Signed in as</p>
            <p className="text-teal-400 font-semibold truncate mt-0.5">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-red-400 text-sm border border-slate-700/40 hover:border-red-400/40 py-2 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="md:ml-72 p-6 lg:p-8 space-y-8">
        {/* Header */}
        <header className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-100">
              {NAV_ITEMS.find(n => n.key === activeSection)?.label ?? "Dashboard"}
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">InvictusPro Community Hub</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              placeholder="Search..."
              className="hidden sm:block bg-slate-800/60 border border-slate-700/40 px-4 py-2 rounded-full text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
            />
            <button
              onClick={() => setActiveSection("settings")}
              className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-black font-bold text-sm px-4 py-2 rounded-full transition-all shadow-lg shadow-teal-500/20"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              New Activity
            </button>
          </div>
        </header>

        {/* Section content */}
        {activeSection === "overview"    && renderOverview()}
        {activeSection === "users"       && renderUsers()}
        {activeSection === "settings"    && renderSettings()}
        {activeSection === "reports"     && renderReports()}
        {activeSection === "activities"  && renderActivities()}
      </main>
    </div>
  );
}
