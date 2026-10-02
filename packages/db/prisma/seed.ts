import { db } from "../src/index";

const categories = [
  ["electronics", "Electronics", "Phones, audio, power and everyday devices", 10],
  ["computing", "Computing", "Laptops, accessories and productivity gear", 20],
  ["home-kitchen", "Home & Kitchen", "Useful appliances and home essentials", 30],
  ["fashion", "Fashion", "Clothing, footwear and accessories", 40],
  ["beauty-care", "Beauty & Care", "Personal care and beauty essentials", 50],
  ["baby-kids", "Baby & Kids", "Everyday essentials for growing families", 60],
  ["grocery", "Grocery", "Fresh food, pantry staples and household groceries", 70],
] as const;

const groceryCategories = [
  ["grocery-fresh", "Fresh Food", "Fresh produce, eggs and everyday perishables", 10],
  ["grocery-pantry", "Pantry", "Rice, beans, grains, oils and cooking staples", 20],
  ["grocery-breakfast", "Breakfast", "Bread, cereal, milk and morning essentials", 30],
  ["grocery-drinks", "Drinks", "Water, juice and non-alcoholic beverages", 40],
  ["grocery-household", "Household", "Cleaning and household consumables", 50],
] as const;

const brands = ["Aster", "NovaCharge", "SonicBay", "HomeNest", "Stride", "LumaCare", "FreshBasket", "GoldenField", "FarmHouse"] as const;

const products = [
  {
    slug: "aster-one-5g-256gb",
    title: "Aster One 5G Smartphone, 256GB",
    shortDescription: "6.7-inch AMOLED display, dual SIM and all-day battery.",
    description: "A balanced 5G smartphone for work, entertainment and everyday photography. Includes 256GB storage, dual-SIM support, USB-C charging and a high-refresh AMOLED display.",
    category: "electronics", brand: "Aster", priceMinor: 32990000n, compareAtPriceMinor: 35990000n, featured: true,
    sku: "ASTER-ONE-256-BLK", variant: "Midnight Black · 256GB", stock: 18,
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "novacharge-20000mah-power-bank",
    title: "NovaCharge 20,000mAh Fast-Charge Power Bank",
    shortDescription: "USB-C PD charging with dual-device output and battery display.",
    description: "High-capacity portable charging for phones, tablets and USB-C accessories. Designed with USB-C power delivery, two-device charging and a clear remaining-charge indicator.",
    category: "electronics", brand: "NovaCharge", priceMinor: 3490000n, compareAtPriceMinor: 3990000n, featured: true,
    sku: "NOVA-PB20-GPH", variant: "Graphite · 20,000mAh", stock: 42,
    image: "https://images.unsplash.com/photo-1609592806596-b43bada2f2d8?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "sonicbay-air-pro-earbuds",
    title: "SonicBay Air Pro Wireless Earbuds",
    shortDescription: "Compact true-wireless earbuds with noise reduction and USB-C case.",
    description: "Lightweight wireless earbuds built for calls, commuting and daily listening. Includes touch controls, environmental noise reduction and a pocket-sized charging case.",
    category: "electronics", brand: "SonicBay", priceMinor: 2790000n, compareAtPriceMinor: null, featured: true,
    sku: "SONIC-AIRPRO-WHT", variant: "Cloud White", stock: 31,
    image: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "homenest-1-5l-blender",
    title: "HomeNest 1.5L Blender with Grinder",
    shortDescription: "Two-speed countertop blender with pulse control and dry-mill attachment.",
    description: "A practical kitchen blender for smoothies, sauces and everyday meal preparation. Includes a 1.5-litre jar, pulse mode and a separate grinder cup for dry ingredients.",
    category: "home-kitchen", brand: "HomeNest", priceMinor: 4190000n, compareAtPriceMinor: 4690000n, featured: true,
    sku: "HOME-BLD15-BLK", variant: "Black · 1.5L", stock: 14,
    image: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "stride-flex-running-shoes",
    title: "Stride Flex Everyday Running Shoes",
    shortDescription: "Breathable lightweight trainers with cushioned everyday support.",
    description: "Comfort-focused trainers for walking, light running and daily wear, with breathable mesh and a flexible cushioned sole.",
    category: "fashion", brand: "Stride", priceMinor: 3890000n, compareAtPriceMinor: 4490000n, featured: false,
    sku: "STRIDE-FLEX-42-BLK", variant: "Black · EU 42", stock: 11,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "lumacare-hydrating-body-lotion",
    title: "LumaCare Hydrating Body Lotion, 400ml",
    shortDescription: "Daily moisturizing lotion with a lightweight, non-greasy finish.",
    description: "An everyday body moisturizer formulated for comfortable hydration without a heavy finish. Supplied in a 400ml pump bottle.",
    category: "beauty-care", brand: "LumaCare", priceMinor: 890000n, compareAtPriceMinor: null, featured: false,
    sku: "LUMA-LOTION-400", variant: "400ml", stock: 63,
    image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "homenest-electric-kettle-1-7l",
    title: "HomeNest 1.7L Stainless Electric Kettle",
    shortDescription: "Fast-boil kettle with automatic shutoff and boil-dry protection.",
    description: "A stainless-steel electric kettle for tea, coffee and kitchen prep with automatic shutoff, a concealed heating element and boil-dry protection.",
    category: "home-kitchen", brand: "HomeNest", priceMinor: 2390000n, compareAtPriceMinor: 2690000n, featured: false,
    sku: "HOME-KET17-SS", variant: "Stainless Steel · 1.7L", stock: 24,
    image: "https://images.unsplash.com/photo-1594213114663-d94db9b17125?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "novacharge-65w-usbc-charger",
    title: "NovaCharge 65W USB-C GaN Wall Charger",
    shortDescription: "Compact multi-port fast charger for phones, tablets and compatible laptops.",
    description: "A compact GaN wall charger with USB-C fast charging for compatible laptops, tablets and phones. Multi-port power sharing is managed automatically.",
    category: "computing", brand: "NovaCharge", priceMinor: 2990000n, compareAtPriceMinor: 3390000n, featured: true,
    sku: "NOVA-GAN65-WHT", variant: "White · 65W", stock: 37,
    image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=900&q=80",
  },
] as const;

