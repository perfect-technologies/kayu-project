import assert from "node:assert/strict";
import test from "node:test";
import type { Actor } from "../../common/auth/types";
import { buildProfileBlock, buildSuggestions, loadProfileData, type ProfileData, type ProfileDeps } from "./agent.profile";

const actor = { id: "user_1", role: "CLIENT", firstName: "Paul", phone: "+243819000001", isActive: true } as Actor;

function card(id: string, status: string, date: string, time: string, provider: { id: string; name: string; category: string | null }) {
  return {
    id,
    status,
    scheduledAt: new Date(`${date}T${time}:00+01:00`),
    scheduledLocal: { date, time },
    durationMin: 60,
    timezone: "Africa/Kinshasa",
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    agreedPrice: null,
    isPaid: false,
    cancelReason: null,
    cancelledAt: null,
    side: "client" as const,
    counterpart: { userId: `u_${provider.id}`, providerId: provider.id, name: provider.name, photo: null, categoryLabel: provider.category },
    clientRating: null,
    hasReview: false,
    hasClientReview: false,
  };
}

const jean = { id: "p_jean", name: "Jean Kasongo", category: "Plomberie" };
const marie = { id: "p_marie", name: "Marie Ilunga", category: "Ménage" };
const marc = { id: "p_marc", name: "Marc Ndaye", category: null };

const chain = [
  { id: "cd", kind: "COUNTRY", label: "RDC", parentId: null, hasChildren: true },
  { id: "kin", kind: "CITY", label: "Kinshasa", parentId: "cd", hasChildren: true },
  { id: "gombe", kind: "COMMUNE", label: "Gombe", parentId: "kin", hasChildren: true },
];

function fixture(): ProfileData {
  return {
    firstName: "Paul",
    phoneKnown: true,
    addresses: [
      { id: "addr_1", label: "HOME", recipient: null, addressLine: "12 avenue de la Justice", placeId: "gombe", placeChain: chain, country: "RDC", latitude: null, longitude: null, isDefault: true, createdAt: new Date(0), updatedAt: new Date(0) },
      { id: "addr_2", label: "WORK", recipient: null, addressLine: "Boulevard du 30 juin", placeId: null, placeChain: [], country: "RDC", latitude: null, longitude: null, isDefault: false, createdAt: new Date(0), updatedAt: new Date(0) },
    ] as never,
    completed: [card("b_1", "COMPLETED", "2026-09-05", "09:00", jean), card("b_2", "COMPLETED", "2026-08-20", "14:00", marc)] as never,
    open: [card("b_3", "PENDING", "2026-09-21", "10:00", marie), card("b_4", "CONFIRMED", "2026-09-25", "08:00", jean)] as never,
    conversations: [
      { id: "c_1", subject: null, lastMessageAt: new Date("2026-09-10T15:00:00.000Z"), lastPreview: "Merci", unread: 0, side: "client", counterpart: { userId: "u_p_jean", providerId: "p_jean", name: "Jean Kasongo", photo: null }, blocked: false, createdAt: new Date(0) },
    ] as never,
    reviews: [
      { id: "r_1", bookingId: "b_1", providerId: "p_jean", clientId: "user_1", rating: 5, comment: "Travail propre et rapide, je recommande.", reply: null, repliedAt: null, isPublic: true, createdAt: new Date(0), provider: { id: "p_jean", displayName: "Jean Kasongo", profilePhoto: null }, booking: { id: "b_1", scheduledAt: new Date(0), scheduledLocal: { date: "2026-09-05", time: "09:00" } } },
      { id: "r_2", bookingId: "b_2", providerId: "p_marc", clientId: "user_1", rating: 2, comment: null, reply: null, repliedAt: null, isPublic: true, createdAt: new Date(0), provider: { id: "p_marc", displayName: "Marc Ndaye", profilePhoto: null }, booking: { id: "b_2", scheduledAt: new Date(0), scheduledLocal: { date: "2026-08-20", time: "14:00" } } },
    ] as never,
    lastCompletedPlace: "Gombe",
  };
}

