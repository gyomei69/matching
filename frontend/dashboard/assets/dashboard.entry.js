import React from "react";
import * as ReactDOM from "react-dom/client";
import * as Mui from "@mui/material";
import { createTheme } from "@mui/material/styles";

const dashboardTheme = createTheme({
	typography: {
		fontFamily:
			"'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		h1: {
			fontSize: "1.25rem",
			fontWeight: 700,
			letterSpacing: "-0.025em",
			lineHeight: 1.2,
			"@media (min-width:600px)": { fontSize: "1.5rem" },
			"@media (min-width:900px)": { fontSize: "1.75rem" },
		},
		h2: {
			fontSize: "1.25rem",
			fontWeight: 700,
			letterSpacing: "-0.02em",
			lineHeight: 1.25,
			"@media (min-width:600px)": { fontSize: "1.5rem" },
			"@media (min-width:900px)": { fontSize: "1.75rem" },
		},
		h3: {
			fontSize: "1.10rem",
			fontWeight: 600,
			letterSpacing: "-0.015em",
			lineHeight: 1.3,
		},
		body1: { fontSize: "0.875rem", lineHeight: 1.5 },
		body2: { fontSize: "0.80rem", lineHeight: 1.4 },
		button: { textTransform: "none", fontWeight: 600, fontSize: "0.875rem" },
		caption: { fontSize: "0.725rem", fontWeight: 500, letterSpacing: "0.01em" },
	},
	components: {
		MuiButton: {
			styleOverrides: {
				root: {
					minHeight: 44,
					textTransform: "none",
				},
			},
		},
		MuiIconButton: {
			styleOverrides: {
				root: {
					minWidth: 44,
					minHeight: 44,
				},
			},
		},
		MuiOutlinedInput: {
			styleOverrides: {
				root: {
					minHeight: 44,
				},
			},
		},
		MuiTab: {
			styleOverrides: {
				root: {
					minHeight: 44,
					textTransform: "none",
				},
			},
		},
	},
});

window.React = React;
window.ReactDOM = ReactDOM;
window.Mui = Mui;
window.Mui.createTheme = createTheme;
window.MaterialUI = Mui;
window.DashboardApp = window.DashboardApp || {};
window.DashboardApp.createTheme = createTheme;
window.DashboardApp.theme = dashboardTheme;

async function loadDashboardModules() {
	await import("./lib/constants.jsx");
	await import("./components/SubjectCategoryPicker.jsx");
	await import("./components/TimePickerField.jsx");
	await import("./components/AmuFooter.jsx");
	await import("./lib/utils.jsx");
	await import("./lib/availability.jsx");
	await import("./lib/selectionCatalog.jsx");
	await import("./context.jsx");
	await import("./components/MentorProfileCard.jsx");
	await import("./router/pages/AllPages.jsx");
	await import("./router/pages/AuthPages.jsx");
	await import("./router/pages/HomePage.jsx");
	await import("./router/pages/MatchingPage.jsx");
	await import("./router/pages/AnnouncementsPage.jsx");
	await import("./router/pages/NotificationsPage.jsx");
	await import("./router/pages/ApprovalsPage.jsx");
	await import("./router/pages/ActivityLogsPage.jsx");
	await import("./router/pages/BackupPage.jsx");
	await import("./router/pages/UsersPage.jsx");
	await import("./router/pages/SettingsPage.jsx");
	await import("./router/pages/ProfilePage.jsx");
	await import("./router/pages/NewsfeedPage.jsx");
	await import("./router/pages/MentorProfilePage.jsx");
	await import("./router/pages/CompleteProfilePage.jsx");
	await import("./components/SubjectSkillPreferences.jsx");
	await import("./router/pages/MentoringPreferencesPage.jsx");
	await import("./router/pages/MenteeMatchingProfile.jsx");
	await import("./router/pages/MentorMatchingProfilePage.jsx");
	await import("./router/pages/MenteePreferencesPage.jsx");
	await import("./router/pages/MentorPreferencesPage.jsx");
	await import("./router/pages/OnboardingPage.jsx");
	await import("./router/pages/PendingApprovalPage.jsx");
	await import("./router/pages/MenteesPage.jsx");
	await import("./router/routes.jsx");
	await import("./ErrorBoundary.jsx");
	await import("./MainContent.jsx");
	await import("./components/Sidebar.jsx");
	await import("./Layout.jsx");
	await import("./AppProviders.jsx");
	await import("./AppRoot.jsx");
	await import("./app.jsx");
}

loadDashboardModules();