const groceryProducts = [
  {
    slug: "goldenfield-long-grain-rice-5kg",
    title: "GoldenField Long Grain Rice, 5kg",
    shortDescription: "Everyday long-grain rice for family meals and meal prep.",
    description: "A 5kg bag of long-grain rice suitable for jollof rice, fried rice and everyday meals.",
    category: "grocery-pantry", brand: "GoldenField", priceMinor: 1190000n, compareAtPriceMinor: 1290000n, featured: true,
    sku: "GF-RICE-5KG", variant: "5kg bag", stock: 80,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "freshbasket-tomatoes-1kg",
    title: "FreshBasket Tomatoes, 1kg",
    shortDescription: "Fresh red tomatoes selected for soups, stews and sauces.",
    description: "Fresh tomatoes packed for same-day grocery fulfilment where supported.",
    category: "grocery-fresh", brand: "FreshBasket", priceMinor: 245000n, compareAtPriceMinor: null, featured: true,
    sku: "FB-TOM-1KG", variant: "1kg pack", stock: 120,
    image: "https://images.unsplash.com/photo-1546470427-e26264be0b0d?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "freshbasket-red-onions-1kg",
    title: "FreshBasket Red Onions, 1kg",
    shortDescription: "Fresh red onions for soups, sauces, salads and everyday cooking.",
    description: "A convenient 1kg pack of fresh red onions.",
    category: "grocery-fresh", brand: "FreshBasket", priceMinor: 215000n, compareAtPriceMinor: null, featured: true,
    sku: "FB-ONION-1KG", variant: "1kg pack", stock: 110,
    image: "https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "goldenfield-vegetable-oil-2l",
    title: "GoldenField Vegetable Oil, 2L",
    shortDescription: "Multipurpose cooking oil for frying, stews and everyday meals.",
    description: "Two-litre bottle of refined vegetable cooking oil.",
    category: "grocery-pantry", brand: "GoldenField", priceMinor: 585000n, compareAtPriceMinor: 620000n, featured: true,
    sku: "GF-OIL-2L", variant: "2L bottle", stock: 75,
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "farmhouse-eggs-12",
    title: "FarmHouse Fresh Eggs, 12 Pack",
    shortDescription: "A tray of 12 fresh eggs for breakfast, baking and cooking.",
    description: "Fresh eggs packed in a protective 12-count tray.",
    category: "grocery-fresh", brand: "FarmHouse", priceMinor: 390000n, compareAtPriceMinor: null, featured: true,
    sku: "FH-EGG-12", variant: "12 eggs", stock: 95,
    image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "farmhouse-full-cream-milk-1l",
    title: "FarmHouse Full Cream Milk, 1L",
    shortDescription: "UHT full-cream milk for breakfast, cereal, tea and cooking.",
    description: "One-litre full-cream UHT milk with shelf-stable packaging.",
    category: "grocery-breakfast", brand: "FarmHouse", priceMinor: 210000n, compareAtPriceMinor: null, featured: false,
    sku: "FH-MILK-1L", variant: "1L carton", stock: 88,
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "freshbasket-sliced-bread",
    title: "FreshBasket Family Sliced Bread",
    shortDescription: "Soft sliced loaf for breakfast, sandwiches and snacks.",
    description: "Family-size sliced bread supplied fresh through supported grocery stores.",
    category: "grocery-breakfast", brand: "FreshBasket", priceMinor: 180000n, compareAtPriceMinor: null, featured: false,
    sku: "FB-BREAD-FAM", variant: "Family loaf", stock: 70,
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "goldenfield-brown-beans-2kg",
    title: "GoldenField Brown Beans, 2kg",
    shortDescription: "Cleaned brown beans for porridge, akara and everyday meals.",
    description: "Two-kilogram pack of cleaned brown beans for household cooking.",
    category: "grocery-pantry", brand: "GoldenField", priceMinor: 680000n, compareAtPriceMinor: null, featured: false,
    sku: "GF-BEANS-2KG", variant: "2kg bag", stock: 64,
    image: "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=900&q=80",
  },
] as const;


