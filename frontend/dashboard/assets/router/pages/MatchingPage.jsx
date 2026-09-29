import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import HandshakeOutlined from "@mui/icons-material/HandshakeOutlined";
import CheckCircleOutline from "@mui/icons-material/CheckCircleOutline";
import RefreshOutlined from "@mui/icons-material/RefreshOutlined";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import MailOutline from "@mui/icons-material/MailOutline";
import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import InfoOutlined from "@mui/icons-material/InfoOutlined";

(function () {
  "use strict";
  const React = window.React;
  const { useContext, useEffect, useMemo, useRef, useState } = React;
  const AppContext = window.DashboardApp.AppContext;
  const Utils = window.DashboardApp.Utils || {};
  const PLACEHOLDER_AVATAR = window.DashboardApp.PLACEHOLDER_AVATAR || "";
  const formatSlotList =
    (window.DashboardApp.Availability &&
      window.DashboardApp.Availability.formatSlotList) ||
    ((slots) => (Array.isArray(slots) ? slots.join(", ") : ""));
  const formatSlotLabel =
    (window.DashboardApp.Availability &&
      window.DashboardApp.Availability.formatSlotLabel) ||
    ((slot) => String(slot || ""));
  const {
    formatDate,
    formatMatchScore,
    LoadingSpinner,
    MatchingLoadingAnimation,
    MentorRoleBadge: RawMentorRoleBadge,
    getAvatarInitials: getAvatarInitialsFromUtils,
  } = Utils;
  const MentorRoleBadge =
    RawMentorRoleBadge ||
    function FallbackMentorRoleBadge({ role, className }) {
      return (
        <span className={"mentor-role-badge " + (className || "")}>
          {String(role || "Mentor")}
        </span>
      );
    };
  const intersectSlots =
    (window.DashboardApp.Availability &&
      window.DashboardApp.Availability.intersectSlots) ||
    null;
  const MentorProfileCard = window.DashboardApp.MentorProfileCard;

  function getAvatarInitials(name, fallback) {
    if (typeof getAvatarInitialsFromUtils === "function") {
      return getAvatarInitialsFromUtils(name, fallback);
    }
    const source = String(name || fallback || "").trim();
    if (!source) return "?";
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function MatchPersonAvatar({ name, url, className }) {
    const src = String(url || "").trim();
    const hasPhoto = src && src !== PLACEHOLDER_AVATAR;
    if (hasPhoto) {
      return <img src={src} alt={name} className={className} />;
    }
    return (
      <span
        className={(className || "") + " match-column-avatar-fallback"}
        role="img"
        aria-label={name || "Profile"}
      >
        {getAvatarInitials(name)}
      </span>
    );
  }

  function getAdminEffectiveBreakdown(pair) {
    if (pair.score_breakdown && pair.score_breakdown.factors) {
      return pair.score_breakdown;
    }
    const d = pair.match_details || {};
    if (d.score_breakdown && d.score_breakdown.factors) {
      return d.score_breakdown;
    }
    const rawScore = Number(pair.score || 0.85);
    const overallPct = Math.round(rawScore * 100);
    const subjs = Array.isArray(d.common_subjects) ? d.common_subjects : [];
    const topics = Array.isArray(d.common_topics) ? d.common_topics : [];
    const comps = Array.isArray(d.common_competencies) ? d.common_competencies : [];
    return {
      overall_score: rawScore,
      overall_percentage: overallPct,
      tier: overallPct >= 85 ? "high" : overallPct >= 65 ? "medium" : "low",
      tier_label: overallPct >= 85 ? "Exceptional Fit" : overallPct >= 75 ? "Strong Fit" : "Good Fit",
      algorithm: "XGBoost Machine Learning",
      factors: {
        academic: {
          label: "Academic & Subject Fit",
          score: Math.min(100, Math.max(35, overallPct + 2)),
          weight_pct: 40,
          summary: (subjs.length || topics.length)
            ? `${subjs.length} shared course(s), ${topics.length} topic(s)`
            : "General curriculum & academic alignment",
        },
        competency: {
          label: "Competency Alignment",
          score: Math.min(100, Math.max(30, overallPct - 2)),
          weight_pct: 25,
          summary: comps.length
            ? `${comps.length} verified competency match(es)`
            : "Complementary course competencies",
        },
        difficulty: {
          label: "Experience & Difficulty Balance",
          score: Math.min(100, Math.max(45, overallPct + 4)),
          weight_pct: 15,
          summary: "Mentor expertise balanced with mentee learning goals",
        },
        schedule: {
          label: "Schedule Compatibility",
          score: Math.min(100, Math.max(40, overallPct)),
          weight_pct: 20,
          summary: "Compatible mutual availability windows",
        },
      },
    };
  }

  function AdminPairXaiBreakdown({ breakdown, showHeader = false }) {
    if (!breakdown || !breakdown.factors) return null;
    const factorKeys = ["academic", "competency", "difficulty", "schedule"];

    return (
      <div className="admin-neu-xai-shelf" role="region" aria-label="Explainable AI Diagnostics">
        {showHeader && (
          <div className="admin-neu-xai-header">
            <div className="admin-neu-xai-title-wrap">
              <span className="neu-xai-badge-ai">Explainable AI Diagnostics</span>
              <span className="neu-xai-algo">{breakdown.algorithm || "XGBoost ML"}</span>
            </div>
            <span className={"neu-xai-tier neu-xai-tier--" + (breakdown.tier || "high")}>
              {breakdown.tier_label || "Active Fit"} ({breakdown.overall_percentage || Math.round((breakdown.overall_score || 0.85) * 100)}%)
            </span>
          </div>
        )}

        <div className="admin-neu-xai-grid">
          {factorKeys.map((key) => {
            const factor = breakdown.factors[key];
            if (!factor) return null;
            const pct = Math.max(0, Math.min(100, Number(factor.score) || 0));
            return (
              <div key={key} className="admin-neu-xai-factor">
                <div className="neu-xai-factor-meta">
                  <span className="neu-xai-factor-name">{factor.label}</span>
                  <div className="neu-xai-factor-stats">
                    <span className="neu-xai-factor-weight">{factor.weight_pct}% wt</span>
                    <span className="neu-xai-factor-pct">{pct}%</span>
                  </div>
                </div>
                <div
                  className="neu-xai-track"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={factor.label}
                >
                  <div
                    className={"neu-xai-fill neu-xai-fill--" + key}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {factor.summary ? (
                  <span className="admin-neu-xai-summary">{factor.summary}</span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function OfficialMentorSpotlight({
    myMentor,
    myMentors = [],
    menteeMatching,
  }) {
    const list = myMentors && myMentors.length > 0 ? myMentors : (myMentor ? [myMentor] : []);
    if (!MentorProfileCard || list.length === 0) return null;
    const isFullCapacity = list.length >= 2;

    return (
      <div className="match-spotlight-section matching-section-block">
        <div className="mentees-section-head">
          <div>
            <div className="section-title">
              {isFullCapacity ? "Your Official Mentors (2/2 Limit Reached)" : "Your Official Mentor (1/2 Slots Used)"}
            </div>
            <p className="page-subtitle matching-section-subtitle">
              {isFullCapacity
                ? "You are currently paired with 2 mentors (maximum mentee limit reached). Stay in touch and coordinate your academic sessions below."
                : "Your confirmed mentor. You have 1 remaining slot available to request an additional mentor if needed."}
            </p>
          </div>
        </div>
        <div className={isFullCapacity ? "official-mentors-grid" : "official-mentor-single"} style={isFullCapacity ? { display: "flex", flexDirection: "column", gap: 20 } : {}}>
          {list.map((m, idx) => {
            const displayName = m.display_name || m.username || "Mentor";
            return (
              <MentorProfileCard
                key={m.id || m.user_id || idx}
                person={m}
                displayName={displayName}
                email={m.email}
                score={m.score}
                matchDetails={m.match_details}
                scoreBreakdown={m.score_breakdown || (m.match_details && m.match_details.score_breakdown)}
                variant="hero"
                kind="mentor"
                isOfficial
                menteeMatching={menteeMatching}
                savedId={m.user_id || m.id}
              />
            );
          })}
        </div>
      </div>
    );
  }

  function parseMentorMatchRow(match) {
    const mentor = match.mentor || {};
    const displayName =
      match.mentor_display_name || match.mentor_username || "Mentor";
    return { mentor, displayName };
  }

  function MentorMatchCard({
    match,
    myMentor,
    myMentors = [],
    chosenMentorId,
    unavailableMentorIds,
    isLimitReached = false,
    isPending = false,
    onRequestPairing,
    onViewProfile,
    compact = false,
    menteeMatching = null,
  }) {
    if (!MentorProfileCard) return null;
    const parsed = parseMentorMatchRow(match);
    const { mentor, displayName } = parsed;
    const isOfficialPair =
      (myMentor && isSameMentorMatch(match, myMentor)) ||
      (Array.isArray(myMentors) && myMentors.some((m) => isSameMentorMatch(match, m))) ||
      chosenMentorId === match.mentor_id;
    const isNotAvailable = unavailableMentorIds.includes(match.mentor_id);
    const slotsLeft = Number(match.slots_left ?? mentor.capacity ?? 0);

    return (
      <MentorProfileCard
        person={mentor}
        displayName={displayName}
        email={mentor.email}
        score={match.score}
        matchDetails={match.match_details}
        scoreBreakdown={match.score_breakdown || (match.match_details && match.match_details.score_breakdown)}
        variant={compact ? "grid" : "grid"}
        kind="mentor"
        isOfficial={isOfficialPair}
        isUnavailable={isNotAvailable}
        isPending={isPending}
        isLimitReached={isLimitReached}
        menteeMatching={menteeMatching}
        slotsLeft={slotsLeft}
        compact={compact}
        savedId={mentor.user_id || match.mentor_id}
        onRequestPairing={() => onRequestPairing(match.mentor_id)}
        onViewProfile={() => onViewProfile(match)}
      />
    );
  }

  function MentorMatchFilterBar({
    search,
    onSearchChange,
    sort,
    onSortChange,
    subject,
    onSubjectChange,
    availability,
    onAvailabilityChange,
    subjectOptions,
  }) {
    return (
      <div className="matching-card match-filter-bar">
        <div className="match-filter-field">
          <label className="match-filter-label" htmlFor="match-search">
            Search
          </label>
          <input
            id="match-search"
            type="search"
            className="match-filter-input"
            placeholder="Search mentors by name or subject..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="match-filter-field">
          <label className="match-filter-label" htmlFor="match-sort">
            Sort
          </label>
          <select
            id="match-sort"
            className="match-filter-select"
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
          >
            <option value="score-desc">Match Score (High to Low)</option>
            <option value="score-asc">Match Score (Low to High)</option>
            <option value="name">Name (A–Z)</option>
          </select>
        </div>
        <div className="match-filter-field">
          <label className="match-filter-label" htmlFor="match-subject">
            Subject
          </label>
          <select
            id="match-subject"
            className="match-filter-select"
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
          >
            <option value="">All subjects</option>
            {subjectOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div className="match-filter-field">
          <label className="match-filter-label" htmlFor="match-availability">
            Availability
          </label>
          <select
            id="match-availability"
            className="match-filter-select"
            value={availability}
            onChange={(e) => onAvailabilityChange(e.target.value)}
          >
            <option value="">Any availability</option>
            <option value="compatible">Compatible schedule</option>
          </select>
        </div>
      </div>
    );
  }

  function isSameMentorMatch(match, mentorRef) {
    if (!mentorRef || !match) return false;
    const mentorProfileId = Number(match.mentor_id);
    if (
      mentorRef.id != null &&
      !Number.isNaN(mentorProfileId) &&
      Number(mentorRef.id) === mentorProfileId
    ) {
      return true;
    }
    const matchUserId =
      match.mentor && match.mentor.user_id != null
        ? Number(match.mentor.user_id)
        : null;
    const mentorUserId =
      mentorRef.user_id != null ? Number(mentorRef.user_id) : null;
    return (
      matchUserId != null &&
      mentorUserId != null &&
      matchUserId === mentorUserId
    );
  }

  function gmailComposeUrl(email) {
    const to = String(email || "").trim();
    if (!to) return "";
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}`;
  }

  function gmailComposeBothUrl(email1, email2) {
    const to = [email1, email2].filter(Boolean).map((e) => String(e).trim()).join(",");
    if (!to) return "";
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent("AMU PeerLink Mentoring Partnership Check-In")}`;
  }

  function AdminPairingCard({ pair, onEmailMentor, onEmailMentee, onEmailBoth }) {
    const breakdown = getAdminEffectiveBreakdown(pair);
    const mentor = pair.mentor || {};
    const mentee = pair.mentee || {};
    const matchDetails = pair.match_details || {};
    const commonSubjects = Array.isArray(matchDetails.common_subjects) ? matchDetails.common_subjects : [];
    const commonTopics = Array.isArray(matchDetails.common_topics) ? matchDetails.common_topics : [];
    const commonCompetencies = Array.isArray(matchDetails.common_competencies) ? matchDetails.common_competencies : [];
    const pct = breakdown.overall_percentage ?? Math.round((Number(pair.score) || 0.85) * 100);
    const tier = breakdown.tier || (pct >= 85 ? "high" : pct >= 70 ? "strong" : "medium");
    const tierLabel = breakdown.tier_label || (pct >= 85 ? "Exceptional Fit" : pct >= 75 ? "Strong Fit" : pct >= 60 ? "Good Fit" : "Moderate Fit");

    const menteeEmail = mentee.email || (pair.mentee_username ? `${pair.mentee_username}@student.buksu.edu.ph` : "");
    const mentorEmail = mentor.email || (pair.mentor_username ? `${pair.mentor_username}@student.buksu.edu.ph` : "");

    const menteeSubjects = Array.isArray(mentee.subjects) && mentee.subjects.length ? mentee.subjects : (matchDetails.mentee_subjects || []);
    const mentorSubjects = Array.isArray(mentor.subjects) && mentor.subjects.length ? mentor.subjects : (matchDetails.mentor_subjects || []);

    return (
      <div className="admin-paired-card neu-card" data-testid={`admin-pair-card-${pair.id}`}>
        <div className="admin-paired-card-top">
          <div className="admin-paired-status-wrap">
            <span className="admin-paired-status-dot" />
            <span className="admin-paired-status-text">Active Partnership</span>
            <span className="admin-paired-timestamp">
              • Paired {formatDate(pair.accepted_at || pair.created_at)}
            </span>
          </div>
          <div className="admin-paired-top-badges">
            <span className={"neu-xai-tier neu-xai-tier--" + (tier === "high" || tier === "strong" ? "high" : tier === "medium" ? "medium" : "low")}>
              {pct}% · {tierLabel}
            </span>
          </div>
        </div>

        <div className="admin-paired-profiles-row">
          {/* Mentee Side */}
          <div className="admin-paired-person-box is-mentee">
            <div className="admin-paired-person-header">
              <MatchPersonAvatar
                name={pair.mentee_display_name || pair.mentee_username}
                url={mentee.avatar_url}
                className="admin-paired-avatar"
              />
              <div className="admin-paired-person-info">
                <MentorRoleBadge role="mentee" prominent />
                <h3 className="admin-paired-person-name">
                  {pair.mentee_display_name || pair.mentee_username}
                </h3>
                <p className="admin-paired-person-sub">@{pair.mentee_username}</p>
              </div>
            </div>

            <div className="admin-paired-person-meta">
              {mentee.year_level && (
                <div className="admin-paired-meta-row">
                  <span className="admin-paired-meta-label">Year Level:</span>
                  <span className="admin-paired-meta-val">Year {mentee.year_level}</span>
                </div>
              )}
              {mentee.difficulty_level != null && (
                <div className="admin-paired-meta-row">
                  <span className="admin-paired-meta-label">Learning Need:</span>
                  <span className="admin-paired-meta-val">{mentee.difficulty_level} / 5</span>
                </div>
              )}
              {menteeEmail && (
                <div className="admin-paired-meta-row">
                  <span className="admin-paired-meta-label">Email:</span>
                  <a href={`mailto:${menteeEmail}`} className="admin-paired-email-link" title="Email mentee">
                    {menteeEmail}
                  </a>
                </div>
              )}
            </div>

            {menteeSubjects.length > 0 && (
              <div className="admin-paired-tags-row">
                <span className="admin-paired-tags-label">Requested Subjects:</span>
                <div className="admin-paired-tags-list">
                  {menteeSubjects.map((s) => (
                    <span key={s} className="neu-badge neu-badge--neutral">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Center Matching Bridge */}
          <div className="admin-paired-bridge">
            <div className="admin-paired-bridge-icon-pod" title={`${pct}% Compatibility Match`}>
              <HandshakeOutlined fontSize="medium" />
            </div>
            <div className="admin-paired-bridge-score">
              <span className="admin-paired-bridge-pct">{pct}%</span>
              <span className="admin-paired-bridge-label">Match Score</span>
            </div>
            <div className="admin-paired-bridge-algo">
              <span>{breakdown.algorithm || "XGBoost ML"}</span>
            </div>
            {menteeEmail && mentorEmail && (
              <button
                type="button"
                className="btn small secondary admin-paired-email-both-btn"
                onClick={() => onEmailBoth(menteeEmail, mentorEmail)}
                title="Compose message to both mentor and mentee"
              >
                <MailOutline fontSize="small" style={{ marginRight: 4 }} />
                <span>Email Both</span>
              </button>
            )}
          </div>

          {/* Mentor Side */}
          <div className="admin-paired-person-box is-mentor">
            <div className="admin-paired-person-header">
              <MatchPersonAvatar
                name={pair.mentor_display_name || pair.mentor_username}
                url={mentor.avatar_url}
                className="admin-paired-avatar"
              />
              <div className="admin-paired-person-info">
                <MentorRoleBadge role={mentor.role || "student"} prominent />
                <h3 className="admin-paired-person-name">
                  {pair.mentor_display_name || pair.mentor_username}
                </h3>
                <p className="admin-paired-person-sub">@{pair.mentor_username}</p>
              </div>
            </div>

            <div className="admin-paired-person-meta">
              {mentor.expertise_level != null && (
                <div className="admin-paired-meta-row">
                  <span className="admin-paired-meta-label">Expertise:</span>
                  <span className="admin-paired-meta-val">{mentor.expertise_level} / 5</span>
                </div>
              )}
              {mentor.capacity != null && (
                <div className="admin-paired-meta-row">
                  <span className="admin-paired-meta-label">Capacity:</span>
                  <span className="admin-paired-meta-val">{mentor.capacity} mentees</span>
                </div>
              )}
              {mentorEmail && (
                <div className="admin-paired-meta-row">
                  <span className="admin-paired-meta-label">Email:</span>
                  <a href={`mailto:${mentorEmail}`} className="admin-paired-email-link" title="Email mentor">
                    {mentorEmail}
                  </a>
                </div>
              )}
            </div>

            {mentorSubjects.length > 0 && (
              <div className="admin-paired-tags-row">
                <span className="admin-paired-tags-label">Expertise Subjects:</span>
                <div className="admin-paired-tags-list">
                  {mentorSubjects.map((s) => (
                    <span key={s} className="neu-badge neu-badge--neutral">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* WHY THEY MATCH — Explainable AI Diagnostics */}
        <div className="admin-paired-why-section">
          <div className="admin-paired-why-header">
            <div className="admin-paired-why-title">
              <span className="admin-paired-why-icon-pod">
                <AutoAwesomeOutlined fontSize="small" className="admin-paired-why-icon" />
              </span>
              <span>Why They Match • Explainable AI Diagnostics</span>
            </div>
            <div className="admin-paired-why-meta">
              <span className="admin-paired-why-algo-badge">
                Powered by {breakdown.algorithm || "XGBoost ML"}
              </span>
              <span className={"neu-xai-tier neu-xai-tier--" + (tier === "high" || tier === "strong" ? "high" : tier === "medium" ? "medium" : "low")}>
                {pct}% · {tierLabel}
              </span>
            </div>
          </div>

          <AdminPairXaiBreakdown breakdown={breakdown} showHeader={false} />

          {/* Shared overlaps summary bar */}
          {(commonSubjects.length > 0 || commonTopics.length > 0 || commonCompetencies.length > 0) && (
            <div className="admin-paired-overlaps-bar">
              {commonSubjects.length > 0 && (
                <div className="admin-paired-overlap-group">
                  <span className="admin-paired-overlap-label">Shared Courses:</span>
                  <div className="admin-paired-overlap-tags">
                    {commonSubjects.map((s) => (
                      <span key={s} className="neu-badge neu-badge--match-course">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {commonTopics.length > 0 && (
                <div className="admin-paired-overlap-group">
                  <span className="admin-paired-overlap-label">Shared Topics:</span>
                  <div className="admin-paired-overlap-tags">
                    {commonTopics.map((t) => (
                      <span key={t} className="neu-badge neu-badge--match-topic">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {commonCompetencies.length > 0 && (
                <div className="admin-paired-overlap-group">
                  <span className="admin-paired-overlap-label">Verified Competencies:</span>
                  <div className="admin-paired-overlap-tags">
                    {commonCompetencies.map((c) => (
                      <span key={c} className="neu-badge neu-badge--match-comp">{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="admin-paired-card-actions">
          {menteeEmail && (
            <button
              type="button"
              className="btn small secondary"
              onClick={() => onEmailMentee(menteeEmail)}
            >
              <MailOutline fontSize="small" style={{ marginRight: 4 }} />
              Contact Mentee
            </button>
          )}
          {mentorEmail && (
            <button
              type="button"
              className="btn small secondary"
              onClick={() => onEmailMentor(mentorEmail)}
            >
              <MailOutline fontSize="small" style={{ marginRight: 4 }} />
              Contact Mentor
            </button>
          )}
        </div>
      </div>
    );
  }

  function AdminPairedUsersView() {
    const ctx = useContext(AppContext);
    if (!ctx) return null;
    const {
      adminPairings = [],
      adminPairingsLoading = false,
      loadAdminPairings,
    } = ctx;

    const [search, setSearch] = useState("");
    const [tierFilter, setTierFilter] = useState("all");
    const [sort, setSort] = useState("score-desc");

    useEffect(() => {
      if (typeof loadAdminPairings === "function" && adminPairings.length === 0 && !adminPairingsLoading) {
        loadAdminPairings();
      }
    }, [loadAdminPairings, adminPairings.length, adminPairingsLoading]);

    const avgScore = useMemo(() => {
      if (!adminPairings.length) return 0;
      const total = adminPairings.reduce((sum, p) => {
        const b = getAdminEffectiveBreakdown(p);
        return sum + (b.overall_percentage || Math.round((Number(p.score) || 0) * 100));
      }, 0);
      return Math.round(total / adminPairings.length);
    }, [adminPairings]);

    const highFitCount = useMemo(() => {
      return adminPairings.filter((p) => {
        const b = getAdminEffectiveBreakdown(p);
        const score = b.overall_percentage || Math.round((Number(p.score) || 0) * 100);
        return score >= 75;
      }).length;
    }, [adminPairings]);

    const filteredPairings = useMemo(() => {
      let list = (adminPairings || []).slice();

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter((p) => {
          const mentorName = String(p.mentor_display_name || p.mentor_username || "").toLowerCase();
          const menteeName = String(p.mentee_display_name || p.mentee_username || "").toLowerCase();
          const mentorEmail = String(p.mentor?.email || "").toLowerCase();
          const menteeEmail = String(p.mentee?.email || "").toLowerCase();
          const subjects = [
            ...(p.match_details?.common_subjects || []),
            ...(p.mentor?.subjects || []),
            ...(p.mentee?.subjects || []),
          ].map((s) => String(s).toLowerCase());
          return (
            mentorName.includes(q) ||
            menteeName.includes(q) ||
            mentorEmail.includes(q) ||
            menteeEmail.includes(q) ||
            subjects.some((s) => s.includes(q))
          );
        });
      }

      if (tierFilter !== "all") {
        list = list.filter((p) => {
          const b = getAdminEffectiveBreakdown(p);
          const score = b.overall_percentage || Math.round((Number(p.score) || 0) * 100);
          if (tierFilter === "exceptional") return score >= 85;
          if (tierFilter === "strong") return score >= 75 && score < 85;
          if (tierFilter === "good") return score >= 60 && score < 75;
          if (tierFilter === "moderate") return score < 60;
          return true;
        });
      }

      list.sort((a, b) => {
        const scoreA = Number(a.score || 0);
        const scoreB = Number(b.score || 0);
        if (sort === "score-desc") return scoreB - scoreA;
        if (sort === "score-asc") return scoreA - scoreB;
        if (sort === "recent") {
          const dateA = new Date(a.accepted_at || a.created_at || 0).getTime();
          const dateB = new Date(b.accepted_at || b.created_at || 0).getTime();
          return dateB - dateA;
        }
        if (sort === "mentor") {
          return String(a.mentor_display_name || a.mentor_username || "").localeCompare(
            String(b.mentor_display_name || b.mentor_username || "")
          );
        }
        if (sort === "mentee") {
          return String(a.mentee_display_name || a.mentee_username || "").localeCompare(
            String(b.mentee_display_name || b.mentee_username || "")
          );
        }
        return 0;
      });

      return list;
    }, [adminPairings, search, tierFilter, sort]);

    function handleEmailMentor(email) {
      if (!email) return;
      window.open(gmailComposeUrl(email), "_blank", "noopener,noreferrer");
    }

    function handleEmailMentee(email) {
      if (!email) return;
      window.open(gmailComposeUrl(email), "_blank", "noopener,noreferrer");
    }

    function handleEmailBoth(email1, email2) {
      const url = gmailComposeBothUrl(email1, email2);
      if (!url) return;
      window.open(url, "_blank", "noopener,noreferrer");
    }

    return (
      <div className="admin-paired-page page-shell" data-testid="admin-paired-users-view">
        <header className="kasandigan-header">
          <div className="kasandigan-header-content">
            <div className="kasandigan-badge">
              <span className="kasandigan-badge-dot" />
              <span>Academic Mentoring Unit • Matching Diagnostics</span>
            </div>
            <h1 className="kasandigan-title">Paired Users</h1>
            <p className="kasandigan-subtitle">
              Review active mentor–mentee partnerships and inspect Explainable AI (XAI) diagnostics detailing why they matched.
            </p>
          </div>
          <div className="kasandigan-header-actions">
            <div className="approvals-summary-pill">
              <span className="approvals-summary-pill-count">{adminPairings.length}</span>
              <span>{adminPairings.length === 1 ? "Pairing" : "Pairings"}</span>
            </div>
            <button
              type="button"
              className="btn kasandigan-btn-primary"
              onClick={() => typeof loadAdminPairings === "function" && loadAdminPairings()}
              disabled={adminPairingsLoading}
              title="Refresh confirmed pairings"
            >
              <RefreshOutlined fontSize="small" className={adminPairingsLoading ? "loading-rotate" : ""} />
              <span>{adminPairingsLoading ? "Refreshing…" : "Refresh"}</span>
            </button>
          </div>
        </header>
 
        {/* Coordinator Auto-Approval Setting Toggle */}
        {window.DashboardApp?.AutoApproveToggle && (
          <window.DashboardApp.AutoApproveToggle />
        )}

        {/* KPI Metrics Ribbon */}
        <div className="admin-paired-stats-grid">
          <div className="admin-paired-stat-card">
            <div className="admin-paired-stat-header">
              <span className="admin-paired-stat-label">Active Partnerships</span>
              <span className="admin-paired-stat-icon neu-icon-pod is-official">
                <HandshakeOutlined fontSize="small" />
              </span>
            </div>
            <div className="admin-paired-stat-value">{adminPairings.length}</div>
            <div className="admin-paired-stat-sub">Confirmed mentor–mentee pairs</div>
          </div>

          <div className="admin-paired-stat-card">
            <div className="admin-paired-stat-header">
              <span className="admin-paired-stat-label">Average Compatibility</span>
              <span className="admin-paired-stat-icon neu-icon-pod is-high">
                <AutoAwesomeOutlined fontSize="small" />
              </span>
            </div>
            <div className="admin-paired-stat-value">{avgScore}%</div>
            <div className="admin-paired-stat-sub">Across all active pairings</div>
          </div>

          <div className="admin-paired-stat-card">
            <div className="admin-paired-stat-header">
              <span className="admin-paired-stat-label">High / Strong Fit</span>
              <span className="admin-paired-stat-icon neu-icon-pod is-strong">
                <CheckCircleOutline fontSize="small" />
              </span>
            </div>
            <div className="admin-paired-stat-value">{highFitCount}</div>
            <div className="admin-paired-stat-sub">Pairings with ≥ 75% match</div>
          </div>

          <div className="admin-paired-stat-card">
            <div className="admin-paired-stat-header">
              <span className="admin-paired-stat-label">Matching Algorithm</span>
              <span className="admin-paired-stat-icon neu-icon-pod is-algo">
                <GroupsOutlined fontSize="small" />
              </span>
            </div>
            <div className="admin-paired-stat-value" style={{ fontSize: "1.1rem", fontWeight: 700 }}>
              XGBoost ML
            </div>
            <div className="admin-paired-stat-sub">4-Pillar Explainable Diagnostics</div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="admin-paired-toolbar">
          <div className="admin-paired-search-field">
            <SearchOutlined className="admin-paired-search-icon" fontSize="small" />
            <input
              type="search"
              className="admin-paired-search-input"
              placeholder="Search by mentor, mentee, subject, or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search paired users"
            />
          </div>

          <div className="admin-paired-filters-wrap">
            <select
              className="admin-paired-select"
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              aria-label="Filter by fit tier"
            >
              <option value="all">All Match Tiers</option>
              <option value="exceptional">Exceptional Fit (≥85%)</option>
              <option value="strong">Strong Fit (75–84%)</option>
              <option value="good">Good Fit (60–74%)</option>
              <option value="moderate">Moderate Fit (&lt;60%)</option>
            </select>

            <select
              className="admin-paired-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sort pairings"
            >
              <option value="score-desc">Compatibility (High to Low)</option>
              <option value="score-asc">Compatibility (Low to High)</option>
              <option value="recent">Most Recently Paired</option>
              <option value="mentor">Mentor Name (A–Z)</option>
              <option value="mentee">Mentee Name (A–Z)</option>
            </select>
          </div>
        </div>

        {/* Pairings List */}
        {adminPairingsLoading && adminPairings.length === 0 ? (
          <div className="card text-center neu-card" style={{ padding: 48, borderRadius: 20 }}>
            <p>Loading confirmed pairings…</p>
          </div>
        ) : filteredPairings.length === 0 ? (
          <div className="card text-center neu-card" style={{ padding: "48px 24px", borderRadius: 20 }}>
            <div className="neu-empty-icon-pod" style={{ margin: "0 auto 16px", width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(14, 165, 233, 0.1)", color: "#0ea5e9" }}>
              <HandshakeOutlined fontSize="large" />
            </div>
            <h2 className="section-title" style={{ fontSize: "1.2rem", marginBottom: 8 }}>
              {adminPairings.length === 0 ? "No Confirmed Pairings Yet" : "No Matching Pairings Found"}
            </h2>
            <p className="page-subtitle" style={{ maxWidth: 520, margin: "0 auto" }}>
              {adminPairings.length === 0
                ? "When mentees request mentors and mentors accept pairing invitations, their confirmed partnerships and Explainable AI compatibility diagnostics will appear here."
                : "No active pairings match your search or filter criteria. Try clearing the filter."}
            </p>
          </div>
        ) : (
          <div className="admin-paired-list" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {filteredPairings.map((pair) => (
              <AdminPairingCard
                key={pair.id}
                pair={pair}
                onEmailMentor={handleEmailMentor}
                onEmailMentee={handleEmailMentee}
                onEmailBoth={handleEmailBoth}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  function MatchingPage() {
    const ctx = useContext(AppContext);
    if (!ctx || !ctx.user) return null;
    const {
      user,
      matchingLoading,
      matchingMode,
      setMatchingMode,
      matchingMinScore,
      setMatchingMinScore,
      runMatching,
      matchingResults,
      lastRunMode,
      lastRunMinScore,
      menteeRecLoading,
      menteeRecommendations,
      menteeRecMeta,
      loadMenteeRecommendations,
      chooseMentor,
      chosenMentorId,
      pendingMentorIds = [],
      mentorRequestsLoading,
      mentorRequests,
      loadMentorRequests,
      myMentor,
      myMentors = [],
      menteePairingsCount = 0,
      loadMyMentor,
      menteeMatching,
      menteeRecUpdating,
      setActiveTab,
      setViewedMentorProfile,
      setMentorProfileHashId,
      loadUserProfile,
    } = ctx;
    const isStaff = !!(
      user?.is_staff || String(user?.role || "").toLowerCase() === "staff"
    );
    if (isStaff) {
      return <AdminPairedUsersView />;
    }
    const Spinner = LoadingSpinner;
    const MatchingLoading = MatchingLoadingAnimation;
    const didAutoLoadRecsRef = useRef(false);
    const [showMoreMentors, setShowMoreMentors] = useState(false);
    const [selectedMentorDetails, setSelectedMentorDetails] = useState(null);
    const [unavailableMentorIds, setUnavailableMentorIds] = useState([]);
    const [matchSearch, setMatchSearch] = useState("");
    const [matchSort, setMatchSort] = useState("score-desc");
    const [matchSubjectFilter, setMatchSubjectFilter] = useState("");
    const [matchAvailabilityFilter, setMatchAvailabilityFilter] = useState("");

    const isMentee =
      String(user?.role || "").toLowerCase() === "mentee" ||
      String(user?.role || "").toLowerCase() === "both";
    const menteeQuestionnaireCompleted = !!(
      user.mentee_questionnaire_completed ?? user.questionnaire_completed
    );

    const activePairingsCount = Math.max(
      (myMentors && myMentors.length) || (myMentor ? 1 : 0),
      menteePairingsCount || 0,
      menteeRecMeta?.paired_mentors_count || 0
    );
    const isLimitReached = isMentee && activePairingsCount >= 2;

    const sortedMenteeRecs = (menteeRecommendations || [])
      .slice()
      .sort((a, b) => {
        if (myMentor && isSameMentorMatch(a, myMentor)) return 1;
        if (myMentor && isSameMentorMatch(b, myMentor)) return -1;
        if (chosenMentorId) {
          const aChosen = a.mentor_id === chosenMentorId;
          const bChosen = b.mentor_id === chosenMentorId;
          if (aChosen && !bChosen) return -1;
          if (bChosen && !aChosen) return 1;
        }
        return (b.score ?? 0) - (a.score ?? 0);
      });

    const visibleMenteeRecs = useMemo(() => {
      const activeMentorIds = new Set(
        [
          myMentor?.id,
          myMentor?.mentor_id,
          myMentor?.user_id,
          ...(myMentors || []).flatMap((m) => [m.id, m.mentor_id, m.user_id]),
        ].filter(Boolean).map(Number)
      );
      return sortedMenteeRecs.filter((match) => {
        if (myMentor && isSameMentorMatch(match, myMentor)) return false;
        if (Array.isArray(myMentors) && myMentors.some((m) => isSameMentorMatch(match, m))) return false;
        if (activeMentorIds.has(Number(match.mentor_id))) return false;
        if (
          chosenMentorId != null &&
          Number(match.mentor_id) === Number(chosenMentorId)
        ) {
          return false;
        }
        return true;
      });
    }, [sortedMenteeRecs, myMentor, myMentors, chosenMentorId]);

    const matchSubjectOptions = useMemo(() => {
      const subjects = new Set();
      visibleMenteeRecs.forEach((match) => {
        const d = match.match_details || {};
        (d.common_subjects || []).forEach((s) => subjects.add(s));
        const mentor = match.mentor || {};
        (mentor.subjects || d.mentor_subjects || []).forEach((s) =>
          subjects.add(s),
        );
      });
      return Array.from(subjects).sort((a, b) =>
        String(a).localeCompare(String(b)),
      );
    }, [visibleMenteeRecs]);

    const filteredMenteeRecs = useMemo(() => {
      let list = visibleMenteeRecs.slice();
      const query = matchSearch.trim().toLowerCase();
      if (query) {
        list = list.filter((match) => {
          const name = (
            match.mentor_display_name ||
            match.mentor_username ||
            ""
          ).toLowerCase();
          const d = match.match_details || {};
          const mentor = match.mentor || {};
          const subjects = [
            ...(d.common_subjects || []),
            ...(mentor.subjects || d.mentor_subjects || []),
          ];
          const topics = [
            ...(d.common_topics || []),
            ...(mentor.topics || d.mentor_topics || []),
          ];
          const haystack = [name, ...subjects, ...topics]
            .join(" ")
            .toLowerCase();
          return haystack.includes(query);
        });
      }
      if (matchSubjectFilter) {
        list = list.filter((match) => {
          const d = match.match_details || {};
          const mentor = match.mentor || {};
          const subjects = [
            ...(d.common_subjects || []),
            ...(mentor.subjects || d.mentor_subjects || []),
          ];
          return subjects.includes(matchSubjectFilter);
        });
      }
      if (matchAvailabilityFilter === "compatible") {
        const menteeSlots = menteeMatching?.availability || [];
        list = list.filter((match) => {
          const mentorSlots = match.mentor?.availability || [];
          if (
            !intersectSlots ||
            !menteeSlots.length ||
            !mentorSlots.length
          ) {
            return false;
          }
          return intersectSlots(menteeSlots, mentorSlots).length > 0;
        });
      }
      list.sort((a, b) => {
        if (matchSort === "score-desc") {
          return (b.score ?? 0) - (a.score ?? 0);
        }
        if (matchSort === "score-asc") {
          return (a.score ?? 0) - (b.score ?? 0);
        }
        if (matchSort === "name") {
          const nameA = (
            a.mentor_display_name ||
            a.mentor_username ||
            ""
          ).toLowerCase();
          const nameB = (
            b.mentor_display_name ||
            b.mentor_username ||
            ""
          ).toLowerCase();
          return nameA.localeCompare(nameB);
        }
        return 0;
      });
      return list;
    }, [
      visibleMenteeRecs,
      matchSearch,
      matchSort,
      matchSubjectFilter,
      matchAvailabilityFilter,
      menteeMatching,
    ]);

    useEffect(() => {
      if (!isMentee) return;
      loadMyMentor();
    }, [isMentee, loadMyMentor]);

    useEffect(() => {
      // Reset auto-load guard when user/questionnaire context changes.
      didAutoLoadRecsRef.current = false;
    }, [user?.id, isMentee, menteeQuestionnaireCompleted]);

    useEffect(() => {
      if (!isMentee) return;
      if (!menteeQuestionnaireCompleted) return;
      if (menteeRecLoading || menteeRecUpdating) return;
      if (didAutoLoadRecsRef.current) return;
      didAutoLoadRecsRef.current = true;
      loadMenteeRecommendations();
    }, [
      isMentee,
      menteeQuestionnaireCompleted,
      menteeRecLoading,
      menteeRecUpdating,
      loadMenteeRecommendations,
    ]);

    useEffect(() => {
      const recommendationIds = new Set(
        (menteeRecommendations || []).map((item) => item.mentor_id),
      );
      setUnavailableMentorIds((current) =>
        current.filter((id) => recommendationIds.has(id)),
      );
    }, [menteeRecommendations]);

    async function handleChooseMentor(mentorId) {
      const result = await chooseMentor(mentorId);
      if (result?.ok) {
        setUnavailableMentorIds([]);
        return;
      }
      if (result?.code === "mentor_capacity_full") {
        setUnavailableMentorIds((current) =>
          current.includes(mentorId) ? current : [...current, mentorId],
        );
      }
    }

    function openMentorProfileInNewTab(match) {
      const mentorUserId =
        match.mentor && match.mentor.user_id != null
          ? match.mentor.user_id
          : null;
      if (mentorUserId == null || typeof window === "undefined") return;
      const profileUrl = `${window.location.origin}${window.location.pathname}#profile/mentor/${mentorUserId}`;
      window.open(profileUrl, "_blank", "noopener,noreferrer");
    }

    return (
      <div
        className={
          isMentee
            ? "matching-page matching-page--mentee page-shell"
            : "matching-page matching-page--mentor page-shell"
        }
      >
        <header className="kasandigan-header" style={{ marginBottom: "20px" }}>
          <div className="kasandigan-header-content">
            <div className="kasandigan-badge">
              <span className="kasandigan-badge-dot" />
              <span>AMU Mentorship • Matching</span>
            </div>
            <h1 className="page-title kasandigan-title" style={{ fontSize: "1.75rem" }}>
              {isMentee ? "Matching" : "Assigned Mentees"}
              {isMentee && menteeRecUpdating && (
                <span className="matching-updating-badge" style={{ marginLeft: "10px", fontSize: "11px" }}>Updating…</span>
              )}
            </h1>
            <p className="page-subtitle kasandigan-subtitle">
              {isMentee
                ? "Personalized mentor recommendations based on your mentoring preferences. Choose a mentor to request a pairing—we match you by subjects and topics you care about."
                : "View your official mentees. New mentee requests are auto-accepted when you have available slots."}
            </p>
          </div>
          {isMentee && (
            <div className="kasandigan-header-actions" style={{ display: "flex", alignItems: "center" }}>
              <div
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
                  gap: "8px",
                  padding: "8px 16px",
                  borderRadius: "24px",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    backgroundColor: isLimitReached ? "#ef4444" : activePairingsCount === 1 ? "#3b82f6" : "#10b981",
                  }}
                />
                {isLimitReached
                  ? `Mentor Limit Reached (${activePairingsCount}/2)`
                  : `Mentors: ${activePairingsCount}/2 Slots`}
              </div>
            </div>
          )}
        </header>


        {isMentee && !menteeQuestionnaireCompleted && (
          <div className="matching-empty">
            <p>
              Set your mentoring preferences so we can recommend mentors based
              on the subjects you want help with.
            </p>
            <div className="btn-row matching-empty-actions">
              <button
                type="button"
                className="btn secondary"
                onClick={() => setActiveTab("mentoring-preferences")}
              >
                Open mentoring preferences
              </button>
            </div>
          </div>
        )}



        {user.role === "mentor" &&
          (() => {
            if (mentorRequestsLoading && mentorRequests.length === 0) {
              return (
                <Spinner
                  title="Loading mentee requests…"
                  subtitle="Fetching your mentee matches"
                />
              );
            }
            if (mentorRequests.length > 0) {
              const accepted = mentorRequests.filter((r) => r.accepted);
              const pending = mentorRequests.filter((r) => !r.accepted);
              return (
                <>
                  {accepted.length > 0 && (
                    <div className="match-mentee-list matching-section-block">
                      <div className="mentees-section-head">
                        <div>
                          <div className="section-title">My mentees</div>
                          <p className="page-subtitle matching-section-subtitle">
                            Official mentees matched to you. Post announcements
                            or view their matching details below.
                          </p>
                        </div>
                        <button
                          type="button"
                          className="btn kasandigan-btn-secondary small"
                          onClick={() => setActiveTab("mentees")}
                        >
                          <GroupsOutlined fontSize="small" />
                          <span>View all mentees</span>
                        </button>
                      </div>
                      {accepted.map((r) => (
                        <MentorProfileCard
                          key={r.mentee_id}
                          person={{
                            avatar_url: r.mentee_avatar_url,
                            display_name: r.mentee_display_name,
                            username: r.mentee_username,
                            subjects: r.mentee_subjects,
                            topics: r.mentee_topics,
                            bio: r.mentee_bio,
                            program: r.mentee_program,
                            year_level: r.mentee_year_level,
                            preferred_learning_style:
                              r.mentee_preferred_learning_style,
                            availability: r.mentee_availability,
                            difficulty_level: r.mentee_difficulty_level,
                          }}
                          displayName={
                            r.mentee_display_name || r.mentee_username
                          }
                          email={r.mentee_email}
                          score={r.score}
                          matchDetails={r.match_details}
                          scoreBreakdown={r.score_breakdown || (r.match_details && r.match_details.score_breakdown)}
                          variant="hero"
                          kind="mentee"
                          isOfficial
                          savedId={r.mentee_user_id || r.mentee_id}
                          onViewProfile={
                            r.mentee_user_id
                              ? () => loadUserProfile(r.mentee_user_id)
                              : undefined
                          }
                        />
                      ))}
                    </div>
                  )}
                  {pending.length > 0 && (
                    <div className="match-mentee-list matching-section-block">
                      <div className="section-title">Not available</div>
                      <p className="page-subtitle matching-section-subtitle">
                        These mentees could not be auto-confirmed because your
                        capacity is full.
                      </p>
                      <div className="match-grid">
                      {pending.map((r) => (
                        <MentorProfileCard
                          key={r.mentee_id}
                          person={{
                            avatar_url: r.mentee_avatar_url,
                            display_name: r.mentee_display_name,
                            username: r.mentee_username,
                            subjects: r.mentee_subjects,
                            topics: r.mentee_topics,
                            bio: r.mentee_bio,
                            program: r.mentee_program,
                            year_level: r.mentee_year_level,
                            preferred_learning_style:
                              r.mentee_preferred_learning_style,
                            availability: r.mentee_availability,
                            difficulty_level: r.mentee_difficulty_level,
                          }}
                          displayName={
                            r.mentee_display_name || r.mentee_username
                          }
                          email={r.mentee_email}
                          score={r.score}
                          matchDetails={r.match_details}
                          scoreBreakdown={r.score_breakdown || (r.match_details && r.match_details.score_breakdown)}
                          variant="grid"
                          kind="mentee"
                          isOfficial={false}
                          isUnavailable
                          compact
                          savedId={r.mentee_user_id || r.mentee_id}
                        />
                      ))}
                      </div>
                    </div>
                  )}
                </>
              );
            }
            return null;
          })()}

        {isMentee && (myMentor || (myMentors && myMentors.length > 0)) ? (
          <OfficialMentorSpotlight
            myMentor={myMentor}
            myMentors={myMentors}
            menteeMatching={menteeMatching}
          />
        ) : null}

        {isMentee &&
          menteeQuestionnaireCompleted &&
          (() => {
            if (menteeRecLoading && visibleMenteeRecs.length === 0) {
              return <MatchingLoading />;
            }

            if (visibleMenteeRecs.length === 0) {
              if (myMentor || (myMentors && myMentors.length > 0)) {
                return null;
              }
              const emptyMessage =
                (menteeRecMeta && menteeRecMeta.message) ||
                "No mentor recommendations yet.";
              const suggestedSlots =
                menteeRecMeta &&
                Array.isArray(menteeRecMeta.suggested_time_slots)
                  ? menteeRecMeta.suggested_time_slots
                  : [];
              return (
                <div className="matching-empty">
                  <p>{emptyMessage}</p>
                  {suggestedSlots.length > 0 && (
                    <div className="matching-suggested-times">
                      <p className="muted matching-suggested-times-label">
                        Suggested available mentor times:
                      </p>
                      <ul className="matching-suggested-times-list">
                        {suggestedSlots.map((slot) => (
                          <li key={slot}>{formatSlotLabel(slot)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="muted matching-suggested-times-note">
                    Try adjusting your availability or selecting more subjects
                    in your mentoring preferences.
                  </p>
                  <div className="btn-row matching-empty-actions matching-empty-actions-wrap">
                    <button
                      type="button"
                      className="btn secondary small"
                      onClick={() => setActiveTab("mentoring-preferences")}
                    >
                      Adjust availability
                    </button>
                    <button
                      type="button"
                      className="btn secondary small"
                      onClick={() => setActiveTab("mentoring-preferences")}
                    >
                      Select more subjects
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div className="match-grid-section">
                <div className="match-grid-head">
                  <div className="section-title">Your mentor matches</div>
                  {visibleMenteeRecs.length >= 1 ? (
                    <div className="btn-row match-mentee-list-head-actions">
                      <button
                        type="button"
                        className="btn secondary small"
                        disabled={menteeRecLoading}
                        onClick={() => {
                          setShowMoreMentors(true);
                          loadMenteeRecommendations(30);
                        }}
                      >
                        {menteeRecLoading
                          ? "Loading more mentors…"
                          : "View more mentors"}
                      </button>
                    </div>
                  ) : null}
                </div>

                {isLimitReached && (
                  <div className="mentee-limit-banner" role="alert">
                    <div className="mentee-limit-icon">
                      <InfoOutlined fontSize="medium" />
                    </div>
                    <div className="mentee-limit-text">
                      <div className="mentee-limit-title">
                        Mentor Limit Reached ({activePairingsCount}/2 Mentors)
                      </div>
                      <div className="mentee-limit-desc">
                        Under AMU guidelines, each mentee is limited to a maximum of 2 mentors concurrently. Because you already have {activePairingsCount} active mentorships, new pairing requests are disabled.
                      </div>
                    </div>
                    <span className="neu-badge neu-badge--high">2/2 Limit Reached</span>
                  </div>
                )}

                <MentorMatchFilterBar
                  search={matchSearch}
                  onSearchChange={setMatchSearch}
                  sort={matchSort}
                  onSortChange={setMatchSort}
                  subject={matchSubjectFilter}
                  onSubjectChange={setMatchSubjectFilter}
                  availability={matchAvailabilityFilter}
                  onAvailabilityChange={setMatchAvailabilityFilter}
                  subjectOptions={matchSubjectOptions}
                />
                {filteredMenteeRecs.length === 0 ? (
                  <div className="matching-card match-filter-empty">
                    <p>No mentors match your current search or filters.</p>
                  </div>
                ) : (
                  <div className="match-grid">
                    {filteredMenteeRecs.map((match, idx) => (
                      <MentorMatchCard
                        key={match.mentor_id + "-" + idx}
                        match={match}
                        myMentor={myMentor}
                        myMentors={myMentors}
                        chosenMentorId={chosenMentorId}
                        unavailableMentorIds={unavailableMentorIds}
                        isLimitReached={isLimitReached}
                        isPending={pendingMentorIds.includes(match.mentor_id) || !!match.is_pending}
                        onRequestPairing={handleChooseMentor}
                        onViewProfile={openMentorProfileInNewTab}
                        menteeMatching={menteeMatching}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

        {isMentee && showMoreMentors && (
          <div
            className="mentee-info-modal-backdrop"
            onClick={() => setShowMoreMentors(false)}
            role="dialog"
            aria-modal="true"
            aria-label="More mentor matches"
          >
            <div
              className="card mentee-info-modal modal-paper-container"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="page-title">More mentor matches</h2>
              <p className="page-subtitle">
                Scroll to explore additional mentors that fit your subjects and
                topics.
              </p>
              {isLimitReached && (
                <div className="mentee-limit-banner" style={{ margin: "12px 0 16px" }} role="alert">
                  <div className="mentee-limit-icon">
                    <InfoOutlined fontSize="small" />
                  </div>
                  <div className="mentee-limit-text">
                    <div className="mentee-limit-title" style={{ fontSize: "0.9rem" }}>
                      Mentor limit reached ({activePairingsCount}/2)
                    </div>
                    <div className="mentee-limit-desc" style={{ fontSize: "0.8rem" }}>
                      Pairing requests are disabled because you have reached the 2-mentor capacity limit.
                    </div>
                  </div>
                </div>
              )}
              <div className="matching-modal-grid">
                {filteredMenteeRecs.length === 0 && !menteeRecLoading && (
                  <p className="muted match-filter-empty">
                    No additional mentors to show right now.
                  </p>
                )}
                {filteredMenteeRecs.map((match, idx) => (
                  <MentorMatchCard
                    key={"modal-" + match.mentor_id + "-" + idx}
                    match={match}
                    myMentor={myMentor}
                    myMentors={myMentors}
                    chosenMentorId={chosenMentorId}
                    unavailableMentorIds={unavailableMentorIds}
                    isLimitReached={isLimitReached}
                    isPending={pendingMentorIds.includes(match.mentor_id) || !!match.is_pending}
                    compact
                    menteeMatching={menteeMatching}
                    onRequestPairing={(mentorId) => {
                      if (isLimitReached) return;
                      handleChooseMentor(mentorId);
                      setShowMoreMentors(false);
                    }}
                    onViewProfile={openMentorProfileInNewTab}
                  />
                ))}
                {menteeRecLoading && (
                  <div className="matching-loading-inline">
                    <MatchingLoading />
                  </div>
                )}
              </div>
              <div className="btn-row matching-modal-footer">
                <button
                  type="button"
                  className="btn secondary small"
                  onClick={() => setShowMoreMentors(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {isMentee && selectedMentorDetails && (
          <div
            className="mentee-info-modal-backdrop"
            onClick={() => setSelectedMentorDetails(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Mentor profile"
          >
            <div
              className="card mentee-info-modal mentor-info-modal modal-paper-container"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const match = selectedMentorDetails;
                const mentor = match.mentor || {};
                const d = match.match_details || {};
                const { percentage, label, tier } = formatMatchScore(
                  match.score,
                );
                const isOfficialPair =
                  (myMentor && isSameMentorMatch(match, myMentor)) ||
                  (Array.isArray(myMentors) && myMentors.some((m) => isSameMentorMatch(match, m))) ||
                  chosenMentorId === match.mentor_id;
                const isPending =
                  pendingMentorIds.includes(match.mentor_id) || !!match.is_pending;
                const isNotAvailable = unavailableMentorIds.includes(
                  match.mentor_id,
                );
                const mentorSubjects =
                  mentor.subjects && mentor.subjects.length
                    ? mentor.subjects
                    : d.mentor_subjects || [];
                const mentorTopics =
                  mentor.topics && mentor.topics.length
                    ? mentor.topics
                    : d.mentor_topics || [];
                return (
                  <>
                    <div className="match-card-header matching-modal-header">
                      <div className="match-card-main">
                        <div className="match-card-title-row">
                          <MatchPersonAvatar
                            name={
                              match.mentor_display_name ||
                              match.mentor_username
                            }
                            url={mentor.avatar_url}
                            className="match-column-avatar"
                          />
                          <div>
                            <h2 className="page-title matching-modal-title">
                              Mentor profile
                            </h2>
                            <p className="page-subtitle matching-modal-subtitle">
                              {match.mentor_display_name ||
                                match.mentor_username}
                            </p>
                            {mentor.role && (
                              <MentorRoleBadge
                                role={mentor.role}
                                prominent
                                className="mentor-role-badge--spaced"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                      <span
                        className={
                          "match-card-score match-score-badge match-score-tier-" +
                          tier
                        }
                      >
                        {percentage}% · {label}
                      </span>
                    </div>
                    <p className="page-subtitle">
                      A quick snapshot of this mentor&apos;s profile,
                      availability, and capacity.
                    </p>
                    <div className="form-grid matching-modal-grid">
                      <div>
                        <p>
                          <strong>Biological sex:</strong>{" "}
                          {mentor.gender || "—"}
                        </p>
                        {mentor.expertise_level != null && (
                          <p>
                            <strong>Expertise level:</strong>{" "}
                            {mentor.expertise_level}/5
                          </p>
                        )}
                        {mentor.capacity != null && (
                          <p>
                            <strong>Capacity:</strong> {mentor.capacity} mentees
                          </p>
                        )}
                      </div>
                      <div>
                        {(mentor.availability || []).length > 0 && (
                          <p>
                            <strong>Availability:</strong>{" "}
                            {formatSlotList(mentor.availability)}
                          </p>
                        )}
                        {mentorSubjects.length > 0 && (
                          <p>
                            <strong>Subjects:</strong>{" "}
                            {mentorSubjects.join(", ")}
                          </p>
                        )}
                        {mentorTopics.length > 0 && (
                          <p>
                            <strong>Topics:</strong> {mentorTopics.join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="btn-row matching-modal-actions">
                      <button
                        type="button"
                        className="btn secondary small"
                        onClick={() => setSelectedMentorDetails(null)}
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        className="btn small"
                        onClick={() => {
                          if (isLimitReached || isPending) return;
                          handleChooseMentor(match.mentor_id);
                          setSelectedMentorDetails(null);
                        }}
                        disabled={isOfficialPair || isPending || isNotAvailable || isLimitReached}
                      >
                        {isOfficialPair
                          ? "Official Pair"
                          : isPending
                            ? "Request Sent"
                            : isNotAvailable
                              ? "Not Available"
                              : isLimitReached
                                ? "Limit Reached (2/2)"
                                : "Choose this mentor"}
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    );
  }

  window.DashboardApp = window.DashboardApp || {};
  window.DashboardApp.Pages = window.DashboardApp.Pages || {};
  window.DashboardApp.Pages.matching = MatchingPage;
  window.DashboardApp.AdminPairedUsersView = AdminPairedUsersView;
})();
