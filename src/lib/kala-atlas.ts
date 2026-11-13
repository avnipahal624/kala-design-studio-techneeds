import type { MotifId } from "@/lib/crafts";

export type AtlasSource = {
  label: string;
  url: string;
};

export type AtlasCraft = {
  id: string;
  name: string;
  state: string;
  region: string;
  coords: [number, number];
  summary: string;
  technique: string;
  materials: string[];
  motifId: MotifId;
  palette: [string, string, string];
  note: string;
  sources: AtlasSource[];
};

const COMPENDIUM: AtlasSource = {
  label: "Ministry of Textiles — State Compendium of Handicrafts 2025",
  url: "https://indian.handicrafts.gov.in/frontend/pdf/State-Compendium-Handicrafts-2025.pdf",
};

const GI_REGISTRY: AtlasSource = {
  label: "Government of India — Geographical Indications reference",
  url: "https://static.pib.gov.in/WriteReadData/specificdocs/documents/2021/nov/doc2021112441.pdf",
};

const V_AND_A: AtlasSource = {
  label: "V&A — Indian embroidery reference",
  url: "https://www.vam.ac.uk/articles/indian-embroidery",
};

const UP_CRAFTS: AtlasSource = {
  label: "Government of Uttar Pradesh — Art and Craft",
  url: "https://nri.up.gov.in/en/page/art-and-craft",
};

