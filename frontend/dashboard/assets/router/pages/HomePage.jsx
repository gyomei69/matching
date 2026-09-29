import EventAvailableOutlined from "@mui/icons-material/EventAvailableOutlined";
import ScheduleOutlined from "@mui/icons-material/ScheduleOutlined";
import HandshakeOutlined from "@mui/icons-material/HandshakeOutlined";
import FlagOutlined from "@mui/icons-material/FlagOutlined";
import ChatBubbleOutline from "@mui/icons-material/ChatBubbleOutline";
import PersonOutline from "@mui/icons-material/PersonOutline";
import CampaignOutlined from "@mui/icons-material/CampaignOutlined";
import TuneOutlined from "@mui/icons-material/TuneOutlined";
import ExploreOutlined from "@mui/icons-material/ExploreOutlined";
import NotificationsNoneOutlined from "@mui/icons-material/NotificationsNoneOutlined";
import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import CheckCircleOutline from "@mui/icons-material/CheckCircleOutline";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import BarChartOutlined from "@mui/icons-material/BarChartOutlined";
import HourglassEmptyOutlined from "@mui/icons-material/HourglassEmptyOutlined";
import Skeleton from "@mui/material/Skeleton";

(function () {
  "use strict";
  const React = window.React;
  const { useContext, useEffect, useRef, useState } = React;
  const AppContext = window.DashboardApp.AppContext;
  const Utils = window.DashboardApp.Utils || {};
  const { formatDate, MentorRoleBadge, formatMatchScore } = Utils;
  const Availability = window.DashboardApp.Availability;
  const formatSlotList =
    (Availability && Availability.formatSlotList) ||
    ((slots) => (Array.isArray(slots) ? slots.join(", ") : ""));

  function MenteeDashIcon({ name, size }) {
    const s = size != null ? size : 18;
    const p = {
      width: s,
      height: s,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": true,
    };
    const icons = {
      users: (
        <svg {...p}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      calendar: (
        <svg {...p}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      clock: (
        <svg {...p}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      pending: (
        <svg {...p}>
          <circle cx="12" cy="12" r="10" />
          <line x1="10" y1="15" x2="10" y2="9" />
          <line x1="14" y1="15" x2="14" y2="9" />
        </svg>
      ),
      check: (
        <svg {...p}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      sparkles: (
        <svg {...p}>
          <path d="M12 3v2M12 19v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M3 12h2M19 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
      star: (
        <svg {...p}>
          <polygon
            points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
            fill="none"
          />
        </svg>
      ),
      megaphone: (
        <svg {...p}>
          <path d="m3 11 18-5v12L3 14v-3z" />
          <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
        </svg>
      ),
      plus: (
        <svg {...p}>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      ),
      barChart: (
        <svg {...p}>
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
      message: (
        <svg {...p}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <line x1="9" y1="10" x2="15" y2="10" />
          <line x1="9" y1="14" x2="13" y2="14" />
        </svg>
      ),
      user: (
        <svg {...p}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      mail: (
        <svg {...p}>
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-10 6L2 7" />
        </svg>
      ),
      target: (
        <svg {...p}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      ),
      compass: (
        <svg {...p}>
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      ),
    };
    const node = icons[name];
    if (!node) return null;
    return <span className="mentee-dash-icon-wrap">{node}</span>;
  }

  function MenteeAvatar({ name, url, className }) {
    const initial = String(name || "?")
      .slice(0, 1)
      .toUpperCase();
    return (
      <div className={"sidebar-avatar-wrapper " + (className || "")}>
        {url ? (
          <img src={url} alt="" className="sidebar-avatar" />
        ) : (
          <div className="sidebar-avatar fallback">{initial}</div>
        )}
      </div>
    );
  }

  function StatCard({ icon, label, value, hint }) {
    return (
      <article className="dashboard-card mentee-stat-card">
        <span className="mentee-stat-icon">{icon}</span>
        <p className="mentee-stat-value">{value}</p>
        <p className="mentee-stat-label">{label}</p>
        {hint ? <p className="mentee-stat-hint">{hint}</p> : null}
      </article>
    );
  }

  function formatHoursValue(minutes) {
    const mins = Number(minutes) || 0;
    if (mins <= 0) return "—";
    const hours = Math.round((mins / 60) * 10) / 10;
    return `${hours} hrs`;
  }

  function formatCountdown(start) {
    if (!(start instanceof Date) || Number.isNaN(start.getTime())) return "";
    const ms = start.getTime() - Date.now();
    if (ms <= 0) return "";
    const hours = Math.round(ms / 3600000);
    if (hours < 1) return "Next window in under an hour";
    if (hours === 1) return "Next window in 1 hour";
    if (hours < 48) return `Next window in ${hours} hours`;
    return `Next window ${start.toLocaleDateString(undefined, {
      weekday: "short",
    })}`;
  }

  function gmailComposeUrl(email) {
    const to = String(email || "").trim();
    if (!to) return "";
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}`;
  }

  function MatchBadge({ score }) {
    if (score == null || !formatMatchScore) return null;
    const { percentage, label, tier } = formatMatchScore(score);
    return (
      <span
        className={"mentee-match-badge match-score-tier-" + tier}
        title={label}
      >
        {percentage}% Match
      </span>
    );
  }

  function WelcomeHeroAvatar({ user }) {
    if (!user) return null;
    const displayName =
      user.full_name || user.display_name || user.username || "You";
    const initial = displayName.slice(0, 1).toUpperCase();
    const avatarUrl = user.avatar_url || "";
    return (
      <div className="dashboard-welcome-avatar" aria-hidden="true">
        <div className="sidebar-avatar-wrapper dashboard-welcome-avatar-wrap">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="sidebar-avatar" />
          ) : (
            <div className="sidebar-avatar fallback">{initial}</div>
          )}
        </div>
      </div>
    );
  }

  function HomePage() {
    const ctx = useContext(AppContext);
    if (!ctx) return null;
    const {
      user,
      stats,
      authCheckDone,
      setActiveTab,
      menteeRecommendations,
      menteeRecLoading,
      loadMenteeRecommendations,
      myMentor,
      myMentors = [],
      menteePairingsCount = 0,
      menteeMatching,
      theme,
      mentorRequests,
      mentorProfile,
      chooseMentor,
      pendingMentorIds = [],
      acceptMentee,
      acceptMenteeLoading,
      adminPairings,
      adminPairingsLoading,
      loadAdminPairings,
    } = ctx;
    const [requestingMentorId, setRequestingMentorId] = useState(null);

    useEffect(() => {
      if (user && (user.role === "staff" || user.is_staff) && typeof loadAdminPairings === "function") {
        loadAdminPairings();
      }
    }, [user]);

    // Deferred / Lazy Loading: Fetch mentor recommendations asynchronously in the background
    // without blocking the rendering of user profile, metrics strip, or stats widgets.
    useEffect(() => {
      if (
        user &&
        user.role === "mentee" &&
        (!menteeRecommendations || menteeRecommendations.length === 0) &&
        typeof loadMenteeRecommendations === "function"
      ) {
        loadMenteeRecommendations(10);
      }
    }, [user, menteeRecommendations, loadMenteeRecommendations]);

    const handleRequestMentor = async (mentorId) => {
      if (!mentorId || typeof chooseMentor !== "function") return;
      setRequestingMentorId(mentorId);
      try {
        await chooseMentor(mentorId);
      } finally {
        setRequestingMentorId(null);
      }
    };
    if (!authCheckDone) return null;
    if (!user) {
      return (
        <div className="card cta-card page-shell">
          <h1 className="page-title">Mentor–Mentee Matching</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            Connect with mentors or mentees through smart matching in one place.
          </p>
          <div className="btn-row">
            <button
              className="btn"
              onClick={() => {
                window.location.href = "/portal/";
              }}
            >
              Get started
            </button>
            <button
              className="btn secondary"
              onClick={() => {
                window.location.href = "/app/#signin";
              }}
            >
              I already have an account
            </button>
            <button
              type="button"
              className="btn secondary auth-landing-back-btn"
              onClick={() => {
                window.location.href = "/landing/";
              }}
            >
              Back to landing
            </button>
          </div>
        </div>
      );
    }

    const staffOverviewChartRef = useRef(null);

    if (user.role === "mentee") {
      const hasQuestionnaire = !!(
        user.mentee_questionnaire_completed ?? user.questionnaire_completed
      );
      const recommendations = Array.isArray(menteeRecommendations)
        ? menteeRecommendations
        : [];
      const matchCount = recommendations.length;
      const firstName = String(
        user.full_name || user.display_name || user.username || "",
      )
        .trim()
        .split(/\s+/)[0];

      const activePairingsCount = Math.max(
        (myMentors && myMentors.length) || (myMentor ? 1 : 0),
        menteePairingsCount || 0
      );
      const isLimitReached = activePairingsCount >= 2;

      const menteeSlots = Array.isArray(menteeMatching?.availability)
        ? menteeMatching.availability
        : [];
      const sharedSlots =
        Availability && myMentor
          ? Availability.intersectSlots(menteeSlots, myMentor.availability)
          : [];
      const scheduleSlots = myMentor && sharedSlots.length
        ? sharedSlots
        : menteeSlots;
      const upcoming = Availability
        ? Availability.nextOccurrences(scheduleSlots, 4)
        : [];
      const nextWindow = upcoming[0] || null;
      const weeklyMinutes = Availability
        ? Availability.weeklyMinutes(
            myMentor && sharedSlots.length ? sharedSlots : menteeSlots,
          )
        : 0;

      const planSubjects = Array.isArray(menteeMatching?.subjects)
        ? menteeMatching.subjects.filter((item) => String(item || "").trim())
        : [];
      const planTopics = Array.isArray(menteeMatching?.topics)
        ? menteeMatching.topics.filter((item) => String(item || "").trim())
        : [];

      const topRecommendation = recommendations.reduce(
        (best, item) =>
          best == null || Number(item.score) > Number(best.score) ? item : best,
        null,
      );
      const headlineScore =
        myMentor && myMentor.score != null
          ? myMentor.score
          : topRecommendation
            ? topRecommendation.score
            : null;
      const headlineMatch =
        headlineScore != null && formatMatchScore
          ? formatMatchScore(headlineScore)
          : null;

      const mentorName = myMentor
        ? myMentor.display_name || myMentor.username
        : "";
      const mentorSubjects = (() => {
        if (!myMentor) return [];
        const details = myMentor.match_details || {};
        if ((details.common_subjects || []).length) {
          return details.common_subjects;
        }
        if (
          Array.isArray(myMentor.subjects) &&
          Array.isArray(menteeMatching?.subjects)
        ) {
          const wanted = new Set(
            menteeMatching.subjects.map((s) => String(s).trim().toLowerCase()),
          );
          return myMentor.subjects.filter((s) =>
            wanted.has(String(s).trim().toLowerCase()),
          );
        }
        return [];
      })();

      function openMentorProfile(userId) {
        if (userId == null || typeof window === "undefined") return;
        window.location.hash = `profile/mentor/${userId}`;
      }

      return (
        <div className="mentee-home page-shell">
          {/* Kasandigan Open Native Header — Zero box container */}
          <header className="kasandigan-header">
            <div className="kasandigan-header-content">
              <div className="kasandigan-badge">
                <span className="kasandigan-badge-dot" />
                <span>Academic Mentoring Unit • Mentee Matching Portal</span>
              </div>
              <h1 className="mentee-hero-title kasandigan-title">
                Welcome back{firstName ? `, ${firstName}` : user.username ? `, ${user.username}` : ""}
              </h1>
              <p className="mentee-hero-subtitle kasandigan-subtitle">
                Find your ideal academic mentor, review algorithmic compatibility, and manage your pairings.
              </p>
              <div className="mentor-v2-status-row" style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                {MentorRoleBadge ? <MentorRoleBadge role="mentee" prominent /> : null}
                <span
                  className={`neu-badge ${
                    isLimitReached
                      ? "neu-badge--high"
                      : activePairingsCount === 1
                      ? "neu-badge--medium"
                      : "neu-badge--neutral"
                  }`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    padding: "4px 10px",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: isLimitReached ? "#ef4444" : activePairingsCount === 1 ? "#3b82f6" : "#10b981",
                    }}
                  />
                  {isLimitReached
                    ? `Mentor Limit Reached (${activePairingsCount}/2)`
                    : `Mentors: ${activePairingsCount}/2 Slots`}
                </span>
              </div>
            </div>
            <div className="kasandigan-header-actions">
              <button
                type="button"
                className="btn kasandigan-btn-primary"
                onClick={() => setActiveTab("matching")}
              >
                <ExploreOutlined fontSize="inherit" />
                <span>Browse All Mentors</span>
              </button>
              <button
                type="button"
                className="btn kasandigan-btn-secondary"
                onClick={() => setActiveTab("mentoring-preferences")}
              >
                <TuneOutlined fontSize="inherit" />
                <span>Matching Profile</span>
              </button>
            </div>
          </header>

          {/* Kasandigan Unified Metric Strip (Pure Matching KPIs) */}
          <section
            className="mentee-stat-grid kasandigan-metric-strip"
            aria-label="Your matching snapshot"
          >
            <div
              className={`kasandigan-metric-cell ${isLimitReached ? "kasandigan-metric-cell--limit-reached" : ""}`}
              onClick={() =>
                myMentor
                  ? openMentorProfile(myMentor.user_id)
                  : setActiveTab("matching")
              }
              role="button"
              tabIndex={0}
            >
              <div className="kasandigan-metric-cell-top">
                <span className="kasandigan-metric-label">Completed pairings</span>
                <span className="kasandigan-metric-icon">
                  <HandshakeOutlined fontSize="inherit" />
                </span>
              </div>
              <div className="kasandigan-metric-value" style={isLimitReached ? { color: "#ef4444" } : {}}>
                {activePairingsCount}/2
              </div>
              <span className="kasandigan-metric-link">
                {isLimitReached
                  ? "Limit reached (2/2) →"
                  : activePairingsCount === 1
                  ? "1 slot available (1/2) →"
                  : "2 slots available (0/2) →"}
              </span>
            </div>

            <div
              className="kasandigan-metric-cell"
              onClick={() => setActiveTab("matching")}
              role="button"
              tabIndex={0}
            >
              <div className="kasandigan-metric-cell-top">
                <span className="kasandigan-metric-label">Recommended mentors</span>
                <span className="kasandigan-metric-icon">
                  <AutoAwesomeOutlined fontSize="inherit" />
                </span>
              </div>
              <div className="kasandigan-metric-value">
                {matchCount}
              </div>
              <span className="kasandigan-metric-link">
                {headlineMatch ? `${headlineMatch.percentage}% top match →` : "Browse recommendations →"}
              </span>
            </div>

            <div
              className="kasandigan-metric-cell"
              onClick={() => setActiveTab("mentoring-preferences")}
              role="button"
              tabIndex={0}
            >
              <div className="kasandigan-metric-cell-top">
                <span className="kasandigan-metric-label">Available windows</span>
                <span className="kasandigan-metric-icon">
                  <ScheduleOutlined fontSize="inherit" />
                </span>
              </div>
              <div className="kasandigan-metric-value">
                {upcoming.length
                  ? `${upcoming.length} ${upcoming.length === 1 ? "window" : "windows"}`
                  : "0"}
              </div>
              <span className="kasandigan-metric-link">
                {myMentor && sharedSlots.length
                  ? "Shared times with mentor →"
                  : upcoming.length
                    ? "From your schedule →"
                    : "Set availability →"}
              </span>
            </div>

            <div
              className="kasandigan-metric-cell"
              onClick={() => setActiveTab("mentoring-preferences")}
              role="button"
              tabIndex={0}
            >
              <div className="kasandigan-metric-cell-top">
                <span className="kasandigan-metric-label">Preferences readiness</span>
                <span className="kasandigan-metric-icon">
                  <TuneOutlined fontSize="inherit" />
                </span>
              </div>
              <div className="kasandigan-metric-value">
                {hasQuestionnaire && planSubjects.length ? "Configured" : "Needs setup"}
              </div>
              <span className="kasandigan-metric-link">
                {planSubjects.length} subject{planSubjects.length === 1 ? "" : "s"} selected →
              </span>
            </div>
          </section>

          {isLimitReached && (
            <div className="mentee-limit-banner" role="alert" style={{ marginBottom: "20px" }}>
              <div className="mentee-limit-icon">
                <HandshakeOutlined fontSize="medium" />
              </div>
              <div className="mentee-limit-text">
                <div className="mentee-limit-title">
                  Mentor Limit Reached ({activePairingsCount}/2 Mentors)
                </div>
                <div className="mentee-limit-desc">
                  Under AMU guidelines, each mentee is limited to a maximum of 2 concurrent mentors. You are currently paired with {activePairingsCount} mentors (maximum capacity reached). Pairing requests for additional mentors are paused.
                </div>
              </div>
              <span className="neu-badge neu-badge--high">2/2 Limit Reached</span>
            </div>
          )}

          {/* Kasandigan Coordinated Grid */}
          <div className="mentee-home-grid kasandigan-main-grid">
            {/* Row 1: Spotlight (Your Mentor or Empty Prompt) + Upcoming Schedule Windows */}
            <div className="mentee-home-row mentee-home-row--spotlight">
              <section className="dashboard-card mentee-spotlight kasandigan-card">
                <div className="kasandigan-card-head">
                  <div className="kasandigan-card-head-title">
                    <PersonOutline fontSize="inherit" className="kasandigan-head-icon" />
                    <h2>
                      {isLimitReached
                        ? "Your Mentors (2/2 Limit Reached)"
                        : activePairingsCount === 1
                        ? "Your Mentor (1/2 Slots Used)"
                        : "Your mentor"}
                    </h2>
                  </div>
                  {myMentor ? <MatchBadge score={myMentor.score} /> : null}
                </div>

                {myMentor || (myMentors && myMentors.length > 0) ? (
                  <div
                    className="mentee-spotlight-content"
                    style={
                      myMentors && myMentors.length > 1
                        ? { display: "flex", flexDirection: "column", gap: "20px" }
                        : {}
                    }
                  >
                    {(myMentors && myMentors.length > 0 ? myMentors : [myMentor]).map(
                      (mentorItem, idx) => {
                        const itemMentorName =
                          mentorItem.display_name || mentorItem.username || "Mentor";
                        const itemSubjects = (() => {
                          const details = mentorItem.match_details || {};
                          if ((details.common_subjects || []).length) {
                            return details.common_subjects;
                          }
                          if (
                            Array.isArray(mentorItem.subjects) &&
                            Array.isArray(menteeMatching?.subjects)
                          ) {
                            const wanted = new Set(
                              menteeMatching.subjects.map((s) =>
                                String(s).trim().toLowerCase()
                              )
                            );
                            return mentorItem.subjects.filter((s) =>
                              wanted.has(String(s).trim().toLowerCase())
                            );
                          }
                          return Array.isArray(mentorItem.subjects)
                            ? mentorItem.subjects
                            : [];
                        })();

                        return (
                          <div
                            key={mentorItem.id || mentorItem.user_id || idx}
                            style={
                              idx > 0
                                ? {
                                    borderTop:
                                      "1px solid var(--border-color, rgba(0,0,0,0.08))",
                                    paddingTop: "16px",
                                  }
                                : {}
                            }
                          >
                            <div className="mentee-spotlight-identity">
                              <div className="mentee-spotlight-avatar">
                                <MenteeAvatar
                                  name={itemMentorName}
                                  url={mentorItem.avatar_url}
                                />
                                <span
                                  className="mentee-spotlight-status"
                                  title="Active pairing"
                                  aria-label="Active pairing"
                                />
                              </div>
                              <div className="mentee-spotlight-meta">
                                <div className="mentee-spotlight-name-row">
                                  <p className="mentee-spotlight-name">
                                    {itemMentorName}
                                  </p>
                                  {mentorItem.role && MentorRoleBadge ? (
                                    <MentorRoleBadge
                                      role={mentorItem.role}
                                      prominent
                                    />
                                  ) : null}
                                </div>
                                {mentorItem.accepted_at && (
                                  <p className="mentee-muted">
                                    Paired since{" "}
                                    {(() => {
                                      try {
                                        const d = new Date(mentorItem.accepted_at);
                                        return Number.isNaN(d.getTime())
                                          ? formatDate(mentorItem.accepted_at)
                                          : d.toLocaleDateString(undefined, {
                                              month: "short",
                                              day: "numeric",
                                              year: "numeric",
                                            });
                                      } catch (e) {
                                        return formatDate(mentorItem.accepted_at);
                                      }
                                    })()}
                                  </p>
                                )}
                                {itemSubjects.length > 0 && (
                                  <div className="mentee-chip-row">
                                    {itemSubjects.slice(0, 4).map((subject) => (
                                      <span key={subject} className="mentee-chip">
                                        {subject}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {idx === 0 && (
                              <dl className="mentee-spotlight-facts" style={{ marginTop: "12px" }}>
                                <div>
                                  <dt>Next window</dt>
                                  <dd>
                                    {nextWindow
                                      ? `${nextWindow.dateLabel} • ${nextWindow.timeLabel}`
                                      : "No overlapping time yet"}
                                  </dd>
                                </div>
                                <div>
                                  <dt>Weekly hours</dt>
                                  <dd>{formatHoursValue(weeklyMinutes)}</dd>
                                </div>
                              </dl>
                            )}

                            <div
                              className="mentee-spotlight-actions"
                              style={{ marginTop: "12px" }}
                            >
                              {mentorItem.email ? (
                                <a
                                  className="btn kasandigan-btn-primary"
                                  href={gmailComposeUrl(mentorItem.email)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ChatBubbleOutline fontSize="inherit" />
                                  <span>Send Message</span>
                                </a>
                              ) : null}
                              <button
                                type="button"
                                className="btn kasandigan-btn-secondary"
                                onClick={() =>
                                  openMentorProfile(mentorItem.user_id || mentorItem.id)
                                }
                              >
                                <PersonOutline fontSize="inherit" />
                                <span>View Profile</span>
                              </button>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                ) : (
                  <div className="mentee-empty">
                    <p>You do not have an official mentor yet.</p>
                    <button
                      type="button"
                      className="btn kasandigan-btn-primary"
                      onClick={() => setActiveTab("matching")}
                    >
                      Browse recommendations
                    </button>
                  </div>
                )}
              </section>

              {/* Schedule Windows Rail Card */}
              <section className="dashboard-card kasandigan-card mentee-rail-card mentee-sessions-card">
                <div className="kasandigan-card-head">
                  <div className="kasandigan-card-head-title">
                    <EventAvailableOutlined fontSize="inherit" className="kasandigan-head-icon" />
                    <h2>Upcoming sessions</h2>
                  </div>
                  {upcoming.length > 0 ? (
                    <span className="kasandigan-card-badge">{upcoming.length} scheduled</span>
                  ) : null}
                </div>
                {upcoming.length > 0 ? (
                  <div className="mentee-sessions-card-body">
                    <p className="mentee-muted mentee-sessions-desc">
                      {myMentor && sharedSlots.length
                        ? `Next overlapping windows with ${mentorName}.`
                        : "The next times you marked as free."}
                    </p>
                    <ul className="mentee-slot-list">
                      {upcoming.map((occ) => (
                        <li
                          key={`${occ.slot}-${occ.start.getTime()}`}
                          className="mentee-slot mentee-slot--schedule"
                        >
                          <span className="mentee-slot-icon">
                            <EventAvailableOutlined fontSize="inherit" />
                          </span>
                          <div className="mentee-slot-copy">
                            <span className="mentee-slot-when">{occ.dateLabel}</span>
                            <span className="mentee-slot-time">{occ.timeLabel}</span>
                          </div>
                          <button
                            type="button"
                            className="mentee-slot-action"
                            onClick={() => setActiveTab("mentoring-preferences")}
                          >
                            Reschedule
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="mentee-muted mentee-sessions-desc" style={{ padding: "16px" }}>
                    {myMentor
                      ? `You and ${mentorName} have no overlapping times yet.`
                      : "You have not set any availability yet."}
                  </p>
                )}
                <div className="mentee-sessions-card-foot" style={{ marginTop: "auto", paddingTop: "14px" }}>
                  <button
                    type="button"
                    className="btn kasandigan-btn-secondary full-width"
                    onClick={() => setActiveTab("mentoring-preferences")}
                  >
                    {upcoming.length ? "Manage schedule" : "Edit availability"}
                  </button>
                </div>
              </section>
            </div>

            {/* Row 2: Recommended Mentors (Direct Matching Actions) + Matching Lifecycle Guide */}
            <div className="mentee-home-row mentee-home-row--discovery">
              <section className="dashboard-card kasandigan-card mentee-recs-card">
                <div className="kasandigan-card-head">
                  <div className="kasandigan-card-head-title">
                    <AutoAwesomeOutlined fontSize="inherit" className="kasandigan-head-icon" />
                    <h2>Recommended mentors</h2>
                  </div>
                  <span className="kasandigan-card-badge">{matchCount} available</span>
                </div>

                {menteeRecLoading && matchCount === 0 ? (
                  <div className="mentee-top-recommendations-list" style={{ padding: "14px 0" }}>
                    <Skeleton
                      variant="rectangular"
                      height={180}
                      sx={{ borderRadius: "16px", mb: 2, transform: "translateZ(0)" }}
                    />
                    <Skeleton
                      variant="rectangular"
                      height={180}
                      sx={{ borderRadius: "16px", transform: "translateZ(0)" }}
                    />
                  </div>
                ) : matchCount > 0 ? (
                  <div className="mentee-spotlight-content" style={{ padding: "14px 0 0 0" }}>
                    <p className="mentee-muted" style={{ marginBottom: "14px", fontSize: "13px" }}>
                      Curated algorithmic recommendations based on your course subjects and available days:
                    </p>

                    <div className="mentee-top-recommendations-list">
                      {recommendations.slice(0, 3).map((match) => {
                        const mentor = match.mentor || {};
                        const name =
                          match.mentor_display_name ||
                          mentor.display_name ||
                          match.mentor_username ||
                          "Mentor";
                        const matchDetails = match.match_details || {};
                        const commonSubs =
                          matchDetails.common_subjects || mentor.subjects || [];
                        const mentorId = match.mentor_id || mentor.mentor_id;
                        const isRequesting = requestingMentorId === mentorId;
                        const isPending = (pendingMentorIds || []).includes(mentorId) || !!match.is_pending;

                        return (
                          <div key={mentorId || name} className="mentee-rec-card">
                            <div className="mentee-rec-card-top">
                              <div className="mentee-rec-identity">
                                <MenteeAvatar name={name} url={mentor.avatar_url} />
                                <div className="mentee-rec-meta">
                                  <div className="mentee-rec-name-row">
                                    <span className="mentee-rec-name">{name}</span>
                                    {mentor.role && MentorRoleBadge ? (
                                      <MentorRoleBadge role={mentor.role} />
                                    ) : null}
                                  </div>
                                  {match.slots_left != null && (
                                    <span className="mentee-rec-slots">
                                      {match.slots_left > 0
                                        ? `${match.slots_left} slot${match.slots_left === 1 ? "" : "s"} open`
                                        : "At capacity"}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <MatchBadge score={match.score} />
                            </div>

                            {commonSubs.length > 0 && (
                              <div className="mentee-chip-row" style={{ margin: "10px 0 12px" }}>
                                {commonSubs.slice(0, 3).map((s) => (
                                  <span key={s} className="mentee-chip">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="mentee-rec-actions">
                              <button
                                type="button"
                                className="btn kasandigan-btn-primary small"
                                disabled={isRequesting || match.slots_left === 0 || isPending}
                                onClick={() => {
                                  if (isPending) return;
                                  handleRequestMentor(mentorId);
                                }}
                              >
                                {isRequesting ? "Connecting..." : isPending ? "Request Sent" : "Connect"}
                              </button>
                              {mentor.user_id && (
                                <button
                                  type="button"
                                  className="btn kasandigan-btn-secondary small"
                                  onClick={() => openMentorProfile(mentor.user_id)}
                                >
                                  Profile
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="kasandigan-card-foot" style={{ marginTop: "14px" }}>
                      <button
                        type="button"
                        className="kasandigan-foot-link"
                        onClick={() => setActiveTab("matching")}
                      >
                        See all matches ({matchCount}) →
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mentee-empty" style={{ padding: "28px 16px" }}>
                    <p style={{ maxWidth: "420px", margin: "0 auto 14px" }}>
                      No mentor recommendations yet. Try adjusting your preferences or selecting additional subjects.
                    </p>
                    <button
                      type="button"
                      className="btn secondary small"
                      onClick={() => setActiveTab("mentoring-preferences")}
                    >
                      Adjust preferences
                    </button>
                  </div>
                )}
              </section>

              {/* Side Stack: Quick Actions & Matching Lifecycle */}
              <div className="mentee-home-side-stack">
                <section className="dashboard-card kasandigan-card mentee-rail-card mentee-quick-actions-card">
                  <div className="kasandigan-card-head">
                    <div className="kasandigan-card-head-title">
                      <ExploreOutlined fontSize="inherit" className="kasandigan-head-icon" />
                      <h2>Quick actions</h2>
                    </div>
                    <span className="kasandigan-card-badge">Shortcuts</span>
                  </div>
                  <div className="mentee-quick-actions">
                    <button
                      type="button"
                      className="mentee-quick-action"
                      onClick={() => setActiveTab("matching")}
                    >
                      <ExploreOutlined fontSize="inherit" />
                      <span>Find mentors</span>
                    </button>
                    <button
                      type="button"
                      className="mentee-quick-action"
                      onClick={() => setActiveTab("mentoring-preferences")}
                    >
                      <TuneOutlined fontSize="inherit" />
                      <span>Preferences</span>
                    </button>
                    <button
                      type="button"
                      className="mentee-quick-action"
                      onClick={() => setActiveTab("notifications")}
                    >
                      <NotificationsNoneOutlined fontSize="inherit" />
                      <span>Notifications</span>
                    </button>
                  </div>
                </section>

                <section className="dashboard-card mentee-activity kasandigan-card mentee-next-steps-card">
                  <div className="kasandigan-card-head">
                    <div className="kasandigan-card-head-title">
                      <FlagOutlined fontSize="inherit" className="kasandigan-head-icon" />
                      <h2>Matching lifecycle</h2>
                    </div>
                    <span className="kasandigan-card-badge">Action Plan</span>
                  </div>
                  <ul className="mentee-timeline">
                    <li
                      className="mentee-timeline-item mentee-timeline-item--interactive"
                      role="button"
                      tabIndex={0}
                      onClick={() => setActiveTab("mentoring-preferences")}
                      title="Go to Mentoring Preferences"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setActiveTab("mentoring-preferences");
                        }
                      }}
                    >
                      <span className={`mentee-timeline-icon ${hasQuestionnaire ? "mentee-timeline-icon--completed" : ""}`}>
                        {hasQuestionnaire ? (
                          <CheckCircleOutline fontSize="inherit" />
                        ) : (
                          <AutoAwesomeOutlined fontSize="inherit" />
                        )}
                      </span>
                      <div className="mentee-timeline-content">
                        <div className="mentee-timeline-header-row">
                          <p className="mentee-timeline-title">
                            1. Mentoring preferences
                          </p>
                          <span className={`mentee-timeline-action-badge ${hasQuestionnaire ? "mentee-timeline-action-badge--done" : ""}`}>
                            {hasQuestionnaire ? "Edit Preferences →" : "Start Setup →"}
                          </span>
                        </div>
                        <p className="mentee-muted">
                          {hasQuestionnaire
                            ? "Preferences configured — ready for matching"
                            : "Select subjects and learning goals"}
                        </p>
                      </div>
                    </li>
                    <li
                      className="mentee-timeline-item mentee-timeline-item--interactive"
                      role="button"
                      tabIndex={0}
                      onClick={() => setActiveTab("availability")}
                      title="Set Your Availability Schedule"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setActiveTab("availability");
                        }
                      }}
                    >
                      <span className={`mentee-timeline-icon ${menteeSlots.length > 0 ? "mentee-timeline-icon--completed" : ""}`}>
                        {menteeSlots.length > 0 ? (
                          <CheckCircleOutline fontSize="inherit" />
                        ) : (
                          <ScheduleOutlined fontSize="inherit" />
                        )}
                      </span>
                      <div className="mentee-timeline-content">
                        <div className="mentee-timeline-header-row">
                          <p className="mentee-timeline-title">
                            2. Availability schedule
                          </p>
                          <span className={`mentee-timeline-action-badge ${menteeSlots.length > 0 ? "mentee-timeline-action-badge--done" : ""}`}>
                            {menteeSlots.length > 0 ? "Update Schedule →" : "Set Hours →"}
                          </span>
                        </div>
                        <p className="mentee-muted">
                          {menteeSlots.length > 0
                            ? `${menteeSlots.length} slot${menteeSlots.length === 1 ? "" : "s"} selected`
                            : "Add free days and times for sessions"}
                        </p>
                      </div>
                    </li>
                    <li
                      className="mentee-timeline-item mentee-timeline-item--interactive"
                      role="button"
                      tabIndex={0}
                      onClick={() => setActiveTab("matching")}
                      title="Find Mentors & View Matches"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setActiveTab("matching");
                        }
                      }}
                    >
                      <span className={`mentee-timeline-icon ${myMentor ? "mentee-timeline-icon--completed" : ""}`}>
                        {myMentor ? (
                          <CheckCircleOutline fontSize="inherit" />
                        ) : (
                          <GroupsOutlined fontSize="inherit" />
                        )}
                      </span>
                      <div className="mentee-timeline-content">
                        <div className="mentee-timeline-header-row">
                          <p className="mentee-timeline-title">
                            3. Official pairing
                          </p>
                          <span className={`mentee-timeline-action-badge ${myMentor ? "mentee-timeline-action-badge--done" : ""}`}>
                            {myMentor ? "View Pairing →" : "Browse Matches →"}
                          </span>
                        </div>
                        <p className="mentee-muted">
                          {myMentor
                            ? `Confirmed with ${mentorName}`
                            : `${matchCount} recommendation${matchCount === 1 ? "" : "s"} ready`}
                        </p>
                      </div>
                    </li>
                  </ul>
                </section>
              </div>
            </div>
          </div>
        </div>
      );
    }
    const userProgress = stats && stats.user_progress;

    useEffect(() => {
      if (!stats || !window.Chart) return;
      const canvas = document.getElementById("staff-overview-chart");
      if (!canvas) return;
      if (staffOverviewChartRef.current) {
        staffOverviewChartRef.current.destroy();
      }
      const totalMentors = stats.total_mentors ?? 0;
      const totalMentees = stats.total_mentees ?? 0;
      const acceptedPairings = stats.accepted_pairings ?? 0;
      const isDark = theme === "dark";
      const staffColors = isDark
        ? ["#0ea5e9", "#10b981", "#f59e0b"]
        : ["#0284c7", "#059669", "#d97706"];

      staffOverviewChartRef.current = new window.Chart(canvas, {
        type: "doughnut",
        data: {
          labels: ["Mentors", "Mentees", "Pairings"],
          datasets: [
            {
              data: [totalMentors, totalMentees, acceptedPairings],
              backgroundColor: staffColors,
              borderWidth: 3,
              borderColor: isDark ? "#181b20" : "#f0f3f8",
              hoverOffset: 8,
              hoverBorderColor: isDark ? "#181b20" : "#f0f3f8",
              hoverBorderWidth: 3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
          },
          cutout: "68%",
        },
      });
    }, [stats, theme]);

    const roleLine =
      user.role === "mentor"
        ? "You're signed in as a mentor."
        : user.role === "staff"
          ? "You're signed in as staff."
          : "You're signed in.";

    const totalMentors = stats?.total_mentors ?? 0;
    const totalMentees = stats?.total_mentees ?? 0;
    const acceptedPairings = stats?.accepted_pairings ?? 0;
    const totalUsers = totalMentors + totalMentees;
    const mentorPct =
      totalUsers > 0 ? Math.round((totalMentors / totalUsers) * 100) : 0;
    const menteePct =
      totalUsers > 0 ? Math.round((totalMentees / totalUsers) * 100) : 0;
    const pairingPct =
      totalMentees > 0
        ? Math.min(100, Math.round((acceptedPairings / totalMentees) * 100))
        : 0;

    if (user.role === "mentor") {
      const acceptedRequests = Array.isArray(mentorRequests)
        ? mentorRequests.filter((request) => request.accepted)
        : [];
      const pendingRequests = Array.isArray(mentorRequests)
        ? mentorRequests.filter((request) => !request.accepted)
        : [];
      const mentorCapacity = Math.max(
        1,
        Number(mentorProfile?.capacity ?? userProgress?.mentor_capacity ?? 5) ||
          5,
      );
      const capacityUsed = Math.min(mentorCapacity, acceptedRequests.length);
      const capacityPct = Math.round((capacityUsed / mentorCapacity) * 100);
      const subjects = Array.isArray(mentorProfile?.subjects)
        ? mentorProfile.subjects
        : [];
      const topics = Array.isArray(mentorProfile?.topics)
        ? mentorProfile.topics
        : [];
      const availability = Array.isArray(mentorProfile?.availability)
        ? mentorProfile.availability
        : [];
      const mentorType = mentorProfile?.role || user.mentor_role || "";
      const profileReady = !!(
        user.mentor_questionnaire_completed ||
        subjects.length ||
        topics.length ||
        mentorProfile?.expertise_level
      );

      const mentorFirstName = (
        user.full_name ||
        user.display_name ||
        user.username ||
        ""
      ).split(" ")[0];

      return (
        <div className="mentee-home mentor-dashboard-v2 page-shell">
          <div className="home-space-glow" aria-hidden="true" />

          {/* Kasandigan Open Native Header — Zero box container */}
          <header className="kasandigan-header">
            <div className="kasandigan-header-content">
              <div className="kasandigan-badge">
                <span className="kasandigan-badge-dot" />
                <span>Academic Mentoring Unit • Mentor Matching Portal</span>
              </div>
              <h1 className="mentee-hero-title kasandigan-title">
                Welcome back{mentorFirstName ? `, ${mentorFirstName}` : user.username ? `, ${user.username}` : ""}
              </h1>
              <p className="mentee-hero-subtitle kasandigan-subtitle">
                Track your mentee capacity, respond to incoming match requests, and manage active pairings.
              </p>
              <div className="mentor-v2-status-row" style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                {mentorType && MentorRoleBadge ? (
                  <MentorRoleBadge role={mentorType} prominent />
                ) : null}
                <span
                  className={
                    "mentor-v2-status-pill " +
                    (user.mentor_approved ? "is-approved" : "is-pending")
                  }
                >
                  {user.mentor_approved
                    ? "Coordinator approved"
                    : "Pending coordinator approval"}
                </span>
              </div>
            </div>
            <div className="kasandigan-header-actions">
              <button
                type="button"
                className="btn kasandigan-btn-primary"
                onClick={() => setActiveTab("mentees")}
              >
                <GroupsOutlined fontSize="inherit" />
                <span>View Mentees</span>
              </button>
              <button
                type="button"
                className="btn kasandigan-btn-secondary"
                onClick={() => setActiveTab(profileReady ? "mentor-matching-profile" : "onboarding")}
              >
                <TuneOutlined fontSize="inherit" />
                <span>Update Matching Profile</span>
              </button>
            </div>
          </header>

          {/* Kasandigan Unified Metric Strip (4 Columns) */}
          <section
            className="mentee-stat-grid kasandigan-metric-strip"
            aria-label="Mentor matching summary"
          >
            <div
              className="kasandigan-metric-cell"
              onClick={() => setActiveTab("mentees")}
              role="button"
              tabIndex={0}
            >
              <div className="kasandigan-metric-cell-top">
                <span className="kasandigan-metric-label">Active mentees</span>
                <span className="kasandigan-metric-icon">
                  <GroupsOutlined fontSize="inherit" />
                </span>
              </div>
              <div className="kasandigan-metric-value">
                {acceptedRequests.length}
              </div>
              <span className="kasandigan-metric-link">
                Official assigned mentees →
              </span>
            </div>

            <div
              className="kasandigan-metric-cell"
              onClick={() => setActiveTab("mentees")}
              role="button"
              tabIndex={0}
            >
              <div className="kasandigan-metric-cell-top">
                <span className="kasandigan-metric-label">Intake capacity</span>
                <span className="kasandigan-metric-icon">
                  <BarChartOutlined fontSize="inherit" />
                </span>
              </div>
              <div className="kasandigan-metric-value">
                {capacityUsed} / {mentorCapacity}
              </div>
              <span className="kasandigan-metric-link">
                {mentorCapacity - capacityUsed} open slot{mentorCapacity - capacityUsed === 1 ? "" : "s"} remaining →
              </span>
            </div>

            <div
              className="kasandigan-metric-cell"
              onClick={() => setActiveTab("mentees")}
              role="button"
              tabIndex={0}
            >
              <div className="kasandigan-metric-cell-top">
                <span className="kasandigan-metric-label">Incoming requests</span>
                <span className="kasandigan-metric-icon">
                  <HourglassEmptyOutlined fontSize="inherit" />
                </span>
              </div>
              <div className="kasandigan-metric-value">
                {pendingRequests.length}
              </div>
              <span className="kasandigan-metric-link">
                {pendingRequests.length ? `${pendingRequests.length} waiting for decision →` : "No pending requests →"}
              </span>
            </div>

            <div
              className="kasandigan-metric-cell"
              onClick={() =>
                setActiveTab(
                  profileReady ? "mentor-matching-profile" : "onboarding"
                )
              }
              role="button"
              tabIndex={0}
            >
              <div className="kasandigan-metric-cell-top">
                <span className="kasandigan-metric-label">Matching readiness</span>
                <span className="kasandigan-metric-icon">
                  <CheckCircleOutline fontSize="inherit" />
                </span>
              </div>
              <div className="kasandigan-metric-value">
                {profileReady ? "Active" : "Needs setup"}
              </div>
              <span className="kasandigan-metric-link">
                {subjects.length} subject{subjects.length === 1 ? "" : "s"} offered →
              </span>
            </div>
          </section>

          {/* Kasandigan Coordinated Grid */}
          <div className="mentee-home-grid kasandigan-main-grid">
            <div className="mentee-home-row mentee-home-row--spotlight">
              {/* Primary Column: Pending Requests (if any) or Active Mentees */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px", flex: "1 1 540px", minWidth: 0 }}>
                {pendingRequests.length > 0 && (
                  <section className="dashboard-card mentee-spotlight kasandigan-card">
                    <div className="kasandigan-card-head">
                      <div className="kasandigan-card-head-title">
                        <HourglassEmptyOutlined fontSize="inherit" className="kasandigan-head-icon" />
                        <h2>Pending Match Requests</h2>
                      </div>
                      <span className="kasandigan-card-badge is-warning">{pendingRequests.length} waiting</span>
                    </div>

                    <div className="mentee-spotlight-content" style={{ padding: "16px 0 0 0" }}>
                      <p className="mentee-muted" style={{ marginBottom: "14px", fontSize: "13px" }}>
                        Mentees whose preferences matched your profile and are waiting for your confirmation:
                      </p>

                      <div className="mentor-pending-requests-list">
                        {pendingRequests.slice(0, 3).map((req) => {
                          const menteeName =
                            req.mentee_display_name ||
                            req.mentee_username ||
                            "Mentee";
                          const subs = req.mentee_subjects || [];
                          const isAccepting = acceptMenteeLoading === req.mentee_id;

                          return (
                            <div key={req.request_id || req.mentee_id} className="mentor-request-card">
                              <div className="mentor-request-card-info">
                                <MenteeAvatar name={menteeName} url={req.mentee_avatar_url} />
                                <div className="mentor-request-meta">
                                  <div className="mentor-request-name-row">
                                    <span className="mentor-request-name">{menteeName}</span>
                                    {req.mentee_username && (
                                      <span className="mentor-request-handle">@{req.mentee_username}</span>
                                    )}
                                  </div>
                                  {subs.length > 0 && (
                                    <div className="mentee-chip-row" style={{ marginTop: "6px" }}>
                                      {subs.slice(0, 3).map((s) => (
                                        <span key={s} className="mentee-chip">
                                          {s}
                                        </span>
                                      ))}
                                      {req.mentee_difficulty_level != null && (
                                        <span className="mentee-chip mentee-chip--accent">
                                          Level {req.mentee_difficulty_level}/5
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="mentor-request-actions">
                                <button
                                  type="button"
                                  className="btn kasandigan-btn-primary small"
                                  disabled={isAccepting || capacityUsed >= mentorCapacity}
                                  onClick={() => typeof acceptMentee === "function" && acceptMentee(req.mentee_id)}
                                >
                                  {isAccepting ? "Accepting..." : "Accept Match"}
                                </button>
                                <button
                                  type="button"
                                  className="btn kasandigan-btn-secondary small"
                                  onClick={() => setActiveTab("mentees")}
                                >
                                  Review
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </section>
                )}

                {/* Primary Focus: Active Mentees */}
                <section className="dashboard-card mentee-spotlight kasandigan-card mentor-active-mentees-card">
                  <div className="kasandigan-card-head">
                    <div className="kasandigan-card-head-title">
                      <GroupsOutlined fontSize="inherit" className="kasandigan-head-icon" />
                      <h2>Your active mentees</h2>
                    </div>
                    {acceptedRequests.length > 0 ? (
                      <span className="kasandigan-card-badge">{acceptedRequests.length} paired</span>
                    ) : null}
                  </div>

                  {acceptedRequests.length > 0 ? (
                    <div className="mentee-spotlight-content mentor-spotlight-content">
                      {acceptedRequests.slice(0, 3).map((request, idx) => {
                        const menteeName =
                          request.mentee_display_name ||
                          request.mentee_username ||
                          "Mentee";
                        const subs = request.mentee_subjects || [];
                        return (
                          <div
                            key={request.mentee_id || idx}
                            className="mentor-mentee-spotlight-item"
                          >
                            <div className="mentee-spotlight-identity">
                              <div className="mentee-spotlight-avatar">
                                <MenteeAvatar
                                  name={menteeName}
                                  url={request.mentee_avatar_url}
                                />
                                <span
                                  className="mentee-spotlight-status"
                                  title="Active mentee"
                                  aria-label="Active mentee"
                                />
                              </div>
                              <div className="mentee-spotlight-meta">
                                <div className="mentee-spotlight-name-row">
                                  <p className="mentee-spotlight-name">{menteeName}</p>
                                  {request.accepted_at && (
                                    <span className="mentee-spotlight-paired-badge">
                                      Paired {formatDate(request.accepted_at)}
                                    </span>
                                  )}
                                </div>
                                {subs.length > 0 && (
                                  <div className="mentee-chip-row">
                                    {subs.slice(0, 3).map((sub) => (
                                      <span key={sub} className="mentee-chip">
                                        {sub}
                                      </span>
                                    ))}
                                    {request.mentee_difficulty_level != null ? (
                                      <span className="mentee-chip mentee-chip--accent">
                                        Difficulty {request.mentee_difficulty_level}/5
                                      </span>
                                    ) : null}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      <div className="mentee-spotlight-actions mentor-mentee-actions">
                        <button
                          type="button"
                          className="btn kasandigan-btn-secondary full-width"
                          onClick={() => setActiveTab("mentees")}
                        >
                          <GroupsOutlined fontSize="inherit" />
                          <span>View All Mentees</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mentee-empty mentor-mentees-empty">
                      <p>
                        No active mentees yet. Once matching connects mentees to your profile, they will appear here.
                      </p>
                      <button
                        type="button"
                        className="btn kasandigan-btn-primary"
                        onClick={() => setActiveTab("mentees")}
                      >
                        View Mentees Directory
                      </button>
                    </div>
                  )}
                </section>
              </div>

              {/* Mentoring Profile & Capacity Rail */}
              <div className="mentee-home-side-stack">
                <section className="dashboard-card kasandigan-card mentee-rail-card mentor-capacity-card">
                  <div className="kasandigan-card-head">
                    <div className="kasandigan-card-head-title">
                      <BarChartOutlined fontSize="inherit" className="kasandigan-head-icon" />
                      <h2>Capacity status</h2>
                    </div>
                    <span className="kasandigan-card-badge">
                      {capacityUsed >= mentorCapacity ? "Full" : "Open"}
                    </span>
                  </div>

                  <div className="mentee-sessions-card-body mentor-capacity-card-body">
                    <div className="mentor-capacity-summary-row">
                      <span className="mentor-capacity-label">Intake progress</span>
                      <span className="mentor-capacity-slot-badge">{capacityUsed} of {mentorCapacity} slots filled</span>
                    </div>

                    <div className="mentor-capacity-bar-wrap">
                      <div
                        className="mentor-capacity-bar-fill"
                        style={{ width: `${Math.min(100, capacityPct)}%` }}
                      />
                    </div>

                    <p className="mentor-capacity-note">
                      {capacityUsed >= mentorCapacity
                        ? "You have reached your maximum mentee capacity."
                        : `You have ${mentorCapacity - capacityUsed} open mentee slot${mentorCapacity - capacityUsed === 1 ? "" : "s"} remaining.`}
                    </p>
                  </div>

                  <div className="mentee-sessions-card-foot mentor-capacity-card-foot">
                    <button
                      type="button"
                      className="btn kasandigan-btn-secondary full-width"
                      onClick={() => setActiveTab("mentor-matching-profile")}
                    >
                      <TuneOutlined fontSize="inherit" />
                      <span>Adjust Capacity</span>
                    </button>
                  </div>
                </section>

                <section className="dashboard-card kasandigan-card mentee-rail-card">
                  <div className="kasandigan-card-head">
                    <div className="kasandigan-card-head-title">
                      <TuneOutlined fontSize="inherit" className="kasandigan-head-icon" />
                      <h2>Matching criteria</h2>
                    </div>
                    <span className="kasandigan-card-badge">
                      {profileReady ? "Ready" : "Incomplete"}
                    </span>
                  </div>

                  <div className="mentee-sessions-card-body">
                    <p className="mentee-muted mentee-sessions-desc">
                      What mentees are matched against across subjects, topics, and schedule availability.
                    </p>

                    <dl className="mentee-spotlight-facts" style={{ marginTop: "12px" }}>
                      <div>
                        <dt>Subjects</dt>
                        <dd>{subjects.length ? subjects.join(", ") : "Not set"}</dd>
                      </div>
                      <div>
                        <dt>Topics</dt>
                        <dd>{topics.length ? topics.join(", ") : "Not set"}</dd>
                      </div>
                      <div>
                        <dt>Availability</dt>
                        <dd>
                          {availability.length
                            ? formatSlotList(availability)
                            : "Not set"}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="mentee-sessions-card-foot" style={{ marginTop: "auto", paddingTop: "14px" }}>
                    <button
                      type="button"
                      className="btn kasandigan-btn-secondary full-width"
                      onClick={() =>
                        setActiveTab(
                          profileReady ? "mentor-matching-profile" : "onboarding"
                        )
                      }
                    >
                      <TuneOutlined fontSize="inherit" />
                      <span>
                        {profileReady
                          ? "Update Matching Profile"
                          : "Continue Onboarding"}
                      </span>
                    </button>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mentor-staff-dashboard page-shell">
        <div className="home-space-glow" aria-hidden="true" />

        {/* Kasandigan Open Native Header — Zero box container */}
        <header className="kasandigan-header">
          <div className="kasandigan-header-content">
            <div className="kasandigan-badge">
              <span className="kasandigan-badge-dot" />
              <span>Signed in as {user.role || "staff"} • Administration Console</span>
            </div>
            <h1 className="home-hero-title kasandigan-title">
              Welcome back
              {user.full_name || user.display_name
                ? `, ${user.full_name || user.display_name}`
                : user.username
                  ? `, ${user.username}`
                  : ""}
            </h1>
            <p className="home-hero-sub kasandigan-subtitle">Campus-wide user management, approval workflows, and system administration.</p>
          </div>

          <div className="kasandigan-header-actions">
            <button
              type="button"
              className="btn kasandigan-btn-primary"
              onClick={() => setActiveTab("users")}
            >
              Manage Users
            </button>
            <button
              type="button"
              className="btn kasandigan-btn-secondary"
              onClick={() => setActiveTab("approvals")}
            >
              User Approvals
            </button>
            <button
              type="button"
              className="btn kasandigan-btn-secondary"
              onClick={() => setActiveTab("backup")}
              title="Database Backup & System Health"
            >
              Database & Backups
            </button>
          </div>
        </header>

        {/* Pure Macro Matching Metrics (Replaced personal mentee counters) */}
        <div className="home-top-stats">
          <div className="home-mini-stat">
            <div className="home-mini-stat-header">
              <span className="home-mini-stat-label">Total mentors</span>
              <span className="home-mini-stat-icon">
                <MenteeDashIcon name="users" size={15} />
              </span>
            </div>
            <div className="home-mini-stat-value">{totalMentors}</div>
          </div>
          <div className="home-mini-stat">
            <div className="home-mini-stat-header">
              <span className="home-mini-stat-label">Total mentees</span>
              <span className="home-mini-stat-icon">
                <MenteeDashIcon name="user" size={15} />
              </span>
            </div>
            <div className="home-mini-stat-value">{totalMentees}</div>
          </div>
          <div className="home-mini-stat">
            <div className="home-mini-stat-header">
              <span className="home-mini-stat-label">Accepted pairings</span>
              <span className="home-mini-stat-icon">
                <MenteeDashIcon name="check" size={15} />
              </span>
            </div>
            <div className="home-mini-stat-value">{acceptedPairings}</div>
          </div>
          <div className="home-mini-stat">
            <div className="home-mini-stat-header">
              <span className="home-mini-stat-label">Pairing rate</span>
              <span className="home-mini-stat-icon">
                <MenteeDashIcon name="target" size={15} />
              </span>
            </div>
            <div className="home-mini-stat-value">{pairingPct}%</div>
          </div>
          <div className="home-mini-stat">
            <div className="home-mini-stat-header">
              <span className="home-mini-stat-label">Unmatched mentees</span>
              <span className="home-mini-stat-icon">
                <MenteeDashIcon name="user" size={15} />
              </span>
            </div>
            <div className="home-mini-stat-value">{Math.max(0, totalMentees - acceptedPairings)}</div>
          </div>
        </div>

        <div className="home-dashboard-grid">
          <section className="dashboard-card kasandigan-card home-staff-management-card">
            <div className="mentee-card-head">
              <h2>Administration shortcuts</h2>
            </div>
            <p className="mentee-muted" style={{ marginBottom: "16px" }}>
              Quickly manage user accounts, system activities, and review coordinator approvals.
            </p>
            <div className="mentee-quick-actions">
              <button
                type="button"
                className="mentee-quick-action"
                onClick={() => setActiveTab("users")}
              >
                <MenteeDashIcon name="users" size={18} />
                <span>Manage users</span>
              </button>
              <button
                type="button"
                className="mentee-quick-action"
                onClick={() => setActiveTab("approvals")}
              >
                <MenteeDashIcon name="check" size={18} />
                <span>Review approvals</span>
              </button>
              <button
                type="button"
                className="mentee-quick-action"
                onClick={() => setActiveTab("announcements")}
              >
                <MenteeDashIcon name="megaphone" size={18} />
                <span>Post announcement</span>
              </button>
            </div>
            {window.DashboardApp?.AutoApproveToggle && (
              <div style={{ marginTop: "18px", borderTop: "1px solid var(--border-color, rgba(148, 163, 184, 0.2))", paddingTop: "14px" }}>
                <window.DashboardApp.AutoApproveToggle compact />
              </div>
            )}
          </section>

          <aside
            className="dashboard-card kasandigan-card home-analytics-card"
            aria-label="System distribution analytics"
          >
            <div className="home-analytics-header">
              <div className="home-analytics-header-left">
                <span className="home-analytics-badge-icon">
                  <MenteeDashIcon name="barChart" size={16} />
                </span>
                <div>
                  <h3 className="home-analytics-title">System Distribution</h3>
                  <p className="home-analytics-sub">
                    Active mentors, mentees & pairings
                  </p>
                </div>
              </div>
              <span className="home-analytics-live-badge">
                <span className="kasandigan-pulse-dot" /> Live
              </span>
            </div>

            <div className="home-analytics-chart-wrap">
              <div
                className="home-analytics-ring"
                aria-label="Mentors, mentees, and pairings distribution"
              >
                <canvas id="staff-overview-chart" height="180" />
                <div className="home-analytics-donut-stat" aria-hidden="true">
                  <span className="home-analytics-donut-num">{totalUsers}</span>
                  <span className="home-analytics-donut-lbl">Total Users</span>
                </div>
              </div>
            </div>

            <div className="home-analytics-breakdown">
              <div className="home-analytics-row">
                <div className="home-analytics-row-left">
                  <span className="home-analytics-dot dot-mentors" />
                  <span className="home-analytics-row-label">Mentors</span>
                </div>
                <div className="home-analytics-row-right">
                  <span className="home-analytics-row-count">
                    {totalMentors} registered
                  </span>
                  <span className="home-analytics-row-pct">{mentorPct}%</span>
                </div>
              </div>

              <div className="home-analytics-row">
                <div className="home-analytics-row-left">
                  <span className="home-analytics-dot dot-mentees" />
                  <span className="home-analytics-row-label">Mentees</span>
                </div>
                <div className="home-analytics-row-right">
                  <span className="home-analytics-row-count">
                    {totalMentees} registered
                  </span>
                  <span className="home-analytics-row-pct">{menteePct}%</span>
                </div>
              </div>

              <div className="home-analytics-row">
                <div className="home-analytics-row-left">
                  <span className="home-analytics-dot dot-pairings" />
                  <span className="home-analytics-row-label">Active Pairings</span>
                </div>
                <div className="home-analytics-row-right">
                  <span className="home-analytics-row-count">
                    {acceptedPairings} matched
                  </span>
                  <span className="home-analytics-row-pct">{pairingPct}%</span>
                </div>
              </div>

              <div className="home-analytics-summary">
                <div className="home-analytics-summary-item">
                  <span className="home-analytics-summary-label">
                    Ratio (Mentee:Mentor)
                  </span>
                  <span className="home-analytics-summary-val">
                    {totalMentors > 0
                      ? `${(totalMentees / totalMentors).toFixed(1)} : 1`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  window.DashboardApp = window.DashboardApp || {};
  window.DashboardApp.Pages = window.DashboardApp.Pages || {};
  window.DashboardApp.Pages.home = HomePage;
  if (typeof module !== "undefined" && module.exports)
    module.exports = { HomePage };
})();
