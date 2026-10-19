import { AxiosError, type AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";
import { NETWORK_ERROR_MESSAGE, toApiError } from "./client";

const failed = (status: number, data: unknown) =>
  new AxiosError("failed", "ERR_BAD_REQUEST", undefined, undefined, {
    status,
    data,
  } as AxiosResponse);

describe("toApiError", () => {
  it("keeps the backend's message", async () => {
    const error = await toApiError(failed(400, { message: "User is already suspended" }));
    expect(error).toMatchObject({ status: 400, message: "User is already suspended" });
  });

  it("joins validation messages", async () => {
    const error = await toApiError(failed(400, { message: ["role must be a string", "reason is required"] }));
    expect(error.message).toBe("role must be a string. reason is required");
  });

  it("rewrites Nest's 'Forbidden resource' for people", async () => {
    const error = await toApiError(failed(403, { message: "Forbidden resource" }));
    expect(error).toMatchObject({ status: 403, message: "You don't have permission to do that." });
  });

  it("keeps a specific 403 message", async () => {
    const error = await toApiError(failed(403, { message: "This account is suspended" }));
    expect(error.message).toBe("This account is suspended");
  });

  it("reports a request with no response as a network error", async () => {
    const error = await toApiError(new AxiosError("Network Error", "ERR_NETWORK"));
    expect(error).toMatchObject({ status: 0, message: NETWORK_ERROR_MESSAGE });
  });
});