export const ATLAS_CRAFTS: AtlasCraft[] = [
  {
    id: "chikankari",
    name: "Chikankari",
    state: "Uttar Pradesh",
    region: "Lucknow",
    coords: [80.95, 26.85],
    summary: "Fine white-on-white embroidery associated with Lucknow, built from delicate counted stitches and shadow work.",
    technique: "The ground is marked, then embroidered with stitches such as murri, bakhiya, jali and shadow work. The light, breathable result is often worked on cotton or silk.",
    materials: ["Cotton", "Muslin", "Silk"],
    motifId: "lotus",
    palette: ["#f7f2e8", "#d8c6a7", "#7a302a"],
    note: "Chikankari is a living craft practiced across Lucknow and beyond; it is not exclusive to a single workshop or family.",
    sources: [UP_CRAFTS, COMPENDIUM],
  },
  {
    id: "phulkari",
    name: "Phulkari",
    state: "Punjab",
    region: "Punjab",
    coords: [75.4, 31.1],
    summary: "Floral darn-stitch embroidery historically worked from the reverse of hand-woven cotton cloth.",
    technique: "Silk floss is worked in a simple darning stitch, often from the reverse, so the front becomes a field of geometric flowers and repeating forms.",
    materials: ["Khaddar cotton", "Silk floss"],
    motifId: "marigold",
    palette: ["#7a302a", "#d8a65b", "#34483e"],
    note: "Phulkari is a regional tradition shared across the Punjab region, with many styles and histories. It is not a single proprietary design.",
    sources: [
      { label: "Philadelphia Museum of Art — Phulkari", url: "https://www.philamuseum.org/exhibitions/phulkari-the-embroidered-textiles-of-punjab-from-the-jill-and-sheldon-bonovitz-collection" },
      V_AND_A,
    ],
  },
  {
    id: "kantha",
    name: "Kantha",
    state: "West Bengal",
    region: "Bengal",
    coords: [88.36, 22.57],
    summary: "Running-stitch quilting that gives layered or recycled cloth a new life, often through intimate personal motifs.",
    technique: "Small running stitches are worked across layered cloth. The stitching can outline figures, flowers, animals or everyday scenes and also gives the textile structure.",
    materials: ["Cotton", "Silk"],
    motifId: "tree",
    palette: ["#f7f2e8", "#a5483b", "#34483e"],
    note: "Kantha belongs to a wider Bengal textile history. Its motifs are personal and regional rather than a fixed iconographic set.",
    sources: [V_AND_A, COMPENDIUM],
  },
  {
    id: "madhubani",
    name: "Madhubani painting",
    state: "Bihar",
    region: "Mithila",
    coords: [86.0, 26.2],
    summary: "Mithila painting known for strong outlines, flat colour fields and dense patterns drawn from local visual traditions.",
    technique: "Natural or prepared pigments are applied with a brush or nib. Double outlines, hatching, fish, lotus, bamboo and courtly figures are common visual elements.",
    materials: ["Handmade paper", "Cotton", "Natural pigments"],
    motifId: "fish",
    palette: ["#7a302a", "#34483e", "#d8a65b"],
    note: "Madhubani is a broad regional painting practice with many artists and styles. A motif reference does not establish a specific artist or GI-protected origin.",
    sources: [COMPENDIUM, { label: "Encyclopaedia reference — Madhubani", url: "https://lnmm.gov.lv/upload/content/indija_vardnica_eng_web.pdf" }],
  },
  {
    id: "sanganeri-block",
    name: "Sanganeri block printing",
    state: "Rajasthan",
    region: "Sanganer, Jaipur",
    coords: [75.8, 26.8],
    summary: "Woodblock printing associated with Sanganer, known for fine floral repeats and a light ground.",
    technique: "Carved teak blocks are inked and pressed by hand in registered repeats. Printers align multiple blocks for outline, fill and highlight.",
    materials: ["Cotton", "Silk", "Natural dyes"],
    motifId: "sprig",
    palette: ["#f7f2e8", "#34483e", "#a5483b"],
    note: "Sanganeri printing is one of several Rajasthan block-printing traditions. The place name does not imply that every printed textile is GI-certified.",
    sources: [COMPENDIUM, GI_REGISTRY],
  },
  {
    id: "blue-pottery",
    name: "Jaipur blue pottery",
    state: "Rajasthan",
    region: "Jaipur",
    coords: [75.82, 26.92],
    summary: "Low-fired ceramic ware with a quartz body and cobalt-blue decoration, associated with Jaipur.",
    technique: "A quartz-rich body is shaped, dried, painted with oxide colours and fired at a relatively low temperature. The result is decorative rather than a high-fire stoneware.",
    materials: ["Quartz", "Clay", "Cobalt oxide"],
    motifId: "mandala",
    palette: ["#f7f2e8", "#273c75", "#d8a65b"],
    note: "Blue pottery is a named craft with a particular GI history; the platform does not label individual pieces as GI-certified without evidence.",
    sources: [COMPENDIUM, GI_REGISTRY],
  },
  {
    id: "ajrakh",
    name: "Ajrakh printing",
    state: "Gujarat",
    region: "Kutch",
    coords: [70.2, 23.7],
    summary: "Resist-printed cloth associated with Kutch, built from repeated geometric and floral blocks in deep indigo and madder.",
    technique: "Cloth is repeatedly washed, resist-printed and dyed. Multiple blocks build a mirrored grid, with the reverse side often carrying a distinct rhythm.",
    materials: ["Cotton", "Silk", "Indigo", "Madder"],
    motifId: "mirror",
    palette: ["#1f2e3d", "#f7f2e8", "#a5483b"],
    note: "Ajrakh is a cross-border craft tradition with many family workshops. References here are to the technique, not to a specific maker.",
    sources: [COMPENDIUM, GI_REGISTRY],
  },
  {
    id: "patola",
    name: "Patan Patola",
    state: "Gujarat",
    region: "Patan",
    coords: [72.12, 23.85],
    summary: "Double-ikat silk weaving from Patan, where warp and weft are dyed before weaving to form the design.",
    technique: "Both warp and weft threads are tie-dyed in planned sequences. Precise alignment during weaving produces reversible, sharply defined patterns.",
    materials: ["Silk", "Natural dyes"],
    motifId: "paisley",
    palette: ["#7a302a", "#d8a65b", "#34483e"],
    note: "Patola is a highly specific weaving tradition. The platform does not imply that a visually similar motif is a Patan Patola.",
    sources: [COMPENDIUM, GI_REGISTRY],
  },
  {
    id: "pattachitra",
    name: "Pattachitra",
    state: "Odisha",
    region: "Puri and Raghurajpur",
    coords: [85.83, 19.81],
    summary: "Cloth-based narrative painting from Odisha with bold outlines, flat colour and dense ornamental borders.",
    technique: "Cloth is prepared with a chalk and gum ground, then painted with mineral or prepared pigments. Figures and narratives are framed by decorative borders.",
    materials: ["Cotton", "Tussar silk", "Natural pigments"],
    motifId: "peacock",
    palette: ["#7a302a", "#d8a65b", "#34483e"],
    note: "Pattachitra covers religious and narrative painting traditions. The reference here is visual and technical, not an authentication of a specific work.",
    sources: [COMPENDIUM, { label: "Ministry of Textiles — craft reference", url: "https://www.texmin.nic.in/" }],
  },
  {
    id: "banarasi",
    name: "Banarasi brocade",
    state: "Uttar Pradesh",
    region: "Varanasi",
    coords: [82.97, 25.32],
    summary: "Silk brocade weaving associated with Varanasi, known for zari motifs, dense borders and narrative pallus.",
    technique: "Supplementary weft threads are woven into a silk ground to create floral, paisley and architectural motifs. Handloom and powerloom production both exist.",
    materials: ["Silk", "Zari"],
    motifId: "lotus",
    palette: ["#7a302a", "#d8a65b", "#f7f2e8"],
    note: "Banarasi is a regional weaving cluster, not a guarantee of a particular loom, fibre or GI certification.",
    sources: [UP_CRAFTS, GI_REGISTRY],
  },
  {
    id: "kanchipuram",
    name: "Kanchipuram silk",
    state: "Tamil Nadu",
    region: "Kanchipuram",
    coords: [79.7, 12.83],
    summary: "South Indian silk weaving known for contrast borders, temple-inspired motifs and a substantial silk body.",
    technique: "Silk warp and weft are woven with a separate border and pallu, often in contrasting colours. Zari adds borders, checks and temple motifs.",
    materials: ["Silk", "Zari"],
    motifId: "border",
    palette: ["#7a302a", "#d8a65b", "#34483e"],
    note: "Kanchipuram weaving has a named GI history and many variations. A visual reference does not certify fibre content or origin.",
    sources: [COMPENDIUM, GI_REGISTRY],
  },
  {
    id: "sozni",
    name: "Sozni embroidery",
    state: "Jammu & Kashmir",
    region: "Kashmir Valley",
    coords: [74.8, 34.1],
    summary: "Fine needlework used on shawls and textiles, with delicate outlining and dense satin-stitch fills.",
    technique: "Artisans outline a motif with fine stitches, then fill selected areas with satin or darning stitch. The direction and density of the thread shape the design.",
    materials: ["Pashmina", "Wool", "Silk"],
    motifId: "paisley",
    palette: ["#34483e", "#d8a65b", "#f7f2e8"],
    note: "Sozni and pashmina have complex regional and legal histories. The platform does not treat a stylistic reference as a verified fibre or origin claim.",
    sources: [COMPENDIUM, { label: "Ministry of Textiles — craft reference", url: "https://www.texmin.nic.in/" }],
  },
  {
    id: "pochampally",
    name: "Pochampally Ikat",
    state: "Telangana",
    region: "Bhoodan Pochampally",
    coords: [78.8, 17.35],
    summary: "Ikat weaving from Telangana where dyed warp and weft threads create soft, feathered geometric patterns.",
    technique: "Threads are bound and dyed before weaving. Slight movement during alignment gives the characteristic softened edges of ikat.",
    materials: ["Silk", "Cotton"],
    motifId: "mirror",
    palette: ["#34483e", "#d8a65b", "#f7f2e8"],
    note: "Pochampally ikat is a regional weaving tradition; the platform does not infer a specific weaver or GI certification from a motif.",
    sources: [COMPENDIUM, GI_REGISTRY],
  },
  {
    id: "kalamkari",
    name: "Kalamkari",
    state: "Andhra Pradesh",
    region: "Srikalahasti and Machilipatnam",
    coords: [79.7, 13.75],
    summary: "Pen-drawn or block-printed narrative textiles using mordants, resists and natural dyes.",
    technique: "Cotton or silk is treated, drawn or printed with mordants and dyes, then washed and repeated. The process builds colour in layers rather than applying a single print.",
    materials: ["Cotton", "Silk", "Natural dyes"],
    motifId: "tree",
    palette: ["#7a302a", "#d8a65b", "#34483e"],
    note: "Kalamkari includes distinct pen-work and block-print traditions. References here describe techniques, not a particular workshop's authorship.",
    sources: [COMPENDIUM, GI_REGISTRY],
  },
];

