# Vidoxis Cinematic Design System & Keynote Aesthetic
**Target Canvas:** 3840×2160 (4K UHD) @ 60fps  
**Design Philosophy:** Steve Jobs & Google Next Keynote Craftsmanship

---

## 1. The 4K Virtual Stage Specifications

```
┌────────────────────────────────────────────────────────────────────────┐
│  MASTER 4K STAGE (3840x2160 @ 60fps)                                  │
│                                                                        │
│   ┌──────────────────────────────────────────────┐  ┌───────────────┐  │
│   │                                              │  │  VEO 2 AVATAR │  │
│   │     SPRING-DAMPED CAMERA ZOOM                │  │  (Gaze Steered│  │
│   │     (Focus pull to active bounding box)      │  │   -15° toward │  │
│   │                                              │  │   action area)│  │
│   │     [ Deploy Model Button ] ◄── Synthetic   │  │  PiP Capsule  │  │
│   │         (Halo Ripple)           Minimum-Jerk │  │  (480x270)    │  │
│   │                                 Bézier Cursor│  └───────────────┘  │
│   │                                              │                     │
│   └──────────────────────────────────────────────┘                     │
│                                                                        │
│   [Automated Gaussian Blur Mask: Billing ID & Corporate Email]         │
│   [Dynamic Moving Watermark: "Confidential - Under NDA"]               │
│   [DeepMind Emotional Audio + Lyria Score with Lookahead Ducking]      │
└────────────────────────────────────────────────────────────────────────┘
```

* **Master Render Canvas:** 3840×2160 pixels (4K UHD) @ 60.0 fps (progressive).
* **Console Screencast Viewport:** 1920×1080 captured at `deviceScaleFactor: 2` with 125% internal browser zoom, ensuring terminal and console text remains razor-sharp when compressed.
* **Safe Margins:** 96px screen-edge margins on all four sides to prevent content cutoff on ultra-wide desktop monitors.

### 1.1 Browser Engine & Typography Rendering (Google-Signed Chrome & Cloudtop)
To guarantee pixel-perfect Google Sans Flex font rendering, zero sub-pixel text antialiasing drift, and complete immunity to corporate Santa endpoint security blocks (`Killed: 9`):
- **macOS Workstations:** Exclusively runs `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` validated against `Developer ID Application: Google LLC (EQHXZ8M8AV)`.
- **Cloudtop / Debian Linux Workstations:** Uses official Google internal repository binaries (`/usr/bin/google-chrome`, `/usr/bin/google-chrome-stable`, or `/opt/google/chrome/chrome`).
- **Micro-Version Parity:** All authoring captures and Remotion compositing sessions must resolve to identical micro-versions (e.g. `153.0.8010.36`) to prevent kerning shifts between rehearsal traces and master video takes.

---

## 2. Kinetic Cursor Physics (The Minimum-Jerk Engine)

Raw automated cursors move in straight, unnatural lines. Vidoxis implements human motor control physics via the **Minimum-Jerk Trajectory Equation**:

$$x(t) = x_0 + (x_1 - x_0) \left( 10\left(\frac{t}{D}\right)^3 - 15\left(\frac{t}{D}\right)^4 + 6\left(\frac{t}{D}\right)^5 \right)$$
$$y(t) = y_0 + (y_1 - y_0) \left( 10\left(\frac{t}{D}\right)^3 - 15\left(\frac{t}{D}\right)^4 + 6\left(\frac{t}{D}\right)^5 \right)$$

### Key Motion Parameters:
1. **Movement Duration ($D$):** Computed using Fitts's Law based on distance $S$ and target width $W$:
   $$D = a + b \cdot \log_2\left(1 + \frac{S}{W}\right)$$
   *(Typical duration: 400ms to 950ms).*
2. **Sub-Pixel Micro-Overshoot:** The cursor travels 2%–4% past the center coordinate before gently snapping back, mimicking human hand deceleration.
3. **Hover Dwell Confirmation:** Upon arriving at the target bounding box, the cursor holds for **150ms to 250ms** before triggering mousedown.
4. **Click Ripple Animation:**
   - On mousedown, an expanding frosted blue/gold halo ring ($r=36\text{px}$) blooms outward with `cubic-bezier(0.16, 1, 0.3, 1)` easing over 400ms, fading to opacity 0.

---

