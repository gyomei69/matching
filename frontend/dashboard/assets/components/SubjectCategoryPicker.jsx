(function () {
  "use strict";
  const React = window.React;
  const { useMemo } = React;

  function SubjectCategoryPicker({ selectedSubjects, onToggle, showError, maxSubjects = 2 }) {
    const catalog = window.DashboardApp.SUBJECT_CATALOG || [];
    const categoryOrder = window.DashboardApp.SUBJECT_CATEGORY_ORDER || ["major"];
    const categoryLabels = window.DashboardApp.SUBJECT_CATEGORY_LABELS || {};

    const normalizedCatalog = useMemo(() => {
      return (catalog || [])
        .filter((entry) => String(entry.category || "major") === "major")
        .map((entry) => {
          const key = entry.category || "major";
          const orderIdx = Math.max(0, categoryOrder.indexOf(key));
          return {
            ...entry,
            category: key,
            categoryLabel: categoryLabels[key] || key,
            orderIdx,
          };
        })
        .sort((a, b) => {
          if (a.orderIdx !== b.orderIdx) return a.orderIdx - b.orderIdx;
          return String(a.code || a.name).localeCompare(String(b.code || b.name));
        });
    }, [catalog, categoryOrder, categoryLabels]);

    const selected = Array.isArray(selectedSubjects) ? selectedSubjects : [];

    return (
      <div className="subject-category-picker subject-category-picker--modern">
        <div className="complete-profile-subject-grid" role="list" aria-label="Subjects by category">
          {normalizedCatalog.map((entry) => {
            const isSelected =
              selected.includes(entry.name) ||
              selected.includes(entry.code) ||
              (entry.id && selected.includes(entry.id));
            const isSubjectDisabled = !isSelected && selected.length >= maxSubjects;
            return (
              <button
                key={entry.name}
                type="button"
                role="listitem"
                className={
                  "complete-profile-subject-card mp-subject-card" +
                  (isSelected ? " is-active" : "") +
                  (isSubjectDisabled
                    ? " opacity-50 cursor-not-allowed pointer-events-none is-disabled"
                    : "")
                }
                style={
                  isSubjectDisabled
                    ? { opacity: 0.5, cursor: "not-allowed", pointerEvents: "none" }
                    : undefined
                }
                aria-pressed={isSelected}
                aria-disabled={isSubjectDisabled}
                disabled={isSubjectDisabled}
                onClick={(e) => {
                  if (!isSelected && selected.length >= maxSubjects) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                  }
                  onToggle(entry.name);
                }}
              >
                <div className="mp-subject-top">
                  <span className={"mp-subject-category-badge mp-cat-" + entry.category}>
                    {entry.category === "major"
                      ? "Major"
                      : entry.category === "ge"
                        ? "GE"
                        : entry.category === "nstp"
                          ? "NSTP"
                          : "PE"}
                  </span>
                  {isSelected ? (
                    <span className="mp-subject-check" aria-hidden="true">✓</span>
                  ) : (
                    <span className="mp-subject-check-placeholder" aria-hidden="true" />
                  )}
                </div>
                {entry.code ? (
                  <span className="complete-profile-subject-code">{entry.code}</span>
                ) : null}
                <span className="complete-profile-subject-title">{entry.name}</span>
              </button>
            );
          })}
        </div>
        {showError ? (
          <p className="complete-profile-error" role="alert">
            Select at least one subject.
          </p>
        ) : null}
      </div>
    );
  }

  window.DashboardApp = window.DashboardApp || {};
  window.DashboardApp.SubjectCategoryPicker = SubjectCategoryPicker;
})();
