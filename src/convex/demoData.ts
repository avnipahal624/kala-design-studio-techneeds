export type DemoAvailability = "available" | "limited" | "paused";

export type DemoArtisan = {
  name: string;
  craft: string;
  city: string;
  region: string;
  skills: string[];
  customSkills?: string[];
  products: string[];
  materials: string[];
  min: number;
  max: number;
  availability: DemoAvailability;
  days: number;
  collaborates: boolean;
  rating: number;
  reviews: number;
};

export const DEMO_ARTISANS: DemoArtisan[] = [
  { name: "Meera Joshi", craft: "Hand-painted mandalas on footwear and denim", city: "Udaipur", region: "Rajasthan", skills: ["Hand Painting", "Mandala Painting", "Surface Preparation", "Protective Finishing"], products: ["Footwear", "Jackets", "Tote Bags"], materials: ["Canvas", "Denim", "Leather"], min: 2200, max: 24000, availability: "available", days: 12, collaborates: true, rating: 4.9, reviews: 18 },
  { name: "Ayesha Khan", craft: "Chikankari and fine hand embroidery", city: "Lucknow", region: "Uttar Pradesh", skills: ["Chikankari", "Embroidery", "Tailoring", "Surface Preparation"], products: ["Kurtas", "Sarees", "Jackets"], materials: ["Cotton", "Silk"], min: 3500, max: 30000, availability: "available", days: 18, collaborates: true, rating: 4.8, reviews: 26 },
  { name: "Gurpreet Kaur", craft: "Phulkari florals worked in floss silk", city: "Amritsar", region: "Punjab", skills: ["Phulkari", "Embroidery", "Surface Preparation"], products: ["Stoles", "Jackets", "Kurtas"], materials: ["Cotton", "Silk"], min: 2800, max: 18000, availability: "limited", days: 16, collaborates: true, rating: 4.9, reviews: 31 },
  { name: "Imran Sheikh", craft: "Block printing and natural dye on cloth", city: "Jaipur", region: "Rajasthan", skills: ["Block Printing", "Textile Dyeing", "Surface Preparation"], products: ["Kurtas", "Sarees", "Tote Bags"], materials: ["Cotton", "Silk"], min: 1800, max: 16000, availability: "available", days: 10, collaborates: true, rating: 4.7, reviews: 22 },
  { name: "Rukmini Devi", craft: "Madhubani linework and hand painting", city: "Patna", region: "Bihar", skills: ["Madhubani Painting", "Hand Painting", "Decorative Finishing"], products: ["Jackets", "Stoles", "Home Decor"], materials: ["Cotton", "Silk"], min: 2500, max: 22000, availability: "available", days: 14, collaborates: true, rating: 4.8, reviews: 17 },
  { name: "Arjun Mehta", craft: "Structured tailoring for jackets and denim", city: "Delhi", region: "Delhi NCR", skills: ["Tailoring", "Surface Preparation", "Decorative Finishing"], products: ["Jackets", "Jeans", "Kurtas"], materials: ["Denim", "Cotton", "Wool"], min: 4000, max: 40000, availability: "available", days: 20, collaborates: true, rating: 4.8, reviews: 34 },
  { name: "Rekha Pal", craft: "Kantha quilting and layered embroidery", city: "Kolkata", region: "West Bengal", skills: ["Kantha", "Embroidery", "Surface Preparation"], products: ["Stoles", "Jackets", "Home Decor"], materials: ["Cotton", "Silk"], min: 2200, max: 20000, availability: "available", days: 15, collaborates: true, rating: 4.9, reviews: 29 },
  { name: "Faizan Ali", craft: "Zardozi metal-thread embroidery", city: "Delhi", region: "Delhi NCR", skills: ["Zardozi", "Beadwork", "Decorative Finishing"], products: ["Jackets", "Sarees", "Accessories"], materials: ["Silk", "Metal"], min: 5000, max: 50000, availability: "limited", days: 24, collaborates: true, rating: 4.9, reviews: 21 },
  { name: "Lakshmi Narayan", craft: "Handloom dyeing and block-printed silk", city: "Varanasi", region: "Uttar Pradesh", skills: ["Textile Dyeing", "Block Printing", "Surface Preparation"], products: ["Sarees", "Stoles", "Kurtas"], materials: ["Silk", "Cotton"], min: 3000, max: 26000, availability: "available", days: 17, collaborates: true, rating: 4.7, reviews: 19 },
  { name: "Noor Bano", craft: "Fine wool embroidery and finishing", city: "Srinagar", region: "Kashmir Valley", skills: ["Embroidery", "Decorative Finishing", "Protective Finishing"], products: ["Stoles", "Jackets", "Kurtas"], materials: ["Wool", "Silk"], min: 3500, max: 32000, availability: "available", days: 22, collaborates: true, rating: 4.9, reviews: 24 },
  { name: "Devika Nair", craft: "Crochet, beadwork and small accessories", city: "Kochi", region: "Kerala", skills: ["Beadwork", "Decorative Finishing"], customSkills: ["Crochet"], products: ["Accessories", "Handbags", "Gifts"], materials: ["Cotton", "Other"], min: 1200, max: 12000, availability: "available", days: 9, collaborates: true, rating: 4.6, reviews: 13 },
  { name: "Kabir Singh", craft: "Leather construction and hand finishing", city: "Jodhpur", region: "Rajasthan", skills: ["Leather Craft", "Decorative Finishing", "Surface Preparation"], products: ["Handbags", "Wallets", "Accessories"], materials: ["Leather", "Canvas", "Metal"], min: 2500, max: 24000, availability: "available", days: 14, collaborates: true, rating: 4.8, reviews: 27 },
  { name: "Anjali Das", craft: "Pattachitra-inspired painting on cloth", city: "Bhubaneswar", region: "Odisha", skills: ["Hand Painting", "Decorative Finishing"], customSkills: ["Pattachitra"], products: ["Home Decor", "Jackets", "Stoles"], materials: ["Cotton", "Silk"], min: 2000, max: 18000, availability: "limited", days: 13, collaborates: true, rating: 4.7, reviews: 15 },
  { name: "Sameer Qureshi", craft: "Painted leather, sneakers and small goods", city: "Mumbai", region: "Maharashtra", skills: ["Leather Craft", "Hand Painting", "Protective Finishing"], products: ["Footwear", "Handbags", "Wallets"], materials: ["Leather", "Canvas"], min: 1800, max: 16000, availability: "available", days: 11, collaborates: true, rating: 4.8, reviews: 23 },
  { name: "Pooja Iyer", craft: "Tailored blouses and delicate embroidery", city: "Chennai", region: "Tamil Nadu", skills: ["Tailoring", "Embroidery", "Surface Preparation"], products: ["Sarees", "Kurtas", "Accessories"], materials: ["Silk", "Cotton"], min: 2600, max: 20000, availability: "available", days: 12, collaborates: true, rating: 4.8, reviews: 20 },
  { name: "Tenzin Dolma", craft: "Wool stoles, dyeing and hand finishing", city: "Dharamshala", region: "Himachal Pradesh", skills: ["Textile Dyeing", "Embroidery", "Protective Finishing"], products: ["Stoles", "Jackets", "Kurtas"], materials: ["Wool", "Silk"], min: 2200, max: 17000, availability: "limited", days: 18, collaborates: true, rating: 4.7, reviews: 14 },
  { name: "Ravi Kumar", craft: "Hand-dyed textiles and home furnishings", city: "Panipat", region: "Haryana", skills: ["Textile Dyeing", "Tailoring", "Surface Preparation"], products: ["Home Decor", "Kurtas", "Stoles"], materials: ["Cotton", "Wool"], min: 1500, max: 14000, availability: "available", days: 9, collaborates: true, rating: 4.5, reviews: 11 },
  { name: "Sana Mir", craft: "Zardozi, beadwork and occasion wear", city: "Hyderabad", region: "Telangana", skills: ["Zardozi", "Beadwork", "Embroidery"], products: ["Sarees", "Jackets", "Accessories"], materials: ["Silk", "Metal"], min: 4500, max: 45000, availability: "available", days: 21, collaborates: true, rating: 4.9, reviews: 25 },
  { name: "Mohan Lal", craft: "Woodwork, carved details and finishing", city: "Jaipur", region: "Rajasthan", skills: ["Woodwork", "Decorative Finishing", "Surface Preparation"], products: ["Furniture", "Home Decor", "Gifts"], materials: ["Wood", "Metal"], min: 3000, max: 35000, availability: "available", days: 20, collaborates: true, rating: 4.6, reviews: 12 },
  { name: "Bhavna Shah", craft: "Bandhani-inspired dye and block print", city: "Ahmedabad", region: "Gujarat", skills: ["Textile Dyeing", "Block Printing", "Surface Preparation"], products: ["Sarees", "Stoles", "Home Decor"], materials: ["Cotton", "Silk"], min: 2000, max: 18000, availability: "available", days: 11, collaborates: true, rating: 4.7, reviews: 16 },
  { name: "Nisha Yadav", craft: "Chikankari kurtas and soft tailoring", city: "Lucknow", region: "Uttar Pradesh", skills: ["Chikankari", "Tailoring", "Embroidery"], products: ["Kurtas", "Sarees", "Accessories"], materials: ["Cotton", "Silk"], min: 2400, max: 19000, availability: "available", days: 13, collaborates: true, rating: 4.8, reviews: 18 },
  { name: "Vikram Rao", craft: "Leather bags with painted and stitched detail", city: "Bengaluru", region: "Karnataka", skills: ["Leather Craft", "Protective Finishing", "Decorative Finishing"], products: ["Handbags", "Footwear", "Accessories"], materials: ["Leather", "Canvas"], min: 2200, max: 21000, availability: "limited", days: 15, collaborates: true, rating: 4.7, reviews: 14 },
];

