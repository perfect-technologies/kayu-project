import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const PUBLIC_COPY_FILES = [
  "apps/web/src/app/layout.tsx",
  "apps/web/src/app/launch/CampaignLanding.tsx",
  "apps/web/src/app/launch/CampaignForm.tsx",
  "apps/web/src/app/launch/providers/page.tsx",
  "apps/web/src/app/launch/clients/page.tsx",
  "apps/web/src/app/launch/confidentialite/page.tsx",
];

test("public campaign copy consistently uses the forthcoming Kinshasa launch narrative", async () => {
  const copy = (
    await Promise.all(
      PUBLIC_COPY_FILES.map((file) => readFile(file, "utf8")),
    )
  ).join("\n");

  assert.match(copy, /KAYOU arrive bientôt à/);
  assert.match(copy, /Préinscrivez-vous gratuitement/);
  assert.match(copy, /premiers prestataires KAYOU/);
  assert.match(copy, /prestataire de confiance/);
  assert.match(copy, /href="\/launch\/confidentialite"/);
  assert.match(copy, /Version \{privacyNoticeVersion\}/);
  assert.doesNotMatch(
    copy,
    /\bb[eê]ta\b|b[eê]ta-test|waitlist|liste d.attente|test privé/iu,
  );
});
