/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

const img = (seed, w = 800, h = 800) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

async function main() {
  console.log("Seeding database...");

  // ---- Settings (shipping fee is admin-editable later) ----
  await prisma.setting.upsert({
    where: { id: 1 },
    create: { id: 1, shippingFee: 60, freeShippingThreshold: 2000 },
    update: {},
  });

  // ---- Admin user ----
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@shop.com").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";
  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      name: "Store Admin",
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: "ADMIN",
    },
    update: {},
  });

  // ---- Categories ----
  const categoryData = [
    { name: "Electronics", slug: "electronics", children: ["Phones", "Laptops", "Audio"] },
    { name: "Fashion", slug: "fashion", children: ["Men", "Women", "Kids"] },
    { name: "Home & Kitchen", slug: "home-kitchen", children: ["Cookware", "Decor"] },
    { name: "Beauty", slug: "beauty", children: ["Skincare", "Makeup"] },
    { name: "Sports", slug: "sports", children: ["Fitness", "Outdoor"] },
  ];

  const categoryIds = {};
  for (const c of categoryData) {
    const parent = await prisma.category.upsert({
      where: { slug: c.slug },
      create: { name: c.name, slug: c.slug, imageUrl: img(`cat-${c.slug}`, 600, 400) },
      update: {},
    });
    categoryIds[c.slug] = parent.id;
    let position = 0;
    for (const childName of c.children) {
      const childSlug = childName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const child = await prisma.category.upsert({
        where: { slug: childSlug },
        create: {
          name: childName,
          slug: childSlug,
          parentId: parent.id,
          position: position++,
          imageUrl: img(`cat-${childSlug}`, 600, 400),
        },
        update: {},
      });
      categoryIds[childSlug] = child.id;
    }
  }

  // ---- Brands ----
  const brandData = [
    { name: "NovaTech", slug: "novatech" },
    { name: "UrbanWeave", slug: "urbanweave" },
    { name: "HomeCraft", slug: "homecraft" },
    { name: "GlowLab", slug: "glowlab" },
    { name: "PeakFit", slug: "peakfit" },
  ];
  const brandIds = {};
  for (const b of brandData) {
    const brand = await prisma.brand.upsert({
      where: { slug: b.slug },
      create: { name: b.name, slug: b.slug, imageUrl: img(`brand-${b.slug}`, 400, 400) },
      update: {},
    });
    brandIds[b.slug] = brand.id;
  }

  // ---- Products ----
  const products = [
    {
      name: "Nova X2 Wireless Headphones",
      slug: "nova-x2-wireless-headphones",
      category: "audio",
      brand: "novatech",
      price: 3490,
      comparePrice: 4200,
      stock: 40,
      rating: 4.6,
      ratingCount: 24,
      isFeatured: true,
      description:
        "Over-ear wireless headphones with active noise cancellation, 40-hour battery life and plush memory-foam ear cushions.",
      variants: [
        { sku: "NX2-BLK", label: "Black", options: { Color: "Black" }, stock: 22 },
        { sku: "NX2-SLV", label: "Silver", options: { Color: "Silver" }, stock: 18 },
      ],
    },
    {
      name: "Nova Pulse Smartwatch",
      slug: "nova-pulse-smartwatch",
      category: "phones",
      brand: "novatech",
      price: 5990,
      comparePrice: 6990,
      stock: 25,
      rating: 4.4,
      ratingCount: 18,
      isFeatured: true,
      description:
        "AMOLED fitness smartwatch with heart-rate, SpO2, sleep tracking and 10-day battery life.",
      variants: [
        { sku: "NPS-42", label: "42mm", options: { Size: "42mm" }, stock: 15 },
        { sku: "NPS-46", label: "46mm", options: { Size: "46mm" }, stock: 10 },
      ],
    },
    {
      name: "AeroBook 14 Laptop",
      slug: "aerobook-14-laptop",
      category: "laptops",
      brand: "novatech",
      price: 62990,
      comparePrice: 69990,
      stock: 12,
      rating: 4.7,
      ratingCount: 9,
      isFeatured: true,
      description:
        "14-inch 2.2K display laptop with 16GB RAM, 512GB NVMe SSD and all-day 12-hour battery.",
    },
    {
      name: "Urban Cotton Crew Tee",
      slug: "urban-cotton-crew-tee",
      category: "men",
      brand: "urbanweave",
      price: 790,
      comparePrice: 990,
      stock: 120,
      rating: 4.3,
      ratingCount: 46,
      description:
        "Heavyweight 100% combed cotton tee with a relaxed fit that holds shape wash after wash.",
      variants: [
        { sku: "UCT-S", label: "Small", options: { Size: "S" }, stock: 30 },
        { sku: "UCT-M", label: "Medium", options: { Size: "M" }, stock: 40 },
        { sku: "UCT-L", label: "Large", options: { Size: "L" }, stock: 35 },
        { sku: "UCT-XL", label: "X-Large", options: { Size: "XL" }, stock: 15 },
      ],
    },
    {
      name: "Urban Denim Jacket",
      slug: "urban-denim-jacket",
      category: "women",
      brand: "urbanweave",
      price: 3290,
      comparePrice: 3990,
      stock: 30,
      rating: 4.5,
      ratingCount: 12,
      isFeatured: true,
      description:
        "Classic mid-wash denim jacket with brass hardware and a slightly cropped silhouette.",
      variants: [
        { sku: "UDJ-M", label: "Medium", options: { Size: "M" }, stock: 16 },
        { sku: "UDJ-L", label: "Large", options: { Size: "L" }, stock: 14 },
      ],
    },
    {
      name: "HomeCraft Non-Stick Pan Set",
      slug: "homecraft-non-stick-pan-set",
      category: "cookware",
      brand: "homecraft",
      price: 4490,
      comparePrice: 5490,
      stock: 20,
      rating: 4.8,
      ratingCount: 31,
      isFeatured: true,
      description:
        "3-piece granite non-stick pan set (20/24/28cm) with even-heat base and cool-touch handles.",
    },
    {
      name: "HomeCraft Ceramic Vase",
      slug: "homecraft-ceramic-vase",
      category: "decor",
      brand: "homecraft",
      price: 1290,
      stock: 45,
      rating: 4.2,
      ratingCount: 7,
      description:
        "Hand-glazed ceramic vase with a matte finish — perfect for dried or fresh arrangements.",
    },
    {
      name: "GlowLab Vitamin C Serum",
      slug: "glowlab-vitamin-c-serum",
      category: "skincare",
      brand: "glowlab",
      price: 1450,
      comparePrice: 1750,
      stock: 60,
      rating: 4.6,
      ratingCount: 54,
      isFeatured: true,
      description:
        "20% Vitamin C + hyaluronic acid serum for brighter, even-toned skin. Fragrance-free.",
    },
    {
      name: "GlowLab Matte Lip Kit",
      slug: "glowlab-matte-lip-kit",
      category: "makeup",
      brand: "glowlab",
      price: 990,
      stock: 80,
      rating: 4.1,
      ratingCount: 22,
      description:
        "Long-wear matte liquid lipstick trio with a lightweight, non-drying formula.",
    },
    {
      name: "PeakFit Yoga Mat Pro",
      slug: "peakfit-yoga-mat-pro",
      category: "fitness",
      brand: "peakfit",
      price: 2190,
      comparePrice: 2590,
      stock: 35,
      rating: 4.7,
      ratingCount: 38,
      description:
        "6mm extra-thick TPE yoga mat with alignment lines and a non-slip textured surface.",
      variants: [
        { sku: "PFM-BLU", label: "Ocean Blue", options: { Color: "Ocean Blue" }, stock: 20 },
        { sku: "PFM-GRN", label: "Forest Green", options: { Color: "Forest Green" }, stock: 15 },
      ],
    },
    {
      name: "PeakFit Resistance Bands Set",
      slug: "peakfit-resistance-bands-set",
      category: "fitness",
      brand: "peakfit",
      price: 1190,
      stock: 70,
      rating: 4.4,
      ratingCount: 27,
      description:
        "5-stack latex bands (10–50 lb) with handles, door anchor and carrying bag.",
    },
    {
      name: "PeakFit Trail Backpack 25L",
      slug: "peakfit-trail-backpack-25l",
      category: "outdoor",
      brand: "peakfit",
      price: 3790,
      comparePrice: 4290,
      stock: 18,
      rating: 4.5,
      ratingCount: 11,
      isFeatured: true,
      description:
        "Water-resistant 25L daypack with rain cover, ventilated back panel and hydration sleeve.",
    },
    {
      name: "NovaBuds Mini TWS Earbuds",
      slug: "novabuds-mini-tws-earbuds",
      category: "audio",
      brand: "novatech",
      price: 1990,
      comparePrice: 2490,
      stock: 90,
      rating: 4.2,
      ratingCount: 63,
      description:
        "Pocket-size true wireless earbuds with 24-hour total playtime and touch controls.",
    },
    {
      name: "Urban Leather Sneakers",
      slug: "urban-leather-sneakers",
      category: "men",
      brand: "urbanweave",
      price: 4290,
      stock: 26,
      rating: 4.4,
      ratingCount: 15,
      description:
        "Minimal full-grain leather sneakers on a cushioned rubber sole.",
      variants: [
        { sku: "ULS-41", label: "EU 41", options: { Size: "41" }, stock: 9 },
        { sku: "ULS-42", label: "EU 42", options: { Size: "42" }, stock: 10 },
        { sku: "ULS-43", label: "EU 43", options: { Size: "43" }, stock: 7 },
      ],
    },
    {
      name: "HomeCraft Linen Curtain Pair",
      slug: "homecraft-linen-curtain-pair",
      category: "decor",
      brand: "homecraft",
      price: 2590,
      stock: 22,
      rating: 4.0,
      ratingCount: 6,
      description:
        "Textured linen-blend curtains (pair) that filter light while keeping privacy.",
    },
    {
      name: "GlowLab Daily Sunscreen SPF50",
      slug: "glowlab-daily-sunscreen-spf50",
      category: "skincare",
      brand: "glowlab",
      price: 1150,
      stock: 95,
      rating: 4.8,
      ratingCount: 71,
      isFeatured: true,
      description:
        "Lightweight no-white-cast sunscreen with SPF50+ PA++++ for daily wear.",
    },
  ];

  let created = 0;
  for (const p of products) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) continue;

    const hasVariants = Boolean(p.variants?.length);
    const product = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        comparePrice: p.comparePrice ?? null,
        stock: hasVariants
          ? p.variants.reduce((s, v) => s + v.stock, 0)
          : p.stock ?? 0,
        hasVariants,
        isFeatured: p.isFeatured ?? false,
        isActive: true,
        ratingAvg: p.rating ?? 0,
        ratingCount: p.ratingCount ?? 0,
        salesCount: Math.floor(Math.random() * 60),
        categoryId: categoryIds[p.category] ?? null,
        brandId: brandIds[p.brand] ?? null,
        images: {
          create: [0, 1, 2].map((i) => ({
            url: img(`${p.slug}-${i}`),
            position: i,
          })),
        },
        ...(hasVariants
          ? {
              variants: {
                create: p.variants.map((v) => ({
                  sku: v.sku,
                  label: v.label,
                  options: v.options,
                  stock: v.stock,
                  isActive: true,
                })),
              },
            }
          : {}),
      },
    });
    created++;

    // Seed a couple of reviews for realism
    const demoCustomer = await prisma.user.upsert({
      where: { email: "customer@example.com" },
      create: {
        email: "customer@example.com",
        name: "Demo Customer",
        passwordHash: await bcrypt.hash("Customer@123", 12),
        role: "CUSTOMER",
      },
      update: {},
    });
    if (p.ratingCount && p.ratingCount > 5 && Math.random() > 0.4) {
      await prisma.review.upsert({
        where: {
          userId_productId: {
            userId: demoCustomer.id,
            productId: product.id,
          },
        },
        create: {
          userId: demoCustomer.id,
          productId: product.id,
          rating: Math.min(5, Math.round(p.rating)),
          comment: "Great quality, delivered on time. Would buy again!",
        },
        update: {},
      });
    }
  }

  // ---- Coupons ----
  const coupons = [
    {
      code: "WELCOME10",
      type: "PERCENT",
      value: 10,
      minPurchase: 500,
      perUserLimit: 1,
      expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000),
    },
    {
      code: "SAVE50",
      type: "FIXED",
      value: 50,
      minPurchase: 1000,
      perUserLimit: 5,
      expiresAt: new Date(Date.now() + 180 * 24 * 3600 * 1000),
    },
  ];
  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      create: { ...c, isActive: true },
      update: {},
    });
  }

  const counts = {
    categories: await prisma.category.count(),
    brands: await prisma.brand.count(),
    products: await prisma.product.count(),
    coupons: await prisma.coupon.count(),
    users: await prisma.user.count(),
  };
  console.log("Seed complete:", counts);
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
  console.log("Customer login: customer@example.com / Customer@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