export type DemoCustomer = {
  name: string;
  city: string;
  interests: string[];
};

export const DEMO_CUSTOMERS: DemoCustomer[] = [
  { name: "Ananya Rao", city: "Bengaluru", interests: ["Festive wear", "Hand embroidery"] },
  { name: "Ishaan Kapoor", city: "Mumbai", interests: ["Painted sneakers", "Denim"] },
  { name: "Priya Nair", city: "Kochi", interests: ["Wedding gifts", "Chikankari"] },
  { name: "Simran Bedi", city: "Chandigarh", interests: ["Phulkari", "Occasion wear"] },
  { name: "Neelam Joshi", city: "Jaipur", interests: ["Block print", "Home décor"] },
  { name: "Aditya Sen", city: "Kolkata", interests: ["Kantha", "Personalised gifts"] },
  { name: "Maya Fernandes", city: "Goa", interests: ["Resort wear", "Hand painting"] },
  { name: "Rohan Desai", city: "Ahmedabad", interests: ["Boutique apparel", "Textiles"] },
];

export type DemoRequestBlueprint = {
  title: string;
  customer: number;
  artisan: number;
  category: string;
  product: string;
  description: string;
  craft: string;
  skills: string[];
  materials: string;
  budget: number;
  days: number;
  city: string;
  fulfilment: "shipping" | "local_handoff";
  status: "open" | "quote_selected" | "closed";
  collab?: "in_progress" | "awaiting_approval" | "completed";
};

