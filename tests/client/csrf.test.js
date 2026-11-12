import { api } from "../../client/src/api.js";

function getHeader(headers, name) {
  if (!headers) return undefined;

  if (typeof headers.get === "function") {
    return headers.get(name);
  }

  return headers[name] ?? headers[name.toLowerCase()];
}

describe("client api CSRF behavior", () => {
  let captured;

  beforeEach(() => {
    captured = [];

    api.defaults.adapter = async (config) => {
      if ((config.url || "").includes("/csrf-token")) {
        return {
          data: { csrfToken: "test-token" },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        };
      }

      captured.push(config);

      return {
        data: {},
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    };
  });

  test("requests are sent with credentials", () => {
    expect(api.defaults.withCredentials).toBe(true);
  });

  test("a mutating request carries the x-csrf-token header", async () => {
    await api.post("/maintenance", {
      roomNumber: "B2-104",
      category: "plumbing",
      description: "Leaking tap",
    });

    const sent = captured.find((c) => (c.url || "").includes("/maintenance"));

    expect(sent).toBeDefined();
    expect(getHeader(sent.headers, "x-csrf-token")).toBe("test-token");
  });
});
