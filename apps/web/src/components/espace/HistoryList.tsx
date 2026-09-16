import type { BookingCard as BookingCardDto } from "@kayu/schemas";
import { BookingCard } from "@/components/bookings/BookingCard";
import { ClientRatingForm } from "@/components/bookings/ClientRatingForm";
import { espaceCopy } from "@/copy/espace";

const copy = espaceCopy.history;

/** Non-pending bookings received; completed ones carry the client rating form until rated. */
export function HistoryList({ bookings }: { bookings: BookingCardDto[] }) {
  const items = bookings.filter((booking) => booking.status !== "PENDING");
  if (items.length === 0) {
    return <p className="rounded-3xl border-2 border-dashed border-border bg-white/60 p-6 text-center text-sm text-muted-foreground">{copy.empty}</p>;
  }
  return (
    <div className="space-y-3">
      {items.map((booking) => (
        <BookingCard key={booking.id} booking={booking} perspective="provider">
          {booking.status === "COMPLETED" && !booking.hasClientReview && <ClientRatingForm bookingId={booking.id} />}
        </BookingCard>
      ))}
    </div>
  );
}