export const DEMO_REQUESTS: DemoRequestBlueprint[] = [
  { title: "Heirloom Kantha Jacket", customer: 0, artisan: 6, category: "Clothing", product: "A soft silk-cotton jacket I bought in Kolkata, unlined and ready for handwork.", description: "Layered running-stitch Kantha across the back, with a quieter panel on the front. Keep the original buttons and make it wearable for winter evenings.", craft: "Kantha", skills: ["Kantha", "Embroidery", "Tailoring"], materials: "Silk", budget: 18500, days: 45, city: "Kolkata", fulfilment: "shipping", status: "quote_selected" },
  { title: "Hand-painted Mandala Sneakers", customer: 1, artisan: 0, category: "Footwear", product: "White canvas high-tops, lightly worn, with clean side panels.", description: "A fine terracotta mandala on the outer sides with small gold accents. Finish must flex with the canvas and stay wearable.", craft: "Mandala Painting", skills: ["Hand Painting", "Mandala Painting", "Protective Finishing"], materials: "Canvas", budget: 4200, days: 21, city: "Mumbai", fulfilment: "shipping", status: "quote_selected" },
  { title: "Chikankari Kurta for a Wedding", customer: 2, artisan: 1, category: "Clothing", product: "A new ivory cotton kurta with a straight cut and side slits.", description: "Delicate white-on-white Chikankari on the yoke and sleeves, inspired by Lucknow architecture. Needs to be light enough for a day wedding.", craft: "Chikankari", skills: ["Chikankari", "Embroidery", "Tailoring"], materials: "Cotton", budget: 12000, days: 60, city: "Lucknow", fulfilment: "shipping", status: "quote_selected" },
  { title: "Phulkari Dupatta", customer: 3, artisan: 2, category: "Clothing", product: "A plain khaddar dupatta in deep madder red.", description: "Phulkari floral geometry across the pallu, with a lighter border. The reverse should look as considered as the front.", craft: "Phulkari", skills: ["Phulkari", "Embroidery"], materials: "Cotton", budget: 7800, days: 30, city: "Chandigarh", fulfilment: "shipping", status: "quote_selected" },
  { title: "Block-printed Cotton Saree", customer: 4, artisan: 3, category: "Clothing", product: "A soft cotton saree in undyed natural cloth.", description: "A small floral block repeat in indigo and madder with a contrasting border. Natural dye is preferred; please show a test swatch first.", craft: "Block Printing", skills: ["Block Printing", "Textile Dyeing"], materials: "Cotton", budget: 9500, days: 40, city: "Jaipur", fulfilment: "shipping", status: "quote_selected" },
  { title: "Madhubani Denim Jacket", customer: 5, artisan: 4, category: "Clothing", product: "A mid-blue denim jacket, oversized fit, in good condition.", description: "A fish and lotus composition across the back in Madhubani double outlines. Keep the painting flexible and avoid covering the pockets.", craft: "Madhubani Painting", skills: ["Madhubani Painting", "Hand Painting", "Protective Finishing"], materials: "Denim", budget: 14500, days: 45, city: "Patna", fulfilment: "shipping", status: "quote_selected" },
  { title: "Tailored Festive Jacket", customer: 6, artisan: 5, category: "Clothing", product: "A new structured jacket in charcoal wool with a simple open front.", description: "Clean tailoring with a hand-finished collar and subtle tone-on-tone stitching. The piece should feel modern rather than costume-like.", craft: "Tailoring", skills: ["Tailoring", "Surface Preparation", "Decorative Finishing"], materials: "Wool", budget: 22000, days: 50, city: "Delhi", fulfilment: "local_handoff", status: "quote_selected" },
  { title: "Zardozi Evening Clutch", customer: 7, artisan: 7, category: "Accessories", product: "A plain silk clutch base with a removable chain.", description: "A compact zardozi motif in antique gold with restrained beadwork. No loose sequins; the clasp must stay clear.", craft: "Zardozi", skills: ["Zardozi", "Beadwork", "Decorative Finishing"], materials: "Silk", budget: 8800, days: 35, city: "Delhi", fulfilment: "shipping", status: "quote_selected" },
  { title: "Handwoven Silk Stole", customer: 0, artisan: 8, category: "Clothing", product: "A handwoven silk stole in warm ivory.", description: "A fine block-printed border in forest green with a small repeating vine. Finish the ends by hand and keep the drape soft.", craft: "Block Printing", skills: ["Textile Dyeing", "Block Printing"], materials: "Silk", budget: 6200, days: 25, city: "Varanasi", fulfilment: "shipping", status: "quote_selected" },
  { title: "Kashmiri-inspired Wool Stole", customer: 1, artisan: 9, category: "Clothing", product: "A lightweight wool stole in deep terracotta.", description: "Fine sozni-style outlining around a paisley field, with a soft hand finish. Avoid heavy padding; the piece should remain fluid.", craft: "Embroidery", skills: ["Embroidery", "Decorative Finishing", "Protective Finishing"], materials: "Wool", budget: 11500, days: 45, city: "Srinagar", fulfilment: "shipping", status: "quote_selected" },
  { title: "Crochet Market Bag", customer: 2, artisan: 10, category: "Bags", product: "A new crochet market bag in natural cotton cord.", description: "A sturdy open-work bag with a reinforced base and a small beaded charm. Keep the handles comfortable for daily use.", craft: "Crochet", skills: ["Crochet", "Beadwork"], materials: "Cotton", budget: 3600, days: 20, city: "Kochi", fulfilment: "shipping", status: "quote_selected" },
  { title: "Hand-finished Leather Tote", customer: 3, artisan: 11, category: "Bags", product: "A plain tan leather tote with a few light marks.", description: "Clean the leather, add a hand-painted border and finish the edges. Keep the patina; do not cover the whole surface.", craft: "Leather Craft", skills: ["Leather Craft", "Decorative Finishing"], materials: "Leather", budget: 9800, days: 30, city: "Jodhpur", fulfilment: "shipping", status: "quote_selected" },
  { title: "Pattachitra Wall Panel", customer: 4, artisan: 12, category: "Home Decor", product: "A stretched cotton panel for a living-room wall.", description: "A bold Pattachitra-inspired peacock and lotus composition with a decorative border. Natural pigments preferred.", craft: "Hand Painting", skills: ["Hand Painting", "Decorative Finishing"], materials: "Cotton", budget: 7200, days: 28, city: "Bhubaneswar", fulfilment: "shipping", status: "quote_selected" },
  { title: "Custom Painted Sneakers", customer: 5, artisan: 13, category: "Footwear", product: "A new pair of white leather sneakers.", description: "Small hand-painted marigolds along the heel and a monogram on the tongue. Must be sealed for rain.", craft: "Hand Painting", skills: ["Hand Painting", "Protective Finishing"], materials: "Leather", budget: 4800, days: 18, city: "Mumbai", fulfilment: "shipping", status: "quote_selected" },
  { title: "Embroidered Silk Blouse", customer: 6, artisan: 14, category: "Clothing", product: "A new deep green silk blouse, tailored to measurements.", description: "A fine embroidered neckline with a small repeating motif. Keep the sleeves elbow-length and the fit comfortable.", craft: "Embroidery", skills: ["Tailoring", "Embroidery"], materials: "Silk", budget: 6900, days: 24, city: "Chennai", fulfilment: "shipping", status: "quote_selected" },
  { title: "Custom Embroidered Jacket", customer: 7, artisan: 0, category: "Clothing", product: "A new ivory silk jacket with a simple open front.", description: "I want a jacket that brings together tailoring, Kantha embroidery and a hand-painted finishing panel. Keep the base elegant and let the three crafts meet without competing.", craft: "Kantha", skills: ["Tailoring", "Embroidery", "Hand Painting"], materials: "Silk", budget: 16000, days: 45, city: "Delhi", fulfilment: "shipping", status: "open" },
  { title: "Personalised Canvas Tote", customer: 0, artisan: 0, category: "Bags", product: "A sturdy natural canvas tote.", description: "A simple hand-painted botanical border and a short name in the centre. Keep it washable and understated.", craft: "Hand Painting", skills: ["Hand Painting", "Protective Finishing"], materials: "Canvas", budget: 3200, days: 20, city: "Pune", fulfilment: "shipping", status: "open" },
  { title: "The Heirloom Jacket", customer: 1, artisan: 0, category: "Clothing", product: "A structured ivory jacket for a family celebration.", description: "Three makers: tailor the base, embroider the front panels with Kantha, then add a hand-painted border in terracotta and gold.", craft: "Kantha", skills: ["Tailoring", "Embroidery", "Hand Painting"], materials: "Silk", budget: 21000, days: 60, city: "Delhi", fulfilment: "shipping", status: "closed", collab: "in_progress" },
  { title: "Monsoon Story Saree", customer: 2, artisan: 0, category: "Clothing", product: "A soft silk saree in monsoon grey.", description: "A coordinated textile story: dye the ground, block-print rain motifs, then finish the pallu with a fine stitched border.", craft: "Block Printing", skills: ["Textile Dyeing", "Block Printing", "Decorative Finishing"], materials: "Silk", budget: 18000, days: 50, city: "Kolkata", fulfilment: "shipping", status: "closed", collab: "awaiting_approval" },
  { title: "Wedding Zardozi Jacket", customer: 3, artisan: 0, category: "Clothing", product: "A deep wine velvet jacket for a winter wedding.", description: "Tailor the jacket, add zardozi panels, then finish the shoulders with beadwork. The final piece should be rich but not heavy.", craft: "Zardozi", skills: ["Tailoring", "Zardozi", "Beadwork"], materials: "Silk", budget: 30000, days: 80, city: "Delhi", fulfilment: "shipping", status: "closed", collab: "completed" },
];