## 3. Dynamic Camera Director (Spring-Damped Focus Pulls)

The camera dynamically pans and zooms to highlight the active console action without disorienting the viewer:

* **Spring Physics Equation:**
  $$F_{\text{spring}} = -k (x - x_{\text{target}}) - c \cdot v$$
  - **Stiffness ($k$):** `180`
  - **Damping ($c$):** `18` (critically damped, zero oscillation)
  - **Mass ($m$):** `1.0`
* **Zoom Ratios:**
  - **Wide Overview (Navigation/Page Load):** 100% (full 3840×2160 screen visible).
  - **Focal Action (Dropdown, Form Input, Deploy Button):** 150%–180% focal crop.
* **Safety Bounding Margin:** The active element's bounding box is always framed with a **minimum 30px safety padding** on all sides.
* **Avatar Exclusion Zone:** The camera viewport never pans into the lower-right corner occupied by the presenter capsule.

---

## 4. Presenter Avatar Capsule Specifications (Veo 2)

* **Capsule Dimensions:** 480px width × 270px height (16:9 ratio) or 320px × 320px circular capsule.
* **Positioning:** Lower right corner (`bottom: 64px; right: 64px`).
* **Frame Styling:**
  - Glassmorphic translucent border: `1.5px solid rgba(255, 255, 255, 0.2)`.
  - Ambient elevation shadow: `box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.5)`.
  - Subtle frosted glass backdrop: `backdrop-filter: blur(16px)`.
* **Gaze-Vector Steering:**
  - **Concept Explanation:** Avatar eyes maintain direct $0^\circ, 0^\circ$ contact with the viewer.
  - **Action Execution:** Avatar head tilts and eyes shift $-15^\circ$ azimuth toward the console element coordinate for 1.2s, nodding slightly upon click confirmation before returning gaze.

---

## 5. Acoustic Hierarchy & Lookahead Audio Ducking

```
Narration Speech Track  [ 0dB Master ] ───────┐
                                              ├──► Master Stereo Output
Tactile UI Haptics SFX  [ -6dB Ambient ] ─────┤
                                              │
Lyria Keynote Score     [ -18dB Ducked ] ─────┘
                        (-8dB during transitions)
```

1. **Dialogue Master (DeepMind Emotional TTS):**
   - Mixed at $0\text{dBFS}$ with 5-band vocal tract formant enhancement (warm low-end at 120Hz, clarity boost at 3.2kHz).
2. **Tactile UI Haptics:**
   - Mechanical click on mousedown: $-6\text{dB}$.
   - Subtle deployment/completion chime: $-8\text{dB}$.
3. **Adaptive Ambient Score (DeepMind Lyria):**
   - Baseline volume during intros, breaks, and time-warped deployments: $-8\text{dB}$.
   - **Lookahead Ducking:** Attenuates the music down to **$-18\text{dB}$** starting **200ms before** spoken phonemes begin, with a smooth **1200ms release envelope** after speech concludes to prevent rhythmic "audio pumping".

---

## 6. Automated Redaction & Compliance Shading

* **Mask Type:** Dual-layer Gaussian blur ($\sigma = 24\text{px}$) with $4\times 4\text{px}$ mosaic pixelation.
* **Auto-Blur Targets:**
  - Top-right Google Account avatar and email address.
  - Project ID numeric prefix and billing account IDs (`01XXXX-XXXXXX-XXXXXX`).
  - Any internal Google domain string matching `*.corp.google.com` or LDAP usernames.
* **NDA Watermark:** Semi-transparent (`opacity: 0.12`), moving diagonal tiled text at $30^\circ$ angle:
  `"Confidential - Under NDA - Prepared for [Customer Name] - Do Not Distribute"`.

---

## 7. Remotion React Component Hierarchy Tree

The master 4K video is assembled inside Remotion (`3840×2160 @ 60fps`) via a modular component tree:

