# Contract 1.5.0 Migration Notes

## Clients

iOS may generate and wire `/api/v1` types from this candidate handoff after its immutable SHA-256 is verified. Android and iOS must require a non-blank description for `GENERAL` records only; `COURSE_RELATED` may omit it. Web may upload a browser-produced `video/webm` file when it contains a video track, an audio track, and a trusted duration no greater than 15 seconds. MP4, MOV, and 3GP remain supported.

No client is required or permitted by this contract to request location permission or collect coordinates for evidence. If a selected media file already contains recognized location metadata, Backend rejects it with `MEDIA_LOCATION_METADATA_NOT_ALLOWED`; clients should ask the user to remove location metadata or capture a new file.

## Database

Migration `0016_optional_course_exercise_description` makes `exercise_records.description` nullable and adds a database check that still requires a trimmed 1..200 character description for `GENERAL` rows. `COURSE_RELATED` rows may store null or a trimmed 1..200 character description. The migration is forward-only and must run before the application image.

## Media deployment

No FFmpeg/WASM or upload-time transcoding service is introduced. Backend validates the original uploaded bytes. Media scanner, object storage, and HTTPS staging configuration remain deployment concerns and are not proven by this candidate package.