test("profile block is deterministic for a fixed dataset and surfaces low ratings", () => {
  const block = buildProfileBlock(fixture());
  assert.equal(block, buildProfileBlock(fixture()));
  assert.equal(
    block,
    [
      "Profil du client (mémoire déterministe, reconstruite à chaque tour) :",
      "Identité : Paul ; téléphone connu.",
      "Adresses enregistrées : « Domicile » (addressId addr_1, par défaut) RDC › Kinshasa › Gombe ; « Travail » (addressId addr_2) lieu non précisé.",
      "Dernières prestations terminées : Jean Kasongo (providerId p_jean), Plomberie, samedi 5 septembre 2026, note donnée 5/5 ; Marc Ndaye (providerId p_marc), catégorie inconnue, jeudi 20 août 2026, note donnée 2/5.",
      "Réservations en cours : Marie Ilunga (providerId p_marie), Ménage, lundi 21 septembre 2026 à 10:00, en attente de confirmation (bookingId b_3) ; Jean Kasongo (providerId p_jean), Plomberie, vendredi 25 septembre 2026 à 08:00, confirmée (bookingId b_4).",
      "Dernières conversations : Jean Kasongo (providerId p_jean), dernier message le 10 septembre 2026.",
      "Avis rédigés par le client : Jean Kasongo (providerId p_jean) 5/5 « Travail propre et rapide, je recommande. » ; Marc Ndaye (providerId p_marc) 2/5 — note basse, à signaler si tu le proposes.",
    ].join("\n"),
  );
  assert.doesNotMatch(block, /avenue de la Justice|\+243/);
});

test("empty sections are omitted and an unknown phone is stated", () => {
  const block = buildProfileBlock({ firstName: null, phoneKnown: false, addresses: [], completed: [], open: [], conversations: [], reviews: [], lastCompletedPlace: null });
  assert.equal(block, "Profil du client (mémoire déterministe, reconstruite à chaque tour) :\nIdentité : prénom inconnu ; téléphone inconnu.");
});

test("personal chips name the last provider, the last category and the last place, three at most", () => {
  assert.deepEqual(buildSuggestions(fixture()), [
    { text: "Recontacter Jean Kasongo", providerId: "p_jean" },
    { text: "Réserver à nouveau : Plomberie", providerId: "p_jean" },
    { text: "Comme la dernière fois à Gombe", providerId: "p_jean" },
  ]);
  const one = fixture();
  one.conversations = [];
  one.completed = [card("b_1", "COMPLETED", "2026-09-05", "09:00", jean)] as never;
  one.lastCompletedPlace = null;
  assert.deepEqual(buildSuggestions(one), [
    { text: "Recontacter Jean Kasongo", providerId: "p_jean" },
    { text: "Réserver à nouveau : Plomberie", providerId: "p_jean" },
  ]);
  assert.deepEqual(buildSuggestions({ ...one, completed: [], conversations: [], reviews: [] }), []);
});

test("loadProfileData reads through the services with the actor as viewer and the contract queries", async () => {
  const calls: Record<string, unknown[]> = { addresses: [], bookings: [], get: [], messaging: [], reviews: [] };
  const deps: ProfileDeps = {
    addresses: { list: async (viewer, query) => (calls.addresses.push([viewer, query]), { items: [], total: 0, page: 1, limit: 50 }) as never },
    bookings: {
      list: async (viewer, query) => {
        calls.bookings.push([viewer, query]);
        const items = query.status === "COMPLETED" ? [card("b_1", "COMPLETED", "2026-09-05", "09:00", jean)] : query.status === "PENDING" ? [card("b_3", "PENDING", "2026-09-30", "10:00", marie)] : [card("b_4", "CONFIRMED", "2026-09-25", "08:00", jean)];
        return { items, total: items.length, page: 1, limit: query.limit } as never;
      },
      get: async (viewer, id) => (calls.get.push([viewer, id]), { placeChain: chain }) as never,
    },
    messaging: { list: async (viewer, query) => (calls.messaging.push([viewer, query]), { items: [], total: 0, page: 1, limit: 3, unreadTotal: 0 }) as never },
    reviews: { mine: async (viewer) => (calls.reviews.push(viewer), { reviews: [], toReview: [] }) as never },
  };

  const data = await loadProfileData(actor, deps);
  assert.equal(data.firstName, "Paul");
  assert.equal(data.phoneKnown, true);
  assert.equal(data.lastCompletedPlace, "Gombe");
  assert.deepEqual(data.open.map((b) => b.id), ["b_4", "b_3"]);
  assert.deepEqual(calls.get[0], [actor, "b_1"]);
  assert.deepEqual(
    (calls.bookings as Array<[Actor, { status?: string; limit: number }]>).map(([viewer, query]) => [viewer === actor, query.status, query.limit]),
    [[true, "COMPLETED", 3], [true, "PENDING", 5], [true, "CONFIRMED", 5]],
  );
  assert.equal((calls.messaging[0] as [Actor, { limit: number }])[1].limit, 3);
  assert.equal(calls.reviews[0], actor);
});
