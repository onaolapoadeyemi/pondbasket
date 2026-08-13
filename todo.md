# Project TODO

- [x] Define a centralized PondBasket brand and Demo Mode configuration with service, fee, legal-language, and default commerce settings.
- [x] Model customers, farmer applications, private verification records, service areas, catalog products, orders, pricing snapshots, notifications, immutable audit events, and persistent marketplace settings.
- [x] Implement server-side role authorization for customer, farmer-application, and administrator actions.
- [x] Implement customer onboarding and private saved-address management without business-registration requirements.
- [ ] Complete farmer draft save/edit workflow and explicit progression through DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, and SUSPENDED states; masked bank-account display is complete.
- [x] Implement a strictly catfish-and-tilapia catalog with approval, service-zone, availability, fulfillment, and processing controls.
- [ ] Wire secure S3-backed product-image and private verification-document uploads into farmer/admin interfaces, including user-visible image optimization and retrieval paths; server storage records are complete.
- [x] Implement zone-aware catalog search and filters.
- [ ] Build the true single-farmer cart UI; direct checkout, integer-kobo pricing snapshots, buyer service fee defaulting to off, and delivery-fee disclosure are complete.
- [ ] Complete customer-facing inspection, delivery-PIN release/confirmation, order-timeline, and dispute-action interfaces; secure server PIN and dispute procedures are complete.
- [ ] Implement farmer dashboard flows for listing, availability, order response, and fulfillment status changes.
- [ ] Implement administrator tools for service area setup, farmer review, product approval, marketplace fees, and Demo Mode visibility.
- [ ] Complete in-app lifecycle notifications and Demo Mode email-notification records for farmer acceptance/rejection, ready, dispatched, and delivery-PIN reminder to both parties; core notification records are complete.
- [ ] Add explicit error and recovery states across all public, customer, farmer, and administrator interfaces; polished responsive navigation, loading, and empty states are complete.
- [ ] Add Vitest coverage for authorization, catalog restrictions, integer-kobo pricing snapshots, masking, and permitted status transitions.
- [x] Verify the application with type checks, tests, production build, and desktop/mobile visual inspection.
- [ ] Save a final project checkpoint and deliver the completed MVP with implementation notes.
