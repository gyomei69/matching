import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import "../assets/router/pages/ApprovalsPage.jsx";
import { ApprovalsPage, UserApprovals } from "../assets/router/pages/UserApprovals.jsx";

const AppContext = globalThis.window.DashboardApp.AppContext;

function withContext(component, value) {
  return React.createElement(
    AppContext.Provider,
    { value },
    component
  );
}

describe("UserApprovals / ApprovalsPage Auto-Verify Toggle", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const baseStaffUser = {
    id: 1,
    username: "coordinator",
    email: "coordinator@buksu.edu.ph",
    role: "coordinator",
    is_staff: true,
  };

  const defaultCtx = {
    user: baseStaffUser,
    approvalsLoading: false,
    approvalActionKey: null,
    pendingMentors: [],
    pendingMentees: [],
    handleApproveMentor: vi.fn(),
    handleRejectMentor: vi.fn(),
    handleApproveMentee: vi.fn(),
    handleRejectMentee: vi.fn(),
    addToast: vi.fn(),
  };

  it("exports UserApprovals alongside ApprovalsPage", () => {
    expect(UserApprovals).toBeDefined();
    expect(ApprovalsPage).toBeDefined();
    expect(UserApprovals).toBe(ApprovalsPage);
  });

  it("renders the Auto-Verify New Users toggle adjacent to Pending Decisions badge", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ is_auto_verify_enabled: false, status: "ok" }),
    });

    render(withContext(React.createElement(UserApprovals), defaultCtx));

    expect(screen.getByText("User Approvals")).toBeInTheDocument();
    expect(screen.getByText("Pending Decisions")).toBeInTheDocument();
    expect(screen.getByText("Auto-Verify New Users")).toBeInTheDocument();

    await waitFor(() => {
      const checkbox = screen.getByRole("checkbox", { name: /auto-verify new users/i });
      expect(checkbox).not.toBeChecked();
    });
  });

  it("fetches initial state and sends PATCH request on toggle change", async () => {
    let autoVerifyState = false;
    globalThis.fetch = vi.fn().mockImplementation((url, opts) => {
      if (!opts || opts.method === "GET" || !opts.method) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ is_auto_verify_enabled: autoVerifyState, status: "ok" }),
        });
      }
      if (opts.method === "PATCH") {
        const body = JSON.parse(opts.body);
        autoVerifyState = body.is_auto_verify_enabled;
        return Promise.resolve({
          ok: true,
          json: async () => ({
            is_auto_verify_enabled: autoVerifyState,
            status: "ok",
            message: "Auto-verification for new users has been enabled.",
          }),
        });
      }
      return Promise.reject(new Error("Unknown request"));
    });

    const addToastMock = vi.fn();
    render(withContext(React.createElement(UserApprovals), { ...defaultCtx, addToast: addToastMock }));

    const checkbox = screen.getByRole("checkbox", { name: /auto-verify new users/i });
    await waitFor(() => {
      expect(checkbox).not.toBeChecked();
    });

    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(checkbox).toBeChecked();
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/coordinator/auto-verify/"),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ is_auto_verify_enabled: true }),
      })
    );

    await waitFor(() => {
      expect(addToastMock).toHaveBeenCalledWith(
        expect.stringContaining("Auto-verification for new users has been enabled."),
        "success"
      );
    });
  });
});
