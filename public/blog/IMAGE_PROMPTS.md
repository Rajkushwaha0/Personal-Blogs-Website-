# Image prompts for the media pipeline blog

Drop generated images into this folder with the exact filenames below.
After you add them, tell me and I will wire them into the article.

Current image already used:
- `media-pipeline-architecture.png` (full architecture overview)

---

## 1) `upload-flow.png`

Prompt:

```text
Clean technical system-design diagram, light background, minimal flat style,
no decorative clutter. Vertical flow with rounded boxes and arrows:

Title: "Upload Flow — video.mp4"

Client requests upload access
↓
Upload API issues S3 Presigned URL
(multipart presigned parts for large videos)
↓
Client uploads directly to Private Amazon S3
↓
Content Validation (magic bytes + ffprobe)
↓
Create Media Record
↓
Publish to Amazon SQS

Use clear labels, muted teal and charcoal colors, professional blog-diagram look.
No 3D, no shadows overload, no stock icons.
```

---

## 2) `parallel-workers.png`

Prompt:

```text
Clean technical system-design diagram, light background, minimal flat style.
Show fan-out from one queue into parallel workers:

Title: "Parallel Processing"

Amazon SQS (center top)
↓
Fan-out into three branches:

Left: HLS Worker → 240p / 480p / 720p / 1080p → .m3u8 playlist
Middle: Enrichment Worker → MediaInfo + Aspect Ratio
Right: Enrichment Worker → Thumbnail + Compression

All three write back into one "Media Document" box at the bottom.

Label retries and attempt counters on each worker.
Professional architecture-blog style, muted teal and charcoal.
```

---

## 3) `cdn-sync-flow.png`

Prompt:

```text
Clean technical system-design diagram, light background, minimal flat style.

Title: "CDN Synchronization"

Media Document (assetId + uploadId)
↓
CDN Sync Worker
↓
Fan-out to destinations:

CloudFront (Default)
Shopify Files
Gumlet
Other Client CDN

Caption under diagram:
"Serve from client CDNs to reduce our egress cost while tracking every copy."

Professional blog diagram, muted teal and charcoal, no clutter.
```

---

## 4) `deletion-flow.png`

Prompt:

```text
Clean technical system-design diagram, light background, minimal flat style.
Vertical lifecycle diagram:

Title: "Safe Deletion of video.mp4"

User Delete Request
↓
Soft Delete (isDeleted=true, inactive)
↓
Retention Window (3–6 months)
↓
Cleanup Worker
↓
Delete Everywhere:
Amazon S3, CloudFront, Shopify, Gumlet, HLS assets, Thumbnails, Database metadata

Show retry / attempt counter on Cleanup Worker.
Professional architecture-blog style, muted teal and charcoal.
```
