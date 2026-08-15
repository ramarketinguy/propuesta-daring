# Daring Admin Infrastructure Design

## Goal

Add a protected operational panel and Cloudflare-backed commerce infrastructure without exposing free-form design editing.

## Scope

- Public landing remains visually controlled by code.
- Admin can manage stock, orders, metrics, and testimonials.
- Testimonials support text plus image or video media.
- Checkout collects shipping data in a landing modal, then opens Mercado Pago Checkout Pro.
- A Mercado Pago webhook is the only source of truth for approved sales.
- Approved payments update orders, stock, sales metrics, and confirmation email delivery.
- Public landing displays approved sales count and available stock.

## Architecture

- Cloudflare Pages hosts the landing and admin interface from the existing GitHub repository.
- Pages Functions or a Worker API handles authentication, orders, stock, metrics, media authorization, Mercado Pago webhooks, and email dispatch.
- D1 stores users, products, stock movements, orders, checkout events, and testimonials.
- R2 stores testimonial images, videos, recipe files, and other private/public media through controlled URLs.
- The initial implementation avoids Cloudflare Stream to keep early costs low; Stream can be added if video volume justifies it.

## Security

- Admin credentials are stored as password hashes, never plaintext.
- Sessions use secure, HTTP-only cookies with expiration and revocation.
- Mercado Pago and email credentials are Cloudflare secrets, never repository files.
- Uploads are restricted by authenticated admin access, MIME type, size, and object prefix.
- Webhooks are idempotent and verify payment status through Mercado Pago before changing stock.

## Delivery Order

1. Cloudflare project configuration and local API skeleton.
2. D1 schema and migrations.
3. Admin authentication and protected shell.
4. Stock, orders, and metrics API.
5. Testimonial media management.
6. Checkout modal and Mercado Pago integration.
7. Webhook confirmation, stock reservation, and email delivery.
8. Public sales/stock counter and production deployment.
