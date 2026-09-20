# My UPI Pay — PWA

A mobile-first Progressive Web App for fast exact-amount UPI payment QR generation.

## Features
- Enter amount and generate a UPI QR containing `pa`, `pn`, `am`, `cu=INR`, and a unique `tr` reference.
- Scan an existing static UPI QR to save the destination.
- Manually enter a UPI ID and either save it as default or use it once.
- Change/clear the saved destination.
- Local transaction history.
- Mark a QR as "PAYMENT RECEIVED" after the merchant sound box confirms payment.
- Save the displayed QR image.
- Shop/merchant settings.
- PWA installable shell and offline app shell after first successful online load.

## Important payment note
This app creates a standard UPI payment URI and QR with an exact amount. It does NOT connect directly to Canara Bank or a PSP and it does NOT independently verify payment receipt. The merchant should continue using the Canara UPI sound box/merchant confirmation. "QR GENERATED" is not the same as "PAYMENT RECEIVED".

## First test on Windows
PWA service workers require HTTPS or localhost. If Python is installed:
1. Open Command Prompt in this folder.
2. Run: `python -m http.server 8080`
3. Open Chrome and go to `http://localhost:8080`
4. Test amount, QR generation, settings, and history.

For camera scanning on a phone, use an HTTPS-hosted copy (or a trusted local HTTPS development setup). A normal `file://` opening is not a full PWA environment.

## Libraries
- QRCode.js 1.0.0 for QR generation.
- html5-qrcode 2.3.8 for camera/image QR scanning.
The app references these libraries from their public CDNs and the service worker attempts to cache them for offline use after the first successful load.

## Version 2
The home screen is intentionally minimal. Optional one-tap amounts and shortcut buttons are hidden by default and can be enabled from Settings. Quick amounts can be customized (up to 6).
