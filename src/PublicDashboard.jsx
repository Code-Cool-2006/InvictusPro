import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export default function PublicDashboard() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [attendees, setAttendees]   = useState({}); // { actId: [users] }
  const [expanded, setExpanded]     = useState({}); // { actId: bool }
  const [loading,       setLoading]       = useState(true);
  const [fetchError,    setFetchError]    = useState(null);
  const [search, setSearch]         = useState("");

  /* ── Load all public activities ─────────────────── */
  useEffect(() => {
    fetch(`${API}/api/activities/public/activities`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        setActivities(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Public activities fetch failed:", err);
        setFetchError(err.message);
        setLoading(false);
      });
  }, [])

  /* ── Toggle attendee list for an activity ────────── */
  const toggleAttendees = async (actId) => {
    const isOpen = expanded[actId];
    setExpanded(p => ({ ...p, [actId]: !isOpen }));

    if (!isOpen && !attendees[actId]) {
      try {
        const res = await fetch(`${API}/api/activities/public/activities/${actId}/attendees`);
        const data = await res.json();
        setAttendees(p => ({ ...p, [actId]: Array.isArray(data) ? data : [] }));
      } catch {
        setAttendees(p => ({ ...p, [actId]: [] }));
      }
    }
  };

  const filtered = activities.filter(a =>
    a.title?.toLowerCase().includes(search.toLowerCase()) ||
    a.location?.toLowerCase().includes(search.toLowerCase()) ||
    a.skills?.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }} className="min-h-screen bg-[#0b1326] text-slate-100">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />

      {/* ── Hero Navbar ──────────────────────────────── */}
      <header className="sticky top-0 z-20"
        style={{ background: "rgba(11,19,38,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black text-teal-400">InvictusPro</span>
            <span className="hidden sm:inline text-xs text-slate-500 uppercase tracking-widest">Community Hub</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:inline">Guest View</span>
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-black font-bold text-sm px-4 py-2 rounded-full transition-all shadow-lg shadow-teal-500/20"
            >
              <span className="material-symbols-outlined text-[16px]">login</span>
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero Section ─────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background glows */}
        <div className="absolute -top-32 left-1/4 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 py-20 text-center relative">
          <span className="inline-block text-xs font-semibold text-teal-400 border border-teal-500/30 bg-teal-500/10 px-3 py-1 rounded-full mb-6 uppercase tracking-widest">
            Open Community
          </span>
          <h1 className="text-5xl sm:text-6xl font-black text-slate-100 leading-tight mb-4">
            Community<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-400">
              Events & Activities
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto mb-10">
            Explore every volunteer activity, see who participated, and join our mission to build stronger communities.
          </p>

          {/* Search */}
          <div className="flex items-center gap-2 max-w-md mx-auto bg-slate-800/60 border border-slate-700/40 rounded-full px-5 py-3 focus-within:border-teal-500 transition-colors">
            <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
            <input
              type="text"
              placeholder="Search by title, location or skill…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pb-6">
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto text-center">
          {[
            { val: activities.length,                                            label: "Events",     color: "text-teal-400"   },
            { val: activities.reduce((s, a) => s + (a.attendees?.length || 0), 0), label: "Sign-ups", color: "text-blue-400"   },
            { val: activities.reduce((s, a) => s + (a.hours || 0), 0),          label: "Total Hrs",  color: "text-purple-400" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl bg-slate-900/60 border border-slate-800/40 py-4">
              <p className={`text-2xl font-extrabold ${s.color}`}>{s.val}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Activities Grid ───────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 pb-20 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-slate-100">
            {filtered.length} {filtered.length === 1 ? "Activity" : "Activities"}
          </h2>
          {search && (
            <button onClick={() => setSearch("")} className="text-xs text-slate-400 hover:text-teal-400 transition-colors">
              Clear search
            </button>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-24 text-slate-500">
            <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
            Loading activities…
          </div>
        )}

        {!loading && fetchError && (
          <div className="text-center py-16 text-slate-500">
            <span className="material-symbols-outlined text-4xl block mb-3 text-red-400">wifi_off</span>
            <p className="text-red-400 font-medium">Could not load activities</p>
            <p className="text-xs mt-1">{fetchError} — check that the backend is running</p>
          </div>
        )}

        {!loading && !fetchError && filtered.length === 0 && (
          <div className="text-center py-20 text-slate-500">
            <span className="material-symbols-outlined text-5xl block mb-3">event_busy</span>
            No activities found.
          </div>
        )}

        {filtered.map(act => (
          <div key={act._id}
            className="rounded-2xl bg-slate-900/60 border border-slate-800/40 hover:border-teal-500/30 transition-colors overflow-hidden"
          >
            {/* Activity header */}
            <div className="p-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-slate-100 truncate">{act.title}</h3>
                <p className="text-slate-400 text-sm mt-1 line-clamp-2">{act.description}</p>

                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-slate-500">
                  {act.date     && <span>📅 {act.date}</span>}
                  {act.location && <span>📍 {act.location}</span>}
                  {act.hours    && <span>⏱ {act.hours} hrs</span>}
                  {act.needed   && <span>👥 {act.needed} needed</span>}
                </div>

                {act.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {act.skills.map(s => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Attendee count + toggle */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-center">
                  <p className="text-xl font-extrabold text-blue-400">{act.attendees?.length ?? 0}</p>
                  <p className="text-xs text-slate-400">Attended</p>
                </div>
                <button
                  onClick={() => toggleAttendees(act._id)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-full border transition-all ${
                    expanded[act._id]
                      ? "border-teal-400/40 text-teal-400 bg-teal-500/10"
                      : "border-slate-600 text-slate-400 hover:border-teal-500/40 hover:text-teal-400"
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {expanded[act._id] ? "expand_less" : "people"}
                  </span>
                  {expanded[act._id] ? "Hide" : "View Attendees"}
                </button>
              </div>
            </div>

            {/* Attendees panel */}
            {expanded[act._id] && (
              <div className="border-t border-slate-800/40 px-5 py-4">
                {!attendees[act._id] ? (
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                    Loading attendees…
                  </div>
                ) : attendees[act._id].length === 0 ? (
                  <p className="text-slate-500 text-sm">No attendees yet — be the first to sign up!</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {attendees[act._id].map(u => (
                      <div key={u._id}
                        className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/30 rounded-full px-3 py-1.5"
                      >
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-[10px] font-black text-black shrink-0">
                          {(u.username || u.email || "?")[0].toUpperCase()}
                        </div>
                        <span className="text-xs text-slate-200 font-medium">{u.username || u.email}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </main>

      {/* ── Footer CTA ───────────────────────────────── */}
      <footer className="border-t border-slate-800/40 py-12 text-center">
        <h3 className="text-xl font-bold text-slate-100 mb-2">Ready to make an impact?</h3>
        <p className="text-slate-400 text-sm mb-6">Sign up as a volunteer or donor and join the community.</p>
        <button
          onClick={() => navigate("/login")}
          className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-black font-bold px-8 py-3 rounded-full transition-all shadow-lg shadow-teal-500/20"
        >
          Get Started
        </button>
        <p className="text-slate-500 text-xs mt-8">© 2026 InvictusPro Community Hub</p>
      </footer>
    </div>
  );
}