```tsx
<VidoxisMasterComposition width={3840} height={2160} fps={60} durationInFrames={totalFrames}>
  {/* Layer 1: Base Background & Ambient Glow */}
  <KeynoteStageBackground theme="google-cloud-dark" />

  {/* Layer 2: Visual Content Layer (Slides or Screencast) */}
  <Sequence from={0} durationInFrames={slideDurationFrames}>
    {/* Stage 1: Keynote Slide Deck (PromptCanvas ELK Layout SVGs) */}
    <SlideDeckLayer slideSvgPath={slidePath} transition="fade_through_black" />
  </Sequence>

  <Sequence from={slideDurationFrames} durationInFrames={demoDurationFrames}>
    {/* Stage 2: Camera-Controlled Live Console Screencast */}
    <CameraSpringController
      telemetry={telemetryEvents}
      stiffness={180}
      damping={18}
      safePaddingPx={30}
    >
      <RawCDPScreencast videoSrc={rawVideoUri} />
      
      {/* Synthetic Minimum-Jerk Spline Cursor & Click Ripple */}
      <SyntheticBézierCursor
        telemetry={telemetryEvents}
        dwellHoldMs={150}
        rippleColor="rgba(66, 133, 244, 0.4)"
      />

      {/* Automated BBox Redaction Shaders */}
      <RedactionShaderMask
        telemetry={telemetryEvents}
        blurRadiusPx={24}
        mosaicSizePx={4}
      />
    </CameraSpringController>
  </Sequence>

  {/* Layer 3: Picture-in-Picture Presenter Avatar (Veo 2) */}
  <PresenterAvatarCapsule
    avatarSrc={veoAvatarUri}
    position="bottom_right"
    widthPx={480}
    heightPx={270}
    borderRadiusPx={24}
    gazeVectors={gazeCoordinates}
  />

  {/* Layer 4: Compliance, NDA Watermarks & Disclaimer Slates */}
  <ConfidentialNDAWatermark text="Confidential - Under NDA - Prepared for Enterprise Partner" />
  <LegalPreviewDisclaimerSlate startFrame={120} durationFrames={180} />

  {/* Layer 5: Multichannel Acoustic Audio Bed */}
  <AudioMixerMaster>
    <Audio src={narrationWavUri} volume={1.0} />
    <Audio src={tactileSfxUri} volume={0.5} />
    <Audio src={lyriaScoreUri} volume={musicDuckingVolume} />
  </AudioMixerMaster>
</VidoxisMasterComposition>
```

---

## 8. WCAG AAA Visual Contrast & Zero-Dead-Air Camera Motion

To maintain visual superiority over static, amateur screen recordings:

### 8.1 WCAG AAA Contrast Ratios (≥ 7:1)
* **Text on Dark Backgrounds:** All typography rendered on slide decks or HUD overlays must achieve a minimum contrast ratio of **7.0:1** (WCAG Level AAA).
* **Color Tokens:**
  - Background Primary: `#0F172A` (Obsidian Navy)
  - Surface Card: `#1E293B` with `border: 1px solid rgba(255, 255, 255, 0.12)`
  - Typography Primary: `#F8FAFC` (14.2:1 contrast ratio)
  - Typography Secondary: `#94A3B8` (7.3:1 contrast ratio)
  - Accent Focus Blue: `#38BDF8` (8.1:1 contrast ratio)

### 8.2 The Zero-Dead-Air Camera Pacing Rule
* **The Constraint:** If a cloud console page load or provisioning operation holds for $>800\text{ms}$, the camera view must **never remain frozen**.
* **Kinetic Response:** The `CameraSpringController` initiates a slow, critically damped focal drift ($v=12\text{px/s}$) across the configuration fields or triggers an ambient highlight pulse around the provisioning status banner.

---

## 9. NCLX Color Space Tagging & Dual Caption Architecture

To eliminate visual rendering anomalies across Apple macOS / iOS displays and maintain legal accessibility standards:

### 9.1 NCLX Color Metadata Parameters (QuickTime Gamma Fix)
All master video renders must output with explicit NCLX atoms in the MP4 container:
* **Color Primaries:** `1` (ITU-R BT.709)
* **Transfer Characteristics:** `1` (ITU-R BT.709, preventing macOS 1.96 gamma shift)
* **Matrix Coefficients:** `1` (ITU-R BT.709)
* **Color Range:** `1` (Limited Video Range `16-235`, preventing washed-out dark mode blacks)

### 9.2 Dual-Channel Caption Styling
* **Sidecar WebVTT Delivery:** Master exports generate `master.vtt` formatted with clean sans-serif typography, customizable font sizing, and full screen-reader accessibility.
* **Cinematic Burn-In (Opt-In Only):** For social and marketing cuts, subtitles render as centered bottom capsules with `background: rgba(15, 23, 42, 0.75)`, `border-radius: 8px`, and `color: #F8FAFC`.

