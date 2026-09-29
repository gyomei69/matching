import React, { useContext, useEffect, useState } from "react";

export function AutoApproveToggle({ className = "", compact = false, onStatusChange, addToast: propAddToast }) {
  const AppContext = typeof window !== "undefined" ? window.DashboardApp?.AppContext : null;
  const ctx = AppContext ? useContext(AppContext) || {} : {};
  const addToast = propAddToast || ctx.addToast;

  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Fetch initial setting on mount
  useEffect(() => {
    let isMounted = true;
    async function fetchSetting() {
      try {
        setLoading(true);
        const res = await fetch("/api/coordinator/auto-approve/", {
          method: "GET",
          credentials: "include",
          headers: {
            "Accept": "application/json",
          },
        });
        if (!res.ok) {
          if (res.status === 403) {
            // Not coordinator/staff
            if (isMounted) setLoading(false);
            return;
          }
          throw new Error(`Failed to load setting (HTTP ${res.status})`);
        }
        const data = await res.json();
        if (isMounted) {
          const val = Boolean(data.is_auto_approve_enabled);
          setEnabled(val);
          setError(null);
          if (typeof onStatusChange === "function") {
            onStatusChange(val);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error("AutoApproveToggle: Error fetching setting", err);
          setError(err.message || "Failed to load auto-approve setting");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchSetting();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggle = async (e) => {
    const nextVal = e.target.checked;
    const prevVal = enabled;
    setEnabled(nextVal);
    setSaving(true);
    setError(null);

    const getCookie = typeof window !== "undefined" ? window.DashboardApp?.Utils?.getCookie : null;
    const csrfToken = getCookie ? getCookie("csrftoken") : "";

    try {
      const res = await fetch("/api/coordinator/auto-approve/", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
        },
        body: JSON.stringify({ is_auto_approve_enabled: nextVal }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Update failed (HTTP ${res.status})`);
      }

      const data = await res.json();
      const updatedVal = Boolean(data.is_auto_approve_enabled);
      setEnabled(updatedVal);

      if (typeof onStatusChange === "function") {
        onStatusChange(updatedVal);
      }

      const msg = data.message || `Auto-approval for new matches has been ${updatedVal ? "enabled" : "disabled"}.`;
      if (typeof addToast === "function") {
        addToast(msg, "success");
      }
    } catch (err) {
      console.error("AutoApproveToggle: Error updating setting", err);
      setEnabled(prevVal);
      setError(err.message || "Could not save setting");
      if (typeof addToast === "function") {
        addToast(err.message || "Failed to update auto-approve setting.", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const statusTooltip = enabled
    ? "Enabled: All newly requested mentor-mentee matches will automatically be approved and activated without requiring manual coordinator review."
    : "Disabled: New mentorship pairings require manual coordinator review and approval.";

  if (compact) {
    return (
      <div
        className={`auto-approve-toggle-compact ${className}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "10px",
          background: "var(--card-bg, #ffffff)",
          border: "1px solid var(--border-color, #e2e8f0)",
          borderRadius: "10px",
          padding: "6px 12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
        title={statusTooltip}
      >
        <span
          style={{
            fontSize: "0.82rem",
            fontWeight: 600,
            color: "var(--text-primary, #1e293b)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: enabled ? "#16a34a" : "#94a3b8",
            }}
          />
          Auto-Approve Matches
        </span>
        <label
          className="users-switch"
          style={{
            position: "relative",
            display: "inline-block",
            width: "36px",
            height: "20px",
            margin: 0,
            cursor: saving || loading ? "not-allowed" : "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={enabled}
            disabled={loading || saving}
            onChange={handleToggle}
            aria-label="Enable Auto-Approval for New Matches"
            style={{ opacity: 0, width: 0, height: 0 }}
          />
          <span
            className="users-slider round"
            style={{
              position: "absolute",
              cursor: "pointer",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: enabled ? "#16a34a" : "#cbd5e1",
              borderRadius: "20px",
              transition: "0.2s",
            }}
          >
            <span
              style={{
                position: "absolute",
                height: "14px",
                width: "14px",
                left: enabled ? "19px" : "3px",
                bottom: "3px",
                backgroundColor: "white",
                borderRadius: "50%",
                transition: "0.2s",
                boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
              }}
            />
          </span>
        </label>
        {saving && (
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted, #64748b)" }}>
            …
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`auto-approve-card ${className}`}
      style={{
        background: "var(--card-bg, #ffffff)",
        border: "1px solid var(--border-color, #e2e8f0)",
        borderRadius: "14px",
        padding: "16px 20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        marginBottom: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                backgroundColor: enabled ? "rgba(22, 163, 74, 0.12)" : "rgba(100, 116, 139, 0.12)",
                color: enabled ? "#16a34a" : "#64748b",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7.5" r="4"></circle>
                <polyline points="17 11 19 13 23 9"></polyline>
              </svg>
            </span>
            <span
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--text-primary, #0f172a)",
                letterSpacing: "-0.01em",
              }}
            >
              Enable Auto-Approval for New Matches
            </span>
            <span
              style={{
                display: "inline-block",
                padding: "2px 8px",
                borderRadius: "6px",
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.03em",
                textTransform: "uppercase",
                backgroundColor: enabled ? "rgba(22, 163, 74, 0.15)" : "rgba(100, 116, 139, 0.12)",
                color: enabled ? "#15803d" : "#475569",
              }}
            >
              {enabled ? "ACTIVE" : "MANUAL REVIEW"}
            </span>
          </div>

          <p
            style={{
              margin: 0,
              fontSize: "0.85rem",
              color: "var(--text-secondary, #64748b)",
              lineHeight: 1.5,
            }}
          >
            {enabled
              ? "All newly requested mentor-mentee matches will automatically be approved and activated without requiring manual coordinator review."
              : "When disabled, mentorship pairing requests remain pending until you or another coordinator manually approves them."}
          </p>

          {error && (
            <p style={{ margin: "6px 0 0", fontSize: "0.8rem", color: "#ef4444" }}>
              ⚠️ {error}
            </p>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <label
            className="users-status-toggle"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: saving || loading ? "not-allowed" : "pointer",
              userSelect: "none",
            }}
          >
            <span
              className="users-switch"
              style={{
                position: "relative",
                display: "inline-block",
                width: "48px",
                height: "26px",
              }}
            >
              <input
                type="checkbox"
                checked={enabled}
                disabled={loading || saving}
                onChange={handleToggle}
                aria-label="Enable Auto-Approval for New Matches"
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span
                className="users-slider round"
                style={{
                  position: "absolute",
                  cursor: "pointer",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: enabled ? "#16a34a" : "#cbd5e1",
                  borderRadius: "26px",
                  transition: "0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: enabled
                    ? "0 2px 6px rgba(22, 163, 74, 0.35)"
                    : "inset 0 1px 2px rgba(0,0,0,0.1)",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    height: "20px",
                    width: "20px",
                    left: enabled ? "25px" : "3px",
                    bottom: "3px",
                    backgroundColor: "white",
                    borderRadius: "50%",
                    transition: "0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
                  }}
                />
              </span>
            </span>
            <span
              className="users-status-toggle-label"
              style={{
                fontSize: "0.86rem",
                fontWeight: 600,
                color: enabled ? "#16a34a" : "var(--text-secondary, #64748b)",
              }}
            >
              {saving ? "Saving…" : enabled ? "Auto-Approve ON" : "Auto-Approve OFF"}
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

if (typeof window !== "undefined") {
  window.DashboardApp = window.DashboardApp || {};
  window.DashboardApp.AutoApproveToggle = AutoApproveToggle;
}

export default AutoApproveToggle;
