import assert from "node:assert/strict";
import test from "node:test";
import { StorageService } from "./storage.service";

function fakeSupabase(options: { removeError?: string } = {}) {
  const removed: Array<{ bucket: string; paths: string[] }> = [];
  return {
    removed,
    storage: {
      from(bucket: string) {
        return {
          async createSignedUploadUrl(path: string) {
            return { data: { signedUrl: "https://up", token: "tok", path: `${bucket}/${path}` }, error: null };
          },
          async createSignedUrl(path: string, expiresIn: number) {
            return { data: { signedUrl: `https://signed/${bucket}/${path}?e=${expiresIn}` }, error: null };
          },
          getPublicUrl(path: string) {
            return { data: { publicUrl: `https://cdn.example/storage/v1/object/public/${bucket}/${path}` } };
          },
          async remove(paths: string[]) {
            removed.push({ bucket, paths });
            return { data: [], error: options.removeError ? { message: options.removeError } : null };
          },
        };
      },
    },
  };
}

function withPrefix<T>(prefix: string | undefined, run: () => T): T {
  const prev = process.env.STORAGE_ENV_PREFIX;
  if (prefix === undefined) delete process.env.STORAGE_ENV_PREFIX;
  else process.env.STORAGE_ENV_PREFIX = prefix;
  try {
    return run();
  } finally {
    if (prev === undefined) delete process.env.STORAGE_ENV_PREFIX;
    else process.env.STORAGE_ENV_PREFIX = prev;
  }
}

test("bucket + visibility policy per purpose", () => {
  const s = new StorageService(fakeSupabase() as never);
  assert.equal(s.bucketFor("avatar"), "avatars");
  assert.equal(s.bucketFor("media"), "provider-media");
  assert.equal(s.bucketFor("attachments"), "message-attachments");
  assert.equal(s.bucketFor("verification"), "verification-docs");
  assert.equal(s.isPublic("avatar"), true);
  assert.equal(s.isPublic("media"), true);
  assert.equal(s.isPublic("attachments"), false);
  assert.equal(s.isPublic("verification"), false);
});

test("buildObjectPath namespaces by purpose + actor and sanitizes the name", () => {
  withPrefix(undefined, () => {
    const s = new StorageService(fakeSupabase() as never);
    const path = s.buildObjectPath("media", "user_1", "Mon Chantier (1).JPG");
    assert.match(path, /^media\/user_1\/[a-z0-9-]+-mon-chantier-1-\.jpg$/i);
  });
});

test("assertOwnedPath accepts only the caller's namespace and rejects traversal", () => {
  withPrefix(undefined, () => {
    const s = new StorageService(fakeSupabase() as never);
    assert.equal(s.assertOwnedPath("avatar", "user_1", "avatar/user_1/abc-x.jpg"), true);
    assert.throws(() => s.assertOwnedPath("avatar", "user_1", "avatar/user_2/abc-x.jpg"));
    assert.throws(() => s.assertOwnedPath("avatar", "user_1", "media/user_1/abc-x.jpg"));
    assert.throws(() => s.assertOwnedPath("avatar", "user_1", "avatar/user_1/../verification/x.pdf"));
    assert.throws(() => s.assertOwnedPath("avatar", "user_1", "avatar/user_1/a\\b.jpg"));
    assert.throws(() => s.assertOwnedPath("avatar", "user_1", "/avatar/user_1/x.jpg"));
    assert.throws(() => s.assertOwnedPath("avatar", "user_1", "avatar/user_1/"));
    assert.throws(() => s.assertOwnedPath("avatar", "user_1", "avatar/user_1//x.jpg"));
  });
});

test("prefixes object paths with STORAGE_ENV_PREFIX and parses them back", () => {
  withPrefix("prod", () => {
    const s = new StorageService(fakeSupabase() as never);
    const path = s.buildObjectPath("attachments", "user_1", "voice.webm");
    assert.match(path, /^prod\/attachments\/user_1\//);
    assert.deepEqual(s.parsePath(path), { purpose: "attachments", ownerId: "user_1" });
    assert.equal(s.parsePath("attachments/user_1/x.webm"), null);
    assert.equal(s.parsePath("prod/unknown/user_1/x.webm"), null);
  });
});

test("assertUploadAllowed enforces mime lists and size caps per purpose", () => {
  const s = new StorageService(fakeSupabase() as never);
  s.assertUploadAllowed("media", "video/mp4", 20 * 1024 * 1024);
  s.assertUploadAllowed("verification", "application/pdf", 1024);
  s.assertUploadAllowed("attachments", "audio/webm");
  assert.throws(() => s.assertUploadAllowed("avatar", "video/mp4"));
  assert.throws(() => s.assertUploadAllowed("media", "video/mp4", 26 * 1024 * 1024));
  assert.throws(() => s.assertUploadAllowed("attachments", "application/pdf"));
});

test("createSignedUpload and createSignedRead go to the purpose bucket", async () => {
  await withPrefix(undefined, async () => {
    const s = new StorageService(fakeSupabase() as never);
    const upload = await s.createSignedUpload("avatar", "user_1", "pic.png");
    assert.equal(upload.bucket, "avatars");
    assert.equal(upload.token, "tok");
    assert.match(upload.path, /^avatar\/user_1\//);

    const read = await s.createSignedRead("attachments", "attachments/user_1/a.webm");
    assert.match(read.url, /^https:\/\/signed\/message-attachments\/attachments\/user_1\/a\.webm/);
    assert.ok(Date.parse(read.expiresAt) > Date.now());
  });
});

test("objectFromUrl recovers the stored object behind a public URL", () => {
  withPrefix(undefined, () => {
    const s = new StorageService(fakeSupabase() as never);
    const url = s.resolveStoredUrl("media", "media/user_1/abc-photo.jpg");
    assert.deepEqual(s.objectFromUrl(url), { purpose: "media", path: "media/user_1/abc-photo.jpg" });
    assert.equal(s.objectFromUrl("https://picsum.photos/seed/x/900/650"), null);
    assert.equal(s.objectFromUrl(null), null);
  });
});

test("removeObjects groups by bucket and journals failures without throwing", async () => {
  const supabase = fakeSupabase({ removeError: "boom" });
  const logs: unknown[] = [];
  const s = new StorageService(supabase as never, { log: async (entry: unknown) => logs.push(entry) } as never);

  await s.removeObjects(
    [
      { purpose: "media", path: "media/u/a.jpg" },
      { purpose: "media", path: "media/u/a.jpg" },
      { purpose: "attachments", path: "attachments/u/b.webm" },
    ],
    "user_1",
  );

  assert.deepEqual(supabase.removed, [
    { bucket: "provider-media", paths: ["media/u/a.jpg"] },
    { bucket: "message-attachments", paths: ["attachments/u/b.webm"] },
  ]);
  assert.equal(logs.length, 2);
  assert.equal((logs[0] as { entityType: string }).entityType, "storage");
});