export const DEMO_PORTFOLIO: { craft: string; titles: string[]; materials: string[] }[] = [
  { craft: "Hand Painting", titles: ["Terracotta mandala sneakers", "Painted denim jacket", "Botanical canvas tote"], materials: ["Canvas", "Denim"] },
  { craft: "Chikankari", titles: ["Ivory Chikankari kurta", "Shadow-work silk blouse"], materials: ["Cotton", "Silk"] },
  { craft: "Phulkari", titles: ["Madder Phulkari dupatta", "Phulkari evening stole"], materials: ["Cotton", "Silk"] },
  { craft: "Block Printing", titles: ["Indigo block-print saree", "Jaipur cotton kurta", "Block-print table runner"], materials: ["Cotton", "Silk"] },
  { craft: "Madhubani Painting", titles: ["Fish-and-lotus denim jacket", "Madhubani silk stole"], materials: ["Denim", "Silk"] },
  { craft: "Tailoring", titles: ["Charcoal wool jacket", "Structured denim jacket"], materials: ["Wool", "Denim"] },
  { craft: "Kantha", titles: ["Kantha quilted jacket", "Running-stitch stole"], materials: ["Cotton", "Silk"] },
  { craft: "Zardozi", titles: ["Antique gold clutch", "Zardozi occasion jacket"], materials: ["Silk", "Metal"] },
  { craft: "Textile Dyeing", titles: ["Natural-dye silk stole", "Indigo handloom saree"], materials: ["Silk", "Cotton"] },
  { craft: "Embroidery", titles: ["Sozni-inspired wool stole", "Embroidered silk blouse"], materials: ["Wool", "Silk"] },
  { craft: "Beadwork", titles: ["Beaded market bag", "Crochet charm bag"], materials: ["Cotton"] },
  { craft: "Leather Craft", titles: ["Hand-finished leather tote", "Painted leather sneakers"], materials: ["Leather"] },
  { craft: "Home Decor", titles: ["Pattachitra wall panel", "Hand-painted cushion cover"], materials: ["Cotton"] },
  { craft: "Woodwork", titles: ["Carved wood mirror frame", "Hand-finished stool"], materials: ["Wood"] },
];

