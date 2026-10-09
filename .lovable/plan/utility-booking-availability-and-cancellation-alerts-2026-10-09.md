# Utility booking availability and cancellation alerts

## User-facing changes
- After a utility partner accepts a new booking, require an availability estimate: minutes (10, 20, 30, 45, or 60; or a custom minute count) or days (1, 2, 3, or 7; or a custom day count).
- Show the partner's estimate in the customer's Utility Services → My bookings history.
- Let the signed-in customer cancel their own booking before work is in progress or completed.
- Notify the owning utility partner immediately in the dashboard when a customer cancels; update the booking state without affecting other request actions.

## Implementation
- Add estimate unit/value fields to utility service requests; validate the accepted transition and estimate on the database side.
- Add an authenticated cancellation RPC that only permits the booking owner to cancel eligible requests, avoiding broad customer update access.
- Enable realtime for utility service request changes; handle customer cancellations in the provider dashboard with a visible alert and refresh.
- Update booking/request types, acceptance dialog, customer history display and cancellation control.
- Add targeted tests for estimate selection/validation/display, owner-only cancellation and provider cancellation notification behavior where testable.
- Verify the preview, focused tests, build log and roadmap. Live account testing may remain unavailable because this project uses an external Supabase project without an authenticated test session.

## Technical decisions
- Cancellation is available while a booking is pending or accepted; it is not available once work is in progress, completed, or already cancelled.
- Store the estimate as an integer duration plus `minutes` or `days`, rather than an absolute date/time, so the displayed promise matches what the partner selected.
