# Customer location on utility service bookings

Make the booking form on Utility Services use the customer's saved address, ask for a location when none exists, save it back to the profile addresses, and let admin switch this off for services that don't need a location.

## What the customer sees

- Opening "Order Now" / "Request Service" pre-fills name, phone and full address from their default saved address (falls back to the most recent one).
- A small address block at the top of the form shows the chosen address with a "Change" option when they have more than one saved.
- If nothing is saved: the form shows an "Add your delivery location" panel with address fields plus a "Use my current location" button (same behaviour as the profile address book). On submit, the address is saved to their saved addresses (marked default if it is their first) and used for the request.
- Services the admin marks as "no location needed" skip all of this — only name and phone are asked.

## What admin gets

- A "Location required" switch on each utility service (in the add/edit form and as a column toggle in the services table), on by default.

## Technical notes

Database (one migration):
- Add `requires_location boolean not null default true` to `utility_services`.
- Add `address_id uuid references public.customer_addresses(id)` plus `latitude`/`longitude` (double precision) to `utility_service_requests` so the provider knows exactly where to go.

Frontend:
- `src/pages/UtilityServices.tsx`: on opening the booking dialog, load `customer_addresses` for the user, order by `is_default desc, created_at desc`, pick the first. Compose the `address` text from line1/line2/landmark/city/state/pincode. Store `address_id`, `latitude`, `longitude` on insert. Gate the whole address section behind `booking.requires_location`, and require a selected/entered address before submit when it is true.
- Extract the address form fields + geolocation capture from `AddressBook.tsx` into a shared piece (`src/components/customer/AddressFormFields.tsx`) so the profile page and the booking dialog stay in sync; `AddressBook.tsx` keeps its current behaviour.
- `src/types` for utility services (`src/lib/utilityServices.ts`): add `requires_location` to `UtilityService`.
- `src/pages/admin/UtilityServicesPage.tsx`: add the field to `svcForm`, the save payload, the edit loader, the form switch and a table toggle via `toggleServiceField`.
- `src/pages/utility-partner/Dashboard.tsx`: show the request's pinned coordinates as a Google Maps link when present.
