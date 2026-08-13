# PondBasket Demo Mode Guide

## What Demo Mode means

Demo Mode is visibly identified throughout the product. All sample farms, participants, addresses, account numbers, products, payments, delivery activity, notification delivery, disputes, and payouts are fictional. A successful mock payment is not a real payment and a recorded pilot payout is not a bank transfer.

## Operator walkthrough

| Role | Route | Demonstrable action |
|---|---|---|
| Customer | `/shop` | Filter listings by zone, species, fish form, and fulfillment method |
| Customer | `/shop/:id` | Review an item, quantity, delivery disclosure, buyer total, and save an address before reservation |
| Customer | `/orders` | Review private order records and delivery-status updates |
| Farmer | `/farm` | Submit an application and inspect the masked bank-account display and verification state |
| Administrator | `/admin` | Review farmer states, configured zones, server-enforced feature flags, commissions, and buyer-service-fee state |
| Anyone | `/legal` | View structurally complete draft policy collection with prominent legal-review notice |

## Safety guarantees implemented in this MVP

The server rejects invalid order transitions, rejects client-supplied prices, stores monetary amounts as integer kobo, creates immutable snapshots for new orders, restricts catalog species to catfish and tilapia, limits product image upload MIME types and size, masks account numbers, and keeps raw delivery PINs out of persistent records. Delivery confirmation requires an eligible status, an unexpired buyer-held PIN, a retry limit, and a customer-owned order.

## Known Demo Mode boundaries

External email, SMS, WhatsApp, Paystack, geocoding, identity verification, real phone OTP, and real bank-account-name resolution are intentionally not connected. In-app records and simulated email records demonstrate lifecycle events without representing delivery as real. Production payout automation, cards, prepared meals, customer reviews, and real marketplace transfers remain server-disabled.

