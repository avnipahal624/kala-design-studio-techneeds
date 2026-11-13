# Kalakari 3D Studio

## Summary

The existing 2D SVG Studio was preserved. A real WebGL preview was added for three products: jacket, T-shirt and tote. Motifs are rendered as surface decals rather than free-floating planes over the canvas. The editor still uses the 2D surface for precise motif placement, text and products without a 3D mesh.

The 3D engine is not loaded on the homepage or marketplace. It is a separate lazy chunk, requested only when a Studio or public demo view actually opens the 3D preview.

## Technology

Added dependencies:

- `three`
- `@react-three/fiber`
- `@react-three/drei`

Relevant files:

- `src/components/studio/Garment3DPreview.tsx` — lazy-loaded 3D viewer, procedural meshes, decals, WebGL check and fallback.
- `src/pages/Studio.tsx` — 2D/3D view toggle inside the existing editor.
- `src/pages/DemoLive.tsx` — public read-only 3D preview.
- `src/lib/crafts.ts` — T-shirt product taxonomy.
- `src/components/art/garments.tsx` — T-shirt 2D silhouette and the existing 2D renderer.

No licensed GLB/GLTF assets were available in the repository. The meshes are original procedural geometry made from rounded boxes, tori and simple garment detailing. This avoids unlicensed assets and keeps the download smaller than a texture-heavy scanned garment.

## Supported products

| Product | 3D model | 2D editor | Notes |
| --- | --- | --- | --- |
| Jacket | Yes | Yes | Structured torso, sleeves, collar and placket. |
| T-shirt | Yes | Yes | Shorter body, short sleeves and crew neck. |
| Tote | Yes | Yes | Structured body, arched handles and base seam. |
| Kurta | No 3D model | Yes | No 3D button is shown; the existing 2D placement editor remains. |
| Cushion | No 3D model | Yes | No 3D button is shown; the existing 2D placement editor remains. |
| Stole | No 3D model | Yes | No 3D button is shown; the existing 2D placement editor remains. |

Products without a 3D model do not show a 3D action at all. The 2D fallback is labelled.

## How the 3D view works

- The garment is rendered with a physical material using the current fabric colour.
- Motif and text layers are converted to a canvas texture and projected with drei `Decal` onto the garment surface.
- Layer x/y, size, rotation, opacity and colour are mapped into the decal transform.
- The first six motif/text layers are previewed.
- Lighting uses ambient, key and fill directional lights, plus contact shadows.
- `OrbitControls` enables drag rotation and scroll zoom.
- Front and back camera controls place the camera on the front or back side.
- Reset restores the camera and orbit target.
- The 3D scene has no automatic rotation, so reduced-motion users are not exposed to unsolicited movement.

## Editing workflow

1. Open `/studio` while signed in.
2. Choose jacket, T-shirt or tote.
3. Add or edit motifs in the 2D placement view.
4. Switch to 3D to inspect the surface result.
5. Change fabric colour in the left panel; the 3D material updates immediately.
6. Rotate and zoom the product, switch front/back, or reset the camera.
7. Return to 2D for exact placement, resize or rotation changes.
8. Save. The existing immutable design version and canvas persistence continue to work.

Direct dragging of motifs in 3D is not implemented. The 2D editor remains the placement source of truth. This is a deliberate limitation rather than a simulated 3D interaction.

## Save and continuity

The 3D view does not introduce a second design format. It reads the existing `CanvasState`:

- `productType`
- `fabricColor`
- `patternId`
- `layers`
- each layer's motif/text, position, size, rotation, colour and opacity

The existing Convex mutations remain authoritative:

- `designs.create`
- `designs.save`
- `designs.rename`
- `designs.restoreVersion`

Saved designs reopen in the same Studio and remain available to the customer request flow and CraftFit brief.

## Access and demo routes

- `/studio` — protected Studio entry point, showing product choices and saved designs.
- `/studio/:designId` — protected editor for one design.
- `/demo/live` — public, read-only 3D preview of the sample jacket. It does not save and does not bypass authentication.
- `/demo` — walkthrough with a link to the populated demo and the real flow.

The public preview is not a demo account and has no write access.

## WebGL, fallback and errors

- WebGL is probed by creating a canvas and checking for `webgl2` or `webgl`.
- If WebGL is unavailable, the component renders the existing 2D `GarmentArt` with a clear "2D fallback · WebGL unavailable" label.
- If the product has no 3D model, the same 2D fallback is shown with a product-specific note.
- The Studio wraps the canvas area in `StudioErrorBoundary`. A render error shows a recoverable message instead of blanking the whole studio.
- The 3D chunk is loaded with `React.lazy` and a loading state.

## Performance

Production build output for the lazy 3D chunk:

- Raw: approximately 970 kB
- Gzip: approximately 262 kB

This chunk is not part of the homepage or marketplace entry path. The Studio's main 2D chunk remains approximately 49 kB raw / 14 kB gzip.

Rendering uses:

- `dpr={[1, 1.75]}`
- antialiasing
- one contact-shadow pass
- simple procedural geometry
- canvas-generated motif textures
- no remote HDR environment or large GLB download

The 3D scene is still a WebGL workload and should be tested on the target student laptops and phones. No browser performance trace was captured in this session.

## Mobile behaviour

- The 3D canvas has a minimum height of 380 px and scales to the viewport width.
- Touch actions are disabled on the canvas container so OrbitControls can own the gesture.
- The existing Studio side panels become drawers below the large breakpoint.
- The 3D footer controls wrap on narrow screens.
- The public preview is usable as a read-only interaction, but direct placement remains a 2D task.

## Verification performed

- `bunx convex dev --once` passed.
- `bunx tsc -b --noEmit` passed with the 3D component included.
- `bun run build` passed. Vite emitted a separate `Garment3DPreview` chunk.
- `bun run lint` passed with zero errors and 22 pre-existing warnings.

Not verified in this session:

- Actual WebGL rendering in a browser.
- Camera gesture behaviour on a physical touch device.
- GPU performance on low-end laptops.
- Visual comparison across 1440 px, 768 px and 375 px layouts.
- Automated screenshot or end-to-end tests.