---

## 10. Slide-to-Console Spatial Hand-off & Color Token Persistence

To eliminate visual and acoustic jarring during the transition from slide presentation to live cloud console:

### 10.1 The 200% Spatial Zoom & Directional Crossfade
* **The Transition Sequence:**
  1. **T - 600ms:** Virtual camera pulls into the active architecture node on the PromptCanvas slide with a 200% zoom crop ($k=180, c=18$).
  2. **T - 150ms:** A directional spatial crossfade begins, dissolving the slide SVG into the live Google Cloud Console at the exact canonical URL.
  3. **T + 0ms:** The synthetic cursor blooms its expanding halo ripple on the console's primary entry field.

### 10.2 Color Token Persistence
* The brand color token used for the target architecture node on the slide (e.g. Google Cloud Blue `#1A73E8`) is mathematically locked to:
  - The frosted halo ring color of the synthetic cursor (`rgba(26, 115, 232, 0.4)`).
  - The focus border outline of the active input drawer in the console screencast.

### 10.3 Acoustic Transition Bridge
* DeepMind Lyria's ambient score initiates a subtle +3dB swell during the 600ms zoom, then attenuates by $-18\text{dB}$ the instant the presenter delivers the opening console syllable.

---

## 11. Progressive Whiteboard Visual Engine & Kinetic Physics

To deliver an engaging, humanized visual explanation of complex topologies before diving into live demos, the Whiteboard Engine combines hand-drawn procedural vector aesthetics with real-time particle simulation in Remotion, standardized on the **Executive Agentic Whiteboard Standard**.

### 11.1 Master Visual Themes & Semantic Stencils

1. **Executive Studio Paper Theme (Canonical Default / Light Mode):**
   - **Canvas Background:** Pure Studio White `#FFFFFF` (or `#F8FAFC`) with subtle 24px drafting grid `#E2E8F0`.
   - **Card Enclosures:** Translucent white panels (`fillColor=#FFFFFF;strokeColor=#CBD5E1;strokeWidth=2;shadow=1;`) with high-contrast text.
   - **Semantic Color Tokens:**
     - Ingress / Client Layer: Sky Blue (`#0284C7` / `#E0F2FE`)
     - Orchestration & Intelligence Hub: Google Blue (`#1A73E8` / `#00205B`)
     - Agentic Reasoning Tools: Royal Violet (`#7C3AED` / `#EDE9FE`)
     - Data Lakehouse & Databases: Emerald & Teal (`#059669` / `#0D9488`)
     - Enterprise Core & Monoliths: Slate Gray (`#475569` / `#F1F5F9`)
     - Security & Ingress Gates: Amber Gold (`#D97706` / `#FEF3C7`)
   - **Semantic Shape Taxonomy:**
     - **Capsule / Pill:** Foundation LLMs (`shape=mxgraph.flowchart.terminator;` or `rounded=1;arcSize=50;`).
     - **3D Storage Cylinder:** Modern database cylinder (`shape=cylinder3;whiteSpace=wrap;html=1;size=14;`). Legacy flat cylinders (`shape=cylinder;`) are prohibited.
     - **Monolithic Pillar:** Enterprise legacy cores (`shape=rectangle;rounded=0;`).
     - **Cloud Enclosure:** Scalloped boundary (`shape=cloud;dashed=1;`) enclosing data plane tiers.

2. **Digital Glassboard Theme (Alternative / Dark Mode):**
   - **Canvas Background:** Obsidian Glass `#080C14` with a subtle 32px isometric dot grid at `rgba(255, 255, 255, 0.05)`.
   - **Chalk / Neon Strokes:** Glowing neon chalk (`#38BDF8`, `#818CF8`, `#34D399`).

### 11.2 1:1 Dual-Artifact Parity & Draw.io Export
The whiteboard engine enforces a strict dual-artifact contract:
- **Broadcast Render Canvas:** 3840×2160 (4K UHD) @ 60fps in Remotion.
- **Editable Draw.io Schema (`.drawio`):** Production XML matching node IDs, geometric coordinates, labels, and orthogonal stepped connectors.

