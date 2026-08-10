# Daring Scroll Video Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the Daring landing page into a frame-by-frame scroll animation using original-resolution WebP frames from the supplied desktop and mobile videos.

**Architecture:** Generate two frame sequences with ffmpeg, then load the matching sequence into a fixed canvas selected by viewport width. A hidden scroll track maps scroll progress to a frame index, while `requestAnimationFrame` performs rendering and progressive image decoding keeps the page responsive.

**Tech Stack:** Plain HTML, CSS, browser Canvas API, WebP, PowerShell, ffmpeg.

---

### Task 1: Generate WebP frame sequences

**Files:**
- Create: `scripts/extract-video-frames.ps1`
- Create: `assets/video-frames/desktop/*.webp`
- Create: `assets/video-frames/mobile/*.webp`

- [ ] **Step 1: Add the reproducible extraction script**

Create a PowerShell script that resolves the repository root, verifies both MP4 inputs, clears only the two generated output folders, creates them, and invokes ffmpeg at 30 fps with lossless WebP output and source dimensions.

```powershell
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$videos = @(
  @{ Input = Join-Path $root 'assets\Videos\Landing Daring web.mp4'; Output = Join-Path $root 'assets\video-frames\desktop' },
  @{ Input = Join-Path $root 'assets\Videos\Landing Daring Móvil.mp4'; Output = Join-Path $root 'assets\video-frames\mobile' }
)

foreach ($video in $videos) {
  if (-not (Test-Path -LiteralPath $video.Input)) { throw "Video no encontrado: $($video.Input)" }
  if (Test-Path -LiteralPath $video.Output) { Remove-Item -LiteralPath $video.Output -Recurse -Force }
  New-Item -ItemType Directory -Path $video.Output -Force | Out-Null
  & ffmpeg -hide_banner -loglevel error -i $video.Input -vf "fps=30" -c:v libwebp -lossless 1 -compression_level 6 (Join-Path $video.Output 'frame-%04d.webp')
  if ($LASTEXITCODE -ne 0) { throw "ffmpeg falló para $($video.Input)" }
}
```

- [ ] **Step 2: Run extraction and verify generated assets**

Run `powershell -ExecutionPolicy Bypass -File scripts/extract-video-frames.ps1`.

Then verify with `Get-ChildItem assets\video-frames\desktop\*.webp | Measure-Object` and the equivalent mobile command. Expected: both folders contain hundreds of frames and no zero-byte files.

### Task 2: Replace the presentation with the scroll canvas

**Files:**
- Modify: `daring-auditoria.html`

- [ ] **Step 1: Add the frame manifest and canvas structure**

Replace the current slide deck markup with a single main region containing a fixed canvas and an empty scroll track. Keep the document metadata, design token stylesheet and font stylesheet only if needed, but do not render text or controls.

```html
<main class="scroll-stage" aria-label="Animación de producto controlada por desplazamiento">
  <canvas id="scroll-canvas"></canvas>
  <div id="scroll-track" aria-hidden="true"></div>
</main>
```

Use a generated manifest in the inline script with the exact file naming pattern `assets/video-frames/desktop/frame-0001.webp` and `assets/video-frames/mobile/frame-0001.webp`; the frame counts are obtained by the loader from a fixed manifest count generated after extraction.

- [ ] **Step 2: Add canvas and layout styles**

Use CSS that fixes the canvas to the viewport, reserves a scroll track height, hides horizontal overflow, gives the canvas a black background, and does not add visible UI elements.

```css
html, body { margin: 0; min-height: 100%; background: #000; overflow-x: hidden; }
body { min-width: 320px; }
.scroll-stage { position: relative; min-height: 100svh; }
#scroll-canvas { position: fixed; inset: 0; width: 100vw; height: 100svh; display: block; background: #000; }
#scroll-track { height: 700vh; pointer-events: none; }
@media (max-width: 767px) { #scroll-track { height: 700vh; } }
@media (prefers-reduced-motion: reduce) { #scroll-track { height: 100svh; } }
```

- [ ] **Step 3: Implement responsive frame loading and drawing**

Implement one `loadSequence()` function that creates `Image` objects, loads the first frame immediately, then decodes the remaining images in batches. Implement `drawFrame()` to scale with contain/cover behavior while respecting device pixel ratio, and clear the canvas before each draw.

```js
const isMobile = window.matchMedia('(max-width: 767px)').matches;
const config = isMobile
  ? { folder: 'mobile', count: MOBILE_FRAME_COUNT, width: 1440, height: 2560 }
  : { folder: 'desktop', count: DESKTOP_FRAME_COUNT, width: 2560, height: 1440 };

function frameUrl(folder, index) {
  return `assets/video-frames/${folder}/frame-${String(index + 1).padStart(4, '0')}.webp`;
}

async function loadSequence(config) {
  const frames = Array.from({ length: config.count }, (_, index) => {
    const image = new Image();
    image.decoding = 'async';
    image.src = frameUrl(config.folder, index);
    return image;
  });
  await frames[0].decode();
  for (let start = 1; start < frames.length; start += 8) {
    await Promise.all(frames.slice(start, start + 8).map((image) => image.decode().catch(() => undefined)));
  }
  return frames;
}
```

- [ ] **Step 4: Map scroll to frames with requestAnimationFrame**

Track the latest scroll position, calculate progress from the scroll track bounds, clamp the frame index, and render only the latest requested frame. Preserve the last successful render if a frame is not decoded yet. On reduced motion render frame zero only.

```js
let pendingFrame = 0;
let renderedFrame = -1;
let raf = 0;

function requestFrame(index) {
  pendingFrame = index;
  if (!raf) raf = requestAnimationFrame(() => {
    raf = 0;
    if (pendingFrame !== renderedFrame && frames[pendingFrame]?.complete) {
      drawFrame(frames[pendingFrame]);
      renderedFrame = pendingFrame;
    }
  });
}

function updateFromScroll() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return requestFrame(0);
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  requestFrame(Math.round((window.scrollY / maxScroll) * (frames.length - 1)));
}
```

### Task 3: Verify responsive behavior and local serving

**Files:**
- Verify: `daring-auditoria.html`
- Verify: `assets/video-frames/desktop/`
- Verify: `assets/video-frames/mobile/`

- [ ] **Step 1: Validate frame dimensions and file health**

Run `ffprobe` on one desktop and one mobile WebP. Expected: `2560x1440` and `1440x2560`, respectively. Run a PowerShell byte-length check and confirm every generated WebP is larger than zero bytes.

- [ ] **Step 2: Validate HTML and asset references**

Run a text search confirming there are no visible presentation strings, `.slide`, `.controls`, `.hint`, or old remote image references. Confirm the two frame folders are referenced by the loader.

- [ ] **Step 3: Start a local static server**

Run `python -m http.server 4173` from the repository root and request `http://localhost:4173/daring-auditoria.html`. Expected: HTTP 200.

- [ ] **Step 4: Check desktop and mobile frame selection**

Open the page at desktop width and confirm network requests use `assets/video-frames/desktop`; emulate a viewport below `768px` and confirm requests use `assets/video-frames/mobile`. Scroll from top to bottom and confirm the first and last frames render without layout shift.

- [ ] **Step 5: Check reduced-motion fallback**

Enable reduced motion in the browser and confirm the page stays on the first frame while remaining scrollable without visual frame changes.
