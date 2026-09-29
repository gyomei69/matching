(function () {
  "use strict";
  const React = window.React;
  const { useContext, useEffect, useMemo, useRef, useState } = React;
  const AppContext = window.DashboardApp.AppContext;
  const Utils = window.DashboardApp.Utils || {};
  const { LoadingSpinner, MentorRoleBadge } = Utils;

  function getInitials(name, fallback) {
    const source = (name || fallback || "").trim();
    if (!source) return "U";
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  function shortenFileName(fileName, maxLen = 42) {
    const text = String(fileName || "");
    if (!text) return "Verification document";
    if (text.length <= maxLen) return text;
    const extIndex = text.lastIndexOf(".");
    if (extIndex <= 0) return text.slice(0, maxLen - 1) + "…";
    const ext = text.slice(extIndex);
    const keep = Math.max(12, maxLen - ext.length - 1);
    return text.slice(0, keep) + "…" + ext;
  }

  function isImageFile(href, fileName) {
    const target = String(fileName || href || "").toLowerCase();
    return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/.test(target);
  }

  function normalizeCloudinaryPdfUrl(href) {
    return String(href || "").trim();
  }

  function getFileTypeLabel(href, fileName) {
    const target = String(fileName || href || "").toLowerCase();
    if (/\.pdf(\?|$)/.test(target)) return "PDF";
    if (/\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/.test(target)) return "Image";
    return "File";
  }

  function buildViewerSrc(href, page, zoom) {
    const clean = String(href || "").trim();
    if (!clean) return "";
    const base = clean.split("#")[0];
    return `${base}#page=${page}&zoom=${zoom}`;
  }

  function StatusBadge({ complete }) {
    if (complete) {
      return (
        <span className="approval-badge approval-badge-complete">
          <span className="approval-badge-dot dot-complete" /> Complete
        </span>
      );
    }
    return (
      <span className="approval-badge approval-badge-incomplete">
        <span className="approval-badge-dot dot-incomplete" /> Incomplete
      </span>
    );
  }

  function DocumentPreviewCard({ href, text, onView }) {
    if (!href) return null;
    const normalizedHref = normalizeCloudinaryPdfUrl(href);
    const image = isImageFile(normalizedHref, text);
    return (
      <div className="approval-document">
        <div
          className="approval-document-preview"
          role="img"
          aria-label="Verification document preview"
        >
          {image ? (
            <img
              src={normalizedHref}
              alt={text || "Verification document"}
              className="approval-document-thumb"
            />
          ) : (
            <svg
              className="approval-document-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
              <path d="M14 2v5h5" />
              <path d="M9 13h6" />
              <path d="M9 17h6" />
            </svg>
          )}
        </div>
        <div className="approval-document-meta">
          <p
            className="approval-document-name"
            title={text || "Verification document"}
          >
            {shortenFileName(text || "Verification document")}
          </p>
          <div className="approval-document-actions">
            <button
              type="button"
              className="btn small secondary"
              onClick={onView}
            >
              View
            </button>
            <a
              href={normalizedHref}
              target="_blank"
              rel="noreferrer"
              className="btn small"
            >
              Download
            </a>
          </div>
        </div>
      </div>
    );
  }

  const VERIFICATION_DOC_GROUPS = [
    ["letter_of_intent", "Letter of intent"],
    ["study_load", "Study load"],
    ["grade", "Grade"],
    ["application", "Application form"],
  ];

  function VerificationDocumentsBlock({ profile, onPreview }) {
    const grouped = profile?.verification_documents_by_kind || {};
    const groups = VERIFICATION_DOC_GROUPS.map(([kind, label]) => ({
      kind,
      label,
      docs: grouped[kind] || [],
    })).filter((group) => group.docs.length);
    if (groups.length) {
      return groups.map((group) => (
        <div key={group.kind} className="approval-secondary-doc">
          <p className="approval-subtle-label">{group.label}</p>
          <div className="approval-document-list">
            {group.docs.map((doc, index) => (
              <DocumentPreviewCard
                key={doc.id || `${group.kind}-${index}`}
                href={doc.url}
                text={doc.name || group.label}
                onView={() => onPreview(doc.url, doc.name, 1)}
              />
            ))}
          </div>
        </div>
      ));
    }
    if (!profile?.verification_document_url) return null;
    return (
      <div className="approval-secondary-doc">
        <p className="approval-subtle-label">Verification document</p>
        <DocumentPreviewCard
          href={profile.verification_document_url}
          text={profile.verification_document_name || "Verification document"}
          onView={() =>
            onPreview(
              profile.verification_document_url,
              profile.verification_document_name,
              profile.verification_document_pages ||
                profile.verification_page_count ||
                profile.total_pages ||
                1,
            )
          }
        />
      </div>
    );
  }

  function DetailChip({ label, value, fullWidth = false }) {
    if (value == null || value === "") return null;
    const isArray = Array.isArray(value);
    return (
      <div className={`approval-detail-chip ${fullWidth ? "approval-detail-chip--full" : ""}`}>
        <span className="approval-detail-chip-label">{label}</span>
        {isArray ? (
          <div className="approval-detail-tags">
            {value.map((item, idx) => (
              <span key={idx} className="approval-detail-subtag">{String(item)}</span>
            ))}
          </div>
        ) : (
          <span className="approval-detail-chip-value">{String(value)}</span>
        )}
      </div>
    );
  }

  function ApprovalsUserRow({
    item,
    type,
    loading,
    onApprove,
    onRejectAsk,
    onPreview,
    onViewDetails,
    Spinner,
  }) {
    const [expanded, setExpanded] = useState(false);
    const m = item;
    const fullName = [m.first_name, m.last_name]
      .map((part) => String(part || "").trim())
      .filter(Boolean)
      .join(" ");
    const displayName =
      fullName ||
      m.full_name ||
      m.display_name ||
      m.username ||
      m.email ||
      "Unknown user";
    const initials = getInitials(displayName, m.email || m.username);
    const yearLabel =
      type === "mentor" &&
      m.role === "Senior IT Student" &&
      m.year_level
        ? Number(m.year_level) === 3
          ? "3rd year"
          : Number(m.year_level) === 4
            ? "4th year"
            : `Year ${m.year_level}`
        : "";
    const summary =
      type === "mentor"
        ? [m.program, yearLabel].filter(Boolean).join(" • ")
        : [m.campus, m.admission_type].filter(Boolean).join(" • ");

    return (
      <article className={"approval-row kasandigan-card " + (expanded ? "is-expanded" : "")}>
        <div className="approval-card-main">
          {/* Top Row: Identity on Left, Status & Details on Right */}
          <div className="approval-card-header">
            <div
              className="approval-card-identity"
              role="button"
              tabIndex={0}
              title="Click to view all applicant details"
              onClick={() => onViewDetails && onViewDetails(item, type)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onViewDetails && onViewDetails(item, type);
                }
              }}
            >
              <div
                className={`approval-avatar ${type === "mentor" ? "approval-avatar--mentor" : "approval-avatar--mentee"}`}
                aria-hidden="true"
              >
                {initials}
              </div>
              <div className="approval-card-info">
                <h3 className="approval-row-name" title={displayName}>
                  {displayName}
                </h3>
                <p className="approval-row-email" title={m.email || "No email"}>
                  {m.email || "No email"}
                </p>
              </div>
            </div>

            <div className="approval-card-top-actions">
              <StatusBadge complete={!!m.general_info_complete} />
              <button
                type="button"
                className="btn small primary approval-view-details-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails && onViewDetails(item, type);
                }}
              >
                View Details
              </button>
              <button
                type="button"
                className="btn secondary small approval-expand-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded((v) => !v);
                }}
              >
                {expanded ? "Hide" : "Quick View"}
              </button>
            </div>
          </div>

          {/* Middle Row: Badges / Summary Chips */}
          <div className="approval-card-meta">
            {type === "mentor" && (
              m.role && MentorRoleBadge ? (
                <MentorRoleBadge role={m.role} prominent />
              ) : (
                <span className="approval-badge approval-badge-incomplete approval-mentor-type-missing">
                  Mentor type not set
                </span>
              )
            )}
            {type === "mentee" && MentorRoleBadge && (
              <MentorRoleBadge role="mentee" prominent />
            )}
            {summary && summary !== "—" && (
              <span className="approval-meta-pill">
                {summary}
              </span>
            )}
          </div>

          {/* Bottom Row: Decision action bar */}
          <div className="approval-card-footer">
            <span className="approval-card-hint">
              {expanded ? "Reviewing verification details" : "Coordinator decision required"}
            </span>
            <div className="approval-card-decision-btns">
              {loading ? (
                <Spinner inline />
              ) : (
                <>
                  <button
                    type="button"
                    className="btn small approval-accept-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onApprove(m.id);
                    }}
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Accept</span>
                  </button>
                  <button
                    type="button"
                    className="btn secondary small approval-reject-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRejectAsk(type, m.id, displayName);
                    }}
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    <span>Reject</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {expanded && (
          <div
            className={`approval-row-secondary ${!((m?.verification_documents && m.verification_documents.length) || m?.verification_document_url) ? "approval-row-secondary--no-docs" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <VerificationDocumentsBlock profile={m} onPreview={onPreview} />

            <div className="approval-secondary-details">
              <p className="approval-subtle-label">User details</p>
              <div className="approval-detail-chip-grid">
                {type === "mentor" && (
                  <DetailChip label="Role" value={m.role} />
                )}
                {type === "mentor" &&
                  m.role === "Senior IT Student" &&
                  m.year_level ? (
                  <DetailChip
                    label="Year"
                    value={
                      Number(m.year_level) === 3
                        ? "3rd year"
                        : Number(m.year_level) === 4
                          ? "4th year"
                          : `Year ${m.year_level}`
                    }
                  />
                ) : null}
                {type === "mentor" && (
                  <DetailChip label="Expertise" value={m.expertise_level ? `Level ${m.expertise_level} / 5` : null} />
                )}
                {type === "mentee" && (
                  <DetailChip label="Campus" value={m.campus} />
                )}
                {type === "mentee" && (
                  <DetailChip label="Student ID" value={m.student_id_no} />
                )}
                {type === "mentee" && (
                  <DetailChip label="Contact" value={m.contact_no} />
                )}
                {type === "mentee" && (
                  <DetailChip label="Admission" value={m.admission_type} />
                )}
                <DetailChip
                  label="Subjects"
                  value={m.subjects?.length ? m.subjects : null}
                  fullWidth
                />
                <DetailChip
                  label="Competencies"
                  value={m.topics?.length ? m.topics : null}
                  fullWidth
                />
                <DetailChip label="Interests" value={m.interests} fullWidth />
              </div>
            </div>
          </div>
        )}
      </article>
    );
  }

  function ViewerToolbar({
    zoom,
    onZoomOut,
    onZoomIn,
    page,
    totalPages,
    onPrev,
    onNext,
    canPrev,
    canNext,
    onToggleSidebar,
    sidebarOpen,
    sidebarEnabled,
    onFullscreen,
    onDownload,
    onOpenNewTab,
  }) {
    const showPageControls = totalPages > 1;
    return (
      <div
        className="file-viewer-toolbar"
        role="toolbar"
        aria-label="Document controls"
      >
        <div className="file-viewer-toolbar-group">
          <button
            type="button"
            className="file-icon-btn"
            onClick={onToggleSidebar}
            aria-label={sidebarOpen ? "Hide page sidebar" : "Show page sidebar"}
            disabled={!sidebarEnabled}
          >
            <span aria-hidden="true">☰</span>
          </button>
          <button
            type="button"
            className="file-icon-btn"
            onClick={onZoomOut}
            aria-label="Zoom out"
          >
            <span aria-hidden="true">−</span>
          </button>
          <div className="file-zoom-indicator" aria-live="polite">
            {zoom}%
          </div>
          <button
            type="button"
            className="file-icon-btn"
            onClick={onZoomIn}
            aria-label="Zoom in"
          >
            <span aria-hidden="true">+</span>
          </button>
        </div>

        {showPageControls ? (
          <div className="file-viewer-toolbar-group">
            <button
              type="button"
              className="file-icon-btn"
              onClick={onPrev}
              disabled={!canPrev}
              aria-label="Previous page"
            >
              <span aria-hidden="true">←</span>
            </button>
            <div className="file-page-indicator" aria-live="polite">
              Page {page} of {totalPages}
            </div>
            <button
              type="button"
              className="file-icon-btn"
              onClick={onNext}
              disabled={!canNext}
              aria-label="Next page"
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>
        ) : (
          <div className="file-viewer-toolbar-group">
            <div className="file-page-indicator file-page-indicator-muted">
              Single page document
            </div>
          </div>
        )}

        <div className="file-viewer-toolbar-group">
          <button
            type="button"
            className="file-icon-btn"
            onClick={onFullscreen}
            aria-label="Toggle fullscreen"
          >
            <span aria-hidden="true">⛶</span>
          </button>
          <button
            type="button"
            className="file-icon-btn"
            onClick={onDownload}
            aria-label="Download document"
          >
            <span aria-hidden="true">↓</span>
          </button>
          <button
            type="button"
            className="file-icon-btn"
            onClick={onOpenNewTab}
            aria-label="Open in new tab"
          >
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      </div>
    );
  }

  function ThumbnailSidebar({ open, page, totalPages, onJump }) {
    if (totalPages <= 1) return null;
    const pages = Array.from({ length: totalPages }, (_, idx) => idx + 1);
    return (
      <aside
        className={`file-thumb-sidebar ${open ? "" : "collapsed"}`}
        aria-label="Page thumbnails"
        aria-hidden={!open}
      >
        <div className="file-thumb-sidebar-head">Pages</div>
        <div className="file-thumb-list">
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              className={`file-thumb-item ${p === page ? "active" : ""}`}
              onClick={() => onJump(p)}
              aria-label={`Go to page ${p}`}
            >
              <span className="file-thumb-preview">{p}</span>
              <span className="file-thumb-label">Page {p}</span>
            </button>
          ))}
        </div>
      </aside>
    );
  }

  function FileViewerModal({ open, data, onClose }) {
    const modalRef = useRef(null);
    const [zoom, setZoom] = useState(100);
    const [page, setPage] = useState(1);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const normalizedHref = useMemo(
      () => normalizeCloudinaryPdfUrl(data?.href),
      [data],
    );
    const image = useMemo(
      () => isImageFile(normalizedHref, data?.name),
      [normalizedHref, data],
    );
    const fileType = useMemo(
      () => getFileTypeLabel(normalizedHref, data?.name),
      [normalizedHref, data],
    );
    const totalPages = useMemo(() => {
      const fromData = Number(
        data?.pageCount ||
          data?.page_count ||
          data?.totalPages ||
          data?.total_pages ||
          1,
      );
      const safe =
        Number.isFinite(fromData) && fromData > 0 ? Math.floor(fromData) : 1;
      return image ? 1 : safe;
    }, [data, image]);
    const sidebarEnabled = !image && totalPages > 1;
    const sidebarVisible = sidebarEnabled && sidebarOpen;
    const viewerSrc = useMemo(
      () =>
        image ? normalizedHref : buildViewerSrc(normalizedHref, page, zoom),
      [image, normalizedHref, page, zoom],
    );

    useEffect(() => {
      if (!open) return;
      setZoom(100);
      setPage(1);
      setSidebarOpen(totalPages > 1);
      setIsLoading(true);
      setHasError(false);
    }, [open, normalizedHref, totalPages]);

    useEffect(() => {
      if (page > totalPages) {
        setPage(totalPages);
      }
    }, [page, totalPages]);

    useEffect(() => {
      if (!open) return;
      function onKeydown(e) {
        if (e.key === "Escape") {
          e.preventDefault();
          onClose();
          return;
        }
        if (e.key === "ArrowRight") {
          if (totalPages <= 1) return;
          e.preventDefault();
          setPage((prev) => Math.min(totalPages, prev + 1));
          return;
        }
        if (e.key === "ArrowLeft") {
          if (totalPages <= 1) return;
          e.preventDefault();
          setPage((prev) => Math.max(1, prev - 1));
        }
      }
      window.addEventListener("keydown", onKeydown);
      return () => window.removeEventListener("keydown", onKeydown);
    }, [open, onClose, totalPages]);

    if (!open || !data || !normalizedHref) return null;

    function toggleFullscreen() {
      const el = modalRef.current;
      if (!el) return;
      if (document.fullscreenElement) {
        document.exitFullscreen?.();
        return;
      }
      el.requestFullscreen?.();
    }

    function handleDownload() {
      window.open(normalizedHref, "_blank", "noopener,noreferrer");
    }

    return (
      <div
        className="file-viewer-overlay"
        onClick={onClose}
        role="presentation"
      >
        <div
          className="file-viewer-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Document viewer"
          onClick={(e) => e.stopPropagation()}
          ref={modalRef}
        >
          <header className="file-viewer-header">
            <div className="file-viewer-meta">
              <h3 className="file-viewer-title" title={data.name || "Document"}>
                {shortenFileName(data.name || "Document", 90)}
              </h3>
              <span className="file-type-badge">{fileType}</span>
              <span className="file-size-meta">Size unavailable</span>
            </div>
            <button
              type="button"
              className="file-close-btn"
              onClick={onClose}
              aria-label="Close viewer"
            >
              ×
            </button>
          </header>

          <div className="file-viewer-stage">
            <ThumbnailSidebar
              open={sidebarVisible}
              page={page}
              totalPages={totalPages}
              onJump={setPage}
            />

            <section className="file-viewer-main">
              <ViewerToolbar
                zoom={zoom}
                onZoomOut={() => setZoom((z) => Math.max(50, z - 10))}
                onZoomIn={() => setZoom((z) => Math.min(250, z + 10))}
                page={page}
                totalPages={totalPages}
                onPrev={() => setPage((p) => Math.max(1, p - 1))}
                onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
                canPrev={page > 1}
                canNext={page < totalPages}
                onToggleSidebar={() => setSidebarOpen((v) => !v)}
                sidebarOpen={sidebarOpen}
                sidebarEnabled={sidebarEnabled}
                onFullscreen={toggleFullscreen}
                onDownload={handleDownload}
                onOpenNewTab={() =>
                  window.open(normalizedHref, "_blank", "noopener,noreferrer")
                }
              />

              <div className="file-viewer-canvas">
                {isLoading && (
                  <div
                    className="file-loading-skeleton"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="file-loading-shimmer" />
                    <span>Loading document...</span>
                  </div>
                )}

                {hasError && (
                  <div className="file-error-state" role="alert">
                    <p>Could not preview this file in the modal.</p>
                    <a
                      href={normalizedHref}
                      target="_blank"
                      rel="noreferrer"
                      className="btn small"
                    >
                      Open in new tab
                    </a>
                  </div>
                )}

                {!hasError && image && (
                  <div className="file-image-stage">
                    <img
                      src={normalizedHref}
                      alt={data.name || "Document preview"}
                      className="file-viewer-image"
                      style={{ transform: `scale(${zoom / 100})` }}
                      onLoad={() => setIsLoading(false)}
                      onError={() => {
                        setHasError(true);
                        setIsLoading(false);
                      }}
                    />
                  </div>
                )}

                {!hasError && !image && (
                  <iframe
                    title={data.name || "Document preview"}
                    src={viewerSrc}
                    className="file-viewer-iframe"
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                      setHasError(true);
                      setIsLoading(false);
                    }}
                  />
                )}
              </div>
            </section>
          </div>

          <footer className="file-viewer-footer">
            <a
              href={normalizedHref}
              target="_blank"
              rel="noreferrer"
              className="btn secondary"
            >
              Open in New Tab
            </a>
            <a
              href={normalizedHref}
              target="_blank"
              rel="noreferrer"
              className="btn"
            >
              Download
            </a>
          </footer>
        </div>
      </div>
    );
  }

  function extractUserDocuments(user) {
    if (!user) return [];
    const docs = [];
    const seenUrls = new Set();

    function addDoc(doc) {
      if (!doc || !doc.url || seenUrls.has(doc.url)) return;
      seenUrls.add(doc.url);
      const isImage = isImageFile(doc.url, doc.name || doc.label);
      docs.push({
        id: doc.id || doc.url,
        kind: doc.kind || "document",
        label: doc.label || (doc.kind ? String(doc.kind).replace(/_/g, " ") : "Verification Document"),
        name: doc.name || doc.file_name || doc.label || "Uploaded Document",
        url: doc.url,
        is_image: isImage,
      });
    }

    if (Array.isArray(user.documents)) {
      user.documents.forEach(addDoc);
    }
    if (user.proof_of_enrollment_url) {
      addDoc({
        id: "proof_of_enrollment",
        kind: "proof_of_enrollment",
        label: "Proof of Enrollment",
        name: "Proof of Enrollment",
        url: user.proof_of_enrollment_url,
      });
    }
    if (user.id_card_url) {
      addDoc({
        id: "id_card",
        kind: "id_card",
        label: "ID Card / Student ID",
        name: "ID Card",
        url: user.id_card_url,
      });
    }
    if (Array.isArray(user.verification_documents)) {
      user.verification_documents.forEach((d) => {
        addDoc({
          id: d.id,
          kind: d.kind,
          label: d.kind ? String(d.kind).replace(/_/g, " ") : "Verification Document",
          name: d.name || d.file_name,
          url: d.url || d.file_url,
        });
      });
    }
    if (user.verification_documents_by_kind) {
      Object.entries(user.verification_documents_by_kind).forEach(([kind, arr]) => {
        if (Array.isArray(arr)) {
          arr.forEach((d) => {
            addDoc({
              id: d.id,
              kind: kind,
              label: String(kind).replace(/_/g, " "),
              name: d.name,
              url: d.url,
            });
          });
        }
      });
    }
    if (user.verification_document_url) {
      addDoc({
        id: "verification_document",
        kind: "verification",
        label: "Verification Document",
        name: user.verification_document_name || "Verification Document",
        url: user.verification_document_url,
      });
    }

    return docs;
  }

  function UserApprovalDetailModal({
    open,
    data,
    loading,
    onClose,
    onApprove,
    onReject,
    onPreview,
  }) {
    if (!open || !data || !data.item) return null;
    const { item, type } = data;

    const fullName = [item.first_name, item.last_name]
      .map((part) => String(part || "").trim())
      .filter(Boolean)
      .join(" ");
    const displayName =
      fullName ||
      item.full_name ||
      item.display_name ||
      item.username ||
      item.email ||
      "Applicant";

    const initials = getInitials(displayName, item.email || item.username);
    const roleLabel = type === "mentor" ? (item.role || "Mentor") : "Mentee";
    const docs = extractUserDocuments(item);

    return (
      <div
        className="approval-modal-backdrop"
        onClick={onClose}
        role="presentation"
      >
        <div
          className="approval-detail-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="approval-modal-user-name"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="approval-detail-modal-header">
            <div className="approval-modal-header-user">
              <div className="approval-avatar approval-modal-avatar" aria-hidden="true">
                {initials}
              </div>
              <div>
                <div className="approval-modal-title-row">
                  <h2 id="approval-modal-user-name" className="approval-modal-user-name">
                    {displayName}
                  </h2>
                  <span className="approval-modal-role-badge">
                    {roleLabel}
                  </span>
                  <StatusBadge complete={!!item.general_info_complete} />
                </div>
                <p className="approval-modal-user-email">{item.email || "No email provided"}</p>
              </div>
            </div>
            <button
              type="button"
              className="file-close-btn"
              onClick={onClose}
              aria-label="Close details modal"
            >
              ×
            </button>
          </header>

          <div className="approval-detail-modal-body">
            {/* Section 1: Personal & Academic Info */}
            <section className="approval-modal-section">
              <h3 className="approval-modal-section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Personal &amp; Academic Info
              </h3>
              <div className="approval-info-grid">
                <div className="approval-info-item">
                  <span className="approval-info-label">Full Name</span>
                  <span className="approval-info-value">{displayName}</span>
                </div>
                <div className="approval-info-item">
                  <span className="approval-info-label">Email Address</span>
                  <span className="approval-info-value">{item.email || "—"}</span>
                </div>
                <div className="approval-info-item">
                  <span className="approval-info-label">Student / Employee ID</span>
                  <span className="approval-info-value">{item.student_id_no || item.id_number || "—"}</span>
                </div>
                <div className="approval-info-item">
                  <span className="approval-info-label">Department</span>
                  <span className="approval-info-value">{item.department || "—"}</span>
                </div>
                <div className="approval-info-item">
                  <span className="approval-info-label">Program / Course</span>
                  <span className="approval-info-value">{item.program || item.course || "—"}</span>
                </div>
                <div className="approval-info-item">
                  <span className="approval-info-label">Year Level</span>
                  <span className="approval-info-value">
                    {item.year_level
                      ? (Number(item.year_level) === 3
                          ? "3rd Year"
                          : Number(item.year_level) === 4
                            ? "4th Year"
                            : `Year ${item.year_level}`)
                      : "—"}
                  </span>
                </div>
                <div className="approval-info-item">
                  <span className="approval-info-label">Campus</span>
                  <span className="approval-info-value">{item.campus || "—"}</span>
                </div>
                <div className="approval-info-item">
                  <span className="approval-info-label">Admission Type</span>
                  <span className="approval-info-value">{item.admission_type || "—"}</span>
                </div>
                <div className="approval-info-item">
                  <span className="approval-info-label">Contact Number</span>
                  <span className="approval-info-value">{item.contact_no || "—"}</span>
                </div>
                <div className="approval-info-item">
                  <span className="approval-info-label">Biological Sex</span>
                  <span className="approval-info-value">{item.sex || item.biological_sex || "—"}</span>
                </div>
              </div>
            </section>

            {/* Section 2: Preferences & Role Details */}
            <section className="approval-modal-section">
              <h3 className="approval-modal-section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m4.93 4.93 4.24 4.24" />
                  <path d="m14.83 9.17 4.24-4.24" />
                  <path d="m14.83 14.83 4.24 4.24" />
                  <path d="m9.17 14.83-4.24 4.24" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
                Preferences &amp; Role Details
              </h3>
              <div className="approval-info-grid">
                <div className="approval-info-item">
                  <span className="approval-info-label">Applied Role</span>
                  <span className="approval-info-value">{roleLabel}</span>
                </div>
                {type === "mentor" && item.expertise_level ? (
                  <div className="approval-info-item">
                    <span className="approval-info-label">Expertise Level</span>
                    <span className="approval-info-value">Level {item.expertise_level} of 5</span>
                  </div>
                ) : null}
                <div className="approval-info-item approval-info-item--full">
                  <span className="approval-info-label">Selected Subject Preferences</span>
                  <div className="approval-tags-wrap">
                    {item.subjects && (Array.isArray(item.subjects) ? item.subjects.length > 0 : Boolean(item.subjects)) ? (
                      (Array.isArray(item.subjects) ? item.subjects : [item.subjects]).map((subj, idx) => (
                        <span key={idx} className="approval-tag approval-tag--subject">
                          {String(subj)}
                        </span>
                      ))
                    ) : (
                      <span className="muted" style={{ fontSize: "12px" }}>No subject preferences recorded.</span>
                    )}
                  </div>
                </div>
                {(item.topics?.length > 0 || item.skills?.length > 0) && (
                  <div className="approval-info-item approval-info-item--full">
                    <span className="approval-info-label">Competencies &amp; Skills</span>
                    <div className="approval-tags-wrap">
                      {(item.topics || item.skills || []).map((top, idx) => (
                        <span key={idx} className="approval-tag approval-tag--topic">
                          {String(top)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {item.interests && (
                  <div className="approval-info-item approval-info-item--full">
                    <span className="approval-info-label">Interests &amp; Background</span>
                    <span className="approval-info-value">{item.interests}</span>
                  </div>
                )}
              </div>
            </section>

            {/* Section 3: Uploaded Documents */}
            <section className="approval-modal-section">
              <h3 className="approval-modal-section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
                Uploaded Documents ({docs.length})
              </h3>
              {docs.length === 0 ? (
                <div className="approval-docs-empty">
                  No verification documents or certificates uploaded by this applicant.
                </div>
              ) : (
                <div className="approval-doc-grid">
                  {docs.map((doc, idx) => (
                    <div key={doc.id || idx} className="approval-doc-card">
                      <div
                        className="approval-doc-thumb-container"
                        role="button"
                        tabIndex={0}
                        title="Click to preview document"
                        onClick={() => onPreview && onPreview(doc.url, doc.name || doc.label, 1)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onPreview && onPreview(doc.url, doc.name || doc.label, 1);
                          }
                        }}
                      >
                        {doc.is_image ? (
                          <img
                            src={doc.url}
                            alt={doc.name || doc.label}
                            className="approval-doc-thumb-img"
                          />
                        ) : (
                          <div className="approval-doc-thumb-fallback">
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
                              <path d="M14 2v5h5" />
                              <path d="M9 13h6" />
                              <path d="M9 17h6" />
                            </svg>
                            <span style={{ fontSize: "11px", fontWeight: 700 }}>DOCUMENT / PDF</span>
                          </div>
                        )}
                      </div>
                      <div className="approval-doc-card-body">
                        <span className="approval-doc-kind-badge">{doc.label}</span>
                        <p className="approval-doc-name" title={doc.name}>
                          {shortenFileName(doc.name, 34)}
                        </p>
                        <div className="approval-doc-card-actions">
                          <button
                            type="button"
                            className="btn small secondary"
                            onClick={() => onPreview && onPreview(doc.url, doc.name || doc.label, 1)}
                          >
                            Preview
                          </button>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn small"
                            title="Open document securely in new tab"
                          >
                            View / Download
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <footer className="approval-modal-footer">
            <button
              type="button"
              className="btn secondary"
              onClick={onClose}
            >
              Close
            </button>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                type="button"
                className="btn approval-reject-btn"
                onClick={() => onReject(type, item.id, displayName)}
                disabled={loading}
              >
                Reject Applicant
              </button>
              <button
                type="button"
                className="btn approval-accept-btn"
                onClick={() => onApprove(item.id)}
                disabled={loading}
              >
                Approve Applicant
              </button>
            </div>
          </footer>
        </div>
      </div>
    );
  }

  function RejectConfirmModal({ open, target, loading, onConfirm, onCancel }) {
    if (!open || !target) return null;
    return (
      <div
        className="approval-modal-backdrop"
        onClick={onCancel}
        role="presentation"
      >
        <div
          className="approval-modal approval-confirm-modal"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="approval-modal-header">
            <h3 className="approval-modal-title">Confirm rejection</h3>
          </div>
          <p className="approval-confirm-copy">
            Reject <strong>{target.name}</strong>? This action will remove the
            account from pending approvals.
          </p>
          <div className="approval-confirm-actions">
            {loading ? (
              <LoadingSpinner inline />
            ) : (
              <>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={onCancel}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn approval-reject-btn"
                  onClick={onConfirm}
                >
                  Reject user
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  function ApprovalsPage() {
    const ctx = useContext(AppContext);
    if (!ctx || !ctx.user) return null;
    const {
      user,
      approvalsLoading,
      approvalActionKey,
      pendingMentors,
      pendingMentees,
      handleApproveMentor,
      handleRejectMentor,
      handleApproveMentee,
      handleRejectMentee,
    } = ctx;
    const Spinner = LoadingSpinner;
    const [previewData, setPreviewData] = useState(null);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [selectedDetailUser, setSelectedDetailUser] = useState(null);

    // Auto-Verify New Users State
    const [isAutoVerifyEnabled, setIsAutoVerifyEnabled] = useState(false);
    const [autoVerifyLoading, setAutoVerifyLoading] = useState(true);
    const [autoVerifySaving, setAutoVerifySaving] = useState(false);

    useEffect(() => {
      let isMounted = true;
      async function fetchAutoVerifySetting() {
        try {
          setAutoVerifyLoading(true);
          const res = await fetch("/api/coordinator/auto-verify/", {
            method: "GET",
            credentials: "include",
            headers: {
              "Accept": "application/json",
            },
          });
          if (res.ok) {
            const data = await res.json();
            if (isMounted) {
              setIsAutoVerifyEnabled(Boolean(data.is_auto_verify_enabled));
            }
          }
        } catch (err) {
          console.error("ApprovalsPage: Failed to load auto-verify setting", err);
        } finally {
          if (isMounted) setAutoVerifyLoading(false);
        }
      }
      fetchAutoVerifySetting();
      return () => {
        isMounted = false;
      };
    }, []);

    const handleAutoVerifyToggle = async (e) => {
      const nextVal = e.target.checked;
      const prevVal = isAutoVerifyEnabled;
      setIsAutoVerifyEnabled(nextVal);
      setAutoVerifySaving(true);

      const getCookie = Utils?.getCookie || (typeof window !== "undefined" ? window.DashboardApp?.Utils?.getCookie : null);
      const csrfToken = getCookie ? getCookie("csrftoken") : "";

      try {
        const res = await fetch("/api/coordinator/auto-verify/", {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
          },
          body: JSON.stringify({ is_auto_verify_enabled: nextVal }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Update failed (HTTP ${res.status})`);
        }

        const data = await res.json();
        const updatedVal = Boolean(data.is_auto_verify_enabled);
        setIsAutoVerifyEnabled(updatedVal);

        const msg = data.message || `Auto-verification for new users has been ${updatedVal ? "enabled" : "disabled"}.`;
        if (typeof ctx.addToast === "function") {
          ctx.addToast(msg, "success");
        }
      } catch (err) {
        console.error("ApprovalsPage: Error updating auto-verify setting", err);
        setIsAutoVerifyEnabled(prevVal);
        if (typeof ctx.addToast === "function") {
          ctx.addToast(err.message || "Failed to update auto-verify setting.", "error");
        }
      } finally {
        setAutoVerifySaving(false);
      }
    };

    const mentorCardLoading = (id) => approvalActionKey === "mentor:" + id;
    const menteeCardLoading = (id) => approvalActionKey === "mentee:" + id;
    if (!user.is_staff)
      return (
        <div className="card">
          <div className="staff-only-msg">This page is for staff only.</div>
        </div>
      );

    function openPreview(href, name, pageCount) {
      if (!href) return;
      const normalizedHref = normalizeCloudinaryPdfUrl(href);
      setPreviewData({ href: normalizedHref, name, pageCount });
    }

    function askReject(type, id, name) {
      setRejectTarget({ type, id, name: name || "this user" });
    }

    function confirmReject() {
      if (!rejectTarget) return;
      if (rejectTarget.type === "mentor") {
        handleRejectMentor(rejectTarget.id);
      } else {
        handleRejectMentee(rejectTarget.id);
      }
      setRejectTarget(null);
    }

    const rejectLoading = rejectTarget
      ? approvalActionKey === `${rejectTarget.type}:${rejectTarget.id}`
      : false;

    const totalPending =
      (pendingMentors?.length || 0) + (pendingMentees?.length || 0);

    return (
      <div className="approvals-page-space page-shell">
        {/* Kasandigan Open Native Header — Zero box container */}
        <header className="kasandigan-header">
          <div className="kasandigan-header-content">
            <div className="kasandigan-badge">
              <span className="kasandigan-badge-dot" />
              <span>Academic Mentoring Unit • Operations Console</span>
            </div>
            <h1 className="kasandigan-title">User Approvals</h1>
            <p className="kasandigan-subtitle">
              Review verification documents and approve pending mentors and mentees.
            </p>
          </div>
          <div className="kasandigan-header-actions" style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {/* Auto-Verify New Users Switch adjacent to Pending Decisions */}
            <div
              className="auto-verify-header-toggle"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                background: "var(--card-bg, #ffffff)",
                border: "1px solid var(--border-color, #e2e8f0)",
                borderRadius: "12px",
                padding: "6px 14px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
              title={
                isAutoVerifyEnabled
                  ? "Auto-Verify Active: Newly registered mentors and mentees are automatically approved and verified upon registration."
                  : "Auto-Verify Off: Newly registered mentors and mentees require manual coordinator review and approval."
              }
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "22px",
                  height: "22px",
                  borderRadius: "6px",
                  backgroundColor: isAutoVerifyEnabled ? "rgba(22, 163, 74, 0.15)" : "rgba(100, 116, 139, 0.12)",
                  color: isAutoVerifyEnabled ? "#16a34a" : "#64748b",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </span>
              <span
                style={{
                  fontSize: "0.84rem",
                  fontWeight: 600,
                  color: "var(--text-primary, #0f172a)",
                  letterSpacing: "-0.01em",
                }}
              >
                Auto-Verify New Users
              </span>
              <label
                className="users-switch"
                style={{
                  position: "relative",
                  display: "inline-block",
                  width: "38px",
                  height: "22px",
                  margin: 0,
                  cursor: autoVerifyLoading || autoVerifySaving ? "not-allowed" : "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={isAutoVerifyEnabled}
                  disabled={autoVerifyLoading || autoVerifySaving}
                  onChange={handleAutoVerifyToggle}
                  aria-label="Auto-Verify New Users"
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
                    backgroundColor: isAutoVerifyEnabled ? "#16a34a" : "#cbd5e1",
                    borderRadius: "22px",
                    transition: "0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: isAutoVerifyEnabled ? "0 2px 5px rgba(22, 163, 74, 0.3)" : "none",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      height: "16px",
                      width: "16px",
                      left: isAutoVerifyEnabled ? "19px" : "3px",
                      bottom: "3px",
                      backgroundColor: "white",
                      borderRadius: "50%",
                      transition: "0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    }}
                  />
                </span>
              </label>
              <span
                style={{
                  display: "inline-block",
                  padding: "1px 6px",
                  borderRadius: "5px",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  letterSpacing: "0.03em",
                  textTransform: "uppercase",
                  backgroundColor: isAutoVerifyEnabled ? "rgba(22, 163, 74, 0.15)" : "rgba(100, 116, 139, 0.12)",
                  color: isAutoVerifyEnabled ? "#15803d" : "#475569",
                }}
              >
                {autoVerifySaving ? "SAVING…" : isAutoVerifyEnabled ? "ACTIVE" : "OFF"}
              </span>
            </div>

            <div className="approvals-summary-pill">
              <span className="approvals-summary-pill-count">{totalPending}</span>
              <span>Pending Decisions</span>
            </div>
          </div>
        </header>

        {approvalsLoading && (
          <Spinner
            title="Loading approvals…"
            subtitle="Fetching pending users"
          />
        )}
        {!approvalsLoading && (
          <div className="approvals-grid approvals-grid-modern">
            <section className="approvals-section">
              <div className="approvals-section-head">
                <div className="approvals-section-title-group">
                  <span className="approvals-section-icon mentor-icon" aria-hidden="true">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                  </span>
                  <h2 className="approvals-section-title">Pending Mentors</h2>
                </div>
                <span className="approvals-count-badge">
                  {pendingMentors.length} {pendingMentors.length === 1 ? "mentor" : "mentors"}
                </span>
              </div>

              {pendingMentors.length === 0 && (
                <div className="approvals-empty-state kasandigan-card">
                  <div className="approvals-empty-icon-pod" aria-hidden="true">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  </div>
                  <h3 className="approvals-empty-title">All Caught Up!</h3>
                  <p className="muted approvals-empty-desc">No mentors currently awaiting verification review.</p>
                </div>
              )}
              {pendingMentors.length > 0 && (
                <div className="approval-rows-list">
                  {pendingMentors.map((m) => (
                    <ApprovalsUserRow
                      key={`mentor-${m.id}`}
                      item={m}
                      type="mentor"
                      loading={mentorCardLoading(m.id)}
                      onApprove={handleApproveMentor}
                      onRejectAsk={askReject}
                      onPreview={openPreview}
                      onViewDetails={(item, type) => setSelectedDetailUser({ item, type })}
                      Spinner={Spinner}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="approvals-section">
              <div className="approvals-section-head">
                <div className="approvals-section-title-group">
                  <span className="approvals-section-icon mentee-icon" aria-hidden="true">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </span>
                  <h2 className="approvals-section-title">Pending Mentees</h2>
                </div>
                <span className="approvals-count-badge">
                  {pendingMentees.length} {pendingMentees.length === 1 ? "mentee" : "mentees"}
                </span>
              </div>

              {pendingMentees.length === 0 && (
                <div className="approvals-empty-state kasandigan-card">
                  <div className="approvals-empty-icon-pod" aria-hidden="true">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  </div>
                  <h3 className="approvals-empty-title">All Caught Up!</h3>
                  <p className="muted approvals-empty-desc">No mentees currently awaiting verification review.</p>
                </div>
              )}
              {pendingMentees.length > 0 && (
                <div className="approval-rows-list">
                  {pendingMentees.map((m) => (
                    <ApprovalsUserRow
                      key={`mentee-${m.id}`}
                      item={m}
                      type="mentee"
                      loading={menteeCardLoading(m.id)}
                      onApprove={handleApproveMentee}
                      onRejectAsk={askReject}
                      onPreview={openPreview}
                      onViewDetails={(item, type) => setSelectedDetailUser({ item, type })}
                      Spinner={Spinner}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        <UserApprovalDetailModal
          open={!!selectedDetailUser}
          data={selectedDetailUser}
          onClose={() => setSelectedDetailUser(null)}
          onApprove={(id) => {
            if (selectedDetailUser?.type === "mentor") {
              handleApproveMentor(id);
            } else {
              handleApproveMentee(id);
            }
            setSelectedDetailUser(null);
          }}
          onReject={(type, id, name) => {
            askReject(type, id, name);
            setSelectedDetailUser(null);
          }}
          onPreview={openPreview}
          loading={
            selectedDetailUser
              ? approvalActionKey === `${selectedDetailUser.type}:${selectedDetailUser.item.id}`
              : false
          }
        />
        <FileViewerModal
          open={!!previewData}
          data={previewData}
          onClose={() => setPreviewData(null)}
        />
        <RejectConfirmModal
          open={!!rejectTarget}
          target={rejectTarget}
          loading={rejectLoading}
          onConfirm={confirmReject}
          onCancel={() => setRejectTarget(null)}
        />
      </div>
    );
  }

  window.DashboardApp = window.DashboardApp || {};
  window.DashboardApp.Pages = window.DashboardApp.Pages || {};
  window.DashboardApp.Pages.approvals = ApprovalsPage;
  window.DashboardApp.Pages.userApprovals = ApprovalsPage;
  window.DashboardApp.ApprovalsPage = ApprovalsPage;
  window.DashboardApp.UserApprovals = ApprovalsPage;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { ApprovalsPage, UserApprovals: ApprovalsPage };
  }
})();

export const ApprovalsPage = window.DashboardApp.ApprovalsPage;
export const UserApprovals = window.DashboardApp.UserApprovals;
export default ApprovalsPage;

