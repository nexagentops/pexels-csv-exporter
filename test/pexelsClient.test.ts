import assert from "node:assert/strict";
import test from "node:test";
import { PexelsApiError, searchPexels, type FetchLike } from "../src/pexelsClient.js";

test("searchPexels paginates and sends the environment secret in the Authorization header", async () => {
  const calls: Array<{ url: URL; authorization: string | null }> = [];

  const fetchImpl: FetchLike = async (url, init) => {
    const headers = new Headers(init?.headers);
    calls.push({
      url,
      authorization: headers.get("Authorization")
    });

    if (url.searchParams.get("page") === "1") {
      return new Response(
        JSON.stringify({
          page: 1,
          per_page: 2,
          total_results: 3,
          next_page: "https://api.pexels.com/v1/search?page=2&per_page=2",
          photos: [
            {
              id: 1,
              width: 100,
              height: 100,
              url: "https://www.pexels.com/photo/1/",
              photographer: "A",
              photographer_url: "https://www.pexels.com/@a",
              photographer_id: 10
            },
            {
              id: 2,
              width: 100,
              height: 100,
              url: "https://www.pexels.com/photo/2/",
              photographer: "B",
              photographer_url: "https://www.pexels.com/@b",
              photographer_id: 20
            }
          ]
        }),
        {
          headers: {
            "X-Ratelimit-Limit": "20000",
            "X-Ratelimit-Remaining": "19999",
            "X-Ratelimit-Reset": "1770000000"
          }
        }
      );
    }

    return new Response(
      JSON.stringify({
        page: 2,
        per_page: 1,
        total_results: 3,
        photos: [
          {
            id: 3,
            width: 100,
            height: 100,
            url: "https://www.pexels.com/photo/3/",
            photographer: "C",
            photographer_url: "https://www.pexels.com/@c",
            photographer_id: 30
          }
        ]
      }),
      {
        headers: {
          "X-Ratelimit-Limit": "20000",
          "X-Ratelimit-Remaining": "19998",
          "X-Ratelimit-Reset": "1770000000"
        }
      }
    );
  };

  const result = await searchPexels({
    apiKey: "unit-test-placeholder",
    type: "photos",
    query: "coffee",
    limit: 3,
    perPage: 2,
    filters: {},
    fetchImpl
  });

  assert.equal(result.type, "photos");
  assert.equal(result.items.length, 3);
  assert.equal(result.pagesFetched, 2);
  assert.deepEqual(result.rateLimit, {
    limit: "20000",
    remaining: "19998",
    reset: "1770000000"
  });
  assert.equal(calls[0]?.authorization, "unit-test-placeholder");
  assert.equal(calls[0]?.url.searchParams.get("per_page"), "2");
  assert.equal(calls[1]?.url.searchParams.get("per_page"), "1");
});

test("searchPexels does not expose the secret in API error messages or response bodies", async () => {
  const fetchImpl: FetchLike = async () =>
    new Response("rejected unit-test-placeholder", {
      status: 401,
      headers: {
        "X-Ratelimit-Remaining": "19997"
      }
    });

  await assert.rejects(
    searchPexels({
      apiKey: "unit-test-placeholder",
      type: "photos",
      query: "coffee",
      limit: 1,
      perPage: 1,
      filters: {},
      fetchImpl
    }),
    (error) => {
      assert.ok(error instanceof PexelsApiError);
      assert.equal(error.message.includes("unit-test-placeholder"), false);
      assert.equal(error.responseBody?.includes("unit-test-placeholder"), false);
      assert.equal(error.responseBody, "rejected [REDACTED]");
      assert.equal(error.rateLimit.remaining, "19997");
      return true;
    }
  );
});

test("searchPexels uses the current documented v1 video search endpoint", async () => {
  const requestedUrls: URL[] = [];
  const fetchImpl: FetchLike = async (url) => {
    requestedUrls.push(url);
    return new Response(
      JSON.stringify({
        page: 1,
        per_page: 1,
        total_results: 0,
        videos: []
      })
    );
  };

  await searchPexels({
    apiKey: "unit-test-placeholder",
    type: "videos",
    query: "workspace",
    limit: 1,
    perPage: 1,
    filters: {},
    fetchImpl
  });

  assert.equal(requestedUrls[0]?.toString(), "https://api.pexels.com/v1/videos/search?query=workspace&page=1&per_page=1");
});
