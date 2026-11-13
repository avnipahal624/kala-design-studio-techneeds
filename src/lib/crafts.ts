/**
 * Static craft reference data.
 *
 * This is editorial/reference content maintained by the platform — it is NOT
 * AI output and is labelled as such in the UI. Craft descriptions are kept
 * short and conservative: techniques and materials are described, never
 * attributed to an individual designer, and no claims are made about
 * ownership of traditional motifs.
 */

export type ProductTypeId = "jacket" | "tshirt" | "kurta" | "tote" | "cushion" | "stole";

export type ProductType = {
  id: ProductTypeId;
  label: string;
  hindi: string;
  silhouette: string;
  hint: string;
  baseFabric: string;
  motifScale: number;
};

export const PRODUCT_TYPES: ProductType[] = [
  {
    id: "jacket",
    label: "Embroidered Jacket",
    hindi: "जैकेट",
    silhouette: "Open-front jacket",
    hint: "Structured shoulders, open placket, wide lapel",
    baseFabric: "#7b2040",
    motifScale: 1,
  },
  {
    id: "tshirt",
    label: "Embroidered T-shirt",
    hindi: "टी-शर्ट",
    silhouette: "Relaxed crew-neck tee",
    hint: "Soft shoulder, short sleeve, clean front panel",
    baseFabric: "#ece2d0",
    motifScale: 0.9,
  },
  {
    id: "kurta",
    label: "Kurta",
    hindi: "कुर्ता",
    silhouette: "Straight kurta",
    hint: "Straight cut, side slits, three-quarter sleeve",
    baseFabric: "#343e87",
    motifScale: 1.05,
  },
  {
    id: "tote",
    label: "Tote Bag",
    hindi: "थैला",
    silhouette: "Structured tote",
    hint: "Boxy body, twin handles, flat base",
    baseFabric: "#e0c9a6",
    motifScale: 0.9,
  },
  {
    id: "cushion",
    label: "Cushion Cover",
    hindi: "कुशन",
    silhouette: "Square cushion",
    hint: "Plump square, piped edge",
    baseFabric: "#fff4de",
    motifScale: 1.1,
  },
  {
    id: "stole",
    label: "Stole",
    hindi: "स्टोल",
    silhouette: "Draped stole",
    hint: "Long rectangular drape with finished ends",
    baseFabric: "#f2a33a",
    motifScale: 0.85,
  },
];

export type MotifId =
  | "mandala"
  | "lotus"
  | "peacock"
  | "fish"
  | "paisley"
  | "marigold"
  | "warli"
  | "tree"
  | "mirror"
  | "sprig"
  | "sunbird"
  | "border";

export type Motif = {
  id: MotifId;
  label: string;
  hindi: string;
  /** Suggested provenance note shown with the motif in the studio. */
  note: string;
  tags: string[];
};

export const MOTIFS: Motif[] = [
  {
    id: "mandala",
    label: "Mandala rosette",
    hindi: "मंडला",
    note: "Concentric rosette built from lotus-petal geometry. A shared decorative language across many Indian crafts.",
    tags: ["geometric", "radial", "formal"],
  },
  {
    id: "lotus",
    label: "Lotus bloom",
    hindi: "कमल",
    note: "Stylised lotus in profile. Frequently used as a border and centrepiece motif.",
    tags: ["floral", "curved", "calm"],
  },
  {
    id: "peacock",
    label: "Peacock",
    hindi: "मोर",
    note: "Stylised peacock with a fan tail. Used here as a contemporary illustration, not as a copy of a specific tradition's composition.",
    tags: ["fauna", "ceremonial", "ornate"],
  },
  {
    id: "fish",
    label: "Fish pair",
    hindi: "मछली",
    note: "Paired fish, a common fertility and water motif in several folk painting traditions.",
    tags: ["fauna", "paired", "folk"],
  },
  {
    id: "paisley",
    label: "Paisley",
    hindi: "अम्बी",
    note: "Mango-shaped paisley with a fine inner vine — a widely travelled motif with many regional readings.",
    tags: ["curved", "classic", "repeatable"],
  },
  {
    id: "marigold",
    label: "Marigold",
    hindi: "गेंदा",
    note: "Layered marigold head, drawn after festival garlands.",
    tags: ["floral", "festive", "radial"],
  },
  {
    id: "warli",
    label: "Warli figure",
    hindi: "वारली",
    note: "Triangle-bodied figure inspired by Warli wall painting from the Maharashtra–Gujarat border. Figures are drawn here in a contemporary line style.",
    tags: ["figurative", "line", "community"],
  },
  {
    id: "tree",
    label: "Tree of life",
    hindi: "कल्पवृक्ष",
    note: "Symmetrical branching tree with leaf pairs — an open-ended botanical composition.",
    tags: ["botanical", "vertical", "story"],
  },
  {
    id: "mirror",
    label: "Mirror diamond",
    hindi: "शीशा",
    note: "Diamond lattice with mirrored centre, referencing shisha work and bandhani tie-resist patterning.",
    tags: ["geometric", "repeatable", "spark"],
  },
  {
    id: "sprig",
    label: "Leaf sprig",
    hindi: "पत्ती",
    note: "Fine botanical sprig for filling negative space and building borders.",
    tags: ["botanical", "fine", "filler"],
  },
  {
    id: "sunbird",
    label: "Sunbird",
    hindi: "सूरज पक्षी",
    note: "Small bird with a sun disc — an original illustration in a miniature-painting palette.",
    tags: ["fauna", "small", "accent"],
  },
  {
    id: "border",
    label: "Floral border",
    hindi: "बेल",
    note: "Running vine border with alternating buds, suited to hems and selvedges.",
    tags: ["border", "repeatable", "vine"],
  },
];

