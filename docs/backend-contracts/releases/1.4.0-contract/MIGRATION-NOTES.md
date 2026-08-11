# Contract 1.4.0 Migration Notes

## Clients

Android must upgrade with this contract: student sign-in and account security are email-only, `PENDING_CONTACT_BINDING` gates new students, and the two dedicated email challenge operations replace the removed generic `PATCH /me`. Web teacher/admin password login and recovery must submit verified email identifiers. Clients must not send `PHONE` or read public phone fields.

## Database

Migration `0014_email_only_auth` adds the email-verification challenge table and the explicit `PENDING_CONTACT_BINDING` User status. Follow-up migration `0015_email_verification_fk_alignment` aligns the new table's foreign-key update actions without changing or deleting data. Both are forward-only and preserve legacy phone columns and historical `PHONE` challenges without reading, clearing, or dropping them. Deploy migrations before the application image.

## Deferred breaking cleanup

A future separately approved destructive migration may physically remove the ignored legacy phone columns after retention and client evidence are complete. It is not part of this candidate. A future `/api/v2` may also remove deprecated compatibility-only Score sort inputs under a separate compatibility review.
