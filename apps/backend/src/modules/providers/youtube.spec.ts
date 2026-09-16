import assert from "node:assert/strict";
import test from "node:test";
import { parseYouTubeUrl } from "./youtube";

test("accepts watch, short link, shorts, embed and live URLs", () => {
  for (const url of [
    "https://youtu.be/M7lc1UVf-VE",
    "https://www.youtube.com/watch?feature=share&v=M7lc1UVf-VE",
    "https://youtube.com/shorts/M7lc1UVf-VE",
    "https://m.youtube.com/embed/M7lc1UVf-VE",
    "https://www.youtube.com/live/M7lc1UVf-VE/",
  ]) {
    const parsed = parseYouTubeUrl(url);
    assert.equal(parsed?.id, "M7lc1UVf-VE", url);
    assert.equal(parsed?.watchUrl, "https://www.youtube.com/watch?v=M7lc1UVf-VE");
    assert.equal(parsed?.embedUrl, "https://www.youtube-nocookie.com/embed/M7lc1UVf-VE");
  }
});

test("rejects deceptive hosts, credentials, plain http and bad ids", () => {
  for (const url of [
    "https://evil.test/youtube.com/watch?v=M7lc1UVf-VE",
    "https://youtube.com.evil.test/watch?v=M7lc1UVf-VE",
    "https://evil@youtube.com/watch?v=M7lc1UVf-VE",
    "http://www.youtube.com/watch?v=M7lc1UVf-VE",
    "https://www.youtube.com:8443/watch?v=M7lc1UVf-VE",
    "javascript:alert(1)",
    "https://www.youtube.com/watch?v=short",
    "https://www.youtube.com/channel/UC123",
    "",
    null,
  ]) {
    assert.equal(parseYouTubeUrl(url), null, String(url));
  }
});