export type Craft = {
  id: string;
  name: string;
  hindi: string;
  region: string;
  /** Short, careful description shown in cards. */
  blurb: string;
  palette: string[];
  motifs: MotifId[];
  materials: string[];
  techniques: string[];
  /** Days of hand-work for a small panel at medium complexity. */
  handworkDays: [number, number];
  productFit: ProductTypeId[];
  accent: string;
};

export const CRAFTS: Craft[] = [
  {
    id: "madhubani",
    name: "Madhubani",
    hindi: "मधुबनी",
    region: "Mithila, Bihar",
    blurb:
      "Line-led painting from Mithila, traditionally done on mud walls and paper with fine double outlines and densely filled botanical fields.",
    palette: ["#7b2040", "#f2a33a", "#087f83", "#fff4de", "#292322"],
    motifs: ["fish", "peacock", "lotus", "tree", "sunbird"],
    materials: ["Handloom cotton", "Silk-cotton", "Natural pigment", "Fine cotton thread"],
    techniques: ["Double-outline linework", "Flat colour fill", "Stem stitch", "Satin stitch"],
    handworkDays: [6, 14],
    productFit: ["jacket", "kurta", "cushion", "stole"],
    accent: "#7b2040",
  },
  {
    id: "phulkari",
    name: "Phulkari",
    hindi: "फुलकारी",
    region: "Punjab",
    blurb:
      "Phulkari means 'flower work': floss-silk darning stitches that build geometric florals across a plain ground, often worked from the reverse.",
    palette: ["#d94b39", "#f2a33a", "#e66a99", "#25765a", "#fff4de"],
    motifs: ["marigold", "mirror", "sprig", "lotus"],
    materials: ["Khaddar cotton", "Floss silk", "Silk thread"],
    techniques: ["Darning stitch", "Herringbone variation", "Counted geometry"],
    handworkDays: [8, 18],
    productFit: ["stole", "jacket", "cushion", "kurta"],
    accent: "#d94b39",
  },
  {
    id: "kalamkari",
    name: "Kalamkari",
    hindi: "कलमकारी",
    region: "Andhra Pradesh",
    blurb:
      "Pen-work textile painting and printing known for narrative panels, earthy madder reds and indigo, and elaborate tree and figure compositions.",
    palette: ["#7b2040", "#343e87", "#c49a55", "#25765a", "#fff4de"],
    motifs: ["tree", "peacock", "lotus", "paisley"],
    materials: ["Handloom cotton", "Myrobalan-treated cloth", "Madder", "Indigo"],
    techniques: ["Kalam pen drawing", "Block printing", "Wax resist", "Natural dyeing"],
    handworkDays: [10, 22],
    productFit: ["stole", "kurta", "cushion", "tote"],
    accent: "#343e87",
  },
  {
    id: "chikankari",
    name: "Chikankari",
    hindi: "चिकनकारी",
    region: "Lucknow, Uttar Pradesh",
    blurb:
      "Delicate white-on-white embroidery from Lucknow: shadow work, raised stitches and airy jali cutwork on fine cotton mulmul.",
    palette: ["#fff4de", "#fff9ef", "#d8f0e9", "#c49a55", "#292322"],
    motifs: ["sprig", "lotus", "paisley", "border"],
    materials: ["Cotton mulmul", "Voile", "Fine cotton thread", "Silk thread"],
    techniques: ["Shadow work (bakhiya)", "Jali cutwork", "Murri stitch", "Phanda knots"],
    handworkDays: [7, 16],
    productFit: ["kurta", "stole", "cushion", "jacket"],
    accent: "#c49a55",
  },
  {
    id: "ajrakh",
    name: "Ajrakh",
    hindi: "अजरख",
    region: "Kutch, Gujarat",
    blurb:
      "Resist-printed cloth with a signature indigo ground and madder reds, built up through repeated printing, dyeing and washing stages.",
    palette: ["#343e87", "#7b2040", "#292322", "#fff4de", "#c49a55"],
    motifs: ["mirror", "mandala", "paisley", "border"],
    materials: ["Cotton", "Silk", "Indigo", "Madder", "Iron-tannin black"],
    techniques: ["Hand block printing", "Resist dyeing", "Multiple wash cycles"],
    handworkDays: [4, 10],
    productFit: ["cushion", "stole", "tote", "jacket"],
    accent: "#343e87",
  },
  {
    id: "bandhani",
    name: "Bandhani",
    hindi: "बांधनी",
    region: "Gujarat & Rajasthan",
    blurb:
      "Tie-resist patterning where thousands of tiny tied points create dotted fields, diamonds and floral bursts once dyed.",
    palette: ["#e66a99", "#d94b39", "#f2a33a", "#343e87", "#fff4de"],
    motifs: ["mirror", "marigold", "mandala", "border"],
    materials: ["Fine cotton", "Gajji silk", "Cotton thread", "Dye"],
    techniques: ["Tie-resist", "Dotted field composition", "Multi-dye layers"],
    handworkDays: [3, 9],
    productFit: ["stole", "kurta", "jacket", "cushion"],
    accent: "#e66a99",
  },
  {
    id: "warli",
    name: "Warli",
    hindi: "वारली",
    region: "Maharashtra",
    blurb:
      "Wall painting from Warli communities using a rice-paste white on mud-brown ground, with triangle figures, spirals and community scenes.",
    palette: ["#fff4de", "#b65a3c", "#292322", "#25765a", "#f2a33a"],
    motifs: ["warli", "tree", "sunbird", "border"],
    materials: ["Cotton canvas", "Kora cloth", "Rice paste pigment", "White thread"],
    techniques: ["Line figure drawing", "Spiral composition", "Running stitch"],
    handworkDays: [2, 7],
    productFit: ["cushion", "tote", "kurta", "stole"],
    accent: "#b65a3c",
  },
  {
    id: "gond",
    name: "Gond painting",
    hindi: "गोंड",
    region: "Central India",
    blurb:
      "Gond painting uses fine dots and line infill to build animals, trees and mythic scenes, with a distinctive signature of patterned interiors.",
    palette: ["#25765a", "#f2a33a", "#d94b39", "#292322", "#fff4de"],
    motifs: ["tree", "peacock", "fish", "sunbird"],
    materials: ["Cotton canvas", "Natural pigment", "Silk thread"],
    techniques: ["Dot-and-line infill", "Contour drawing", "Chain stitch"],
    handworkDays: [7, 16],
    productFit: ["cushion", "stole", "jacket", "kurta"],
    accent: "#25765a",
  },
  {
    id: "kantha",
    name: "Kantha",
    hindi: "कांथा",
    region: "West Bengal",
    blurb:
      "Running-stitch quilting that layers old cloth into new, with rippling lines and simple narrative motifs stitched in relief.",
    palette: ["#d94b39", "#f2a33a", "#087f83", "#fff4de", "#e66a99"],
    motifs: ["lotus", "sunbird", "tree", "sprig"],
    materials: ["Recycled cotton saris", "Cotton thread", "Silk thread"],
    techniques: ["Running stitch quilting", "Motif darning", "Layer stitching"],
    handworkDays: [5, 12],
    productFit: ["cushion", "stole", "jacket", "kurta"],
    accent: "#d94b39",
  },
  {
    id: "pattachitra",
    name: "Pattachitra",
    hindi: "पट्टचित्र",
    region: "Odisha",
    blurb:
      "Cloth-based scroll painting with bold outlines, flat fills and decorative borders, traditionally prepared with tamarind-seed binding.",
    palette: ["#d94b39", "#f2a33a", "#292322", "#fff4de", "#343e87"],
    motifs: ["peacock", "lotus", "fish", "border"],
    materials: ["Cotton cloth", "Tussar silk", "Natural pigment", "Fine thread"],
    techniques: ["Bold outline", "Flat colour fill", "Decorative border"],
    handworkDays: [8, 18],
    productFit: ["jacket", "stole", "cushion", "kurta"],
    accent: "#d94b39",
  },
  {
    id: "zardozi",
    name: "Zardozi",
    hindi: "ज़रदोज़ी",
    region: "Lucknow & Delhi",
    blurb:
      "Metal-thread embroidery worked on a frame, building raised gold and silver surfaces with sequins, beads and fine couching.",
    palette: ["#c49a55", "#7b2040", "#f2a33a", "#fff4de", "#292322"],
    motifs: ["mandala", "paisley", "marigold", "border"],
    materials: ["Silk", "Velvet", "Metallic thread", "Sequins", "Beads"],
    techniques: ["Metal thread couching", "Bead work", "Sequins", "Raised padding"],
    handworkDays: [12, 26],
    productFit: ["jacket", "stole", "cushion", "kurta"],
    accent: "#c49a55",
  },
  {
    id: "kashmiri",
    name: "Kashmiri embroidery",
    hindi: "कश्मीरी कढ़ाई",
    region: "Kashmir Valley",
    blurb:
      "Fine needle embroidery in a palette of chinar leaves, saffron crocus and almond blossoms, with satin and chain stitch shading.",
    palette: ["#7b2040", "#343e87", "#25765a", "#f2a33a", "#fff4de"],
    motifs: ["paisley", "sprig", "tree", "lotus"],
    materials: ["Pashmina", "Fine wool", "Silk thread", "Cotton thread"],
    techniques: ["Satin stitch", "Chain stitch", "Fine shading", "Sozni outlining"],
    handworkDays: [14, 30],
    productFit: ["stole", "jacket", "kurta", "cushion"],
    accent: "#7b2040",
  },
];

