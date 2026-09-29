import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import MenteePreferencesPage from "./MenteePreferencesPage.jsx";

(function () {
  "use strict";
  const React = window.React;
  const { useContext, useState, useEffect, useRef } = React;
  const AppContext = window.DashboardApp.AppContext;
  const { getCookie, fetchJSON, DashboardIcon } =
    window.DashboardApp.Utils || {};

  const BIO_MAX = 200;
  const MAX_TAGS = 8;
  const OPEN_SECTION_STORAGE_KEY = "settings:open-section";
  const TAB_IDS = ["account", "password", "academic", "preferences", "coordinator"];
  const LEGACY_SECTION_MAP = { general: "academic", bio: "account", matching: "preferences", automation: "coordinator" };

  /** Reads the section from a "settings/<section>" hash so links can open one directly. */
  function sectionFromHash() {
    const raw = String(window.location.hash || "").replace(/^#/, "");
    if (!raw.startsWith("settings")) return null;
    const section = raw.split("/")[1] || "";
    const normalized = LEGACY_SECTION_MAP[section] || section;
    return TAB_IDS.includes(normalized) ? normalized : null;
  }

  function writeSectionHash(section) {
    const base = window.location.pathname + window.location.search;
    const next = section ? `${base}#settings/${section}` : `${base}#settings`;
    window.history.replaceState(null, "", next);
  }

  const PASSWORD_STRENGTH_LABELS = [
    "Too weak",
    "Too weak",
    "Weak",
    "Almost there",
    "Strong",
  ];

  function formatYearLevel(value) {
    const level = Number(value);
    if (!level) return "—";
    if (level === 1) return "1st Year";
    if (level === 2) return "2nd Year";
    if (level === 3) return "3rd Year";
    if (level === 4) return "4th Year";
    return `Year ${level}`;
  }

  function getInitials(name) {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function SettingsTabNav({ tabs, activeTab, onChange }) {
    const handleTabChange = (_event, value) => {
      onChange(value);
    };
    return (
      <Tabs
        allowScrollButtonsMobile={false}
        aria-label="Settings sections"
        className="settings-tabs"
        onChange={handleTabChange}
        scrollButtons={false}
        value={activeTab}
        variant="scrollable"
      >
        {tabs.map((tab) => (
          <Tab key={tab.id} label={tab.label} value={tab.id} />
        ))}
      </Tabs>
    );
  }

  function getPasswordChecks(password) {
    const value = String(password || "");
    return [
      { id: "length", label: "At least 10 characters", ok: value.length >= 10 },
      { id: "lower", label: "One lowercase letter", ok: /[a-z]/.test(value) },
      { id: "upper", label: "One uppercase letter", ok: /[A-Z]/.test(value) },
      { id: "number", label: "One number", ok: /\d/.test(value) },
    ];
  }

  function ReadOnlyBadge() {
    return (
      <span className="settings-readonly-badge" aria-label="Read only">
        🔒 Read only
      </span>
    );
  }

  function BioAndInterestsCard({
    bio,
    tags,
    onBioSave,
    onTagsSave,
    onDirtyChange,
    registerActions,
    onDraftChange,
    addToast,
  }) {
    const [bioText, setBioText] = useState(bio);
    const [bioSaving, setBioSaving] = useState(false);
    const [localTags, setLocalTags] = useState(tags);
    const [tagInput, setTagInput] = useState("");
    const [tagsSaving, setTagsSaving] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [tagError, setTagError] = useState("");
    const suggestionsRef = useRef(null);
    const inputRef = useRef(null);
    const debounceRef = useRef(null);

    useEffect(() => {
      setBioText(bio);
    }, [bio]);
    useEffect(() => {
      setLocalTags(tags);
    }, [tags]);

    useEffect(() => {
      function handleClickOutside(e) {
        if (
          suggestionsRef.current &&
          !suggestionsRef.current.contains(e.target) &&
          inputRef.current &&
          !inputRef.current.contains(e.target)
        ) {
          setShowSuggestions(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function handleTagInputChange(value) {
      setTagInput(value);
      setTagError("");
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (value.trim().length > 0) {
        debounceRef.current = setTimeout(async () => {
          const res = await fetchJSON(
            `/api/tags/suggestions/?q=${encodeURIComponent(value.trim())}`,
          );
          if (res.ok) {
            const existing = new Set(localTags.map((t) => t.toLowerCase()));
            setSuggestions(
              (res.data.suggestions || []).filter(
                (s) => !existing.has(s.toLowerCase()),
              ),
            );
            setShowSuggestions(true);
          }
        }, 250);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }

    function addTag(tagName) {
      const trimmed = tagName.trim();
      if (!trimmed) return;
      if (localTags.length >= MAX_TAGS) {
        const msg = "Maximum " + MAX_TAGS + " tags allowed.";
        setTagError(msg);
        if (typeof addToast === "function") {
          addToast({ title: "Tag Limit", message: msg, type: "warning" });
        }
        return;
      }
      if (localTags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
        const msg = `Interest "${trimmed}" has already been added.`;
        setTagError(msg);
        if (typeof addToast === "function") {
          addToast({ title: "Duplicate Interest", message: msg, type: "warning" });
        }
        return;
      }
      setLocalTags([...localTags, trimmed]);
      setTagInput("");
      setSuggestions([]);
      setShowSuggestions(false);
      setTagError("");
    }

    function removeTag(idx) {
      setLocalTags(localTags.filter((_, i) => i !== idx));
      setTagError("");
    }

    function handleTagKeyDown(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        addTag(tagInput);
      }
    }

    async function saveBio() {
      if (!bioChanged) {
        if (typeof addToast === "function") {
          addToast("Bio is already up to date.", "info");
        }
        return;
      }
      setBioSaving(true);
      await onBioSave(bioText);
      setBioSaving(false);
    }

    async function saveTags() {
      if (!tagsChanged) {
        if (typeof addToast === "function") {
          addToast("Interests are already up to date.", "info");
        }
        return;
      }
      setTagsSaving(true);
      await onTagsSave(localTags);
      setTagsSaving(false);
    }

    const bioChanged = bioText !== bio;
    const tagsChanged = JSON.stringify(localTags) !== JSON.stringify(tags);
    const isDirty = bioChanged || tagsChanged;

    useEffect(() => {
      if (onDirtyChange) onDirtyChange(isDirty);
    }, [isDirty]);

    useEffect(() => {
      if (typeof onDraftChange === "function") {
        onDraftChange({ bio: bioText, tags: localTags });
      }
    }, [bioText, localTags]);

    useEffect(() => {
      return () => {
        if (onDirtyChange) onDirtyChange(false);
      };
    }, []);

    useEffect(() => {
      if (!registerActions) return;
      registerActions({
        save: async () => {
          let ok = true;
          if (bioChanged) {
            setBioSaving(true);
            ok = (await onBioSave(bioText)) !== false;
            setBioSaving(false);
          }
          if (ok && tagsChanged) {
            setTagsSaving(true);
            ok = (await onTagsSave(localTags)) !== false;
            setTagsSaving(false);
          }
          return ok;
        },
        discard: () => {
          setBioText(bio);
          setLocalTags(tags);
          setTagInput("");
          setTagError("");
          setSuggestions([]);
          setShowSuggestions(false);
        },
      });
    }, [bio, tags, bioText, localTags, bioChanged, tagsChanged]);

    return (
      <div className="settings-bio-panel">
        <h3 className="settings-bio-panel-title">Bio &amp; interests</h3>
        <p className="settings-helper-text">
          Tell others about yourself and what you&apos;re interested in.
        </p>
        <div className="settings-bio-section">
          <div className="settings-section-label">Bio</div>
          <div className="form-group settings-bio-form-group">
            <textarea
              className="bio-textarea"
              value={bioText}
              onChange={(e) => setBioText(e.target.value.slice(0, BIO_MAX))}
              placeholder="Write a short bio about yourself..."
              rows={4}
              maxLength={BIO_MAX}
            />
            <div className="settings-bio-toolbar">
              <div className="bio-char-count">
                <span
                  className={
                    bioText.length > BIO_MAX - 20 ? "bio-char-warn" : ""
                  }
                >
                  {bioText.length}
                </span>
                /{BIO_MAX}
              </div>
              <button
                type="button"
                className={`btn small ${bioChanged ? "btn-primary" : "secondary"}`}
                onClick={saveBio}
                disabled={bioSaving}
                title={bioChanged ? "Save bio changes" : "Bio is up to date"}
              >
                {bioSaving
                  ? "Saving\u2026"
                  : "Save bio"}
              </button>
            </div>
          </div>
        </div>

        <div className="settings-bio-divider" role="presentation" />

        <div className="settings-tags-section">
          <div className="settings-section-label">Interests / Tags</div>
          <p className="field-helper settings-tags-helper">
            Add up to {MAX_TAGS} tags. Type and press Enter or select from
            suggestions.
          </p>

          <div className="tag-input-container">
            <div className="tag-input-pills">
              {localTags.map((t, i) => (
                <span key={t + i} className="sp-tag-pill sp-tag-pill--editable">
                  {t}
                  <button
                    type="button"
                    className="sp-tag-remove"
                    onClick={() => removeTag(i)}
                    aria-label={"Remove " + t}
                  >
                    &times;
                  </button>
                </span>
              ))}
              {localTags.length < MAX_TAGS && (
                <input
                  ref={inputRef}
                  type="text"
                  className="tag-input-field"
                  value={tagInput}
                  onChange={(e) => handleTagInputChange(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onFocus={() => {
                    if (tagInput.trim()) setShowSuggestions(true);
                  }}
                  placeholder={
                    localTags.length === 0
                      ? "e.g. Python, Web Dev, UI/UX"
                      : "Add tag\u2026"
                  }
                />
              )}
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="tag-suggestions" ref={suggestionsRef}>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="tag-suggestion-item"
                    onClick={() => addTag(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          {tagError && <p className="sp-file-error">{tagError}</p>}

          <div className="settings-tags-toolbar">
            <button
              type="button"
              className={`btn small ${tagsChanged ? "btn-primary" : "secondary"}`}
              onClick={saveTags}
              disabled={tagsSaving}
              title={tagsChanged ? "Save interests changes" : "Interests are up to date"}
            >
              {tagsSaving
                ? "Saving\u2026"
                : "Save interests"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  function SettingsPage() {
    const ctx = useContext(AppContext);
    if (!ctx || !ctx.user) return null;
    const {
      user,
      setUser,
      setError,
      addToast,
      settingsForm,
      setSettingsForm,
      settingsSaving,
      handleSettingsSave,
      handleBioSave,
      handleTagsSave,
      handleAvatarChange,
      handleRemoveAvatar: ctxHandleRemoveAvatar,
      avatarUploading,
      menteeProfile,
      setMenteeProfile,
      menteeProfileSaving,
      handleMenteeProfileSave,
      setUnsavedChangesDirty,
    } = ctx;

    const [activeTab, setActiveTab] = useState(() => {
      const fromHash = sectionFromHash();
      if (fromHash) return fromHash;
      try {
        const stored =
          window.sessionStorage.getItem(OPEN_SECTION_STORAGE_KEY) ?? "account";
        return LEGACY_SECTION_MAP[stored] || stored;
      } catch {
        return "account";
      }
    });
    const [bioDirty, setBioDirty] = useState(false);
    const [bioDraft, setBioDraft] = useState({
      bio: settingsForm.bio || "",
      tags: Array.isArray(settingsForm.tags) ? settingsForm.tags : [],
    });
    const [savingAll, setSavingAll] = useState(false);
    const [savedAt, setSavedAt] = useState(0);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const bioActionsRef = useRef({ save: null, discard: null });
    const generalSavedRef = useRef(null);
    const generalEditedRef = useRef(false);
    const [passwordEmail, setPasswordEmail] = useState("");
    const [passwordVerificationCode, setPasswordVerificationCode] =
      useState("");
    const [passwordForm, setPasswordForm] = useState({
      new_password1: "",
      new_password2: "",
    });
    const [passwordCodeSent, setPasswordCodeSent] = useState(false);
    const [passwordCodeVerified, setPasswordCodeVerified] = useState(false);
    const [passwordCodeSending, setPasswordCodeSending] = useState(false);
    const [passwordCodeVerifying, setPasswordCodeVerifying] = useState(false);
    const [passwordChanging, setPasswordChanging] = useState(false);
    const [passwordResendSeconds, setPasswordResendSeconds] = useState(0);
    const [passwordStatus, setPasswordStatus] = useState({
      tone: "muted",
      message: "",
    });
    const passwordCodeInputRef = useRef(null);
    const passwordNewPasswordRef = useRef(null);

    useEffect(() => {
      if (!passwordCodeSent && !passwordCodeVerified) {
        setPasswordEmail(settingsForm.email || user.email || "");
      }
    }, [
      settingsForm.email,
      user.email,
      passwordCodeSent,
      passwordCodeVerified,
    ]);

    useEffect(() => {
      try {
        window.sessionStorage.setItem(OPEN_SECTION_STORAGE_KEY, activeTab);
      } catch {
        /* storage unavailable */
      }
      writeSectionHash(activeTab);
    }, [activeTab]);

    useEffect(() => {
      function onHashChange() {
        const section = sectionFromHash();
        if (section) setActiveTab(section);
      }
      window.addEventListener("hashchange", onHashChange);
      return () => window.removeEventListener("hashchange", onHashChange);
    }, []);

    useEffect(() => {
      if (passwordResendSeconds <= 0) return undefined;
      const timer = window.setInterval(() => {
        setPasswordResendSeconds((current) => (current > 0 ? current - 1 : 0));
      }, 1000);
      return () => window.clearInterval(timer);
    }, [passwordResendSeconds]);

    function selectTab(tabId) {
      setActiveTab(tabId);
    }

    async function handleRemoveAvatar() {
      if (typeof ctxHandleRemoveAvatar === "function") {
        await ctxHandleRemoveAvatar();
        return;
      }
      if (!settingsForm.avatar_url && !user?.avatar_url) return;
      try {
        const response = await fetch("/api/me/avatar/", {
          method: "DELETE",
          credentials: "include",
          headers: { "X-CSRFToken": getCookie("csrftoken") },
        });
        const data = (await response.json()) || {};
        if (!response.ok) {
          addToast(data.error || "Unable to remove profile picture.", "error");
          return;
        }
        setSettingsForm((prev) => ({ ...prev, avatar_url: "" }));
        setUser((prev) => (prev ? { ...prev, avatar_url: "" } : prev));
        addToast("Profile photo removed.");
      } catch (err) {
        addToast("Network error while removing profile picture.", "error");
      }
    }

    async function handleSendPasswordCode() {
      setError("");
      setPasswordStatus({ tone: "muted", message: "" });
      const email = String(passwordEmail || "").trim();
      if (!email) {
        const msg = "Enter the email address that should receive the code.";
        setPasswordStatus({
          tone: "error",
          message: msg,
        });
        addToast({
          title: "Email Required",
          message: msg,
          type: "warning",
        });
        return;
      }
      setPasswordCodeSending(true);
      const result = await fetchJSON("/api/me/password-code/send/", {
        method: "POST",
        headers: { "X-CSRFToken": getCookie("csrftoken") },
        body: JSON.stringify({ email }),
      });
      setPasswordCodeSending(false);
      if (!result.ok) {
        const message =
          result.data?.errors && typeof result.data.errors === "object"
            ? Object.values(result.data.errors)
                .flat()
                .filter(Boolean)
                .join(" ") ||
              result.data?.error ||
              "Unable to send verification code."
            : result.data?.error || "Unable to send verification code.";
        setPasswordCodeVerified(false);
        setPasswordStatus({ tone: "error", message });
        addToast({
          title: "Send Failed",
          message,
          type: "error",
        });
        return;
      }
      setPasswordCodeSent(true);
      setPasswordCodeVerified(false);
      setPasswordVerificationCode("");
      setPasswordForm({ new_password1: "", new_password2: "" });
      setPasswordResendSeconds(Number(result.data?.cooldown_seconds || 60));
      setPasswordStatus({
        tone: "success",
        message: result.data?.message || "Verification code sent.",
      });
      addToast({
        title: "Code Sent",
        message: result.data?.message || "Verification code sent to your email.",
        type: "success",
      });
      window.setTimeout(() => {
        passwordCodeInputRef.current?.focus();
      }, 0);
    }

    async function handleVerifyPasswordCode() {
      setError("");
      setPasswordStatus({ tone: "muted", message: "" });
      if (String(passwordVerificationCode || "").trim().length !== 6) {
        const msg = "Please enter the 6-digit verification code.";
        setPasswordStatus({
          tone: "error",
          message: msg,
        });
        addToast({
          title: "Invalid Code",
          message: msg,
          type: "warning",
        });
        return;
      }
      setPasswordCodeVerifying(true);
      const result = await fetchJSON("/api/me/password-code/verify/", {
        method: "POST",
        headers: { "X-CSRFToken": getCookie("csrftoken") },
        body: JSON.stringify({ verification_code: passwordVerificationCode }),
      });
      setPasswordCodeVerifying(false);
      if (!result.ok) {
        const message =
          result.data?.errors && typeof result.data.errors === "object"
            ? Object.values(result.data.errors)
                .flat()
                .filter(Boolean)
                .join(" ") ||
              result.data?.error ||
              "Invalid verification code."
            : result.data?.error || "Invalid verification code.";
        setPasswordCodeVerified(false);
        setPasswordStatus({ tone: "error", message });
        addToast({
          title: "Verification Failed",
          message,
          type: "error",
        });
        return;
      }
      setPasswordCodeVerified(true);
      setPasswordStatus({
        tone: "success",
        message:
          result.data?.message ||
          "Code verified. You can now set a new password.",
      });
      addToast({
        title: "Code Verified",
        message: result.data?.message || "Security code verified. You can now set your new password.",
        type: "success",
      });
      window.setTimeout(() => {
        passwordNewPasswordRef.current?.focus();
      }, 0);
    }

    async function handleChangePasswordWithCode() {
      setError("");
      setPasswordStatus({ tone: "muted", message: "" });
      if (!passwordCodeVerified) {
        const msg = "Please enter and verify the security code before updating your password.";
        setPasswordStatus({
          tone: "error",
          message: msg,
        });
        addToast({
          title: "Verification Required",
          message: msg,
          type: "warning",
        });
        return;
      }
      if (!passwordForm.new_password1) {
        const msg = "Please enter your new password.";
        setPasswordStatus({ tone: "error", message: msg });
        addToast({ title: "Password Required", message: msg, type: "warning" });
        return;
      }
      if (!passwordMeetsRules) {
        const msg = "Password must be at least 10 characters and contain uppercase, lowercase, and numbers.";
        setPasswordStatus({ tone: "error", message: msg });
        addToast({ title: "Password Complexity", message: msg, type: "warning" });
        return;
      }
      if (!passwordsMatch) {
        const msg = "The confirmation password does not match the new password.";
        setPasswordStatus({ tone: "error", message: msg });
        addToast({ title: "Passwords Mismatch", message: msg, type: "warning" });
        return;
      }

      setPasswordChanging(true);
      const result = await fetchJSON("/api/me/password-code/change/", {
        method: "POST",
        headers: { "X-CSRFToken": getCookie("csrftoken") },
        body: JSON.stringify({
          new_password1: passwordForm.new_password1,
          new_password2: passwordForm.new_password2,
        }),
      });
      setPasswordChanging(false);
      if (!result.ok) {
        const errs = result.data?.errors;
        const message =
          errs && typeof errs === "object"
            ? Object.values(errs).flat().filter(Boolean).join(" ") ||
              "Unable to change password."
            : result.data?.error || "Unable to change password.";
        setPasswordStatus({ tone: "error", message });
        addToast({
          title: "Update Failed",
          message,
          type: "error",
        });
        return;
      }
      setPasswordForm({
        new_password1: "",
        new_password2: "",
      });
      setPasswordVerificationCode("");
      setPasswordCodeSent(false);
      setPasswordCodeVerified(false);
      setPasswordResendSeconds(0);
      setPasswordStatus({
        tone: "success",
        message: result.data?.message || "Password updated successfully.",
      });
      addToast({
        title: "Password Updated",
        message: result.data?.message || "Your password has been changed successfully.",
        type: "success",
      });
    }

    const passwordChecks = getPasswordChecks(passwordForm.new_password1);
    const passwordScore = passwordChecks.filter((check) => check.ok).length;
    const passwordMeetsRules = passwordScore === passwordChecks.length;
    const passwordsMatch =
      !!passwordForm.new_password1 &&
      !!passwordForm.new_password2 &&
      passwordForm.new_password1 === passwordForm.new_password2;
    const canUpdatePassword =
      passwordCodeVerified &&
      passwordMeetsRules &&
      passwordsMatch &&
      !passwordChanging;
    const resendLabel =
      passwordResendSeconds > 0
        ? `Resend code (${passwordResendSeconds}s)`
        : passwordCodeSent
          ? "Resend code"
          : "Send code";

    const accountChanged =
      String(settingsForm.email || "").trim() !==
        String(user.email || "").trim() ||
      String(settingsForm.display_name || "").trim() !==
        String(user.display_name || user.full_name || "").trim();

    const generalRequiredFields = [
      "campus",
      "student_id_no",
      "contact_no",
      "admission_type",
      "sex",
    ];
    const generalMissingCount = generalRequiredFields.filter(
      (field) => !String((menteeProfile || {})[field] || "").trim(),
    ).length;

    const isStaff = Boolean(
      user.is_staff ||
      user.role === "staff" ||
      user.role === "coordinator" ||
      user.is_superuser
    );
    const isMentee =
      user.role === "mentee" ||
      user.role === "both" ||
      Boolean(user.mentee_profile || user.mentee_info);
    const hasPreferences =
      !isStaff &&
      (user.role === "mentor" ||
        user.role === "mentee" ||
        user.role === "both" ||
        Boolean(user.mentor_profile || user.mentee_profile));

    const serializedGeneral = JSON.stringify(menteeProfile || {});
    if (!generalEditedRef.current) {
      generalSavedRef.current = serializedGeneral;
    }
    const generalChanged =
      isMentee && generalSavedRef.current !== serializedGeneral;

    function updateMenteeProfile(patch) {
      generalEditedRef.current = true;
      setMenteeProfile({ ...menteeProfile, ...patch });
    }

    const dirtyLabels = [
      accountChanged && "Account",
      bioDirty && "Bio & interests",
      generalChanged && "Academic & personal info",
    ].filter(Boolean);
    const isDirty = dirtyLabels.length > 0;
    const justSaved = savedAt > 0 && !isDirty;

    const settingsTabs = [
      { id: "account", label: "Account Profile" },
      { id: "password", label: "Password & Security" },
    ];
    if (isMentee) {
      settingsTabs.push({
        id: "academic",
        label: "Academic & Personal Info",
      });
    }
    if (hasPreferences) {
      settingsTabs.push({
        id: "preferences",
        label: "Matching Preferences",
      });
    }
    if (isStaff) {
      settingsTabs.push({
        id: "coordinator",
        label: "Match Automation",
      });
    }

    useEffect(() => {
      if (
        settingsTabs.length > 0 &&
        !settingsTabs.some((t) => t.id === activeTab)
      ) {
        setActiveTab("account");
      }
    }, [settingsTabs.map((t) => t.id).join(","), activeTab]);

    useEffect(() => {
      if (typeof setUnsavedChangesDirty === "function") {
        setUnsavedChangesDirty(isDirty);
      }
    }, [isDirty]);

    // Leaving the page always goes through the leave guard, so pending edits are
    // rolled back the same way the bio/interests draft state is.
    const revertRef = useRef({});
    revertRef.current = {
      accountChanged,
      generalChanged,
      email: user.email || "",
      display_name: user.display_name || user.full_name || "",
      generalSnapshot: generalSavedRef.current,
    };

    useEffect(() => {
      return () => {
        if (typeof setUnsavedChangesDirty === "function") {
          setUnsavedChangesDirty(false);
        }
        const pending = revertRef.current || {};
        if (pending.accountChanged) {
          setSettingsForm((prev) => ({
            ...prev,
            email: pending.email,
            display_name: pending.display_name,
          }));
        }
        if (pending.generalChanged && pending.generalSnapshot) {
          try {
            setMenteeProfile(JSON.parse(pending.generalSnapshot));
          } catch {
            /* keep current values when the snapshot is unreadable */
          }
        }
      };
    }, []);

    useEffect(() => {
      if (!isDirty) return undefined;
      function onBeforeUnload(event) {
        event.preventDefault();
        event.returnValue = "";
      }
      window.addEventListener("beforeunload", onBeforeUnload);
      return () => window.removeEventListener("beforeunload", onBeforeUnload);
    }, [isDirty]);

    useEffect(() => {
      if (!savedAt) return undefined;
      const timeoutId = window.setTimeout(() => setSavedAt(0), 2600);
      return () => window.clearTimeout(timeoutId);
    }, [savedAt]);

    async function handleGeneralSave() {
      const ok = (await handleMenteeProfileSave()) !== false;
      if (ok) generalEditedRef.current = false;
      return ok;
    }

    async function handleSaveAll() {
      setSavingAll(true);
      let ok = true;
      if (accountChanged) {
        ok = (await handleSettingsSave()) !== false;
      }
      if (ok && bioDirty && bioActionsRef.current.save) {
        ok = (await bioActionsRef.current.save()) !== false;
      }
      if (ok && generalChanged) {
        ok = await handleGeneralSave();
      }
      setSavingAll(false);
      if (ok) setSavedAt(Date.now());
    }

    function handleDiscardAll() {
      setSettingsForm({
        ...settingsForm,
        email: user.email || "",
        display_name: user.display_name || user.full_name || "",
      });
      if (bioActionsRef.current.discard) bioActionsRef.current.discard();
      if (generalChanged) {
        generalEditedRef.current = false;
        try {
          setMenteeProfile(JSON.parse(generalSavedRef.current));
        } catch {
          /* keep current values when the snapshot is unreadable */
        }
      }
      addToast({
        title: "Changes Discarded",
        message: "All unsaved changes were reverted.",
        type: "info",
      });
    }

    const displayBio = bioDraft.bio || settingsForm.bio || "";
    const displayTags =
      bioDraft.tags && bioDraft.tags.length
        ? bioDraft.tags
        : Array.isArray(settingsForm.tags)
          ? settingsForm.tags
          : [];

    return (
      <div
        className={
          "settings-page-shell page-shell" +
          (user.role === "mentee"
            ? " settings-page-shell--mentee"
            : user.role === "mentor"
              ? " settings-page-shell--mentor"
              : "")
        }
      >
        <header className="kasandigan-header">
          <div className="kasandigan-header-content">
            <div className="kasandigan-badge">
              <span className="kasandigan-badge-dot" />
              <span>Academic Mentoring Unit • Account Preferences</span>
            </div>
            <h1 className="kasandigan-title">Settings</h1>
            <p className="kasandigan-subtitle">
              Manage your account, security credentials, and academic preferences.
            </p>
          </div>
          <div className="kasandigan-header-actions">
            <span
              className="kasandigan-badge"
              style={{
                textTransform: "capitalize",
                background: "var(--subcard-bg, #f8fafc)",
                border: "1px solid var(--border-color, #e2e8f0)",
                color: "var(--text-secondary, #475569)",
                fontWeight: 600,
              }}
            >
              <span
                className="kasandigan-badge-dot"
                style={{
                  background: user.is_staff
                    ? "#0284c7"
                    : user.role === "mentor"
                      ? "#0ea5e9"
                      : user.role === "both"
                        ? "#8b5cf6"
                        : "#10b981",
                }}
              />
              <span>
                {user.is_staff
                  ? "AMU Coordinator"
                  : user.role === "mentor"
                    ? "Peer Mentor"
                    : user.role === "mentee"
                      ? "Mentee"
                      : user.role === "both"
                        ? "Peer Mentor & Mentee"
                        : "User Account"}
              </span>
            </span>
          </div>
        </header>

        <SettingsTabNav
          tabs={settingsTabs}
          activeTab={activeTab}
          onChange={selectTab}
        />

        <div className="settings-content-grid">
          <div className="settings-main-column">
            {activeTab === "account" && (
              <div className="settings-tab-panel">
            <h2 className="settings-tab-panel-title">Account Profile</h2>
            <p className="settings-tab-panel-subtitle">
              Update the email and photo used across the dashboard.
            </p>
            <div className="form-grid responsive-form-row">
              <div className="form-group">
                <label htmlFor="settings-display-name" className="settings-label">
                  Display name
                </label>
                <input
                  id="settings-display-name"
                  type="text"
                  value={settingsForm.display_name ?? ""}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      display_name: e.target.value,
                    })
                  }
                  placeholder="Your display name"
                />
                <p className="field-helper settings-helper-text">
                  Your name as displayed to peers and coordinators across PeerLink.
                </p>
              </div>
              <div className="form-group">
                <label htmlFor="settings-email" className="settings-label">
                  Email
                </label>
                <input
                  id="settings-email"
                  type="email"
                  value={settingsForm.email}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, email: e.target.value })
                  }
                  placeholder="your@email.com"
                />
              </div>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="settings-label">Profile picture</label>
                <div className="settings-avatar-block">
                  <button
                    type="button"
                    className="settings-avatar-uploader"
                    onClick={() => {
                      const input = document.getElementById(
                        "settings-avatar-input",
                      );
                      if (input) input.click();
                    }}
                  >
                    <div className="settings-avatar-preview">
                      {settingsForm.avatar_url ? (
                        <img
                          src={settingsForm.avatar_url}
                          alt="Profile preview"
                          className="settings-avatar-img"
                        />
                      ) : (
                        <div className="settings-avatar-fallback">
                          {(
                            settingsForm.display_name ||
                            user.display_name ||
                            user.full_name ||
                            settingsForm.email ||
                            user.email ||
                            "?"
                          )
                            .slice(0, 1)
                            .toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="settings-avatar-overlay">
                      <span
                        className="settings-avatar-overlay-icon"
                        aria-hidden="true"
                      >
                        <DashboardIcon name="camera" size={18} />
                      </span>
                      <span className="settings-avatar-overlay-text">
                        {avatarUploading ? "Uploading…" : "Change photo"}
                      </span>
                    </div>
                  </button>
                  <div className="settings-avatar-meta">
                    <input
                      id="settings-avatar-input"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleAvatarChange}
                      disabled={avatarUploading}
                      style={{ display: "none" }}
                    />
                    <div className="settings-avatar-actions">
                      <button
                        type="button"
                        className="settings-btn-upload"
                        onClick={() => {
                          const input = document.getElementById(
                            "settings-avatar-input",
                          );
                          if (input) input.click();
                        }}
                        disabled={avatarUploading}
                      >
                        {avatarUploading ? "Uploading…" : "Upload photo"}
                      </button>
                      <button
                        type="button"
                        className="settings-btn-text"
                        onClick={handleRemoveAvatar}
                        disabled={avatarUploading || (!settingsForm.avatar_url && !user.avatar_url)}
                      >
                        Remove
                      </button>
                    </div>
                    <p className="field-helper settings-helper-text">
                      Clear front-facing photo (PNG or JPG, max 5MB).
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="settings-tab-footer">
              <button
                type="button"
                className="btn"
                onClick={handleSettingsSave}
                disabled={!accountChanged || settingsSaving}
              >
                {settingsSaving ? "Saving..." : "Save changes"}
              </button>
              {accountChanged && (
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => {
                    setSettingsForm((prev) => ({
                      ...prev,
                      display_name: user.display_name || user.full_name || "",
                      email: user.email || "",
                    }));
                  }}
                  disabled={settingsSaving}
                >
                  Discard
                </button>
              )}
              <span
                className="settings-helper-text"
                style={{
                  marginLeft: "auto",
                  fontSize: "13px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  color: accountChanged
                    ? "var(--primary, #0284c7)"
                    : "var(--text-muted)",
                  fontWeight: accountChanged ? 600 : 400,
                }}
              >
                {accountChanged ? "● Unsaved changes" : "✓ All changes saved"}
              </span>
            </div>


            <BioAndInterestsCard
              bio={settingsForm.bio || ""}
              tags={Array.isArray(settingsForm.tags) ? settingsForm.tags : []}
              onBioSave={handleBioSave}
              onTagsSave={handleTagsSave}
              onDirtyChange={setBioDirty}
              onDraftChange={setBioDraft}
              registerActions={(actions) => {
                bioActionsRef.current = actions;
              }}
              addToast={addToast}
            />
          </div>
        )}

        {activeTab === "password" && (
          <div className="settings-tab-panel">
            <h2 className="settings-tab-panel-title">Password &amp; Security</h2>
            <p className="settings-tab-panel-subtitle">
              Verify your email, then set a new password.
            </p>
            <div className="settings-password-flow-v2">
              <section className="settings-password-step-v2">
                <div className="settings-password-step-header">
                  <span className="settings-password-step-badge">1</span>
                  <div>
                    <h3 className="settings-password-step-title">
                      Request verification code
                    </h3>
                    <p className="field-helper settings-helper-text">
                      We&apos;ll send a 6-digit code to your account email.
                    </p>
                  </div>
                </div>
                <div className="form-group settings-password-email-group">
                  <label className="settings-label">Email address</label>
                  <input
                    type="email"
                    className="readonly-field-input"
                    value={passwordEmail}
                    readOnly
                    aria-readonly="true"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
                <div className="settings-password-actions">
                  <button
                    type="button"
                    className="settings-btn-upload"
                    onClick={handleSendPasswordCode}
                    disabled={
                      passwordCodeSending ||
                      passwordCodeVerifying ||
                      passwordChanging ||
                      !passwordEmail.trim() ||
                      passwordResendSeconds > 0
                    }
                  >
                    {passwordCodeSending ? "Sending..." : resendLabel}
                  </button>
                </div>
              </section>

              <section
                className={
                  "settings-password-step-v2" +
                  (passwordCodeSent ? "" : " is-muted")
                }
              >
                <div className="settings-password-step-header">
                  <span className="settings-password-step-badge">2</span>
                  <div>
                    <h3 className="settings-password-step-title">
                      Verify &amp; update
                    </h3>
                    <p className="field-helper settings-helper-text">
                      Enter the code and choose a new password.
                    </p>
                  </div>
                </div>
                <div className="form-group settings-password-code-group">
                  <label className="settings-label">Verification code</label>
                  <input
                    ref={passwordCodeInputRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={passwordVerificationCode}
                    onChange={(e) => {
                      const nextValue = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6);
                      setPasswordVerificationCode(nextValue);
                      setPasswordCodeVerified(false);
                    }}
                    disabled={!passwordCodeSent}
                  />
                  <p className="field-helper settings-helper-text">
                    {passwordCodeSent
                      ? "The code expires after 10 minutes."
                      : "Send a code first to unlock this step."}
                  </p>
                </div>
                <div className="settings-password-actions">
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={handleVerifyPasswordCode}
                    disabled={
                      !passwordCodeSent ||
                      passwordCodeVerifying ||
                      passwordVerificationCode.length !== 6 ||
                      passwordCodeVerified
                    }
                  >
                    {passwordCodeVerifying
                      ? "Verifying..."
                      : passwordCodeVerified
                        ? "Code verified"
                        : "Verify code"}
                  </button>
                </div>

                <div
                  className={
                    "form-grid settings-password-grid responsive-form-row" +
                    (passwordCodeVerified ? "" : " is-muted")
                  }
                  style={{ marginTop: 20 }}
                >
                  <div className="form-group">
                    <label htmlFor="settings-new-password" className="settings-label">
                      New password
                    </label>
                    <div className="settings-password-input">
                      <input
                        id="settings-new-password"
                        ref={passwordNewPasswordRef}
                        type={showNewPassword ? "text" : "password"}
                        value={passwordForm.new_password1}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            new_password1: e.target.value,
                          }))
                        }
                        placeholder="Enter new password"
                        disabled={!passwordCodeVerified}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="settings-password-toggle"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        disabled={!passwordCodeVerified}
                        aria-pressed={showNewPassword}
                      >
                        {showNewPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="settings-confirm-password" className="settings-label">
                      Confirm new password
                    </label>
                    <div className="settings-password-input">
                      <input
                        id="settings-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordForm.new_password2}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            new_password2: e.target.value,
                          }))
                        }
                        placeholder="Confirm new password"
                        disabled={!passwordCodeVerified}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="settings-password-toggle"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        disabled={!passwordCodeVerified}
                        aria-pressed={showConfirmPassword}
                      >
                        {showConfirmPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>
                </div>
                {passwordForm.new_password1 ? (
                  <div className="settings-password-meter">
                    <div
                      className="settings-password-meter-track"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={passwordChecks.length}
                      aria-valuenow={passwordScore}
                      aria-label="Password strength"
                    >
                      <span
                        className={
                          "settings-password-meter-fill is-score-" +
                          passwordScore
                        }
                        style={{
                          width: `${(passwordScore / passwordChecks.length) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="settings-password-meter-label">
                      {PASSWORD_STRENGTH_LABELS[passwordScore]}
                    </span>
                  </div>
                ) : null}
                <div className="settings-password-validation">
                  {passwordCodeVerified && (
                    <ul
                      className="settings-password-rules"
                      aria-label="Password requirements"
                    >
                      {passwordChecks.map((check) => (
                        <li
                          key={check.id}
                          className={
                            "settings-password-check" +
                            (check.ok ? " is-ok" : "")
                          }
                        >
                          <span
                            className="settings-password-check-icon"
                            aria-hidden="true"
                          >
                            {check.ok ? "\u2713" : "\u2022"}
                          </span>
                          {check.label}
                        </li>
                      ))}
                    </ul>
                  )}
                  {passwordCodeVerified &&
                  !passwordsMatch &&
                  passwordForm.new_password2 ? (
                    <p className="field-helper settings-password-validation-text is-error">
                      Passwords do not match.
                    </p>
                  ) : null}
                  {passwordCodeVerified && passwordMeetsRules && passwordsMatch ? (
                    <p className="field-helper settings-password-validation-text is-success">
                      Password looks good.
                    </p>
                  ) : null}
                </div>
                <div className="settings-password-actions settings-password-actions--primary">
                  <button
                    type="button"
                    className="settings-btn-upload"
                    onClick={handleChangePasswordWithCode}
                    disabled={passwordChanging}
                  >
                    {passwordChanging ? "Saving..." : "Save new password"}
                  </button>
                </div>
              </section>

              {passwordStatus.message && (
                <p
                  className={
                    "field-helper settings-password-feedback is-" +
                    passwordStatus.tone
                  }
                  role="status"
                  aria-live="polite"
                >
                  {passwordStatus.message}
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === "academic" && isMentee && (
          <div className="settings-tab-panel">
            <h2 className="settings-tab-panel-title">
              Academic &amp; Personal Info
            </h2>
            <p className="settings-tab-panel-subtitle">
              Review institution-managed records and update your contact details.
            </p>
            <div className="settings-academic-grid">
              <div className="settings-info-card">
                <span className="settings-institution-badge">
                  🔒 Managed by Institution
                </span>
                <h3 className="settings-info-card-title">Academic record</h3>
                <div className="form-grid responsive-form-row">
                  <div className="form-group">
                    <label className="settings-label">Campus</label>
                    <input
                      className="readonly-field-input"
                      value={menteeProfile.campus || "—"}
                      readOnly
                      disabled
                    />
                  </div>
                  <div className="form-group">
                    <label className="settings-label">Student ID No.</label>
                    <input
                      className="readonly-field-input"
                      value={menteeProfile.student_id_no || "—"}
                      readOnly
                      disabled
                    />
                  </div>
                  <div className="form-group">
                    <label className="settings-label">Course / Program</label>
                    <input
                      className="readonly-field-input"
                      value={menteeProfile.program || "—"}
                      readOnly
                      disabled
                    />
                  </div>
                  <div className="form-group">
                    <label className="settings-label">Year level</label>
                    <input
                      className="readonly-field-input"
                      value={formatYearLevel(menteeProfile.year_level)}
                      readOnly
                      disabled
                    />
                  </div>
                </div>
                <p className="field-helper settings-helper-text settings-helper-text--bright">
                  These fields come from your enrolment record. Contact an
                  administrator if anything looks incorrect.
                </p>
              </div>

              <div className="settings-info-card">
                <h3 className="settings-info-card-title">
                  Personal &amp; contact information
                </h3>
                <div className="form-grid responsive-form-row">
                  <div className="form-group">
                    <label className="settings-label">Contact No. *</label>
                    <input
                      value={menteeProfile.contact_no}
                      onChange={(e) =>
                        updateMenteeProfile({
                          contact_no: e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 11),
                        })
                      }
                      placeholder="11 digits only"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={11}
                    />
                  </div>
                  <div className="form-group">
                    <label className="settings-label">Admission type *</label>
                    <select
                      value={menteeProfile.admission_type || ""}
                      onChange={(e) =>
                        updateMenteeProfile({ admission_type: e.target.value })
                      }
                    >
                      <option value="">Select admission type</option>
                      <option value="regular">Regular</option>
                      <option value="transferee">Transferee</option>
                      <option value="shiftee">Shiftee</option>
                      <option value="returnee">Returnee</option>
                      <option value="irregular">Irregular</option>
                      {menteeProfile.admission_type &&
                        ![
                          "regular",
                          "transferee",
                          "shiftee",
                          "returnee",
                          "irregular",
                        ].includes(
                          String(menteeProfile.admission_type).toLowerCase(),
                        ) && (
                          <option value={menteeProfile.admission_type}>
                            {menteeProfile.admission_type}
                          </option>
                        )}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="settings-label">Biological sex *</label>
                    <select
                      value={menteeProfile.sex || ""}
                      onChange={(e) =>
                        updateMenteeProfile({ sex: e.target.value })
                      }
                    >
                      <option value="">Select biological sex</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="settings-tab-footer">
              <button
                type="button"
                className="btn"
                onClick={handleGeneralSave}
                disabled={!generalChanged || menteeProfileSaving}
              >
                {menteeProfileSaving ? "Saving..." : "Save changes"}
              </button>
              {generalChanged && (
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => {
                    try {
                      if (generalSavedRef.current) {
                        setMenteeProfile(JSON.parse(generalSavedRef.current));
                        generalEditedRef.current = false;
                      }
                    } catch {
                      /* ignore */
                    }
                  }}
                  disabled={menteeProfileSaving}
                >
                  Discard
                </button>
              )}
              {generalMissingCount > 0 ? (
                <p
                  className="field-helper settings-helper-text"
                  role="status"
                  style={{ marginLeft: "auto", color: "#e11d48", fontWeight: 500 }}
                >
                  {generalMissingCount} required field
                  {generalMissingCount === 1 ? "" : "s"} still missing.
                </p>
              ) : (
                <span
                  className="settings-helper-text"
                  style={{
                    marginLeft: "auto",
                    fontSize: "13px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    color: generalChanged
                      ? "var(--primary, #0284c7)"
                      : "var(--text-muted)",
                    fontWeight: generalChanged ? 600 : 400,
                  }}
                >
                  {generalChanged ? "● Unsaved changes" : "✓ All changes saved"}
                </span>
              )}
            </div>
          </div>
        )}

        {activeTab === "preferences" && (
          <div className="settings-tab-panel" style={{ padding: 0 }}>
            <MenteePreferencesPage defaultRole={user.role === "mentor" ? "STUDENT_MENTOR" : "MENTEE"} />
          </div>
        )}

        {activeTab === "coordinator" && isStaff && (
          <div className="settings-tab-panel">
            <h2 className="settings-tab-panel-title">Match Automation Settings</h2>
            <p className="settings-tab-panel-subtitle">
              Configure automated approval rules for mentor–mentee pairings across BukSU PeerLink.
            </p>
            {window.DashboardApp?.AutoApproveToggle && (
              <window.DashboardApp.AutoApproveToggle />
            )}
          </div>
        )}
      </div>

      <div className="settings-sidebar-column">
            {/* Live Profile Directory Preview Card */}
            <div className="settings-preview-card kasandigan-card">
              <div className="settings-card-head">
                <div className="kasandigan-card-head-title">
                  <span className="settings-preview-icon-pill">
                    <DashboardIcon name="userCircle" size={16} />
                  </span>
                  <div>
                    <h3 className="settings-preview-title">Live Directory Preview</h3>
                    <p className="settings-preview-subtitle">How peers see you on PeerLink</p>
                  </div>
                </div>
                <span className="settings-preview-badge">Public Card</span>
              </div>

              <div className="settings-preview-body">
                <div className="settings-preview-hero">
                  <div className="settings-preview-avatar">
                    {settingsForm.avatar_url ? (
                      <img
                        src={settingsForm.avatar_url}
                        alt="Profile"
                        className="settings-preview-avatar-img"
                      />
                    ) : (
                      <div className="settings-preview-avatar-fallback">
                        {getInitials(
                          settingsForm.display_name ||
                            user.display_name ||
                            user.full_name ||
                            "User",
                        )}
                      </div>
                    )}
                    <span className="settings-preview-status-dot" title="Active Account" />
                  </div>
                  <div className="settings-preview-info">
                    <h4 className="settings-preview-name">
                      {settingsForm.display_name ||
                        user.display_name ||
                        user.full_name ||
                        "PeerLink User"}
                    </h4>
                    <p className="settings-preview-email">
                      {settingsForm.email || user.email || "—"}
                    </p>
                    <div className="settings-preview-role-chip">
                      <span className="settings-preview-role-dot" />
                      <span>
                        {user.is_staff
                          ? "AMU Staff"
                          : user.role === "mentor"
                            ? "Mentor"
                            : user.role === "mentee"
                              ? "Mentee"
                              : user.role === "both"
                                ? "Mentor & Mentee"
                                : "User"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="settings-preview-section">
                  <span className="settings-preview-section-title">About</span>
                  <p className="settings-preview-bio">
                    {displayBio ? (
                      displayBio
                    ) : (
                      <span className="settings-preview-placeholder">
                        No bio added yet. Write a short introduction on the left to stand out.
                      </span>
                    )}
                  </p>
                </div>

                <div className="settings-preview-section">
                  <span className="settings-preview-section-title">Topics &amp; Interests</span>
                  <div className="settings-preview-tags">
                    {displayTags && displayTags.length > 0 ? (
                      displayTags.map((tag, idx) => (
                        <span key={tag + idx} className="settings-preview-tag-pill">
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="settings-preview-placeholder">
                        No interests added yet.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="settings-preview-footer">
                <span className="settings-preview-footer-icon">✓</span>
                <span>Updates made here directly sync across the AMU matching directory.</span>
              </div>
            </div>

            {/* Contextual Card 2: Security Guidelines or Institutional Guidance */}
            {activeTab === "password" ? (
              <div className="settings-security-guide-card kasandigan-card">
                <div className="settings-card-head">
                  <div className="kasandigan-card-head-title">
                    <span className="settings-preview-icon-pill">
                      <DashboardIcon name="lock" size={16} />
                    </span>
                    <div>
                      <h3 className="settings-preview-title">Security Guidelines</h3>
                      <p className="settings-preview-subtitle">Protecting your account</p>
                    </div>
                  </div>
                  <span className="settings-preview-badge">Protected</span>
                </div>
                <ul className="settings-security-tips-list">
                  <li>
                    <span className="settings-security-check">✓</span>
                    <div>
                      <strong>Two-Step Verification</strong>
                      <p>A 6-digit confirmation code ensures credential changes are fully authorized.</p>
                    </div>
                  </li>
                  <li>
                    <span className="settings-security-check">✓</span>
                    <div>
                      <strong>Strong Password Criteria</strong>
                      <p>Use at least 10 characters combining uppercase, lowercase, and numbers.</p>
                    </div>
                  </li>
                  <li>
                    <span className="settings-security-check">✓</span>
                    <div>
                      <strong>10-Minute Code Lifetime</strong>
                      <p>Security verification codes expire automatically after 10 minutes.</p>
                    </div>
                  </li>
                </ul>
              </div>
            ) : activeTab === "academic" ? (
              <div className="settings-security-guide-card kasandigan-card">
                <div className="settings-card-head">
                  <div className="kasandigan-card-head-title">
                    <span className="settings-preview-icon-pill">
                      <DashboardIcon name="graduationCap" size={16} />
                    </span>
                    <div>
                      <h3 className="settings-preview-title">Institutional Record</h3>
                      <p className="settings-preview-subtitle">Official enrolment sync</p>
                    </div>
                  </div>
                  <span className="settings-preview-badge">Official</span>
                </div>
                <p className="settings-security-guide-desc">
                  Student IDs, enrolled program, and year levels are officially managed by the institution.
                </p>
                <div className="settings-security-guide-callout">
                  <strong>Need to request an update?</strong>
                  <p>Contact your AMU coordinator to verify and update official enrolment records.</p>
                </div>
              </div>
            ) : (
              <div className="settings-security-guide-card kasandigan-card">
                <div className="settings-card-head">
                  <div className="kasandigan-card-head-title">
                    <span className="settings-preview-icon-pill">
                      <DashboardIcon name="building" size={16} />
                    </span>
                    <div>
                      <h3 className="settings-preview-title">Account Integrity</h3>
                      <p className="settings-preview-subtitle">Institutional sync</p>
                    </div>
                  </div>
                  <span className="settings-preview-badge">Verified</span>
                </div>
                <p className="settings-security-guide-desc">
                  Your full name and student credentials are verified against AMU enrolment records.
                </p>
                <div className="settings-security-guide-callout">
                  <strong>Need to update official info?</strong>
                  <p>Contact the Academic Mentoring Unit office if your registered details require updates.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {(isDirty || justSaved) && (
          <div
            className={
              "mp-sticky-bar settings-sticky-bar" +
              (isDirty ? " is-dirty" : " is-saved")
            }
            role="status"
            aria-live="polite"
          >
            <div className="mp-sticky-meta">
              <p className="mp-sticky-title">
                {isDirty ? "Unsaved changes" : "Saved"}
              </p>
              <p className="mp-sticky-subtitle">
                {isDirty ? dirtyLabels.join(", ") : "Your settings were updated."}
              </p>
            </div>
            {isDirty && (
              <div className="mp-sticky-actions">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={handleDiscardAll}
                  disabled={savingAll}
                >
                  Discard
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={handleSaveAll}
                  disabled={savingAll}
                >
                  {savingAll ? "Saving..." : "Save changes"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  window.DashboardApp = window.DashboardApp || {};
  window.DashboardApp.Pages = window.DashboardApp.Pages || {};
  window.DashboardApp.Pages.settings = SettingsPage;
})();
