import assert from "node:assert/strict";
import test from "node:test";
import { YOUTUBE_HOSTS, parseYouTubeUrl } from "../dist/index.js";

const ID = "M7lc1UVf-VE";

test("accepts every supported URL shape on every allowed host", () => {
  for (const url of [
    `https://www.youtube.com/watch?v=${ID}`,
    `https://youtube.com/watch?feature=share&v=${ID}`,
    `https://m.youtube.com/watch?v=${ID}&t=42`,
    `https://youtu.be/${ID}`,
    `https://youtu.be/${ID}?si=abc`,
    `https://www.youtube.com/shorts/${ID}`,
    `https://youtube.com/embed/${ID}`,
    `https://www.youtube-nocookie.com/embed/${ID}`,
    `https://www.youtube.com/live/${ID}/`,
    `  https://WWW.YouTube.com/watch?v=${ID}  `,
  ]) {
    assert.deepEqual(
      parseYouTubeUrl(url),
      {
        id: ID,
        watchUrl: `https://www.youtube.com/watch?v=${ID}`,
        embedUrl: `https://www.youtube-nocookie.com/embed/${ID}`,
        thumbnailUrl: `https://i.ytimg.com/vi/${ID}/hqdefault.jpg`,
      },
      url,
    );
  }
});

test("rejects deceptive hosts: exact host match only, no suffix or path tricks", () => {
  for (const url of [
    `https://youtube.com.evil.example/watch?v=${ID}`,
    `https://evil.example/youtube.com/watch?v=${ID}`,
    `https://notyoutube.com/watch?v=${ID}`,
    `https://music.youtube.com/watch?v=${ID}`,
    `https://youtube-nocookie.com/embed/${ID}`,
    `https://evil@youtube.com/watch?v=${ID}`,
    `https://user:pass@www.youtube.com/watch?v=${ID}`,
    `https://www.youtube.com:8443/watch?v=${ID}`,
    `http://www.youtube.com/watch?v=${ID}`,
    `javascript:alert(1)`,
  ]) {
    assert.equal(parseYouTubeUrl(url), null, url);
  }
  assert.equal(YOUTUBE_HOSTS.includes("music.youtube.com"), false);
});

test("rejects bad ids and non-video paths", () => {
  for (const url of [
    "https://www.youtube.com/watch?v=short",
    `https://www.youtube.com/watch?v=${ID}x`,
    "https://www.youtube.com/watch?v=M7lc1UVf+VE",
    "https://youtu.be/",
    `https://youtu.be/${ID}/extra`,
    `https://www.youtube.com/shorts/${ID}/extra`,
    "https://www.youtube.com/channel/UC1234567890",
    `https://www.youtube.com/v/${ID}`,
    "not a url",
    "",
    null,
    undefined,
  ]) {
    assert.equal(parseYouTubeUrl(url), null, String(url));
  }
});