const foodRestaurants = [
  {
    merchantSlug: "jollof-house",
    legalName: "Jollof House Restaurants Ltd",
    name: "Jollof House",
    slug: "jollof-house",
    description: "Smoky party-style jollof, grilled proteins, classic sides and chilled local drinks.",
    heroImageUrl: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=1400&q=80",
    cuisineTags: ["Nigerian", "Jollof", "Grill"],
    priceBand: 2,
    deliveryFeeMinor: 120000n,
    serviceFeeMinor: 45000n,
    minOrderMinor: 250000n,
    estimatedDeliveryMin: 25,
    estimatedDeliveryMax: 40,
    rating: 4.8,
    ratingCount: 1284,
    sections: [
      {
        slug: "popular",
        title: "Popular",
        items: [
          {
            slug: "party-jollof-chicken",
            name: "Party Jollof Rice + Grilled Chicken",
            description: "Smoky jollof rice served with a juicy grilled chicken quarter and pepper sauce.",
            imageUrl: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=900&q=80",
            priceMinor: 420000n,
            featured: true,
            dietaryTags: ["Halal-friendly"],
            modifiers: [
              { name: "Protein", required: true, minSelect: 1, maxSelect: 1, options: [["Grilled chicken", 0n], ["Spicy beef", 90000n], ["Grilled fish", 150000n]] },
              { name: "Spice level", required: true, minSelect: 1, maxSelect: 1, options: [["Mild", 0n], ["Medium", 0n], ["Hot", 0n]] },
              { name: "Add extras", required: false, minSelect: 0, maxSelect: 3, options: [["Fried plantain", 70000n], ["Coleslaw", 50000n], ["Extra pepper sauce", 30000n]] },
            ],
          },
          {
            slug: "fried-rice-chicken",
            name: "Nigerian Fried Rice + Chicken",
            description: "Vegetable fried rice with grilled chicken and house pepper sauce.",
            imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80",
            priceMinor: 430000n,
            featured: true,
            dietaryTags: [],
            modifiers: [
              { name: "Protein", required: true, minSelect: 1, maxSelect: 1, options: [["Grilled chicken", 0n], ["Spicy beef", 90000n]] },
              { name: "Add extras", required: false, minSelect: 0, maxSelect: 2, options: [["Fried plantain", 70000n], ["Coleslaw", 50000n]] },
            ],
          },
        ],
      },
      {
        slug: "mains",
        title: "Mains",
        items: [
          {
            slug: "suya-beef-bowl",
            name: "Suya Beef Rice Bowl",
            description: "Seasoned beef strips, jollof rice, onions, tomatoes and suya spice.",
            imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
            priceMinor: 480000n,
            featured: false,
            dietaryTags: ["Spicy"],
            modifiers: [
              { name: "Spice level", required: true, minSelect: 1, maxSelect: 1, options: [["Medium", 0n], ["Hot", 0n], ["Extra hot", 0n]] },
            ],
          },
        ],
      },
      {
        slug: "sides-drinks",
        title: "Sides & drinks",
        items: [
          { slug: "fried-plantain", name: "Fried Plantain", description: "Golden sweet plantain slices.", imageUrl: "https://images.unsplash.com/photo-1605196560547-1f2f85aa3a49?auto=format&fit=crop&w=900&q=80", priceMinor: 120000n, featured: false, dietaryTags: ["Vegetarian"], modifiers: [] },
          { slug: "zobo-chilled", name: "Chilled Zobo", description: "House hibiscus drink with ginger and pineapple.", imageUrl: "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80", priceMinor: 100000n, featured: false, dietaryTags: ["Vegan"], modifiers: [] },
        ],
      },
    ],
  },
  {
    merchantSlug: "ember-grill",
    legalName: "Ember Grill Foods Ltd",
    name: "Ember Grill",
    slug: "ember-grill",
    description: "Flame-grilled burgers, chicken, loaded fries and shareable comfort food.",
    heroImageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1400&q=80",
    cuisineTags: ["Burgers", "Grill", "Fast food"],
    priceBand: 2,
    deliveryFeeMinor: 100000n,
    serviceFeeMinor: 50000n,
    minOrderMinor: 300000n,
    estimatedDeliveryMin: 30,
    estimatedDeliveryMax: 45,
    rating: 4.6,
    ratingCount: 842,
    sections: [
      {
        slug: "burgers",
        title: "Burgers",
        items: [
          {
            slug: "ember-double-smash",
            name: "Ember Double Smash Burger",
            description: "Two smashed beef patties, cheddar, grilled onions, pickles and Ember sauce.",
            imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80",
            priceMinor: 520000n,
            featured: true,
            dietaryTags: [],
            modifiers: [
              { name: "Cheese", required: false, minSelect: 0, maxSelect: 1, options: [["Extra cheddar", 70000n]] },
              { name: "Make it a meal", required: false, minSelect: 0, maxSelect: 1, options: [["Fries + soft drink", 180000n]] },
              { name: "Remove", required: false, minSelect: 0, maxSelect: 3, options: [["No onions", 0n], ["No pickles", 0n], ["No sauce", 0n]] },
            ],
          },
          {
            slug: "crispy-chicken-burger",
            name: "Crispy Chicken Burger",
            description: "Crispy chicken fillet, slaw, pickles and spicy mayo.",
            imageUrl: "https://images.unsplash.com/photo-1615297928064-24977384d0da?auto=format&fit=crop&w=900&q=80",
            priceMinor: 450000n,
            featured: true,
            dietaryTags: [],
            modifiers: [
              { name: "Heat", required: true, minSelect: 1, maxSelect: 1, options: [["Classic", 0n], ["Spicy", 0n], ["Fire", 0n]] },
              { name: "Make it a meal", required: false, minSelect: 0, maxSelect: 1, options: [["Fries + soft drink", 180000n]] },
            ],
          },
        ],
      },
      {
        slug: "wings-sides",
        title: "Wings & sides",
        items: [
          {
            slug: "sticky-wings-6",
            name: "Sticky Wings · 6pc",
            description: "Six grilled chicken wings tossed in your choice of sauce.",
            imageUrl: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=900&q=80",
            priceMinor: 380000n,
            featured: false,
            dietaryTags: [],
            modifiers: [
              { name: "Sauce", required: true, minSelect: 1, maxSelect: 1, options: [["BBQ", 0n], ["Sweet chilli", 0n], ["Hot pepper", 0n]] },
            ],
          },
          { slug: "loaded-fries", name: "Loaded Fries", description: "Crispy fries with cheese sauce, grilled onions and jalapeños.", imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=80", priceMinor: 280000n, featured: false, dietaryTags: ["Vegetarian"], modifiers: [] },
        ],
      },
    ],
  },
  {
    merchantSlug: "green-bowl-kitchen",
    legalName: "Green Bowl Kitchen Ltd",
    name: "Green Bowl Kitchen",
    slug: "green-bowl-kitchen",
    description: "Fresh bowls, wraps, salads, smoothies and lighter everyday meals.",
    heroImageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1400&q=80",
    cuisineTags: ["Healthy", "Salads", "Wraps"],
    priceBand: 2,
    deliveryFeeMinor: 90000n,
    serviceFeeMinor: 40000n,
    minOrderMinor: 220000n,
    estimatedDeliveryMin: 20,
    estimatedDeliveryMax: 35,
    rating: 4.7,
    ratingCount: 615,
    sections: [
      {
        slug: "bowls",
        title: "Build a bowl",
        items: [
          {
            slug: "grilled-chicken-avocado-bowl",
            name: "Chicken & Avocado Bowl",
            description: "Grilled chicken, avocado, mixed greens, tomato, cucumber and herbed rice.",
            imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
            priceMinor: 490000n,
            featured: true,
            dietaryTags: ["High protein"],
            modifiers: [
              { name: "Base", required: true, minSelect: 1, maxSelect: 1, options: [["Herbed rice", 0n], ["Brown rice", 20000n], ["Mixed greens", 0n]] },
              { name: "Dressing", required: true, minSelect: 1, maxSelect: 1, options: [["Lemon herb", 0n], ["Spicy yoghurt", 0n], ["No dressing", 0n]] },
              { name: "Extras", required: false, minSelect: 0, maxSelect: 3, options: [["Extra avocado", 100000n], ["Boiled egg", 70000n], ["Extra chicken", 160000n]] },
            ],
          },
          {
            slug: "falafel-rainbow-bowl",
            name: "Falafel Rainbow Bowl",
            description: "Falafel, cabbage, carrots, cucumber, tomato, hummus and mixed greens.",
            imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
            priceMinor: 420000n,
            featured: true,
            dietaryTags: ["Vegetarian"],
            modifiers: [
              { name: "Base", required: true, minSelect: 1, maxSelect: 1, options: [["Mixed greens", 0n], ["Herbed rice", 0n]] },
              { name: "Extras", required: false, minSelect: 0, maxSelect: 2, options: [["Extra hummus", 70000n], ["Avocado", 100000n]] },
            ],
          },
        ],
      },
      {
        slug: "drinks",
        title: "Smoothies & drinks",
        items: [
          { slug: "mango-ginger-smoothie", name: "Mango Ginger Smoothie", description: "Mango, banana, ginger and yoghurt blended cold.", imageUrl: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=900&q=80", priceMinor: 220000n, featured: false, dietaryTags: ["Vegetarian"], modifiers: [] },
          { slug: "water-75cl", name: "Still Water · 75cl", description: "Chilled bottled water.", imageUrl: "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=900&q=80", priceMinor: 70000n, featured: false, dietaryTags: ["Vegan"], modifiers: [] },
        ],
      },
    ],
  },
] as const;


const pharmacyProducts = [
  { sku: "BPH-PARA-500-20", slug: "bazaara-paracetamol-500mg-20", name: "Paracetamol 500mg, 20 tablets", genericName: "Paracetamol", brand: "HealthCore", activeIngredient: "Paracetamol", strength: "500mg", dosageForm: "Tablet", barcode: "100000000001", category: "Pain & Fever", description: "Over-the-counter pain and fever relief product. Follow the label and pharmacist guidance.", priceMinor: 180000n, stock: 80, rx: false, batch: "PARA-2609", expiry: "2028-09-30T00:00:00.000Z" },
  { sku: "BPH-ORS-10", slug: "bazaara-oral-rehydration-salts-10", name: "Oral Rehydration Salts, 10 sachets", genericName: "Oral rehydration salts", brand: "ReHydra", activeIngredient: "Glucose/electrolyte salts", strength: null, dosageForm: "Powder sachet", barcode: "100000000002", category: "Digestive Care", description: "Oral rehydration sachets for preparing electrolyte solution according to package directions.", priceMinor: 260000n, stock: 60, rx: false, batch: "ORS-2610", expiry: "2028-10-31T00:00:00.000Z" },
  { sku: "BPH-VITC-100", slug: "bazaara-vitamin-c-100mg-100", name: "Vitamin C 100mg, 100 tablets", genericName: "Ascorbic acid", brand: "VitaWell", activeIngredient: "Ascorbic acid", strength: "100mg", dosageForm: "Tablet", barcode: "100000000003", category: "Vitamins & Supplements", description: "Vitamin C supplement supplied as 100mg tablets.", priceMinor: 420000n, stock: 45, rx: false, batch: "VITC-2608", expiry: "2028-08-31T00:00:00.000Z" },
  { sku: "BPH-THERM-DIG", slug: "bazaara-digital-thermometer", name: "Digital Thermometer", genericName: null, brand: "CarePoint", activeIngredient: null, strength: null, dosageForm: null, barcode: "100000000004", category: "Devices", description: "Reusable digital thermometer for household temperature checks.", priceMinor: 2400000n, stock: 24, rx: false, batch: "THERM-2607", expiry: null },
  { sku: "BPH-SPF50-50", slug: "bazaara-spf50-sunscreen-50ml", name: "Broad Spectrum SPF 50 Sunscreen, 50ml", genericName: null, brand: "SunGuard", activeIngredient: null, strength: "SPF 50", dosageForm: "Lotion", barcode: "100000000005", category: "Skin Care", description: "Broad-spectrum sunscreen for routine sun protection.", priceMinor: 3500000n, stock: 32, rx: false, batch: "SPF50-2609", expiry: "2028-09-30T00:00:00.000Z" },
  { sku: "BPH-BABY-WIPE-72", slug: "bazaara-baby-wipes-72", name: "Sensitive Baby Wipes, 72 pack", genericName: null, brand: "SoftNest", activeIngredient: null, strength: null, dosageForm: null, barcode: "100000000006", category: "Baby Care", description: "Fragrance-free wipes for routine baby care.", priceMinor: 1350000n, stock: 70, rx: false, batch: "BABY-2611", expiry: "2029-11-30T00:00:00.000Z" },
  { sku: "BPH-AMOX-500-21", slug: "bazaara-amoxicillin-500mg-21", name: "Amoxicillin 500mg, 21 capsules", genericName: "Amoxicillin", brand: "RxCore", activeIngredient: "Amoxicillin", strength: "500mg", dosageForm: "Capsule", barcode: "100000000007", category: "Prescription Medicines", description: "Prescription-only antibiotic. Dispensing requires a valid prescription and pharmacist approval.", priceMinor: 2100000n, stock: 30, rx: true, batch: "AMOX-2609", expiry: "2028-09-30T00:00:00.000Z" },
] as const;

async function ensureSeller(slug: string, legalName: string, displayName: string, vertical = "SHOPPING", organizationType: "SELLER" | "GROCERY_MERCHANT" | "RESTAURANT" | "PHARMACY" = "SELLER", fulfillmentModes: string[] = ["STANDARD"]) {
  let merchant = await db.merchant.findUnique({ where: { slug }, include: { stores: true } });
  if (!merchant) {
    const organization = await db.organization.create({
      data: { type: organizationType, legalName, displayName, status: "ACTIVE", country: "NG" },
    });
    merchant = await db.merchant.create({
      data: { organizationId: organization.id, slug, vertical, verifiedAt: new Date(), stores: { create: { name: `${displayName} Main Store`, fulfillmentModes } } },
      include: { stores: true },
    });
  }
  if (merchant.vertical !== vertical) merchant = await db.merchant.update({ where: { id: merchant.id }, data: { vertical }, include: { stores: true } });
  const store = merchant.stores[0] ?? await db.store.create({ data: { merchantId: merchant.id, name: `${displayName} Main Store`, fulfillmentModes } });
  await db.store.update({ where: { id: store.id }, data: { fulfillmentModes } });
  return { merchant, store };
}


async function seedFoodRestaurant(definition: (typeof foodRestaurants)[number]) {
  const { merchant } = await ensureSeller(
    definition.merchantSlug,
    definition.legalName,
    definition.name,
    "FOOD",
    "RESTAURANT",
    ["DELIVERY", "PICKUP", "SCHEDULED"]
  );

  const restaurant = await db.foodRestaurant.upsert({
    where: { merchantId: merchant.id },
    create: {
      merchantId: merchant.id,
      slug: definition.slug,
      description: definition.description,
      heroImageUrl: definition.heroImageUrl,
      cuisineTags: [...definition.cuisineTags],
      priceBand: definition.priceBand,
      status: "ACTIVE",
      deliveryEnabled: true,
      pickupEnabled: true,
      asapEnabled: true,
      scheduledEnabled: true,
      deliveryFeeMinor: definition.deliveryFeeMinor,
      serviceFeeMinor: definition.serviceFeeMinor,
      minOrderMinor: definition.minOrderMinor,
      estimatedDeliveryMin: definition.estimatedDeliveryMin,
      estimatedDeliveryMax: definition.estimatedDeliveryMax,
      rating: definition.rating,
      ratingCount: definition.ratingCount,
    },
    update: {
      slug: definition.slug,
      description: definition.description,
      heroImageUrl: definition.heroImageUrl,
      cuisineTags: [...definition.cuisineTags],
      status: "ACTIVE",
      deliveryFeeMinor: definition.deliveryFeeMinor,
      serviceFeeMinor: definition.serviceFeeMinor,
      minOrderMinor: definition.minOrderMinor,
      estimatedDeliveryMin: definition.estimatedDeliveryMin,
      estimatedDeliveryMax: definition.estimatedDeliveryMax,
      rating: definition.rating,
      ratingCount: definition.ratingCount,
    },
  });

  for (let day = 0; day < 7; day++) {
    const isSunday = day === 0;
    await db.foodOpeningHour.upsert({
      where: { restaurantId_dayOfWeek: { restaurantId: restaurant.id, dayOfWeek: day } },
      create: { restaurantId: restaurant.id, dayOfWeek: day, openMinute: isSunday ? 9 * 60 : 8 * 60, closeMinute: 23 * 60, closed: false },
      update: { openMinute: isSunday ? 9 * 60 : 8 * 60, closeMinute: 23 * 60, closed: false },
    });
  }

  for (let sectionIndex = 0; sectionIndex < definition.sections.length; sectionIndex++) {
    const sectionDefinition = definition.sections[sectionIndex]!;
    const section = await db.foodMenuSection.upsert({
      where: { restaurantId_slug: { restaurantId: restaurant.id, slug: sectionDefinition.slug } },
      create: { restaurantId: restaurant.id, slug: sectionDefinition.slug, title: sectionDefinition.title, sortOrder: sectionIndex * 10, active: true },
      update: { title: sectionDefinition.title, sortOrder: sectionIndex * 10, active: true },
    });

    for (let itemIndex = 0; itemIndex < sectionDefinition.items.length; itemIndex++) {
      const itemDefinition = sectionDefinition.items[itemIndex]!;
      const item = await db.foodMenuItem.upsert({
        where: { restaurantId_slug: { restaurantId: restaurant.id, slug: itemDefinition.slug } },
        create: {
          restaurantId: restaurant.id,
          sectionId: section.id,
          slug: itemDefinition.slug,
          name: itemDefinition.name,
          description: itemDefinition.description,
          imageUrl: itemDefinition.imageUrl,
          currency: "NGN",
          priceMinor: itemDefinition.priceMinor,
          active: true,
          soldOut: false,
          featured: itemDefinition.featured,
          dietaryTags: [...itemDefinition.dietaryTags],
          prepMinutes: 18,
          sortOrder: itemIndex * 10,
        },
        update: {
          sectionId: section.id,
          name: itemDefinition.name,
          description: itemDefinition.description,
          imageUrl: itemDefinition.imageUrl,
          priceMinor: itemDefinition.priceMinor,
          active: true,
          soldOut: false,
          featured: itemDefinition.featured,
          dietaryTags: [...itemDefinition.dietaryTags],
          sortOrder: itemIndex * 10,
        },
      });

      await db.foodModifierGroup.deleteMany({ where: { itemId: item.id } });
      for (let groupIndex = 0; groupIndex < itemDefinition.modifiers.length; groupIndex++) {
        const groupDefinition = itemDefinition.modifiers[groupIndex]!;
        await db.foodModifierGroup.create({
          data: {
            itemId: item.id,
            name: groupDefinition.name,
            required: groupDefinition.required,
            minSelect: groupDefinition.minSelect,
            maxSelect: groupDefinition.maxSelect,
            sortOrder: groupIndex * 10,
            options: {
              create: groupDefinition.options.map(([name, priceDeltaMinor], optionIndex) => ({
                name,
                priceDeltaMinor,
                active: true,
                sortOrder: optionIndex * 10,
              })),
            },
          },
        });
      }
    }
  }

  return restaurant;
}

async function main() {
  for (const [slug, name, description, sortOrder] of categories) {
    await db.category.upsert({ where: { slug }, create: { slug, name, description, sortOrder }, update: { name, description, sortOrder, active: true } });
  }
  const groceryRoot = await db.category.findUniqueOrThrow({ where: { slug: "grocery" } });
  for (const [slug, name, description, sortOrder] of groceryCategories) {
    await db.category.upsert({ where: { slug }, create: { slug, name, description, sortOrder, parentId: groceryRoot.id }, update: { name, description, sortOrder, parentId: groceryRoot.id, active: true } });
  }

  for (const name of brands) {
    const slug = name.toLowerCase();
    await db.brand.upsert({ where: { slug }, create: { slug, name }, update: { name } });
  }

  const { merchant, store } = await ensureSeller("bazaara-select", "Bazaara Select Retail Ltd", "Bazaara Select");

  for (const item of products) {
    const category = await db.category.findUniqueOrThrow({ where: { slug: item.category } });
    const brand = await db.brand.findUniqueOrThrow({ where: { slug: item.brand.toLowerCase() } });
    const product = await db.product.upsert({
      where: { slug: item.slug },
      create: {
        merchantId: merchant.id, categoryId: category.id, brandId: brand.id, slug: item.slug, title: item.title,
        shortDescription: item.shortDescription, description: item.description, status: "ACTIVE", currency: "NGN",
        priceMinor: item.priceMinor, compareAtPriceMinor: item.compareAtPriceMinor, featured: item.featured,
      },
      update: {
        merchantId: merchant.id, categoryId: category.id, brandId: brand.id, title: item.title,
        shortDescription: item.shortDescription, description: item.description, status: "ACTIVE",
        priceMinor: item.priceMinor, compareAtPriceMinor: item.compareAtPriceMinor, featured: item.featured,
      },
    });
    const variant = await db.productVariant.upsert({
      where: { sku: item.sku },
      create: { productId: product.id, sku: item.sku, title: item.variant, priceMinor: item.priceMinor, compareAtPriceMinor: item.compareAtPriceMinor, currency: "NGN", active: true },
      update: { productId: product.id, title: item.variant, priceMinor: item.priceMinor, compareAtPriceMinor: item.compareAtPriceMinor, active: true },
    });
    await db.inventoryItem.upsert({
      where: { storeId_variantId: { storeId: store.id, variantId: variant.id } },
      create: { storeId: store.id, variantId: variant.id, quantityOnHand: item.stock },
      update: { quantityOnHand: item.stock },
    });
    await db.productMedia.deleteMany({ where: { productId: product.id } });
    await db.productMedia.create({ data: { productId: product.id, type: "IMAGE", url: item.image, alt: item.title, sortOrder: 0 } });
  }

  const { merchant: groceryMerchant, store: groceryStore } = await ensureSeller(
    "bazaara-fresh",
    "Bazaara Fresh Markets Ltd",
    "Bazaara Fresh",
    "GROCERY",
    "GROCERY_MERCHANT",
    ["STANDARD", "EXPRESS", "SCHEDULED"]
  );

  for (const item of groceryProducts) {
    const category = await db.category.findUniqueOrThrow({ where: { slug: item.category } });
    const brand = await db.brand.findUniqueOrThrow({ where: { slug: item.brand.toLowerCase() } });
    const product = await db.product.upsert({
      where: { slug: item.slug },
      create: {
        merchantId: groceryMerchant.id, categoryId: category.id, brandId: brand.id, slug: item.slug, title: item.title,
        shortDescription: item.shortDescription, description: item.description, status: "ACTIVE", currency: "NGN",
        priceMinor: item.priceMinor, compareAtPriceMinor: item.compareAtPriceMinor, featured: item.featured,
      },
      update: {
        merchantId: groceryMerchant.id, categoryId: category.id, brandId: brand.id, title: item.title,
        shortDescription: item.shortDescription, description: item.description, status: "ACTIVE",
        priceMinor: item.priceMinor, compareAtPriceMinor: item.compareAtPriceMinor, featured: item.featured,
      },
    });
    const variant = await db.productVariant.upsert({
      where: { sku: item.sku },
      create: { productId: product.id, sku: item.sku, title: item.variant, priceMinor: item.priceMinor, compareAtPriceMinor: item.compareAtPriceMinor, currency: "NGN", active: true },
      update: { productId: product.id, title: item.variant, priceMinor: item.priceMinor, compareAtPriceMinor: item.compareAtPriceMinor, active: true },
    });
    await db.inventoryItem.upsert({
      where: { storeId_variantId: { storeId: groceryStore.id, variantId: variant.id } },
      create: { storeId: groceryStore.id, variantId: variant.id, quantityOnHand: item.stock },
      update: { quantityOnHand: item.stock },
    });
    await db.productMedia.deleteMany({ where: { productId: product.id } });
    await db.productMedia.create({ data: { productId: product.id, type: "IMAGE", url: item.image, alt: item.title, sortOrder: 0 } });
  }

  for (const restaurant of foodRestaurants) {
    await seedFoodRestaurant(restaurant);
  }

  const { merchant: pharmacyMerchant } = await ensureSeller(
    "bazaara-health", "Bazaara Health Pharmacy Ltd", "Bazaara Health", "PHARMACY", "PHARMACY", ["DELIVERY", "PICKUP"]
  );
  await db.pharmacyMerchantProfile.upsert({
    where: { merchantId: pharmacyMerchant.id },
    create: { merchantId: pharmacyMerchant.id, regulator: "PCN", licenceNumber: "DEMO-PCN-VERIFIED", verificationStatus: "VERIFIED", deliveryEnabled: true, pickupEnabled: true, consultationEnabled: true, verifiedAt: new Date() },
    update: { verificationStatus: "VERIFIED", deliveryEnabled: true, pickupEnabled: true, consultationEnabled: true, verifiedAt: new Date(), suspendedAt: null },
  });
  for (const item of pharmacyProducts) {
    const product = await db.pharmacyProduct.upsert({
      where: { slug: item.slug },
      create: { merchantId: pharmacyMerchant.id, sku: item.sku, slug: item.slug, name: item.name, genericName: item.genericName, brand: item.brand, activeIngredient: item.activeIngredient, strength: item.strength, dosageForm: item.dosageForm, barcode: item.barcode, description: item.description, category: item.category, priceMinor: item.priceMinor, currency: "NGN", stockOnHand: item.stock, requiresPrescription: item.rx, active: true },
      update: { merchantId: pharmacyMerchant.id, sku: item.sku, name: item.name, genericName: item.genericName, brand: item.brand, activeIngredient: item.activeIngredient, strength: item.strength, dosageForm: item.dosageForm, barcode: item.barcode, description: item.description, category: item.category, priceMinor: item.priceMinor, stockOnHand: item.stock, requiresPrescription: item.rx, active: true },
    });
    await db.pharmacyInventoryBatch.upsert({
      where: { productId_batchNumber: { productId: product.id, batchNumber: item.batch } },
      create: { productId: product.id, batchNumber: item.batch, quantityOnHand: item.stock, reservedQuantity: 0, expiresAt: item.expiry ? new Date(item.expiry) : null, supplierName: "Bazaara Health Demo Supply" },
      update: { quantityOnHand: item.stock, reservedQuantity: 0, expiresAt: item.expiry ? new Date(item.expiry) : null },
    });
  }

  console.log(`Seeded ${products.length} marketplace products, ${groceryProducts.length} grocery products, ${foodRestaurants.length} food restaurants and ${pharmacyProducts.length} pharmacy products.`);
}

main().finally(async () => db.$disconnect());
