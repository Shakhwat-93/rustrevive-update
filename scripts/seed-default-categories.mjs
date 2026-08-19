import fs from "node:fs";

// Read environment
const envFile = fs.readFileSync(".env.local", "utf8");
const env = {};
for (const line of envFile.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx !== -1) {
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const DEFAULT_CATEGORIES = [
  {
    name: "Heavyweight T-Shirts",
    slug: "t-shirts",
    description: "260 GSM to 320 GSM combed cotton vintage cut t-shirts.",
    sort_order: 1,
    is_active: true,
  },
  {
    name: "Raw Denim & Pants",
    slug: "pants",
    description: "14.5oz Japanese shuttle-loomed selvedge denim and pleated trousers.",
    sort_order: 2,
    is_active: true,
  },
  {
    name: "Artisanal Jackets",
    slug: "jackets",
    description: "Handcrafted wool, canvas, and leather chore jackets.",
    sort_order: 3,
    is_active: true,
  },
  {
    name: "Leather Belts",
    slug: "belts",
    description: "Full-grain Italian and vegetable-tanned bridle leather belts.",
    sort_order: 4,
    is_active: true,
  },
  {
    name: "Tailored Overshirts",
    slug: "shirts",
    description: "Heavy twill and brushed oxford button-downs.",
    sort_order: 5,
    is_active: true,
  },
  {
    name: "Artifacts & Accessories",
    slug: "accessories",
    description: "Handmade brass hardware, leather wallets, and accessories.",
    sort_order: 6,
    is_active: true,
  },
];

async function seedCategories() {
  console.log("==================================================");
  console.log("RUST & REVIVE — SEEDING DEFAULT CATEGORIES");
  console.log("==================================================");

  for (const cat of DEFAULT_CATEGORIES) {
    const res = await fetch(`${url}/rest/v1/categories`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(cat),
    });

    if (res.ok || res.status === 201) {
      console.log(`  ✅ Seeded: ${cat.name} (${cat.slug})`);
    } else {
      const txt = await res.text();
      console.log(`  ⚠️ Notice on ${cat.slug}: ${txt}`);
    }
  }
}

seedCategories();