export const ATLAS_STATE_NOTES: Record<string, string> = {
  "Andhra Pradesh": "A long textile coast and Deccan hinterland with painting, weaving and dye traditions.",
  Bihar: "The Mithila region is known for painting, while Bhagalpur has a distinct silk-weaving history.",
  Gujarat: "Kutch and Patan support resist-dyeing, printing and double-ikat traditions with deep regional histories.",
  "Jammu & Kashmir": "High-altitude fibre and embroidery traditions are often described through pashmina and sozni work.",
  "Tamil Nadu": "Silk weaving, block printing and temple textile traditions are spread across the state.",
  "Uttar Pradesh": "Lucknow embroidery and Varanasi weaving are among the state's widely documented textile traditions.",
  "West Bengal": "Kantha, Jamdani-inspired weaving and a wide range of cotton and silk traditions are part of the region's textile history.",
  Rajasthan: "Block printing, blue pottery, bandhani and miniature painting are documented across different Rajasthan centres.",
  Punjab: "Phulkari is a shared regional embroidery tradition with many styles and histories.",
  Telangana: "Ikat weaving and a strong cotton and silk handloom base are central to the state's textile identity.",
  Odisha: "Pattachitra painting and handloom traditions are documented across coastal and inland Odisha.",
};

export function craftsForState(state: string): AtlasCraft[] {
  return ATLAS_CRAFTS.filter((craft) => craft.state === state);
}

export function canonicalStateName(value: string | null | undefined): string {
  if (!value) return "";
  const cleaned = value.trim().toLowerCase().replace(/\s+/g, " ");
  const aliases: Record<string, string> = {
    "jammu and kashmir": "Jammu & Kashmir",
    "jammu & kashmir": "Jammu & Kashmir",
    "nct of delhi": "Delhi",
    "new delhi": "Delhi",
    "orissa": "Odisha",
    "pondicherry": "Puducherry",
    "dadra and nagar haveli and daman and diu": "Dadra,Nagar Haveli,Daman & Diu",
    "dadra & nagar haveli & daman & diu": "Dadra,Nagar Haveli,Daman & Diu",
    "andaman and nicobar islands": "Andaman & Nicobar",
    "andaman & nicobar": "Andaman & Nicobar",
  };
  return aliases[cleaned] ?? value.trim();
}
