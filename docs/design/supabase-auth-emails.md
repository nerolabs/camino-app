# Supabase auth email templates (Get Camino brand)

The two styled auth templates, versioned here so they can be pasted into any Supabase
project (production `oftrpaleqtmuvolwsocd`, staging `gsnsgfobfswazqhfcstx`) instead of
living only in a dashboard. Style mirrors `lib/emailTemplates.ts` (`shell()` + `button()`:
cal ground, Georgia masthead, Helvetica body, cobalt button, 560px column).

Where they go: Supabase dashboard → project → **Authentication → Emails → Templates** →
"Magic link or OTP" / "Confirm sign up" (Subject + Body/Source). Both include the
`{{ .ConfirmationURL }}` button **and** the one-time `{{ .Token }}` code (length is Supabase's choice — currently 8 digits) so a link requested on
one device can be completed on another (the app's EmailSignIn dialog accepts the code).

Auth emails are transactional: no unsubscribe footer (that's only for the weekly roundup).

---

## Magic link or OTP

**Subject:** `Your Get Camino sign-in link`

```html
<!doctype html>
<html><body style="margin:0;padding:0;background:#FBFAF7;">
<div style="max-width:560px;margin:0 auto;padding:32px 24px;font-family:Georgia,'Times New Roman',serif;color:#15243B;">
  <div style="font-size:22px;font-weight:600;margin-bottom:24px;">Get Camino <span style="color:#8A9BB0;font-size:14px;font-style:italic;">— your road to Spain</span></div>
  <p style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:24px;margin:0 0 16px;">Hola — Lola here.</p>
  <p style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:24px;margin:0 0 16px;">Tap the button and you’re back on your roadmap — no password needed.</p>
  <div style="margin:24px 0;"><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#2B5AA3;color:#FFFFFF;text-decoration:none;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;padding:12px 22px;border-radius:8px;">Sign in to Get Camino</a></div>
  <p style="font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:20px;color:#4A5A70;margin:0 0 8px;">Reading this on a different device? Enter this code in the app instead:</p>
  <div style="margin:0 0 24px;"><span style="display:inline-block;font-family:'Courier New',Courier,monospace;font-size:28px;letter-spacing:8px;font-weight:700;color:#15243B;background:#FFFFFF;border:1px solid #E8E4DC;border-radius:10px;padding:14px 18px;">{{ .Token }}</span></div>
  <p style="font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:20px;color:#8A9BB0;margin:0 0 16px;">The link and code expire in an hour and work once. Didn’t request this? You can safely ignore it — nothing happens without it.</p>
  <hr style="border:none;border-top:1px solid #E8E4DC;margin:32px 0 16px;">
  <div style="font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:18px;color:#8A9BB0;">
    You’re getting this because this address was used to sign in to Get Camino.
    <br>Guidance only — not legal or tax advice.
  </div>
</div>
</body></html>
```

## Confirm sign up

**Subject:** `Confirm your email — your Get Camino account is almost ready`

```html
<!doctype html>
<html><body style="margin:0;padding:0;background:#FBFAF7;">
<div style="max-width:560px;margin:0 auto;padding:32px 24px;font-family:Georgia,'Times New Roman',serif;color:#15243B;">
  <div style="font-size:22px;font-weight:600;margin-bottom:24px;">Get Camino <span style="color:#8A9BB0;font-size:14px;font-style:italic;">— your road to Spain</span></div>
  <p style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:24px;margin:0 0 16px;">Hola — I’m Lola.</p>
  <p style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:24px;margin:0 0 16px;">One tap to confirm this address and your Get Camino account is ready:</p>
  <div style="margin:24px 0;"><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#2B5AA3;color:#FFFFFF;text-decoration:none;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;padding:12px 22px;border-radius:8px;">Confirm my email</a></div>
  <p style="font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:20px;color:#4A5A70;margin:0 0 8px;">Reading this on a different device? Enter this code in the app instead:</p>
  <div style="margin:0 0 24px;"><span style="display:inline-block;font-family:'Courier New',Courier,monospace;font-size:28px;letter-spacing:8px;font-weight:700;color:#15243B;background:#FFFFFF;border:1px solid #E8E4DC;border-radius:10px;padding:14px 18px;">{{ .Token }}</span></div>
  <p style="font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:20px;color:#8A9BB0;margin:0 0 16px;">The link and code expire in an hour. Didn’t create a Get Camino account? You can safely ignore this email.</p>
  <hr style="border:none;border-top:1px solid #E8E4DC;margin:32px 0 16px;">
  <div style="font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:18px;color:#8A9BB0;">
    You’re getting this because this address was used to create a Get Camino account.
    <br>Guidance only — not legal or tax advice.
  </div>
</div>
</body></html>
```
