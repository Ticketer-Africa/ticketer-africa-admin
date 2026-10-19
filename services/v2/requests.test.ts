import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "./client";
import { createAndMaybeSelfApprove } from "./requests";

const { adminPost } = vi.hoisted(() => ({ adminPost: vi.fn() }));
vi.mock("./client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./client")>();
  return { ...actual, adminPost };
});

const input = {
  type: "REFUND" as const,
  targetId: "txn_1",
  payload: { mode: "KORAPAY" },
  reason: "Buyer was charged twice for one order",
};

beforeEach(() => adminPost.mockReset());

describe("createAndMaybeSelfApprove", () => {
  it("only creates the request when not self-approving", async () => {
    adminPost.mockResolvedValueOnce({ id: "req_1", status: "PENDING" });
    const outcome = await createAndMaybeSelfApprove(input, { selfApprove: false });
    expect(adminPost).toHaveBeenCalledTimes(1);
    expect(adminPost).toHaveBeenCalledWith("/requests", input);
    expect(outcome).toEqual({ request: { id: "req_1", status: "PENDING" }, selfApproved: false });
  });

  it("creates, then approves it with selfApprove and the same reason", async () => {
    adminPost
      .mockResolvedValueOnce({ id: "req_1", status: "PENDING" })
      .mockResolvedValueOnce({ id: "req_1", status: "EXECUTED" });
    const outcome = await createAndMaybeSelfApprove(input, { selfApprove: true });
    expect(adminPost).toHaveBeenNthCalledWith(1, "/requests", input);
    expect(adminPost).toHaveBeenNthCalledWith(2, "/requests/req_1/approve", {
      selfApprove: true,
      reason: input.reason,
    });
    expect(outcome).toEqual({ request: { id: "req_1", status: "EXECUTED" }, selfApproved: true });
  });

  it("keeps the created request when the self-approval fails", async () => {
    adminPost
      .mockResolvedValueOnce({ id: "req_1", status: "PENDING" })
      .mockRejectedValueOnce(new ApiError(400, "A reason of at least 20 characters is required"));
    const outcome = await createAndMaybeSelfApprove(input, { selfApprove: true });
    expect(outcome).toEqual({
      request: { id: "req_1", status: "PENDING" },
      selfApproved: false,
      selfApproveError: "A reason of at least 20 characters is required",
    });
  });

  it("throws when the request itself can't be created", async () => {
    adminPost.mockRejectedValueOnce(new ApiError(400, "Resale refunds aren't supported yet"));
    await expect(createAndMaybeSelfApprove(input, { selfApprove: true })).rejects.toThrow(
      "Resale refunds aren't supported yet",
    );
    expect(adminPost).toHaveBeenCalledTimes(1);
  });
});
