import React from "react";

export function MenteeMatchingProfile(props) {
  const Component =
    (window.DashboardApp &&
      window.DashboardApp.Pages &&
      (window.DashboardApp.Pages["mentee-matching-profile"] ||
        window.DashboardApp.Pages["mentoring-preferences"])) ||
    window.DashboardApp?.MenteeMatchingProfile;

  if (!Component) {
    return null;
  }

  return React.createElement(Component, props);
}

export default MenteeMatchingProfile;
