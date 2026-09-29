import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { AutoApproveToggle } from "../assets/components/AutoApproveToggle.jsx";

describe("AutoApproveToggle Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the toggle with label 'Enable Auto-Approval for New Matches'", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ is_auto_approve_enabled: false, status: "ok" }),
    });

    render(React.createElement(AutoApproveToggle));

    expect(screen.getByText("Enable Auto-Approval for New Matches")).toBeInTheDocument();
    
    await waitFor(() => {
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).not.toBeChecked();
    });
  });

  it("fetches initial state and toggles via PATCH request", async () => {
    let autoApproveState = false;
    globalThis.fetch = vi.fn().mockImplementation((url, opts) => {
      if (!opts || opts.method === "GET" || !opts.method) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ is_auto_approve_enabled: autoApproveState, status: "ok" }),
        });
      }
      if (opts.method === "PATCH") {
        const body = JSON.parse(opts.body);
        autoApproveState = body.is_auto_approve_enabled;
        return Promise.resolve({
          ok: true,
          json: async () => ({
            is_auto_approve_enabled: autoApproveState,
            status: "ok",
            message: "Auto-approval for new matches has been enabled.",
          }),
        });
      }
      return Promise.reject(new Error("Unknown request"));
    });

    const addToastMock = vi.fn();
    render(React.createElement(AutoApproveToggle, { addToast: addToastMock }));

    const checkbox = screen.getByRole("checkbox");
    await waitFor(() => {
      expect(checkbox).not.toBeChecked();
    });

    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(checkbox).toBeChecked();
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/coordinator/auto-approve/"),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ is_auto_approve_enabled: true }),
      })
    );

    await waitFor(() => {
      expect(addToastMock).toHaveBeenCalledWith(
        expect.stringContaining("Auto-approval for new matches has been enabled."),
        "success"
      );
    });
  });
});