### 11.3 Progressive Vector Stroke Unwinding Math
- Vector elements unwind progressively rather than popping in.
- For an SVG `<path>` with length $L$:
  $$\text{strokeDasharray} = L$$
  $$\text{strokeDashoffset} = L \times (1 - \text{interpolate}(frame, [start, end], [0, 1], \{\text{easing: Easing.bezier}(0.25, 0.1, 0.25, 1)\}))$$
- **Stylus Glow Dot:** A 12px circular bloom tracks the instantaneous tip coordinate:
  $$(X_{\text{tip}}, Y_{\text{tip}}) = \text{pathElement.getPointAtLength}(L \times \text{progress})$$

### 11.4 Particle Physics Simulation (`ParticleStreamShader`)
- Edges carrying data emit kinetic glowing particles along cubic Bezier curves $\mathbf{B}(t)$:
  $$\mathbf{B}(t) = (1-t)^3 \mathbf{P}_0 + 3(1-t)^2 t \mathbf{P}_1 + 3(1-t) t^2 \mathbf{P}_2 + t^3 \mathbf{P}_3$$
- **Parameters:**
  - **Particle Radius:** 3px to 6px with Gaussian bloom.
  - **Velocity:** $v = 1.8\text{px/frame}$ for standard requests; $v = 4.5\text{px/frame}$ during burst load or stress scenarios.
  - **Color Coding:** Amber pulses represent control-plane commands (IAM check, TLS handshake); cyan pulses represent live user data payloads.

### 11.5 Remotion Component Tree for Whiteboarding
```tsx
<WhiteboardStage width={3840} height={2160} theme="studio_paper">
  {/* Layer 1: Studio Drafting Grid Background */}
  <DraftingGrid spacing={24} stroke="#E2E8F0" />

  {/* Layer 2: Cloud Boundary Enclosures */}
  <ScallopedCloudBoundary
    label="Google Cloud Data Plane"
    bounds={{ x: 730, y: 340, width: 780, height: 490 }}
    dashed={true}
    stroke="#94A3B8"
  />

  {/* Layer 3: Progressive 5-Tier Sketch Nodes */}
  {nodes.map(node => (
    <ProgressiveSketchNode
      key={node.id}
      data={node}
      shape={node.semanticShape}
      startFrame={node.drawStartFrame}
      durationFrames={node.drawDurationFrames}
    />
  ))}

  {/* Layer 4: Kinetic Particle Data Streams */}
  {edges.map(edge => (
    <ParticleEdgeStream
      key={edge.id}
      source={edge.source}
      target={edge.target}
      ratePps={edge.ratePps}
      color={edge.color}
      startFrame={edge.streamStartFrame}
    />
  ))}

  {/* Layer 5: Optical Stylus Glow Tracker */}
  <OpticalStylusHead activeStrokeCoordinates={activeTip} color="#1A73E8" />
</WhiteboardStage>
```

---

## 12. 12px Dilation Kernel Geometry for PII Redaction Blurs

To eliminate the risk of sensitive billing IDs (`01XXXX-XXXXXX-XXXXXX`), internal `@google.com` LDAPs, or project hashes leaking through font anti-aliasing edges:

### 12.1 The Sub-Pixel Kerning Bleed Problem
Raw element bounding boxes returned by `element.getBoundingClientRect()` hug the inner CSS content box. Glyph ascenders, descenders, drop shadows, and anti-aliasing edge filters spill 1–3 pixels beyond this box. Under high-resolution 4K playback, unblurred pixel edges can allow OCR models to reconstruct character shapes.

### 12.2 The 12px Dilation Kernel Formula
All bounding boxes flagged with `redactPii: true` must pass through the **Dilation Kernel Transformer** before being emitted to telemetry or shader pipelines:
$$\begin{aligned}
x_{\text{dilated}} &= \max(0, x - 12) \\
y_{\text{dilated}} &= \max(0, y - 12) \\
width_{\text{dilated}} &= width + 24 \\
height_{\text{dilated}} &= height + 24
\end{aligned}$$

### 12.3 Shader Blur Execution Parameters
- **Blur Radius:** $\sigma = 16\text{px}$ Gaussian blur.
- **Pass Count:** 3-pass separable box-blur approximation for WebGL / Remotion performance.
- **Edge Feathering:** 4px linear alpha feathering to prevent harsh rectangular cut-outs, blending naturally into surrounding console chrome.


