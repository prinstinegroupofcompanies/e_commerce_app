const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const PASSWORD_DEMO = "111111";

const PRODUCTION_ACCOUNTS = {
  admin: { email: "admin@markayhall.com", password: "Admin@MarkayHall", name: "Markay Hall Admin" },
  seller: { email: "seller@markayhall.com", password: "Seller@2026", name: "Markay Hall Seller" },
  customer: { email: "customer@markayhall.com", password: "Customer@2026", name: "Markay Hall Customer" },
};

// ─── Unsplash image URLs (royalty-free, direct hotlink) ──────
const IMG = {
  // Products
  headphones: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
  headphones2: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&q=80",
  headphones3: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&q=80",
  backpack: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80",
  backpack2: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&q=80",
  backpack3: "https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600&q=80",
  smartwatch: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
  smartwatch2: "https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=600&q=80",
  smartwatch3: "https://images.unsplash.com/photo-1617043786394-f977fa12eddf?w=600&q=80",
  shirt: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80",
  shirt2: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&q=80",
  shirt3: "https://images.unsplash.com/photo-1598032895397-b9472444bf93?w=600&q=80",
  runningShoes: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
  runningShoes2: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=600&q=80",
  runningShoes3: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&q=80",
  speaker: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80",
  speaker2: "https://images.unsplash.com/photo-1589003077984-894e133dabab?w=600&q=80",
  speaker3: "https://images.unsplash.com/photo-1558537348-c0f8e733989d?w=600&q=80",
  usbHub: "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=600&q=80",
  usbHub2: "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=600&q=80",
  dinnerSet: "https://images.unsplash.com/photo-1603199506016-5a54f17a2311?w=600&q=80",
  dinnerSet2: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&q=80",
  dinnerSet3: "https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?w=600&q=80",
  deskLamp: "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=600&q=80",
  deskLamp2: "https://images.unsplash.com/photo-1534105615256-13940a56ff44?w=600&q=80",
  deskLamp3: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&q=80",
  moisturizer: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&q=80",
  moisturizer2: "https://images.unsplash.com/photo-1570194065650-d99fb4b38b17?w=600&q=80",
  moisturizer3: "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=600&q=80",
  yogaMat: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&q=80",
  yogaMat2: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80",
  yogaMat3: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80",
  phoneCase: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&q=80",
  phoneCase2: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&q=80",
  phoneCase3: "https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=600&q=80",
  tshirt: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
  tshirt2: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80",
  tshirt3: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80",

  // Sellers – avatars / logos
  sellerAvatar1: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
  sellerAvatar2: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
  sellerAvatar3: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
  sellerAvatar4: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",

  // Sellers – shop banners
  shopBanner1: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
  shopBanner2: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80",
  shopBanner3: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&q=80",
  shopBanner4: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",

  // Hero / promo banners
  heroBanner1: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80",
  heroBanner2: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80",
  heroBanner3: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&q=80",
};

async function upsertByEmail(model, email, data) {
  return prisma[model].upsert({
    where: { email },
    update: data.update || {},
    create: { email, ...data.create },
  });
}

/** @param {string} productId */
async function refreshProductReviewStats(productId) {
  const reviews = await prisma.review.findMany({
    where: { productId, isApproved: true },
    select: { rating: true },
  });
  const total = reviews.length;
  const avg = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
  await prisma.product.update({
    where: { id: productId },
    data: { averageRating: Math.round(avg * 10) / 10, totalReviews: total },
  });
}