const PALETTES = [
  ["#7a302a", "#d8a65b", "#f7f2e8", "#34483e"],
  ["#34483e", "#c99b55", "#efe1ca", "#7a302a"],
  ["#4b3a32", "#d8a65b", "#f1e6d6", "#a5483b"],
  ["#7a302a", "#e9dfd0", "#9bad9d", "#28231f"],
];

function esc(value: string) {
  return value.replace(/[<>&"]/g, "");
}

/** Original editorial artwork for demo records. No external stock assets. */
export function demoArtwork(craft: string, title: string, index: number) {
  const palette = PALETTES[index % PALETTES.length];
  const rings = Array.from({ length: 6 }, (_, ring) => {
    const radius = 28 + ring * 21;
    return `<circle cx="330" cy="218" r="${radius}" fill="none" stroke="${palette[ring % 3]}" stroke-width="${ring % 2 ? 1 : 2}" opacity="${0.22 + ring * 0.04}"/>`;
  }).join("");
  const petals = Array.from({ length: 12 }, (_, petal) => {
    const angle = petal * 30;
    return `<ellipse cx="330" cy="148" rx="11" ry="34" fill="${palette[petal % 2]}" opacity="0.55" transform="rotate(${angle} 330 218)"/>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 660 440">
  <rect width="660" height="440" fill="${palette[2]}"/>
  <rect x="20" y="20" width="620" height="400" fill="none" stroke="${palette[0]}" stroke-width="1" opacity="0.35"/>
  <path d="M0 330 Q180 250 330 325 T660 300 V440 H0Z" fill="${palette[1]}" opacity="0.18"/>
  ${rings}${petals}
  <path d="M230 330 L230 190 Q230 155 265 145 L395 145 Q430 155 430 190 L430 330Z" fill="${palette[3]}" opacity="0.12" stroke="${palette[0]}" stroke-width="1.5"/>
  <text x="330" y="372" text-anchor="middle" font-family="Georgia,serif" font-size="25" fill="${palette[3]}">${esc(craft)}</text>
  <text x="330" y="397" text-anchor="middle" font-family="Helvetica,sans-serif" font-size="10" letter-spacing="2" fill="${palette[3]}" opacity="0.7">${esc(title.toUpperCase())}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const DEMO_LABEL = "Sample data — fictional demo record, not a real order, verification or payment.";
export const DEMO_SEED_KEY = "kalakari-phase3-v1";
