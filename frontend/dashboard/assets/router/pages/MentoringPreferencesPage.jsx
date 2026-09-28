import Slider from "@mui/material/Slider";

(function () {
  "use strict";
  const React = window.React;
  const { useContext, useEffect, useMemo, useRef, useState } = React;
  const AppContext = window.DashboardApp.AppContext;

  const SubjectCategoryPicker =
    window.DashboardApp && window.DashboardApp.SubjectCategoryPicker;
  const SelectionCatalog =
    window.DashboardApp && window.DashboardApp.SelectionCatalog;
  const getMajorSubjectsFromSelection =
    window.DashboardApp.getMajorSubjectsFromSelection || ((s) => s || []);

  const TimePickerField =
    window.DashboardApp && window.DashboardApp.TimePickerField;
  const formatTimeLabel =
    (window.DashboardApp && window.DashboardApp.formatTimeLabel) ||
    ((hhmm) => String(hhmm || ""));

  const Availability = window.DashboardApp.Availability;
  const {
    DAY_ORDER,
    DAY_LABELS,
    MIN_AVAILABLE_TIME,
    MAX_AVAILABLE_TIME,
    parseSlot,
    formatSlotLabel,
    buildAvailabilityUpdate,
  } = Availability;

  const MAX_TOTAL_SUBJECTS = 2;
  const MAX_TOTAL_TOPICS = 6;
  const MAX_TOTAL_COMPETENCIES = 6;

  const MAX_SUBJECTS = MAX_TOTAL_SUBJECTS;
  const MAX_TOPICS_PER_SUBJECT = MAX_TOTAL_TOPICS;
  const MAX_COMPETENCIES_PER_TOPIC = MAX_TOTAL_COMPETENCIES;
  const MAX_COMPETENCIES_TOTAL = MAX_TOTAL_COMPETENCIES;


  const DIFFICULTY_OPTIONS = [
    {
      value: 1,
      label: "Minor Help",
      helper: "You mostly feel on track and only need occasional check-ins.",
    },
    {
      value: 2,
      label: "Minor Help",
      helper: "You understand the basics but need guidance on tougher concepts.",
    },
    {
      value: 3,
      label: "Moderate Mentorship",
      helper: "You often need mentor support to stay on pace and build confidence.",
    },
    {
      value: 4,
      label: "Intensive Support",
      helper: "You need consistent, structured support to keep progressing.",
    },
    {
      value: 5,
      label: "Intensive Support",
      helper: "You need immediate, frequent help to avoid falling behind.",
    },
  ];

  function getGroupedSupportLabel(level) {
    const n = Number(level);
    if (!n || n < 1) return "Not set";
    if (n <= 2) return "Minor Help";
    if (n === 3) return "Moderate Mentorship";
    return "Intensive Support";
  }

  function SectionCard({ title, description, children }) {
    return (
      <section className="mp-section">
        <div className="mp-section-head">
          <h2 className="mp-section-title">{title}</h2>
          {description ? (
            <p className="mp-section-help">{description}</p>
          ) : null}
        </div>
        <div className="mp-section-body">{children}</div>
      </section>
    );
  }

  function DayPicker({ selectedDays, onToggle, onPreset }) {
    const weekdaysSelected =
      selectedDays.length === 5 &&
      selectedDays.every((day) => day !== "Sat" && day !== "Sun");
    const everyDaySelected = selectedDays.length === DAY_ORDER.length;

    return (
      <div className="mp-day-picker">
        <div className="mp-day-picker-head">
          <span className="mp-field-label" id="mp-day-picker-label">
            Days
          </span>
          <div className="mp-day-presets">
            <button
              type="button"
              className={
                "mp-day-preset" + (weekdaysSelected ? " is-active" : "")
              }
              onClick={() => onPreset(["Mon", "Tue", "Wed", "Thu", "Fri"])}
            >
              Weekdays
            </button>
            <button
              type="button"
              className={
                "mp-day-preset" + (everyDaySelected ? " is-active" : "")
              }
              onClick={() => onPreset([...DAY_ORDER])}
            >
              Every day
            </button>
          </div>
        </div>
        <div
          className="mp-day-chips"
          role="group"
          aria-labelledby="mp-day-picker-label"
        >
          {DAY_ORDER.map((day) => {
            const active = selectedDays.includes(day);
            return (
              <button
                key={day}
                type="button"
                role="checkbox"
                aria-checked={active}
                aria-label={DAY_LABELS[day]}
                className={"mp-day-chip" + (active ? " is-active" : "")}
                onClick={() => onToggle(day)}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function serializePreferences(profile) {
    return JSON.stringify({
      subjects: profile.subjects || [],
      topics: profile.topics || [],
      competency_ids: profile.competency_ids || [],
      competency_needs: profile.competency_needs || {},
      difficulty_level: profile.difficulty_level ?? null,
      preferred_learning_style: profile.preferred_learning_style || "",
      availability: profile.availability || [],
    });
  }

  function MentoringPreferencesPage(props) {
    const MAX_TOTAL_SUBJECTS = 2;
    const MAX_TOTAL_TOPICS = 6;
    const MAX_TOTAL_COMPETENCIES = 6;
    const MAX_SUBJECTS = MAX_TOTAL_SUBJECTS;
    const MAX_TOPICS_PER_SUBJECT = MAX_TOTAL_TOPICS;
    const MAX_COMPETENCIES_PER_TOPIC = MAX_TOTAL_COMPETENCIES;
    const MAX_COMPETENCIES_TOTAL = MAX_TOTAL_COMPETENCIES;

    const embedded = !!(props && props.embedded);
    const ctx = useContext(AppContext);
    const user = ctx && ctx.user;
    const menteeMatching = (ctx && ctx.menteeMatching) || {
      subjects: [],
      topics: [],
      competency_ids: [],
      competency_needs: {},
      difficulty_level: null,
      preferred_learning_style: "",
      availability: [],
    };
    const setMenteeMatching = ctx && ctx.setMenteeMatching;
    const menteeMatchingSaving = !!(ctx && ctx.menteeMatchingSaving);
    const handleMenteeMatchingSave = ctx && ctx.handleMenteeMatchingSave;
    const setUnsavedChangesDirty = ctx && ctx.setUnsavedChangesDirty;

    const savedSnapshotRef = useRef(serializePreferences(menteeMatching));
    const hasUserEditedRef = useRef(false);
    const [savedAt, setSavedAt] = useState(0);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [availabilityDraft, setAvailabilityDraft] = useState({
      days: [],
      start: "",
      end: "",
    });
    const [availabilityEditingIndex, setAvailabilityEditingIndex] =
      useState(null);
    const [availabilityError, setAvailabilityError] = useState("");


    const serializedPrefs = serializePreferences(menteeMatching);
    if (!hasUserEditedRef.current) {
      savedSnapshotRef.current = serializedPrefs;
    }
    const isPristine = savedSnapshotRef.current === serializedPrefs;
    const justSaved = savedAt > 0;

    const DRAFT_STORAGE_KEY = `peerlink.survey_draft_${user?.id || user?.username || "mentee"}`;
    const [draftAvailable, setDraftAvailable] = useState(false);

    useEffect(() => {
      try {
        const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && (Array.isArray(parsed.subjects) ? parsed.subjects.length > 0 : parsed.selectedSubjects?.length > 0)) {
            setDraftAvailable(true);
          }
        }
      } catch (e) {}
    }, [DRAFT_STORAGE_KEY]);

    useEffect(() => {
      if (!hasUserEditedRef.current || isPristine) return;
      const timer = setTimeout(() => {
        try {
          window.localStorage.setItem(
            DRAFT_STORAGE_KEY,
            JSON.stringify({
              ...menteeMatching,
              savedAt: Date.now(),
            })
          );
        } catch (e) {}
      }, 800);
      return () => clearTimeout(timer);
    }, [menteeMatching, isPristine, DRAFT_STORAGE_KEY]);

    const handleResumeDraft = () => {
      try {
        const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setMenteeMatching((prev) => ({ ...prev, ...parsed }));
          hasUserEditedRef.current = true;
          setDraftAvailable(false);
        }
      } catch (e) {}
    };

    const handleDiscardDraft = () => {
      try {
        window.localStorage.removeItem(DRAFT_STORAGE_KEY);
        setDraftAvailable(false);
      } catch (e) {}
    };

    useEffect(() => {
      if (!savedAt) return undefined;
      const timeoutId = window.setTimeout(() => setSavedAt(0), 2200);
      return () => window.clearTimeout(timeoutId);
    }, [savedAt]);

    function markDirty() {
      hasUserEditedRef.current = true;
    }

    useEffect(() => {
      if (typeof setUnsavedChangesDirty === "function") {
        setUnsavedChangesDirty(!isPristine);
      }
    }, [isPristine]);

    useEffect(() => {
      return () => {
        if (typeof setUnsavedChangesDirty === "function") {
          setUnsavedChangesDirty(false);
        }
      };
    }, []);

    useEffect(() => {
      function onBeforeUnload(event) {
        if (isPristine) return;
        event.preventDefault();
        event.returnValue = "";
      }
      window.addEventListener("beforeunload", onBeforeUnload);
      return () => window.removeEventListener("beforeunload", onBeforeUnload);
    }, [isPristine]);

    const selectedSubjects = Array.isArray(menteeMatching.subjects)
      ? menteeMatching.subjects.filter((item) => String(item || "").trim())
      : [];
    const selectedMajorSubjects = useMemo(
      () => getMajorSubjectsFromSelection(selectedSubjects),
      [selectedSubjects],
    );
    const [topicOptions, setTopicOptions] = useState([]);
    const [topicGroups, setTopicGroups] = useState([]);
    const [competencyMap, setCompetencyMap] = useState({});
    const [selectedTopicIds, setSelectedTopicIds] = useState([]);
    const [selectedCompetencyIds, setSelectedCompetencyIds] = useState(
      Array.isArray(menteeMatching.competency_ids)
        ? [...menteeMatching.competency_ids]
        : [],
    );
    const [selectionLoading, setSelectionLoading] = useState(false);
    const [collapsedSubjects, setCollapsedSubjects] = useState([]);
    const hydrateSelectionRef = useRef(true);

    const competencyLookup = useMemo(() => {
      const map = new Map();
      Object.values(competencyMap).forEach((items) => {
        (Array.isArray(items) ? items : []).forEach((item) => {
          map.set(item.id, item);
        });
      });
      return map;
    }, [competencyMap]);

    const hasSelectedSubject = selectedMajorSubjects.length > 0;
    const needsTopics = topicOptions.length > 0;
    const needsCompetencies = selectedTopicIds.length > 0;
    const selectedTopicCount = selectedTopicIds.length;
    const selectedCompetencyCount = selectedCompetencyIds.length;
    const selectedTopicLookup = useMemo(
      () =>
        new Map(
          (Array.isArray(topicOptions) ? topicOptions : []).map((topic) => [
            topic.id,
            topic,
          ]),
        ),
      [topicOptions],
    );
    const hasDifficulty =
      menteeMatching.difficulty_level != null &&
      menteeMatching.difficulty_level >= 1 &&
      menteeMatching.difficulty_level <= 5;

    function applyCompetencySelection(nextIds, nextTopicIdsOverride) {
      const nextCompetencyIds = Array.from(new Set(nextIds));
      const topicIdsForState = Array.isArray(nextTopicIdsOverride)
        ? [...nextTopicIdsOverride]
        : [...selectedTopicIds];
      const nextTopicNames = topicIdsForState
        .map((topicId) => selectedTopicLookup.get(topicId))
        .filter(Boolean)
        .map((topic) => topic.name)
        .filter(Boolean);
      const previousNeeds =
        menteeMatching.competency_needs &&
        typeof menteeMatching.competency_needs === "object"
          ? menteeMatching.competency_needs
          : {};
      const defaultNeed = Number(menteeMatching.difficulty_level || 3);
      const nextNeeds = {};
      nextCompetencyIds.forEach((competencyId) => {
        const prevNeed = Number(previousNeeds[competencyId]);
        nextNeeds[competencyId] =
          Number.isFinite(prevNeed) && prevNeed >= 1 && prevNeed <= 5
            ? prevNeed
            : defaultNeed;
      });
      setSelectedCompetencyIds(nextCompetencyIds);
      setMenteeMatching((prev) => ({
        ...prev,
        competency_ids: nextCompetencyIds,
        competency_needs: nextNeeds,
        topics: nextTopicNames,
      }));
    }

    function applySelectionOptions(options) {
      const uniqueTopics = Array.isArray(options.topics) ? options.topics : [];
      setTopicOptions(uniqueTopics);
      setTopicGroups(
        Array.isArray(options.topicGroups) ? options.topicGroups : [],
      );

      const topicIds = uniqueTopics.map((topic) => topic.id).filter(Boolean);
      if (!topicIds.length) {
        setCompetencyMap({});
        setSelectedTopicIds([]);
        setSelectedCompetencyIds([]);
        setMenteeMatching({
          ...menteeMatching,
          topics: [],
          competency_ids: [],
          competency_needs: {},
        });
        return;
      }

      const competencies = Array.isArray(options.competencies)
        ? options.competencies
        : [];
      const grouped = options.competenciesByTopicId || {};
      setCompetencyMap(grouped);

      if (hydrateSelectionRef.current) {
        const savedIds = new Set(
          (Array.isArray(menteeMatching.competency_ids)
            ? menteeMatching.competency_ids
            : [])
            .map((item) => Number(item))
            .filter((item) => Number.isFinite(item) && item > 0),
        );
        const nextCompetencyIds = [];
        const nextTopicIds = new Set();
        competencies.forEach((competency) => {
          if (!savedIds.has(Number(competency.id))) return;
          nextCompetencyIds.push(competency.id);
          if (competency.topic_id) nextTopicIds.add(competency.topic_id);
        });
        const hydratedTopicIds = Array.from(nextTopicIds);
        setSelectedTopicIds(hydratedTopicIds);
        applyCompetencySelection(nextCompetencyIds, hydratedTopicIds);
        hydrateSelectionRef.current = false;
      } else {
        const validTopicIds = new Set(topicIds);
        const nextTopicIds = selectedTopicIds.filter((id) =>
          validTopicIds.has(id),
        );
        const allowedCompetencyIds = new Set(
          nextTopicIds.flatMap((topicItemId) =>
            (grouped[topicItemId] || []).map((competency) => competency.id),
          ),
        );
        const nextCompetencyIds = selectedCompetencyIds.filter((id) =>
          allowedCompetencyIds.has(id),
        );
        setSelectedTopicIds(nextTopicIds);
        applyCompetencySelection(nextCompetencyIds, nextTopicIds);
      }
    }

    async function loadSelectionOptions(subjectNames) {
      if (!Array.isArray(subjectNames) || subjectNames.length === 0) {
        setTopicOptions([]);
        setTopicGroups([]);
        setCompetencyMap({});
        setSelectedTopicIds([]);
        setSelectedCompetencyIds([]);
        setMenteeMatching({
          ...menteeMatching,
          subjects: [],
          topics: [],
          competency_ids: [],
          competency_needs: {},
        });
        return;
      }

      const prefetched = SelectionCatalog.peek(subjectNames);
      if (prefetched) {
        applySelectionOptions(prefetched);
        return;
      }

      setSelectionLoading(true);
      try {
        applySelectionOptions(await SelectionCatalog.load(subjectNames));
      } finally {
        setSelectionLoading(false);
      }
    }

    useEffect(() => {
      SelectionCatalog.prefetch();
    }, []);

    useEffect(() => {
      if (!hasSelectedSubject) {
        setTopicOptions([]);
        setTopicGroups([]);
        setCompetencyMap({});
        setSelectedTopicIds([]);
        setSelectedCompetencyIds([]);
        return;
      }
      loadSelectionOptions(selectedMajorSubjects);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasSelectedSubject, selectedMajorSubjects.join(",")]);

    const isTopicCapExceeded = selectedTopicIds.length > MAX_TOTAL_TOPICS;
    const isCompetencyCapExceeded =
      selectedCompetencyIds.length > MAX_TOTAL_COMPETENCIES;
    const isSubjectCapExceeded = selectedSubjects.length > MAX_TOTAL_SUBJECTS;
    const isBoundsExceeded =
      isSubjectCapExceeded || isTopicCapExceeded || isCompetencyCapExceeded;
    const isFormInvalid = isBoundsExceeded || isSubjectCapExceeded;
    const saveTooltip = isFormInvalid
      ? "Cannot save: selections exceed permitted limits (Max 2 subjects, 6 topics total, 6 competencies total)."
      : "Click to save your preferences";

    const selectedDifficulty = DIFFICULTY_OPTIONS.find(
      (item) => item.value === Number(menteeMatching.difficulty_level),
    );
    const selectedSlots = Array.isArray(menteeMatching.availability)
      ? menteeMatching.availability
      : [];
    const canSave =
      hasSelectedSubject &&
      (!needsTopics || selectedTopicCount > 0) &&
      (!needsCompetencies || selectedCompetencyCount > 0) &&
      hasDifficulty &&
      !isBoundsExceeded;

    const completionSteps = [
      {
        id: "subjects",
        label: "Subjects",
        done: selectedMajorSubjects.length > 0,
        value: selectedMajorSubjects.length
          ? `${selectedMajorSubjects.length} / ${MAX_TOTAL_SUBJECTS}`
          : "Not set",
      },
      {
        id: "topics",
        label: "Topics",
        done: selectedTopicCount > 0,
        value: selectedTopicCount
          ? `${selectedTopicCount} / ${MAX_TOTAL_TOPICS}`
          : "Not set",
      },
      {
        id: "competencies",
        label: "Competencies",
        done: selectedCompetencyCount > 0,
        value: selectedCompetencyCount
          ? `${selectedCompetencyCount} / ${MAX_TOTAL_COMPETENCIES}`
          : "Not set",
      },
      {
        id: "support_need",
        label: "Support need",
        done: hasDifficulty,
        value: hasDifficulty
          ? getGroupedSupportLabel(menteeMatching.difficulty_level)
          : "Not set",
      },
      {
        id: "availability",
        label: "Availability",
        done: selectedSlots.length > 0,
        value: selectedSlots.length
          ? `${selectedSlots.length} range${selectedSlots.length === 1 ? "" : "s"}`
          : "Not set",
      },
    ];
    const completedSteps = completionSteps.filter((step) => step.done).length;
    const completionPercent = Math.round(
      (completedSteps / completionSteps.length) * 100,
    );

    const showSubjectError = submitAttempted && !hasSelectedSubject;
    const showTopicError =
      submitAttempted && needsTopics && selectedTopicCount === 0;
    const showCompetencyError =
      submitAttempted && needsCompetencies && selectedCompetencyCount === 0;
    const showDifficultyError = submitAttempted && !hasDifficulty;

    function toggleSubject(subjectName) {
      markDirty();
      const isSelected = selectedSubjects.includes(subjectName);
      if (!isSelected && selectedSubjects.length >= MAX_TOTAL_SUBJECTS) {
        return;
      }
      let nextSubjects;
      if (isSelected) {
        nextSubjects = selectedSubjects.filter((item) => item !== subjectName);
        const unselectedGroup = topicGroups.find(
          (g) =>
            g.subjectName === subjectName ||
            String(g.subjectId) === String(subjectName),
        );
        const prunedTopicIds = new Set(
          unselectedGroup ? (unselectedGroup.topics || []).map((t) => t.id) : [],
        );
        (topicOptions || []).forEach((t) => {
          if (t.subject_name === subjectName || t.subject === subjectName) {
            prunedTopicIds.add(t.id);
          }
        });
        const nextTopicIds = selectedTopicIds.filter(
          (id) => !prunedTopicIds.has(id),
        );
        const prunedCompIds = new Set();
        prunedTopicIds.forEach((tId) => {
          (competencyMap[tId] || []).forEach((c) => prunedCompIds.add(c.id));
        });
        const nextCompIds = selectedCompetencyIds.filter(
          (id) => !prunedCompIds.has(id),
        );
        setSelectedTopicIds(nextTopicIds);
        applyCompetencySelection(nextCompIds, nextTopicIds);
      } else {
        nextSubjects = [...selectedSubjects, subjectName];
      }
      setMenteeMatching((prev) => ({
        ...prev,
        subjects: nextSubjects,
      }));
    }

    function toggleSubjectPanel(groupKey) {
      setCollapsedSubjects((prev) =>
        prev.includes(groupKey)
          ? prev.filter((item) => item !== groupKey)
          : [...prev, groupKey],
      );
    }

    function toggleTopic(topic) {
      const topicId = Number(topic?.id || 0);
      if (!topicId) return;
      markDirty();
      const isSelected = selectedTopicIds.includes(topicId);
      if (!isSelected && selectedTopicIds.length >= MAX_TOTAL_TOPICS) {
        return;
      }
      const nextTopicIds = isSelected
        ? selectedTopicIds.filter((item) => item !== topicId)
        : [...selectedTopicIds, topicId];
      const allowedCompetencyIds = new Set(
        nextTopicIds.flatMap((topicItemId) =>
          (competencyMap[topicItemId] || []).map((competency) => competency.id),
        ),
      );
      setSelectedTopicIds(nextTopicIds);
      applyCompetencySelection(
        selectedCompetencyIds.filter((competencyId) =>
          allowedCompetencyIds.has(competencyId),
        ),
        nextTopicIds,
      );
    }

    function toggleCompetency(competency) {
      const competencyId = Number(competency?.id || 0);
      if (!competencyId) return;
      if (!selectedTopicIds.includes(Number(competency.topic_id || 0))) return;
      markDirty();
      const isSelected = selectedCompetencyIds.includes(competencyId);
      if (!isSelected && selectedCompetencyIds.length >= MAX_TOTAL_COMPETENCIES) {
        return;
      }
      const nextCompetencyIds = isSelected
        ? selectedCompetencyIds.filter((item) => item !== competencyId)
        : [...selectedCompetencyIds, competencyId];
      applyCompetencySelection(nextCompetencyIds);
    }

    function setSupportNeed(value) {
      markDirty();
      setMenteeMatching({
        ...menteeMatching,
        difficulty_level: Number(value),
      });
    }

    async function handleSave() {
      setSubmitAttempted(true);
      let availability = Array.isArray(menteeMatching.availability)
        ? menteeMatching.availability
        : [];
      if (
        availabilityDraft.days.length > 0 &&
        availabilityDraft.start &&
        availabilityDraft.end
      ) {
        const { error, next } = buildAvailabilityUpdate(
          availability,
          availabilityDraft,
          availabilityEditingIndex,
        );
        if (!next) {
          setAvailabilityError(error);
          return;
        }
        availability = next;
        setAvailabilityError("");
        setMenteeMatching({ ...menteeMatching, availability });
        setAvailabilityDraft({ days: [], start: "", end: "" });
        setAvailabilityEditingIndex(null);
        markDirty();
      }
      if (!canSave) return;
      const saved = await handleMenteeMatchingSave({ availability });
      if (saved) {
        hasUserEditedRef.current = false;
        try {
          window.localStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch (e) {}
        setDraftAvailable(false);
        setSavedAt(Date.now());
        savedSnapshotRef.current = serializePreferences({
          ...menteeMatching,
          availability,
        });
      }
    }

    function handleReset() {
      if (isPristine) return;
      try {
        const parsed = JSON.parse(savedSnapshotRef.current || "{}");
        const subjects = Array.isArray(parsed.subjects) ? parsed.subjects : [];
        const topics = Array.isArray(parsed.topics) ? parsed.topics : [];
        const competencyIds = Array.isArray(parsed.competency_ids)
          ? parsed.competency_ids
          : [];
        const competencyNeeds =
          parsed.competency_needs && typeof parsed.competency_needs === "object"
            ? parsed.competency_needs
            : {};
        const nextTopicIds = new Set();
        competencyIds.forEach((competencyId) => {
          const competency = competencyLookup.get(competencyId);
          if (competency?.topic_id) {
            nextTopicIds.add(competency.topic_id);
          }
        });

        setMenteeMatching({
          ...menteeMatching,
          subjects,
          topics,
          competency_ids: competencyIds,
          competency_needs: competencyNeeds,
          difficulty_level:
            parsed.difficulty_level == null
              ? null
              : Number(parsed.difficulty_level),
          preferred_learning_style: parsed.preferred_learning_style || "",
          availability: Array.isArray(parsed.availability)
            ? parsed.availability
            : [],
        });
        setSelectedTopicIds(Array.from(nextTopicIds));
        setSelectedCompetencyIds(competencyIds);
        hydrateSelectionRef.current = true;
        setAvailabilityDraft({ days: [], start: "", end: "" });
        setAvailabilityEditingIndex(null);
        setAvailabilityError("");
        setSubmitAttempted(false);
        hasUserEditedRef.current = false;
      } catch (error) {
        console.warn("Unable to restore saved mentoring preferences", error);
      }
    }

    if (!ctx || !user) return null;

    if (user.role !== "mentee") {
      return (
        <div className="mentoring-preferences-page mentor-matching-profile-page page-shell">
          <h1 className="page-title">Mentee Matching Profile</h1>
          <p className="page-subtitle">
            This page is available for student accounts only.
          </p>
        </div>
      );
    }

    return (
      <div
        className={
          "mentoring-preferences-page mentor-matching-profile-page page-shell" +
          (embedded ? " is-embedded" : "")
        }
      >
        {!embedded && (
          <header className="kasandigan-header">
            <div className="kasandigan-header-content">
              <div className="kasandigan-badge">
                <span className="kasandigan-badge-dot" />
                <span>Academic Mentoring Unit • Mentee Profile</span>
              </div>
              <h1 className="kasandigan-title">Mentee Matching Profile</h1>
              <p className="kasandigan-subtitle">
                Keep your subjects, topics, competencies, support need, and availability up to date so we can recommend the right mentors for you.
              </p>
            </div>
            <div className="kasandigan-header-actions">
              <span className="kasandigan-badge kasandigan-badge--role">
                <span
                  className="kasandigan-badge-dot"
                  style={{ background: "#0ea5e9" }}
                />
                <span>Student Mentee</span>
              </span>
            </div>
          </header>
        )}

        {draftAvailable && (
          <div
            className="mentee-draft-banner"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "linear-gradient(135deg, rgba(30, 41, 59, 0.75), rgba(15, 23, 42, 0.85))",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              boxShadow: "inset 2px 2px 5px rgba(0, 0, 0, 0.4), inset -2px -2px 5px rgba(255, 255, 255, 0.04), 0 4px 12px rgba(0, 0, 0, 0.3)",
              borderRadius: "16px",
              padding: "14px 20px",
              marginBottom: "20px",
              backdropFilter: "blur(12px)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "1.4rem" }}>💾</span>
              <div>
                <strong style={{ display: "block", color: "#38bdf8", fontSize: "0.95rem" }}>
                  Unsaved Survey Draft Found
                </strong>
                <span style={{ fontSize: "0.82rem", opacity: 0.8 }}>
                  You have previously auto-saved survey responses. Would you like to resume?
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                className="btn small"
                style={{
                  background: "#0284c7",
                  color: "#fff",
                  fontWeight: 600,
                  borderRadius: "10px",
                  padding: "6px 14px",
                }}
                onClick={handleResumeDraft}
              >
                Resume Draft
              </button>
              <button
                type="button"
                className="btn small ghost"
                style={{
                  borderRadius: "10px",
                  padding: "6px 12px",
                  opacity: 0.75,
                }}
                onClick={handleDiscardDraft}
              >
                Discard
              </button>
            </div>
          </div>
        )}

        <div className="mp-layout">
          <div className="mp-main">
            <SectionCard
              title="Subject"
              description="Select every subject you need help with. Topics and competencies will load for each selected subject."
            >
              <div className="mp-inline-meta" aria-live="polite">
                {selectedMajorSubjects.length} selected
              </div>
              {SubjectCategoryPicker ? (
                <SubjectCategoryPicker
                  selectedSubjects={selectedSubjects}
                  onToggle={toggleSubject}
                  showError={showSubjectError}
                />
              ) : (
                <p className="field-helper">Subject picker is unavailable.</p>
              )}
              {showSubjectError && (
                <p className="complete-profile-error" role="alert">
                  Select a subject before continuing.
                </p>
              )}
            </SectionCard>

            {hasSelectedSubject && (
              <SectionCard
                title="Topics"
                description="Select up to 6 topics connected to your selected subjects."
              >
                <div
                  className={
                    "mp-inline-meta" +
                    (selectedTopicCount >= MAX_TOTAL_TOPICS ? " is-max-reached" : "")
                  }
                  style={
                    selectedTopicCount >= MAX_TOTAL_TOPICS
                      ? {
                          color: "#f59e0b",
                          fontWeight: 700,
                          backgroundColor: "rgba(245, 158, 11, 0.15)",
                          border: "1px solid rgba(245, 158, 11, 0.4)",
                          borderRadius: "20px",
                          padding: "3px 10px",
                          display: "inline-block",
                        }
                      : undefined
                  }
                  aria-live="polite"
                >
                  {selectedTopicCount} / {MAX_TOTAL_TOPICS} max
                  {selectedTopicCount >= MAX_TOTAL_TOPICS ? " (Max Reached)" : ""}
                </div>
                {selectionLoading && (
                  <p
                    className="field-helper complete-profile-helper"
                    role="status"
                  >
                    Loading topics for the selected subjects.
                  </p>
                )}
                {!selectionLoading && topicOptions.length === 0 ? (
                  <p
                    className="field-helper complete-profile-helper"
                    role="status"
                  >
                    No topics are defined for these subjects yet.
                  </p>
                ) : topicGroups.length > 0 ? (
                  <div className="mp-subject-accordions">
                    {topicGroups.map((group) => {
                      const groupTopics = group.topics || [];
                      const groupKey = String(
                        group.subjectId ?? group.subjectName,
                      );
                      const selectedInGroup = groupTopics.filter((topic) =>
                        selectedTopicIds.includes(topic.id),
                      ).length;
                      const open = !collapsedSubjects.includes(groupKey);
                      const panelId = `mp-topics-panel-${groupKey.replace(/\W+/g, "-")}`;
                      return (
                        <section
                          key={groupKey}
                          className={
                            "mp-subject-accordion" + (open ? " is-open" : "")
                          }
                        >
                          <button
                            type="button"
                            className="mp-subject-accordion-head"
                            aria-expanded={open}
                            aria-controls={panelId}
                            onClick={() => toggleSubjectPanel(groupKey)}
                          >
                            <span
                              className="mp-subject-accordion-chevron"
                              aria-hidden="true"
                            >
                              ▸
                            </span>
                            <span className="mp-subject-accordion-title">
                              {group.subjectName}
                            </span>
                            <span className="mp-subject-accordion-count">
                              {selectedInGroup} selected
                            </span>
                          </button>
                          {open && (
                            <div
                              className="mp-subject-accordion-body"
                              id={panelId}
                              role="list"
                              aria-label={`${group.subjectName} topics`}
                            >
                              {groupTopics.map((topic) => {
                                const active = selectedTopicIds.includes(
                                  topic.id,
                                );
                                const isTopicDisabled =
                                  !active &&
                                  selectedTopicIds.length >= MAX_TOTAL_TOPICS;
                                return (
                                  <button
                                    key={topic.id}
                                    type="button"
                                    role="listitem"
                                    className={
                                      "mp-pill" +
                                      (active ? " is-active" : "") +
                                      (isTopicDisabled
                                        ? " opacity-50 cursor-not-allowed pointer-events-none is-disabled"
                                        : "")
                                    }
                                    style={
                                      isTopicDisabled
                                        ? {
                                            opacity: 0.5,
                                            cursor: "not-allowed",
                                            pointerEvents: "none",
                                          }
                                        : undefined
                                    }
                                    disabled={isTopicDisabled}
                                    aria-pressed={active}
                                    aria-disabled={isTopicDisabled}
                                    onClick={(e) => {
                                      if (
                                        !active &&
                                        selectedTopicIds.length >= MAX_TOTAL_TOPICS
                                      ) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        return;
                                      }
                                      toggleTopic(topic);
                                    }}
                                  >
                                    {active ? (
                                      <span className="mp-chip-check">✓</span>
                                    ) : null}
                                    <span>{topic.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </section>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    className="mp-chip-row"
                    role="list"
                    aria-label="Topic options"
                  >
                    {topicOptions.map((topic) => {
                      const active = selectedTopicIds.includes(topic.id);
                      const isTopicDisabled =
                        !active && selectedTopicIds.length >= MAX_TOTAL_TOPICS;
                      return (
                        <button
                          key={topic.id}
                          type="button"
                          role="listitem"
                          className={
                            "mp-pill" +
                            (active ? " is-active" : "") +
                            (isTopicDisabled
                              ? " opacity-50 cursor-not-allowed pointer-events-none is-disabled"
                              : "")
                          }
                          style={
                            isTopicDisabled
                              ? {
                                  opacity: 0.5,
                                  cursor: "not-allowed",
                                  pointerEvents: "none",
                                }
                              : undefined
                          }
                          disabled={isTopicDisabled}
                          aria-pressed={active}
                          aria-disabled={isTopicDisabled}
                          onClick={(e) => {
                            if (
                              !active &&
                              selectedTopicIds.length >= MAX_TOTAL_TOPICS
                            ) {
                              e.preventDefault();
                              e.stopPropagation();
                              return;
                            }
                            toggleTopic(topic);
                          }}
                        >
                          {active ? (
                            <span className="mp-chip-check">✓</span>
                          ) : null}
                          <span>{topic.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {showTopicError && (
                  <p className="complete-profile-error" role="alert">
                    Select at least one topic.
                  </p>
                )}
              </SectionCard>
            )}

            {selectedTopicCount > 0 && (
              <SectionCard
                title="Competencies"
                description="Select up to 6 competencies you want help with across all topics."
              >
                <div
                  className={
                    "mp-inline-meta" +
                    (selectedCompetencyCount >= MAX_TOTAL_COMPETENCIES
                      ? " is-max-reached"
                      : "")
                  }
                  style={
                    selectedCompetencyCount >= MAX_TOTAL_COMPETENCIES
                      ? {
                          color: "#f59e0b",
                          fontWeight: 700,
                          backgroundColor: "rgba(245, 158, 11, 0.15)",
                          border: "1px solid rgba(245, 158, 11, 0.4)",
                          borderRadius: "20px",
                          padding: "3px 10px",
                          display: "inline-block",
                        }
                      : undefined
                  }
                  aria-live="polite"
                >
                  {selectedCompetencyCount} / {MAX_TOTAL_COMPETENCIES} max
                  {selectedCompetencyCount >= MAX_TOTAL_COMPETENCIES
                    ? " (Max Reached)"
                    : ""}
                </div>
                <div className="mp-competency-groups">
                  {selectedTopicIds.map((topicId) => {
                    const topic = selectedTopicLookup.get(topicId);
                    const competencies = competencyMap[topicId] || [];
                    if (!topic) return null;
                    const selectedInTopic = competencies.filter((c) =>
                      selectedCompetencyIds.includes(c.id),
                    ).length;
                    return (
                      <section key={topicId} className="mp-competency-group">
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "8px",
                          }}
                        >
                          <h3
                            className="mp-competency-group-title"
                            style={{ margin: 0 }}
                          >
                            {topic.name}
                          </h3>
                          <span
                            className="mp-competency-count"
                            style={{ fontSize: "0.85rem", opacity: 0.85 }}
                          >
                            {selectedInTopic} selected
                          </span>
                        </div>
                        <div
                          className="mp-chip-row"
                          role="list"
                          aria-label={`${topic.name} competencies`}
                        >
                          {competencies.length > 0 ? (
                            competencies.map((competency) => {
                              const active = selectedCompetencyIds.includes(
                                competency.id,
                              );
                              const isCompDisabled =
                                !active &&
                                selectedCompetencyIds.length >=
                                  MAX_TOTAL_COMPETENCIES;
                              return (
                                <button
                                  key={competency.id}
                                  type="button"
                                  role="listitem"
                                  className={
                                    "mp-pill" +
                                    (active ? " is-active" : "") +
                                    (isCompDisabled
                                      ? " opacity-50 cursor-not-allowed pointer-events-none is-disabled"
                                      : "")
                                  }
                                  style={
                                    isCompDisabled
                                      ? {
                                          opacity: 0.5,
                                          cursor: "not-allowed",
                                          pointerEvents: "none",
                                        }
                                      : undefined
                                  }
                                  disabled={isCompDisabled}
                                  aria-pressed={active}
                                  aria-disabled={isCompDisabled}
                                  title={
                                    isCompDisabled
                                      ? `Limit reached: Maximum ${MAX_TOTAL_COMPETENCIES} competencies total.`
                                      : competency.description || competency.name
                                  }
                                  onClick={(e) => {
                                    if (
                                      !active &&
                                      selectedCompetencyIds.length >=
                                        MAX_TOTAL_COMPETENCIES
                                    ) {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      return;
                                    }
                                    toggleCompetency(competency);
                                  }}
                                >
                                  {active ? (
                                    <span className="mp-chip-check">✓</span>
                                  ) : null}
                                  <span>{competency.name}</span>
                                </button>
                              );
                            })
                          ) : (
                            <p
                              className="field-helper complete-profile-helper"
                              role="status"
                            >
                              No competencies are defined for this topic yet.
                            </p>
                          )}
                        </div>
                      </section>
                    );
                  })}
                </div>
                {showCompetencyError && (
                  <p className="complete-profile-error" role="alert">
                    Select at least one competency.
                  </p>
                )}
              </SectionCard>
            )}

            <SectionCard
              title="Mentorship role & support need"
              description="Tell us how much mentoring support you need so we can match you with the right mentor."
            >
              <div
                className="pref-role-row"
                role="group"
                aria-label="Mentorship role"
              >
                <span className="pref-role-pill is-active">
                  Mentee (learning)
                </span>
              </div>
              <div className="pref-slider-label">
                <span>Support need</span>
                <span className="pref-slider-level">
                  {getGroupedSupportLabel(menteeMatching.difficulty_level)}
                </span>
              </div>
              <Slider
                className="pref-slider"
                min={1}
                max={5}
                step={1}
                marks={DIFFICULTY_OPTIONS.map((option) => ({
                  value: option.value,
                  label: String(option.value),
                }))}
                value={menteeMatching.difficulty_level || 1}
                onChange={(_, value) => setSupportNeed(value)}
                aria-label="Support need"
                aria-valuetext={
                  selectedDifficulty
                    ? `Level ${selectedDifficulty.value}, ${selectedDifficulty.label}`
                    : "Support need not set"
                }
              />
              <div
                className="pref-support-levels"
                role="group"
                aria-label="Support level options"
              >
                {DIFFICULTY_OPTIONS.map((option) => {
                  const active =
                    option.value ===
                    Number(menteeMatching.difficulty_level || 1);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={
                        "pref-support-level-item" + (active ? " is-active" : "")
                      }
                      aria-pressed={active}
                      aria-current={active ? "true" : undefined}
                      onClick={() => setSupportNeed(option.value)}
                    >
                      <span className="pref-support-level-num">
                        {option.value}
                      </span>
                      <div className="pref-support-level-copy">
                        <span className="pref-support-level-title">
                          {option.label}
                        </span>
                        <p className="pref-support-level-desc">
                          {option.helper}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {showDifficultyError && (
                <p className="complete-profile-error" role="alert">
                  Select a support need before saving.
                </p>
              )}
            </SectionCard>

            <SectionCard
              title="Available time"
              description="Pick the days you can meet, then a time range between 7:00 AM and 10:00 PM."
            >
              <div className="mp-availability-composer">
                <DayPicker
                  selectedDays={availabilityDraft.days}
                  onToggle={(day) => {
                    setAvailabilityError("");
                    setAvailabilityDraft((prev) => ({
                      ...prev,
                      days: prev.days.includes(day)
                        ? prev.days.filter((item) => item !== day)
                        : DAY_ORDER.filter(
                            (item) => item === day || prev.days.includes(item),
                          ),
                    }));
                  }}
                  onPreset={(days) => {
                    setAvailabilityError("");
                    setAvailabilityDraft((prev) => {
                      const same =
                        prev.days.length === days.length &&
                        days.every((day) => prev.days.includes(day));
                      return { ...prev, days: same ? [] : days };
                    });
                  }}
                />
                <div className="time-range-row responsive-form-row">
                  <TimePickerField
                    id="mentee-matching-start"
                    label="Start time"
                    min={MIN_AVAILABLE_TIME}
                    max={MAX_AVAILABLE_TIME}
                    value={availabilityDraft.start}
                    onChange={(e) => {
                      setAvailabilityError("");
                      setAvailabilityDraft({
                        ...availabilityDraft,
                        start: e.target.value,
                      });
                    }}
                  />
                  <TimePickerField
                    id="mentee-matching-end"
                    label="End time"
                    min={MIN_AVAILABLE_TIME}
                    max={MAX_AVAILABLE_TIME}
                    value={availabilityDraft.end}
                    onChange={(e) => {
                      setAvailabilityError("");
                      setAvailabilityDraft({
                        ...availabilityDraft,
                        end: e.target.value,
                      });
                    }}
                  />
                </div>
              </div>
              <div className="btn-row mp-availability-actions">
                <button
                  type="button"
                  className="btn secondary small"
                  disabled={
                    availabilityDraft.days.length === 0 ||
                    !availabilityDraft.start ||
                    !availabilityDraft.end
                  }
                  onClick={() => {
                    const { error, next } = buildAvailabilityUpdate(
                      menteeMatching.availability,
                      availabilityDraft,
                      availabilityEditingIndex,
                    );
                    if (!next) {
                      setAvailabilityError(error);
                      return;
                    }
                    setAvailabilityError("");
                    setMenteeMatching({
                      ...menteeMatching,
                      availability: next,
                    });
                    setAvailabilityDraft({ days: [], start: "", end: "" });
                    setAvailabilityEditingIndex(null);
                    markDirty();
                  }}
                >
                  {availabilityEditingIndex != null
                    ? "Update timeframe"
                    : "Add timeframe"}
                </button>
                {availabilityEditingIndex != null && (
                  <button
                    type="button"
                    className="btn ghost small"
                    onClick={() => {
                      setAvailabilityEditingIndex(null);
                      setAvailabilityDraft({ days: [], start: "", end: "" });
                      setAvailabilityError("");
                    }}
                  >
                    Cancel edit
                  </button>
                )}
              </div>
              {availabilityError && (
                <p className="complete-profile-error" role="alert">
                  {availabilityError}
                </p>
              )}
              <p className="field-helper">
                You can add multiple ranges. We&apos;ll match you with mentors whose
                days and times overlap yours.
              </p>
              {Array.isArray(menteeMatching.availability) &&
                menteeMatching.availability.length > 0 && (
                  <div
                    className="availability-list mp-availability-list"
                    aria-live="polite"
                  >
                    {menteeMatching.availability.map((slot, idx) => (
                      <div
                        key={`${slot}-${idx}`}
                        className={
                          "availability-item mp-availability-item" +
                          (availabilityEditingIndex === idx ? " is-editing" : "")
                        }
                      >
                        <span className="availability-item-label">
                          {formatSlotLabel(slot)}
                        </span>
                        <div className="availability-item-actions">
                          <button
                            type="button"
                            className="availability-action-btn"
                            onClick={() => {
                              const parsed = parseSlot(slot);
                              if (!parsed) return;
                              setAvailabilityDraft({
                                days: parsed.hasExplicitDays
                                  ? [...parsed.days]
                                  : [...DAY_ORDER],
                                start: parsed.start,
                                end: parsed.end,
                              });
                              setAvailabilityEditingIndex(idx);
                              setAvailabilityError("");
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="availability-action-btn availability-action-btn--danger"
                            onClick={() => {
                              const next = menteeMatching.availability.filter(
                                (_, i) => i !== idx,
                              );
                              setMenteeMatching({
                                ...menteeMatching,
                                availability: next,
                              });
                              if (availabilityEditingIndex === idx) {
                                setAvailabilityEditingIndex(null);
                                setAvailabilityDraft({
                                  days: [],
                                  start: "",
                                  end: "",
                                });
                              } else if (
                                availabilityEditingIndex != null &&
                                availabilityEditingIndex > idx
                              ) {
                                setAvailabilityEditingIndex(
                                  availabilityEditingIndex - 1,
                                );
                              }
                              markDirty();
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </SectionCard>
          </div>

          <aside className="mp-preview matching-card">
            <h3 className="mp-preview-title">Your Matching Profile</h3>

            <div className="mp-progress">
              <div className="mp-progress-head">
                <span className="mp-progress-value">
                  {completionPercent}% Complete
                </span>
                <span className="mp-progress-meta">
                  {completedSteps} of {completionSteps.length}
                </span>
              </div>
              <div
                className="mp-progress-track"
                role="progressbar"
                aria-valuenow={completionPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Profile completeness"
              >
                <div
                  className="mp-progress-fill"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>

            <dl className="mp-preview-list">
              {completionSteps.map((step) => (
                <div
                  key={step.id}
                  className={"mp-preview-row" + (step.done ? " is-done" : "")}
                >
                  <dt>
                    <span className="mp-preview-check" aria-hidden="true">
                      {step.done ? "✓" : "○"}
                    </span>
                    {step.label}
                  </dt>
                  <dd>{step.value}</dd>
                </div>
              ))}
            </dl>

            {selectedSlots.length > 0 && (
              <ul className="mp-preview-slots">
                {selectedSlots.map((slot, idx) => (
                  <li key={`${slot}-${idx}`}>{formatSlotLabel(slot)}</li>
                ))}
              </ul>
            )}
          </aside>
        </div>

        {(!isPristine || justSaved) && (
          <div
            className={
              "mp-sticky-bar" +
              (justSaved && isPristine ? " is-saved" : " is-dirty")
            }
            role="status"
          >
            <div className="mp-sticky-meta">
              <p className="mp-sticky-title">
                {justSaved && isPristine ? "Saved" : "Unsaved changes"}
              </p>
              <p className="mp-sticky-subtitle">
                {justSaved && isPristine
                  ? "Your mentee matching profile was updated."
                  : "Save your preferences to keep these updates."}
              </p>
              {submitAttempted && (!canSave || isFormInvalid) && !isPristine && (
                <p
                  className="complete-profile-error complete-profile-error-summary"
                  role="alert"
                >
                  {isBoundsExceeded
                    ? "Please ensure selections do not exceed limits (up to 2 subjects, 6 topics total, and 6 competencies total)."
                    : needsTopics
                      ? needsCompetencies
                        ? "Select a subject, a topic, a competency, and a support need before saving."
                        : "Select a subject, a topic, and a support need before saving."
                      : "Select at least one subject and a support need before saving."}
                </p>
              )}
            </div>
            <div className="mp-sticky-actions">
              <button
                type="button"
                className="btn primary small mp-sticky-save-btn"
                onClick={handleSave}
                disabled={menteeMatchingSaving || (!canSave && !isPristine) || isFormInvalid}
                title={saveTooltip}
              >
                {menteeMatchingSaving
                  ? "Saving…"
                  : embedded
                    ? "Save & finish"
                    : "Save Preferences"}
              </button>
              {!isPristine && (
                <button
                  type="button"
                  className="btn secondary small mp-sticky-discard-btn"
                  onClick={handleReset}
                  disabled={menteeMatchingSaving}
                >
                  Discard
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  window.DashboardApp = window.DashboardApp || {};
  window.DashboardApp.Pages = window.DashboardApp.Pages || {};
  window.DashboardApp.Pages["mentoring-preferences"] = MentoringPreferencesPage;
  window.DashboardApp.Pages["mentee-matching-profile"] = MentoringPreferencesPage;
  window.DashboardApp.MenteeMatchingProfile = MentoringPreferencesPage;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      MentoringPreferencesPage,
      MenteeMatchingProfile: MentoringPreferencesPage,
    };
  }
})();
