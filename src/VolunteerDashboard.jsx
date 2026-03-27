import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import { format } from "date-fns";
import jsPDF from "jspdf";

/* ── Nav items ────────────────────────────────────────────── */
const NAV_ITEMS = [
  { key: "overview",      label: "Overview",       icon: "dashboard" },
  { key: "opportunities", label: "Explore",        icon: "explore" },
  { key: "activities",   label: "My Activities",  icon: "event_available" },
  { key: "events",       label: "Events",         icon: "groups" },
  { key: "profile",      label: "Profile",        icon: "account_circle" },
];

const availableSkills = [
  "Teaching","Medical Aid","Event Planning","Fundraising","IT Support",
  "Gardening","Cooking","Driving","Photography","Social Media",
  "Counseling","Carpentry","Painting","Music","Sports Coaching",
];

/* ── Shared input style ───────────────────────────────────── */
const inp = "w-full px-4 py-3 rounded-lg bg-slate-800/60 border border-slate-700/40 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors text-sm";

function VolunteerDashboard({ user, setUser }) {
  const [activeSection, setActiveSection] = useState("overview");
  const [volunteerProfile, setVolunteerProfile] = useState(null);
  const [availability, setAvailability] = useState({
    monday:    { available: false, startTime: "09:00", endTime: "17:00" },
    tuesday:   { available: false, startTime: "09:00", endTime: "17:00" },
    wednesday: { available: false, startTime: "09:00", endTime: "17:00" },
    thursday:  { available: false, startTime: "09:00", endTime: "17:00" },
    friday:    { available: false, startTime: "09:00", endTime: "17:00" },
    saturday:  { available: false, startTime: "09:00", endTime: "17:00" },
    sunday:    { available: false, startTime: "09:00", endTime: "17:00" },
  });
  const [skills, setSkills]                   = useState([]);
  const [activities, setActivities]           = useState([]);
  const [allActivities, setAllActivities]     = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [searchTerm, setSearchTerm]           = useState("");
  const [uploadState, setUploadState]         = useState({ loading: false, error: null });

  const navigate = useNavigate();

  /* ── Data loading ─────────────────────────────────────── */
  const loadVolunteerData = async () => {
    try {
      const { data } = await api.get("/volunteers/profile");
      setVolunteerProfile(data);
      setAvailability(data.availability || availability);
      setSkills(data.skills || []);

      const [actsRes, recsRes] = await Promise.all([
        api.get("/activities"),
        api.get("/activities/recommendations"),
      ]);
      setActivities(actsRes.data);
      setAllActivities(actsRes.data);
      setRecommendations(recsRes.data);
    } catch (err) {
      console.error("Error loading volunteer data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadVolunteerData(); }, [user]);

  /* ── API helpers ──────────────────────────────────────── */
  const saveVolunteerData = async (updates) => {
    try {
      const { data } = await api.put("/volunteers/profile", updates);
      setVolunteerProfile(data);
    } catch (err) {
      console.error("Error saving volunteer data:", err);
      alert("Error saving data. Please try again.");
    }
  };

  const handleAvailabilityChange = (day, field, value) => {
    const next = { ...availability, [day]: { ...availability[day], [field]: value } };
    setAvailability(next);
    saveVolunteerData({ availability: next });
  };

  const handleSkillToggle = (skill) => {
    const next = skills.includes(skill) ? skills.filter(s => s !== skill) : [...skills, skill];
    setSkills(next);
    saveVolunteerData({ skills: next });
  };

  const handleIdProofUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    const ALLOWED  = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!ALLOWED.includes(file.type)) {
      setUploadState({ loading: false, error: "Only JPEG, PNG, WebP images or PDFs are allowed." });
      return;
    }
    if (file.size > MAX_SIZE) {
      setUploadState({ loading: false, error: "File must be under 5 MB." });
      return;
    }

    setUploadState({ loading: true, error: null });
    try {
      const formData = new FormData();
      formData.append("idProof", file);

      // Use fetch directly so we can send multipart (api axios instance uses JSON by default)
      const token = JSON.parse(localStorage.getItem("user"))?.token;
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/volunteers/upload-id`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Upload failed.");
      }

      setUploadState({ loading: false, error: null });
      loadVolunteerData(); // refresh profile so idProofUrl shows
    } catch (err) {
      console.error("Upload error:", err);
      setUploadState({ loading: false, error: err.message || "Upload failed. Please try again." });
    }
  };

  const handleSignUp = async (activity) => {
    try {
      await api.post(`/activities/${activity._id}/signup`);
      alert("Successfully signed up for the opportunity!");
      loadVolunteerData();
    } catch (err) {
      alert(`Error signing up: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  const generateCertificate = (activity) => {
    const doc = new jsPDF();
    doc.setFontSize(20); doc.text("Volunteer Certificate", 105, 30, { align: "center" });
    doc.setFontSize(16); doc.text("Invictus Organization", 105, 50, { align: "center" });
    doc.setFontSize(14); doc.text("This is to certify that", 105, 80, { align: "center" });
    doc.setFontSize(18); doc.text(user.email, 105, 100, { align: "center" });
    doc.setFontSize(14); doc.text("has successfully completed the volunteer activity:", 105, 120, { align: "center" });
    doc.text(activity.title, 105, 135, { align: "center" });
    doc.text(`on ${format(new Date(activity.date), "PPP")}`, 105, 150, { align: "center" });
    doc.text(`Hours contributed: ${activity.hours}`, 105, 165, { align: "center" });
    doc.setFontSize(12); doc.text(`Certificate issued on ${format(new Date(), "PPP")}`, 105, 190, { align: "center" });
    doc.save(`volunteer_certificate_${activity.title.replace(/\s+/g, "_")}.pdf`);
  };

  /* ── Filtered opportunities ───────────────────────────── */
  const filteredActivities = searchTerm
    ? allActivities.filter(a =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : activities;

  /* ──────────────────────────────────────────────────────
     SECTION RENDERERS
  ─────────────────────────────────────────────────────── */

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Profile + Hero */}
      <section className="grid lg:grid-cols-12 gap-6">

        {/* Profile card */}
        <div className="lg:col-span-4 rounded-2xl bg-slate-900/60 border border-slate-800/40 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-2xl font-black text-black">
              {(volunteerProfile?.name || user?.email || "V")[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-100">
                {volunteerProfile?.name || user?.email?.split("@")[0] || "Volunteer"}
              </h2>
              <p className="text-xs text-teal-400 uppercase tracking-wider mt-0.5">Level 4 Volunteer</p>
            </div>
          </div>

          {skills.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-slate-400 mb-2">Skills</p>
              <div className="flex flex-wrap gap-2">
                {skills.slice(0, 4).map(s => (
                  <span key={s} className="text-xs px-2 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">{s}</span>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <p className="text-xs text-slate-400 mb-1">Availability</p>
            <p className="text-sm text-slate-300">
              {Object.entries(availability).filter(([,v]) => v.available).map(([d]) => d.slice(0,3)).join(", ") || "Not set"}
            </p>
          </div>

          <div className="grid grid-cols-3 text-center gap-2">
            {[
              { val: volunteerProfile?.eventsAttended || 0, label: "Tasks",  color: "text-teal-400" },
              { val: volunteerProfile?.totalHours || 0,     label: "Hours",  color: "text-blue-400" },
              { val: volunteerProfile?.certificatesEarned || 0, label: "Certs", color: "text-purple-400" },
            ].map(s => (
              <div key={s.label} className="rounded-xl bg-slate-800/40 py-3">
                <p className={`text-xl font-extrabold ${s.color}`}>{s.val}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Hero banner */}
        <div className="lg:col-span-8 rounded-2xl bg-gradient-to-br from-slate-900/80 to-teal-900/30 border border-teal-500/20 p-8 flex flex-col justify-end min-h-[220px]">
          <span className="text-xs text-teal-400 uppercase tracking-widest mb-2">Featured Opportunity</span>
          <h2 className="text-3xl font-extrabold text-slate-100 mb-3">
            Empower Local Schools with IT Infrastructure
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            Help set up remote learning hubs for underserved communities. Skills: IT Support, Teaching.
          </p>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setActiveSection("opportunities")}
              className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-black font-bold px-6 py-2.5 rounded-full text-sm transition-all shadow-lg shadow-teal-500/20"
            >
              Explore Opportunities
            </button>
            <button className="border border-slate-600 hover:border-teal-400 text-slate-300 hover:text-teal-400 px-6 py-2.5 rounded-full text-sm transition-all">
              View Details
            </button>
          </div>
        </div>
      </section>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section>
          <h3 className="text-lg font-bold text-slate-100 mb-4">Recommended for You
            <span className="text-sm text-slate-400 font-normal ml-2">Based on your skills</span>
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recommendations.slice(0, 3).map(act => (
              <div key={act._id} className="rounded-2xl bg-slate-900/60 border border-slate-800/40 p-5 hover:border-teal-500/30 transition-colors">
                <h4 className="font-bold text-slate-100 mb-1">{act.title}</h4>
                <p className="text-sm text-slate-400 mb-4">{act.description?.substring(0, 90)}…</p>
                <p className="text-xs text-slate-500 mb-4">📅 {act.date}</p>
                <button
                  onClick={() => handleSignUp(act)}
                  className="w-full py-2 rounded-xl border border-teal-500/40 text-teal-400 hover:bg-teal-500/10 text-sm font-semibold transition-colors"
                >
                  Quick Sign Up
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick-access cards */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { key: "profile",      icon: "account_circle", label: "My Profile",            desc: "Update skills & availability" },
          { key: "opportunities",icon: "explore",        label: "Browse Opportunities",  desc: "Find & sign up for roles"     },
          { key: "activities",   icon: "event_available",label: "My Activities",         desc: "Track hours & earn certs"     },
          { key: "events",       icon: "groups",         label: "Community Events",      desc: "Join gatherings & workshops"  },
        ].map(c => (
          <button key={c.key} onClick={() => setActiveSection(c.key)}
            className="text-left rounded-2xl p-5 bg-slate-900/60 border border-slate-800/40 hover:border-teal-500/40 hover:bg-slate-800/50 transition-all group"
          >
            <span className="material-symbols-outlined text-teal-400 text-3xl group-hover:scale-110 transition-transform inline-block">{c.icon}</span>
            <h4 className="text-slate-100 font-bold mt-3 text-sm">{c.label}</h4>
            <p className="text-slate-400 text-xs mt-1">{c.desc}</p>
          </button>
        ))}
      </section>
    </div>
  );

  const renderOpportunities = () => (
    <div className="space-y-6">
      {/* Filters bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          className={`${inp} max-w-xs`}
          placeholder="Search opportunities..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <button
          onClick={() => { setActivities(allActivities.filter(a => a.skills?.some(s => skills.includes(s)))); setSearchTerm(""); }}
          className="px-4 py-2 text-sm rounded-full border border-teal-500/40 text-teal-400 hover:bg-teal-500/10 transition-colors"
        >
          Match My Skills
        </button>
        <button
          onClick={() => { setActivities(allActivities); setSearchTerm(""); }}
          className="px-4 py-2 text-sm rounded-full border border-slate-600 text-slate-400 hover:border-slate-400 transition-colors"
        >
          Show All
        </button>
      </div>

      {filteredActivities.length === 0 && (
        <p className="text-slate-500 text-center py-16">No opportunities found.</p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredActivities.map(act => (
          <div key={act._id} className="rounded-2xl bg-slate-900/60 border border-slate-800/40 p-5 hover:border-teal-500/30 transition-colors flex flex-col">
            <h4 className="font-bold text-slate-100 mb-1">{act.title}</h4>
            <p className="text-sm text-slate-400 mb-3 flex-1">{act.description}</p>
            <div className="space-y-1 text-xs text-slate-500 mb-4">
              <p>📅 {act.date}</p>
              <p>📍 {act.location}</p>
              <p>👥 {act.needed} volunteers needed</p>
            </div>
            {act.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {act.skills.map(s => (
                  <span key={s} className={`text-xs px-2 py-0.5 rounded-full ${skills.includes(s) ? "bg-teal-500/20 text-teal-400" : "bg-slate-700/50 text-slate-400"}`}>{s}</span>
                ))}
              </div>
            )}
            <button
              onClick={() => handleSignUp(act)}
              className="w-full py-2 rounded-xl border border-teal-500/40 text-teal-400 hover:bg-teal-500/10 text-sm font-semibold transition-colors"
            >
              Sign Up
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderActivities = () => (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-5">
        {[
          { label: "Total Hours",        value: volunteerProfile?.totalHours || 0,        color: "text-teal-400"   },
          { label: "Events Attended",    value: volunteerProfile?.eventsAttended || 0,    color: "text-blue-400"   },
          { label: "Certificates Earned",value: volunteerProfile?.certificatesEarned || 0,color: "text-purple-400" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl bg-slate-900/60 border border-slate-800/40 p-6">
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className={`text-3xl font-extrabold mt-2 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Activity log */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/40 overflow-hidden">
        <div className="p-5 border-b border-slate-800/40">
          <h3 className="font-bold text-slate-100">Recent Activities</h3>
        </div>
        {volunteerProfile?.activities?.length > 0 ? (
          <div className="divide-y divide-slate-800/40">
            {volunteerProfile.activities.map((act, i) => (
              <div key={i} className="p-5 flex justify-between items-center hover:bg-slate-800/20 transition-colors">
                <div>
                  <h4 className="font-semibold text-slate-100 text-sm">{act.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">📅 {act.date} · {act.hours} hrs</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    act.status === "completed" ? "text-green-400 bg-green-400/10" :
                    act.status === "upcoming"  ? "text-blue-400 bg-blue-400/10"  :
                                                 "text-yellow-400 bg-yellow-400/10"
                  }`}>
                    {act.status?.charAt(0).toUpperCase() + act.status?.slice(1)}
                  </span>
                  {act.status === "completed" && (
                    <button
                      onClick={() => generateCertificate(act)}
                      className="text-xs text-teal-400 border border-teal-500/30 hover:bg-teal-500/10 px-3 py-1 rounded-full transition-colors"
                    >
                      Download Cert
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-12 text-sm">No recent activities found.</p>
        )}
      </div>
    </div>
  );

  const renderEvents = () => (
    <div className="space-y-5">
      <div className="flex gap-3 items-center">
        <select className={`${inp} max-w-xs`}>
          <option>All Events</option>
          <option>Workshops</option>
          <option>Social Gatherings</option>
          <option>Fundraisers</option>
        </select>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[
          { title: "Volunteer Appreciation Dinner", desc: "Celebrate the contributions of our amazing volunteers.", date: "April 15, 2026 · 6:00 PM", location: "Community Hall", badge: "Free for volunteers", btn: "RSVP" },
          { title: "Leadership Workshop",           desc: "Develop leadership skills and learn about community organizing.", date: "May 25, 2026 · 10:00 AM", location: "Training Center",  badge: "Registration required", btn: "Register" },
          { title: "Monthly Volunteer Meetup",      desc: "Connect with fellow volunteers and share experiences.",          date: "Every last Friday · 7:00 PM", location: "Local Cafe", badge: "Casual gathering",      btn: "Join" },
        ].map(ev => (
          <div key={ev.title} className="rounded-2xl bg-slate-900/60 border border-slate-800/40 p-5 hover:border-teal-500/30 transition-colors flex flex-col">
            <h4 className="font-bold text-slate-100 mb-2">{ev.title}</h4>
            <p className="text-sm text-slate-400 flex-1 mb-4">{ev.desc}</p>
            <div className="space-y-1 text-xs text-slate-500 mb-4">
              <p>📅 {ev.date}</p>
              <p>📍 {ev.location}</p>
              <p>🎟️ {ev.badge}</p>
            </div>
            <button className="w-full py-2 rounded-xl border border-teal-500/40 text-teal-400 hover:bg-teal-500/10 text-sm font-semibold transition-colors">
              {ev.btn}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Personal info */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/40 p-6 space-y-4">
        <h3 className="font-bold text-slate-100">Personal Information</h3>
        <input className={inp} type="text" placeholder="Full Name" value={volunteerProfile?.name || ""} onChange={e => saveVolunteerData({ name: e.target.value })} />
        <input className={inp} type="tel"  placeholder="Phone Number" value={volunteerProfile?.phone || ""} onChange={e => saveVolunteerData({ phone: e.target.value })} />
        <textarea className={`${inp} h-24 resize-none`} placeholder="Address" value={volunteerProfile?.address || ""} onChange={e => saveVolunteerData({ address: e.target.value })} />

        {/* ID proof */}
        <div>
          <p className="text-xs text-slate-400 mb-2">ID Proof Upload (Aadhaar / PAN / Voter ID)</p>

          <label
            htmlFor="idProofInput"
            className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-dashed transition-colors ${
              uploadState.loading
                ? "border-teal-500/60 bg-teal-500/5 cursor-wait"
                : "border-slate-600 hover:border-teal-500"
            }`}
          >
            {uploadState.loading ? (
              <>
                <span className="material-symbols-outlined text-teal-400 animate-spin">progress_activity</span>
                <span className="text-sm text-teal-400">Uploading…</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-slate-400">upload_file</span>
                <span className="text-sm text-slate-400">
                  {volunteerProfile?.idProofUrl ? "Replace ID proof" : "Click to upload (JPEG, PNG, PDF · max 5 MB)"}
                </span>
              </>
            )}
          </label>

          <input
            id="idProofInput"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={handleIdProofUpload}
            disabled={uploadState.loading}
          />

          {/* Status messages */}
          {uploadState.error && (
            <p className="text-xs text-red-400 mt-2">⚠ {uploadState.error}</p>
          )}
          {!uploadState.error && volunteerProfile?.idProofUrl && (
            <div className="flex items-center gap-2 mt-2">
              <p className="text-xs text-teal-400">✓ ID proof uploaded</p>
              <a
                href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${volunteerProfile.idProofUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-400 hover:text-teal-400 underline underline-offset-2 transition-colors"
              >
                View
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Availability */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/40 p-6">
          <h3 className="font-bold text-slate-100 mb-4">Weekly Availability</h3>
          <div className="space-y-2">
            {Object.entries(availability).map(([day, s]) => (
              <div key={day} className="flex items-center gap-3">
                <label className="flex items-center gap-2 w-28 cursor-pointer">
                  <input type="checkbox" checked={s.available} className="accent-teal-400"
                    onChange={e => handleAvailabilityChange(day, "available", e.target.checked)} />
                  <span className="text-sm text-slate-300 capitalize">{day}</span>
                </label>
                {s.available && (
                  <div className="flex items-center gap-2">
                    <input type="time" value={s.startTime} className="bg-slate-800/60 border border-slate-700/40 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
                      onChange={e => handleAvailabilityChange(day, "startTime", e.target.value)} />
                    <span className="text-slate-500 text-xs">to</span>
                    <input type="time" value={s.endTime} className="bg-slate-800/60 border border-slate-700/40 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
                      onChange={e => handleAvailabilityChange(day, "endTime", e.target.value)} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/40 p-6">
          <h3 className="font-bold text-slate-100 mb-4">Skills & Interests</h3>
          <div className="flex flex-wrap gap-2">
            {availableSkills.map(skill => (
              <button key={skill} onClick={() => handleSkillToggle(skill)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  skills.includes(skill)
                    ? "bg-teal-500/20 text-teal-400 border-teal-500/40"
                    : "bg-slate-800/40 text-slate-400 border-slate-700/40 hover:border-slate-500"
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  /* ──────────────────────────────────────────────────────
     MAIN RENDER
  ─────────────────────────────────────────────────────── */
  return (
    <div style={{ fontFamily: "Inter, sans-serif" }} className="min-h-screen bg-[#0b1326] text-slate-100">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />

      {/* ── Sidebar ────────────────────────────────────── */}
      <aside className="fixed left-0 top-0 h-full w-72 hidden md:flex flex-col"
        style={{ background: "rgba(10,18,40,0.75)", backdropFilter: "blur(20px)", borderRight: "1px solid rgba(148,163,184,0.08)" }}>
        <div className="p-8">
          <h1 className="text-2xl font-black text-teal-400">InvictusPro</h1>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">Community Hub</p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <button key={item.key} onClick={() => setActiveSection(item.key)}
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
          <button onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-red-400 text-sm border border-slate-700/40 hover:border-red-400/40 py-2 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main ───────────────────────────────────────── */}
      <div className="md:ml-72 flex flex-col min-h-screen">

        {/* Sticky header */}
        <header className="sticky top-0 z-10 flex justify-between items-center px-6 h-16"
          style={{ background: "rgba(11,19,38,0.7)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="flex items-center gap-4">
            <h2 className="font-bold text-slate-100">
              {NAV_ITEMS.find(n => n.key === activeSection)?.label ?? "Dashboard"}
            </h2>
            <input
              placeholder="Search opportunities..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); if (activeSection !== "opportunities") setActiveSection("opportunities"); }}
              className="hidden sm:block bg-slate-800/60 border border-slate-700/40 px-4 py-1.5 rounded-full text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors w-56"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 text-slate-400 hover:text-slate-100 transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-black font-bold text-sm">
              {(user?.email || "V")[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {loading ? (
            <div className="flex items-center justify-center py-24 text-slate-500">
              <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
              Loading…
            </div>
          ) : (
            <>
              {activeSection === "overview"      && renderOverview()}
              {activeSection === "opportunities" && renderOpportunities()}
              {activeSection === "activities"    && renderActivities()}
              {activeSection === "events"        && renderEvents()}
              {activeSection === "profile"       && renderProfile()}
            </>
          )}
        </main>
      </div>

      {/* ── Mobile bottom nav ──────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 w-full flex justify-around py-3 z-10"
        style={{ background: "rgba(10,18,40,0.95)", backdropFilter: "blur(16px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {NAV_ITEMS.map(item => (
          <button key={item.key} onClick={() => setActiveSection(item.key)}
            className={`flex flex-col items-center gap-0.5 ${activeSection === item.key ? "text-teal-400" : "text-slate-500"}`}
          >
            <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            <span className="text-[9px]">{item.label.split(" ")[0]}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default VolunteerDashboard;