export const CRAFT_BY_ID: Record<string, Craft> = Object.fromEntries(
  CRAFTS.map((craft) => [craft.id, craft]),
);

export const MOTIF_BY_ID: Record<string, Motif> = Object.fromEntries(
  MOTIFS.map((motif) => [motif.id, motif]),
);

export const PRODUCT_BY_ID: Record<string, ProductType> = Object.fromEntries(
  PRODUCT_TYPES.map((product) => [product.id, product]),
);

/** Curated palette starting points for the studio. */
export const PALETTE_PRESETS: { name: string; colors: string[] }[] = [
  { name: "Madder & Indigo", colors: ["#7b2040", "#343e87", "#f2a33a", "#fff4de", "#292322"] },
  { name: "Saffron Bazaar", colors: ["#d94b39", "#f4bd42", "#087f83", "#fff4de", "#7b2040"] },
  { name: "Rani Garden", colors: ["#e66a99", "#7b2040", "#25765a", "#f7d5bb", "#fff9ef"] },
  { name: "Monsoon Teal", colors: ["#087f83", "#d8f0e9", "#343e87", "#f2a33a", "#292322"] },
  { name: "Zardozi Night", colors: ["#292322", "#c49a55", "#7b2040", "#f2a33a", "#fff4de"] },
  { name: "Ivory Chikan", colors: ["#fff9ef", "#e7e0f4", "#c49a55", "#25765a", "#7b2040"] },
];

export const FABRICS: { id: string; name: string; detail: string; color: string }[] = [
  { id: "handloom-cotton", name: "Handloom cotton", detail: "Matte, forgiving, holds fine embroidery", color: "#e8d3b4" },
  { id: "mulmul", name: "Mulmul", detail: "Feather-light, ideal for chikankari", color: "#f6ecdb" },
  { id: "tussar-silk", name: "Tussar silk", detail: "Warm gold sheen with a slub texture", color: "#d9bb87" },
  { id: "raw-silk", name: "Raw silk", detail: "Crisp body, good for structured jackets", color: "#b0512f" },
  { id: "khaddar", name: "Khaddar", detail: "Handspun cotton used for phulkari ground", color: "#dcd0b6" },
  { id: "velvet", name: "Velvet", detail: "Deep pile that carries zardozi well", color: "#5f1a34" },
];
