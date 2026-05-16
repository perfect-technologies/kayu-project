import assert from "node:assert/strict";
import test from "node:test";
import { StorageService } from "./storage.service";

function fakeSupabase(signed: { signedUrl: string; token: string; path: string }) {
  return {
    storage: {
      from(bucket: string) {
        return {
          async createSignedUploadUrl(path: string) {
            return { data: { ...signed, path: `${bucket}/${path}` }, error: null };
          },
          getPublicUrl(path: string) {
            return { data: { publicUrl: `https://cdn.example/${bucket}/${path}` } };
          },
        };
      },
    },
  };
}

test("bucket + visibility policy per purpose", () => {
  const s = new StorageService(fakeSupabase({ signedUrl: "x", token: "t", path: "p" }) as never);
  assert.equal(s.bucketFor("avatar"), "avatars");
  assert.equal(s.bucketFor("portfolio"), "portfolio");
  assert.equal(s.bucketFor("verification"), "verification-docs");
  assert.equal(s.isPublic("avatar"), true);
  assert.equal(s.isPublic("portfolio"), true);
  assert.equal(s.isPublic("verification"), false);
});

test("buildObjectPath namespaces by purpose + actor and sanitizes the name", () => {
  const s = new StorageService(fakeSupabase({ signedUrl: "x", token: "t", path: "p" }) as never);
  const path = s.buildObjectPath("portfolio", "user_1", "Mon Chantier (1).JPG");
  assert.match(path, /^portfolio\/user_1\/[a-z0-9-]+-mon-chantier-1-\.jpg$/i);
});

test("assertOwnedPath accepts only the caller's namespace", () => {
  const s = new StorageService(fakeSupabase({ signedUrl: "x", token: "t", path: "p" }) as never);
  assert.equal(s.assertOwnedPath("avatar", "user_1", "avatar/user_1/abc-x.jpg"), true);
  assert.throws(() => s.assertOwnedPath("avatar", "user_1", "avatar/user_2/abc-x.jpg"));
  assert.throws(() => s.assertOwnedPath("avatar", "user_1", "portfolio/user_1/abc-x.jpg"));
});

test("resolveStoredUrl returns a public URL for public buckets, a storage ref for private", () => {
  const s = new StorageService(fakeSupabase({ signedUrl: "x", token: "t", path: "p" }) as never);
  assert.equal(
    s.resolveStoredUrl("avatar", "avatars/user_1/a.jpg"),
    "https://cdn.example/avatars/avatars/user_1/a.jpg",
  );
  assert.equal(
    s.resolveStoredUrl("verification", "verification-docs/user_1/a.jpg"),
    "storage://verification-docs/verification-docs/user_1/a.jpg",
  );
});

test("createSignedUpload returns bucket/path/token/signedUrl", async () => {
  const s = new StorageService(
    fakeSupabase({ signedUrl: "https://up", token: "tok", path: "ignored" }) as never,
  );
  const out = await s.createSignedUpload("avatar", "user_1", "pic.png");
  assert.equal(out.bucket, "avatars");
  assert.equal(out.token, "tok");
  assert.equal(out.signedUrl, "https://up");
  assert.match(out.path, /^avatar\/user_1\//);
});

test("assertOwnedPath rejects path traversal and malformed paths", () => {
  const s = new StorageService(fakeSupabase({ signedUrl: "x", token: "t", path: "p" }) as never);
  assert.throws(() => s.assertOwnedPath("avatar", "user_1", "avatar/user_1/../verification-docs/x.pdf"));
  assert.throws(() => s.assertOwnedPath("avatar", "user_1", "avatar/user_1/a\\b.jpg"));
  assert.throws(() => s.assertOwnedPath("avatar", "user_1", "/avatar/user_1/x.jpg"));
  assert.throws(() => s.assertOwnedPath("avatar", "user_1", "avatar/user_1/"));
  assert.throws(() => s.assertOwnedPath("avatar", "user_1", "avatar/user_1//x.jpg"));
  // still accepts a well-formed path:
  assert.equal(s.assertOwnedPath("avatar", "user_1", "avatar/user_1/abc-x.jpg"), true);
});