async function main() {
  const passwordDemo = await bcrypt.hash(PASSWORD_DEMO, 12);
  const adminPassword = await bcrypt.hash(PRODUCTION_ACCOUNTS.admin.password, 12);
  const sellerPrimaryPassword = await bcrypt.hash(PRODUCTION_ACCOUNTS.seller.password, 12);
  const customerPrimaryPassword = await bcrypt.hash(PRODUCTION_ACCOUNTS.customer.password, 12);

  // ─── Admin & settings ───────────────────────────────────────
  await prisma.admin.upsert({
    where: { email: PRODUCTION_ACCOUNTS.admin.email },
    update: { password: adminPassword, isActive: true, name: PRODUCTION_ACCOUNTS.admin.name },
    create: {
      name: PRODUCTION_ACCOUNTS.admin.name,
      email: PRODUCTION_ACCOUNTS.admin.email,
      password: adminPassword,
    },
  });

  await prisma.setting.upsert({
    where: { key: "site_name" },
    update: { value: "Markay Hall" },
    create: { key: "site_name", value: "Markay Hall", group: "general" },
  });

  const paymentMethods = [
    { name: "cod", displayName: "Cash on delivery", isActive: true },
    { name: "bank", displayName: "Bank transfer", isActive: true },
    { name: "stripe", displayName: "Card (Stripe)", isActive: true },
    { name: "paypal", displayName: "PayPal", isActive: true },
    { name: "wallet", displayName: "Wallet balance", isActive: true },
    { name: "orange_money", displayName: "Orange Money", isActive: true },
    { name: "mtn_mobile_money", displayName: "MTN Mobile Money", isActive: true },
  ];
  for (const pm of paymentMethods) {
    const existing = await prisma.paymentMethod.findFirst({ where: { name: pm.name } });
    if (existing) {
      await prisma.paymentMethod.update({
        where: { id: existing.id },
        data: { isActive: pm.isActive, displayName: pm.displayName },
      });
    } else {
      await prisma.paymentMethod.create({ data: pm });
    }
  }

  // ─── Pickup locations ─────────────────────────────────────────
  const pickupPoints = [
    {
      id: "seed-pickup-main",
      name: "Markay Hall Main Store",
      address: "123 Commerce Street",
      city: "Monrovia",
      country: "Liberia",
      phone: "+231770000001",
      hours: "Mon–Sat 9:00–18:00",
    },
    {
      id: "seed-pickup-westlands",
      name: "Westlands Collection Point",
      address: "Ring Road, Westlands",
      city: "Monrovia",
      country: "Liberia",
      phone: "+231770000002",
      hours: "Mon–Fri 10:00–19:00",
    },
    {
      id: "seed-pickup-monrovia",
      name: "Monrovia Harbour Pickup",
      address: "Monrovia Avenue",
      city: "Monrovia",
      country: "Liberia",
      phone: "+231770000003",
      hours: "Mon–Sat 8:00–17:00",
    },
    {
      id: "seed-pickup-monrovia",
      name: "Monrovia Lakeside Hub",
      address: "Oginga Odinga Street",
      city: "Monrovia",
      country: "Liberia",
      phone: "+231770000004",
      hours: "Tue–Sun 9:00–16:00",
    },
  ];
  for (const p of pickupPoints) {
    await prisma.pickupPoint.upsert({
      where: { id: p.id },
      update: { ...p, isActive: true },
      create: { ...p, isActive: true },
    });
  }

  // ─── Categories ───────────────────────────────────────────────
  const categories = [
    { slug: "electronics", name: "Electronics", sortOrder: 1 },
    { slug: "fashion", name: "Fashion", sortOrder: 2 },
    { slug: "home-living", name: "Home & Living", sortOrder: 3 },
    { slug: "beauty", name: "Beauty & Care", sortOrder: 4 },
    { slug: "sports", name: "Sports & Outdoors", sortOrder: 5 },
  ];
  const categoryMap = {};
  for (const c of categories) {
    categoryMap[c.slug] = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, sortOrder: c.sortOrder, isActive: true },
      create: { ...c, isActive: true },
    });
  }

  const smartphones = await prisma.category.upsert({
    where: { slug: "smartphones" },
    update: { parentId: categoryMap.electronics.id, isActive: true },
    create: {
      name: "Smartphones",
      slug: "smartphones",
      parentId: categoryMap.electronics.id,
      sortOrder: 1,
      isActive: true,
    },
  });
  categoryMap.smartphones = smartphones;

  // ─── Brands ───────────────────────────────────────────────────
  const brands = [
    { slug: "markay", name: "Markay" },
    { slug: "acme", name: "Acme" },
    { slug: "urban-style", name: "Urban Style" },
    { slug: "techhive", name: "TechHive" },
  ];
  const brandMap = {};
  for (const b of brands) {
    brandMap[b.slug] = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: { name: b.name, isActive: true },
      create: { ...b, isActive: true },
    });
  }

  // ─── Sellers (stores) ─────────────────────────────────────────
  const sellersData = [
    {
      email: PRODUCTION_ACCOUNTS.seller.email,
      name: PRODUCTION_ACCOUNTS.seller.name,
      password: sellerPrimaryPassword,
      phone: "+2317702000001",
      shopName: "Markay Hall Official Store",
      shopSlug: "markay-hall-official",
      shopDescription: "Quality everyday goods from a trusted seller.",
      shopCity: "Monrovia",
      shopCountry: "Liberia",
      totalOrders: 42,
      avatar: IMG.sellerAvatar1,
      shopLogo: IMG.sellerAvatar1,
      shopBanner: IMG.shopBanner1,
    },
    {
      email: "seller2@mock.example.com",
      name: "Amina Ochieng",
      shopName: "Urban Style Co",
      shopSlug: "urban-style-co",
      shopDescription: "Trendy fashion and accessories for modern living.",
      shopCity: "Monrovia",
      shopCountry: "Liberia",
      totalOrders: 28,
      avatar: IMG.sellerAvatar2,
      shopLogo: IMG.sellerAvatar2,
      shopBanner: IMG.shopBanner2,
    },
    {
      email: "seller3@mock.example.com",
      name: "James Chen",
      shopName: "TechHive Electronics",
      shopSlug: "techhive-electronics",
      shopDescription: "Phones, audio, and smart home gadgets.",
      shopCity: "Monrovia",
      shopCountry: "Liberia",
      totalOrders: 65,
      avatar: IMG.sellerAvatar3,
      shopLogo: IMG.sellerAvatar3,
      shopBanner: IMG.shopBanner3,
    },
    {
      email: "seller4@mock.example.com",
      name: "Fatima Hassan",
      shopName: "Home & Living Mart",
      shopSlug: "home-living-mart",
      shopDescription: "Furniture, décor, and kitchen essentials.",
      shopCity: "Monrovia",
      shopCountry: "Liberia",
      totalOrders: 19,
      avatar: IMG.sellerAvatar4,
      shopLogo: IMG.sellerAvatar4,
      shopBanner: IMG.shopBanner4,
    },
  ];
  const sellerMap = {};
  for (const s of sellersData) {
    const sellerPassword = s.password || passwordDemo;
    sellerMap[s.shopSlug] = await upsertByEmail("seller", s.email, {
      create: {
        name: s.name,
        password: sellerPassword,
        shopName: s.shopName,
        shopSlug: s.shopSlug,
        shopDescription: s.shopDescription,
        shopCity: s.shopCity,
        shopCountry: s.shopCountry,
        avatar: s.avatar,
        shopLogo: s.shopLogo,
        shopBanner: s.shopBanner,
        isActive: true,
        isShopActive: true,
        verificationStatus: "approved",
        verifiedAt: new Date(),
        businessCategory: "General retail",
        shopCounty: "Montserrado",
        phone: s.phone || "+2317702000001",
        totalOrders: s.totalOrders,
        walletBalance: 1200,
      },
      update: {
        password: sellerPassword,
        verificationStatus: "approved",
        isShopActive: true,
        verifiedAt: new Date(),
        shopName: s.shopName,
        shopDescription: s.shopDescription,
        avatar: s.avatar,
        shopLogo: s.shopLogo,
        shopBanner: s.shopBanner,
        phone: s.phone || "+2317702000001",
        isShopActive: true,
        isActive: true,
      },
    });
  }

  // ─── Delivery companies (Liberia) ─────────────────────────────
  const deliveryCompanies = [
    {
      email: "delivery@example.com",
      name: "Monrovia Express",
      slug: "monrovia-express",
      phone: "+231770100001",
      city: "Monrovia",
      county: "Montserrado",
      standardFee: 5,
      expressFee: 12,
    },
    {
      email: "riderhub@mock.example.com",
      name: "RiderHub Liberia",
      slug: "riderhub-liberia",
      phone: "+231770100002",
      city: "Monrovia",
      county: "Montserrado",
      standardFee: 4.5,
      expressFee: 9,
    },
  ];
  for (const d of deliveryCompanies) {
    await prisma.deliveryCompany.upsert({
      where: { email: d.email },
      update: {
        verificationStatus: "approved",
        verifiedAt: new Date(),
        isActive: true,
        standardFee: d.standardFee,
        expressFee: d.expressFee,
      },
      create: {
        ...d,
        password: passwordDemo,
        country: "Liberia",
        verificationStatus: "approved",
        verifiedAt: new Date(),
        isActive: true,
      },
    });
  }

  // ─── Customers ────────────────────────────────────────────────
  const customersData = [
    {
      email: PRODUCTION_ACCOUNTS.customer.email,
      name: PRODUCTION_ACCOUNTS.customer.name,
      password: customerPrimaryPassword,
      walletBalance: 500,
      phone: "+2317701234567",
    },
    { email: "jane.doe@mock.example.com", name: "Jane Doe", walletBalance: 120, phone: "+2317701234568" },
    { email: "mike.wilson@mock.example.com", name: "Mike Wilson", walletBalance: 75, phone: "+2317701234569" },
    { email: "sarah.kim@mock.example.com", name: "Sarah Kim", walletBalance: 200, phone: "+2317701234570" },
    { email: "alex.nguyen@mock.example.com", name: "Alex Nguyen", walletBalance: 50, phone: "+2317701234571" },
  ];
  const customerMap = {};
  for (const c of customersData) {
    const customerPassword = c.password || passwordDemo;
    customerMap[c.email] = await upsertByEmail("customer", c.email, {
      create: {
        name: c.name,
        password: customerPassword,
        emailVerifiedAt: new Date(),
        walletBalance: c.walletBalance,
        phone: c.phone,
        isActive: true,
      },
      update: {
        name: c.name,
        password: customerPassword,
        phone: c.phone,
        emailVerifiedAt: new Date(),
        walletBalance: c.walletBalance,
        isActive: true,
      },
    });
  }

  // ─── Products ─────────────────────────────────────────────────
  const productsData = [
    {
      slug: "wireless-headphones",
      name: "Wireless Headphones",
      price: 89.99,
      comparePrice: 120,
      shortDescription: "Noise cancelling, 30h battery.",
      stockQuantity: 40,
      isFeatured: true,
      categorySlug: "electronics",
      brandSlug: "acme",
      sellerSlug: "markay-hall-official",
      thumbnail: IMG.headphones,
      images: [IMG.headphones, IMG.headphones2, IMG.headphones3],
    },
    {
      slug: "minimal-backpack",
      name: "Minimal Backpack",
      price: 54.5,
      comparePrice: 70,
      shortDescription: "Water resistant urban carry.",
      stockQuantity: 25,
      isFeatured: true,
      categorySlug: "fashion",
      brandSlug: "urban-style",
      sellerSlug: "markay-hall-official",
      thumbnail: IMG.backpack,
      images: [IMG.backpack, IMG.backpack2, IMG.backpack3],
    },
    {
      slug: "smart-watch",
      name: "Smart Watch Pro",
      price: 199,
      comparePrice: 249,
      shortDescription: "Health tracking & notifications.",
      stockQuantity: 15,
      isFeatured: true,
      categorySlug: "electronics",
      brandSlug: "techhive",
      sellerSlug: "techhive-electronics",
      thumbnail: IMG.smartwatch,
      images: [IMG.smartwatch, IMG.smartwatch2, IMG.smartwatch3],
    },
    {
      slug: "linen-shirt",
      name: "Linen Summer Shirt",
      price: 42,
      comparePrice: 55,
      shortDescription: "Breathable linen blend.",
      stockQuantity: 60,
      categorySlug: "fashion",
      brandSlug: "urban-style",
      sellerSlug: "urban-style-co",
      thumbnail: IMG.shirt,
      images: [IMG.shirt, IMG.shirt2, IMG.shirt3],
    },
    {
      slug: "running-shoes",
      name: "Trail Running Shoes",
      price: 118,
      comparePrice: 140,
      shortDescription: "Grip sole for all terrains.",
      stockQuantity: 22,
      isFeatured: true,
      categorySlug: "sports",
      brandSlug: "urban-style",
      sellerSlug: "urban-style-co",
      thumbnail: IMG.runningShoes,
      images: [IMG.runningShoes, IMG.runningShoes2, IMG.runningShoes3],
    },
    {
      slug: "bluetooth-speaker",
      name: "Portable Bluetooth Speaker",
      price: 64.99,
      shortDescription: "360° sound, IPX7 waterproof.",
      stockQuantity: 35,
      categorySlug: "electronics",
      brandSlug: "techhive",
      sellerSlug: "techhive-electronics",
      thumbnail: IMG.speaker,
      images: [IMG.speaker, IMG.speaker2, IMG.speaker3],
    },
    {
      slug: "usb-c-hub",
      name: "USB-C 7-in-1 Hub",
      price: 39.99,
      shortDescription: "HDMI, USB 3.0, SD card reader.",
      stockQuantity: 80,
      categorySlug: "electronics",
      brandSlug: "techhive",
      sellerSlug: "techhive-electronics",
      thumbnail: IMG.usbHub,
      images: [IMG.usbHub, IMG.usbHub2],
    },
    {
      slug: "ceramic-dinner-set",
      name: "Ceramic Dinner Set (16pc)",
      price: 89,
      shortDescription: "Microwave-safe stoneware.",
      stockQuantity: 18,
      categorySlug: "home-living",
      brandSlug: "markay",
      sellerSlug: "home-living-mart",
      thumbnail: IMG.dinnerSet,
      images: [IMG.dinnerSet, IMG.dinnerSet2, IMG.dinnerSet3],
    },
    {
      slug: "desk-lamp",
      name: "LED Desk Lamp",
      price: 34.5,
      shortDescription: "Adjustable brightness & color temp.",
      stockQuantity: 45,
      categorySlug: "home-living",
      brandSlug: "markay",
      sellerSlug: "home-living-mart",
      thumbnail: IMG.deskLamp,
      images: [IMG.deskLamp, IMG.deskLamp2, IMG.deskLamp3],
    },
    {
      slug: "face-moisturizer",
      name: "Hydrating Face Moisturizer",
      price: 24.99,
      shortDescription: "SPF 15 daily moisturizer.",
      stockQuantity: 100,
      categorySlug: "beauty",
      brandSlug: "markay",
      sellerSlug: "home-living-mart",
      thumbnail: IMG.moisturizer,
      images: [IMG.moisturizer, IMG.moisturizer2, IMG.moisturizer3],
    },
    {
      slug: "yoga-mat",
      name: "Premium Yoga Mat",
      price: 29.99,
      shortDescription: "Non-slip 6mm thickness.",
      stockQuantity: 55,
      categorySlug: "sports",
      brandSlug: "acme",
      sellerSlug: "markay-hall-official",
      thumbnail: IMG.yogaMat,
      images: [IMG.yogaMat, IMG.yogaMat2, IMG.yogaMat3],
    },
    {
      slug: "phone-case-bundle",
      name: "Phone Case Bundle",
      price: 19.99,
      shortDescription: "3-pack clear & matte cases.",
      stockQuantity: 120,
      categorySlug: "smartphones",
      brandSlug: "techhive",
      sellerSlug: "techhive-electronics",
      thumbnail: IMG.phoneCase,
      images: [IMG.phoneCase, IMG.phoneCase2, IMG.phoneCase3],
    },
  ];

  const productMap = {};
  for (const p of productsData) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        price: p.price,
        comparePrice: p.comparePrice ?? null,
        shortDescription: p.shortDescription,
        stockQuantity: p.stockQuantity,
        isFeatured: !!p.isFeatured,
        isActive: true,
        categoryId: categoryMap[p.categorySlug]?.id,
        brandId: brandMap[p.brandSlug]?.id,
        sellerId: sellerMap[p.sellerSlug]?.id,
        thumbnail: p.thumbnail,
        images: JSON.stringify(p.images || []),
      },
      create: {
        name: p.name,
        slug: p.slug,
        sku: `SKU-${p.slug.toUpperCase().replace(/-/g, "")}`,
        description: `<p>${p.shortDescription}</p><p>Mock catalog item — editable in admin.</p>`,
        shortDescription: p.shortDescription,
        price: p.price,
        comparePrice: p.comparePrice ?? null,
        categoryId: categoryMap[p.categorySlug]?.id,
        brandId: brandMap[p.brandSlug]?.id,
        sellerId: sellerMap[p.sellerSlug]?.id,
        thumbnail: p.thumbnail,
        images: JSON.stringify(p.images || []),
        type: "simple",
        stockQuantity: p.stockQuantity,
        isFeatured: !!p.isFeatured,
        isActive: true,
      },
    });
    productMap[p.slug] = product;
  }

  // Variable product example
  const variableProduct = await prisma.product.upsert({
    where: { slug: "classic-tee-variable" },
    update: { isActive: true },
    create: {
      name: "Classic Cotton Tee",
      slug: "classic-tee-variable",
      sku: "SKU-TEEVAR",
      description: "<p>Available in multiple sizes. Mock variable product.</p>",
      shortDescription: "Soft cotton tee — pick your size.",
      price: 28,
      comparePrice: 35,
      categoryId: categoryMap.fashion.id,
      brandId: brandMap["urban-style"].id,
      sellerId: sellerMap["urban-style-co"].id,
      thumbnail: IMG.tshirt,
      images: JSON.stringify([IMG.tshirt, IMG.tshirt2, IMG.tshirt3]),
      type: "variable",
      stockQuantity: 0,
      isActive: true,
    },
  });
  productMap["classic-tee-variable"] = variableProduct;

  const variantSizes = [
    { options: "Size: S", stock: 12, sku: "TEE-S" },
    { options: "Size: M", stock: 20, sku: "TEE-M" },
    { options: "Size: L", stock: 15, sku: "TEE-L" },
    { options: "Size: XL", stock: 8, sku: "TEE-XL" },
  ];
  for (const v of variantSizes) {
    const existing = await prisma.productVariant.findFirst({
      where: { productId: variableProduct.id, options: v.options },
    });
    if (existing) {
      await prisma.productVariant.update({
        where: { id: existing.id },
        data: { stock: v.stock, price: 28, isActive: true },
      });
    } else {
      await prisma.productVariant.create({
        data: {
          productId: variableProduct.id,
          options: v.options,
          sku: v.sku,
          price: 28,
          stock: v.stock,
          isActive: true,
        },
      });
    }
  }

  // ─── Reviews ──────────────────────────────────────────────────
  const reviewTemplates = [
    { rating: 5, title: "Excellent!", body: "Exactly as described. Fast delivery.", approved: true },
    { rating: 4, title: "Very good", body: "Great quality, minor packaging dent.", approved: true },
    { rating: 5, title: "Love it", body: "Would buy again. Highly recommend.", approved: true },
    { rating: 3, title: "Okay", body: "Decent for the price.", approved: false },
    { rating: 2, title: "Could be better", body: "Not what I expected.", approved: false },
  ];

  const customerIds = Object.values(customerMap);
  let reviewIdx = 0;
  for (const slug of Object.keys(productMap)) {
    const product = productMap[slug];
    for (let i = 0; i < 3; i++) {
      const tpl = reviewTemplates[(reviewIdx + i) % reviewTemplates.length];
      const customer = customerIds[i % customerIds.length];
      const existing = await prisma.review.findFirst({
        where: { productId: product.id, customerId: customer.id },
      });
      if (!existing) {
        await prisma.review.create({
          data: {
            productId: product.id,
            customerId: customer.id,
            sellerId: product.sellerId,
            rating: tpl.rating,
            title: tpl.title,
            body: tpl.body,
            isApproved: tpl.approved,
            adminReply: tpl.approved ? "Thank you for your feedback!" : null,
          },
        });
      }
    }
    reviewIdx += 1;
    await refreshProductReviewStats(product.id);
  }

  // ─── Notifications ──────────────────────────────────────────────
  const notifications = [
    {
      customerEmail: PRODUCTION_ACCOUNTS.customer.email,
      title: "Welcome to Markay Hall",
      message: "Your account is ready. Start shopping from trusted sellers.",
      type: "info",
      link: "/products",
    },
    {
      customerEmail: "jane.doe@mock.example.com",
      title: "Order shipped",
      message: "Your recent order is on the way.",
      type: "success",
      link: "/dashboard/orders",
    },
    {
      customerEmail: "mike.wilson@mock.example.com",
      title: "Coupon available",
      message: "Use WELCOME10 for 10% off orders over $20.",
      type: "info",
      link: "/products",
    },
    {
      sellerEmail: PRODUCTION_ACCOUNTS.seller.email,
      title: "New order received",
      message: "You have a new order waiting for fulfillment.",
      type: "info",
      link: "/seller/orders",
    },
    {
      sellerEmail: "seller2@mock.example.com",
      title: "Payout processed",
      message: "Your weekly payout of $240.00 was sent.",
      type: "success",
      link: "/seller/payouts",
    },
    {
      sellerEmail: "seller3@mock.example.com",
      title: "Low stock alert",
      message: "Smart Watch Pro is below threshold (15 units).",
      type: "warning",
      link: "/seller/inventory",
    },
    {
      sellerEmail: "seller4@mock.example.com",
      title: "New review",
      message: "A customer left a review on Ceramic Dinner Set.",
      type: "info",
      link: "/seller/reviews",
    },
  ];

  for (const n of notifications) {
    const customerId = n.customerEmail ? customerMap[n.customerEmail]?.id : null;
    const sid = n.sellerEmail
      ? Object.values(sellerMap).find((s) => s.email === n.sellerEmail)?.id
      : null;
    const existing = await prisma.notification.findFirst({
      where: {
        title: n.title,
        customerId: customerId || null,
        sellerId: sid || null,
      },
    });
    if (!existing) {
      await prisma.notification.create({
        data: {
          customerId,
          sellerId: sid,
          title: n.title,
          message: n.message,
          type: n.type,
          link: n.link,
          isRead: false,
        },
      });
    }
  }

  // ─── Marketing extras ───────────────────────────────────────────
  await prisma.banner.deleteMany({});
  await prisma.banner.createMany({
    data: [
      {
        title: "Markay Hall Spring Sale",
        image: IMG.heroBanner1,
        link: "/products",
        position: "homepage",
        sortOrder: 0,
        isActive: true,
      },
      {
        title: "Shop Top Sellers",
        image: IMG.heroBanner2,
        link: "/products?sort=sold",
        position: "homepage",
        sortOrder: 1,
        isActive: true,
      },
      {
        title: "Free pickup in Monrovia",
        image: IMG.heroBanner3,
        link: "/checkout",
        position: "homepage",
        sortOrder: 2,
        isActive: true,
      },
    ],
  });

  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: { isActive: true },
    create: {
      code: "WELCOME10",
      title: "Welcome 10%",
      discountType: "percentage",
      discount: 10,
      minOrderAmount: 20,
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: "SAVE20" },
    update: { isActive: true },
    create: {
      code: "SAVE20",
      title: "Save $20",
      discountType: "fixed",
      discount: 20,
      minOrderAmount: 100,
      isActive: true,
    },
  });

  const subscribers = ["news@mock.example.com", "alerts@mock.example.com", "buyer@mock.example.com"];
  for (const email of subscribers) {
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { isActive: true },
      create: { email, isActive: true },
    });
  }

  console.log("\n✅ Mock seed complete\n");
  console.log("Production accounts:");
  console.log(`  Admin:    ${PRODUCTION_ACCOUNTS.admin.email} / ${PRODUCTION_ACCOUNTS.admin.password}`);
  console.log(`  Seller:   ${PRODUCTION_ACCOUNTS.seller.email} / ${PRODUCTION_ACCOUNTS.seller.password}`);
  console.log(`  Customer: ${PRODUCTION_ACCOUNTS.customer.email} / ${PRODUCTION_ACCOUNTS.customer.password}`);
  console.log("Demo accounts (password: 111111):");
  console.log("  Sellers:  seller2@mock.example.com, seller3@mock.example.com, seller4@mock.example.com");
  console.log("  Delivery: delivery@example.com, riderhub@mock.example.com");
  console.log("  Customers: jane.doe@mock.example.com, mike.wilson@mock.example.com, …");
  console.log(`  Pickup locations: ${pickupPoints.length}`);
  console.log(`  Categories: ${categories.length + 1} (incl. smartphones)`);
  console.log(`  Sellers / stores: ${sellersData.length}`);
  console.log(`  Customers: ${customersData.length}`);
  console.log(`  Products: ${Object.keys(productMap).length}`);
  console.log("  Reviews, notifications, banners, coupons seeded.\n");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
