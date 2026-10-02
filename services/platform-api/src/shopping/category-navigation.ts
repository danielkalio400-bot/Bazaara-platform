export type ShoppingCategoryLeaf = {
  slug: string;
  label: string;
  query: string;
};

export type ShoppingCategoryGroup = {
  slug: string;
  label: string;
  query: string;
  items: ShoppingCategoryLeaf[];
};

export type ShoppingCategoryNavigationItem = {
  slug: string;
  label: string;
  desktopLabel?: string;
  query: string;
  mobile?: boolean;
  desktop?: boolean;
  groups: ShoppingCategoryGroup[];
};

const leaf = (slug: string, label: string, query = label): ShoppingCategoryLeaf => ({ slug, label, query });
const group = (slug: string, label: string, items: ShoppingCategoryLeaf[], query = label): ShoppingCategoryGroup => ({ slug, label, query, items });

export const shoppingCategoryNavigation: ShoppingCategoryNavigationItem[] = [
  {
    slug: "official-stores",
    label: "Official Stores",
    query: "official stores",
    mobile: false,
    groups: [
      group("top-official-stores", "Official Stores", [
        leaf("bazaara-select", "Bazaara Select"),
        leaf("apple", "Apple"),
        leaf("samsung", "Samsung"),
        leaf("xiaomi", "Xiaomi"),
        leaf("nivea", "Nivea"),
        leaf("intel", "Intel"),
        leaf("nexus", "Nexus"),
      ]),
    ],
  },
  {
    slug: "appliances",
    label: "Appliances",
    query: "appliances",
    mobile: false,
    groups: [
      group("large-appliances", "Large Appliances", [
        leaf("washing-machines", "Washing Machines"),
        leaf("refrigerators", "Refrigerators"),
        leaf("freezers", "Freezers"),
        leaf("air-conditioners", "Air Conditioners"),
      ]),
      group("small-appliances", "Small Appliances", [
        leaf("blenders", "Blenders"),
        leaf("kettles", "Kettles"),
        leaf("microwaves", "Microwaves"),
        leaf("air-fryers", "Air Fryers"),
        leaf("coffee-makers", "Coffee Makers"),
      ]),
    ],
  },
  {
    slug: "home-office",
    label: "Home & Office",
    query: "home office",
    groups: [
      group("appliances", "Appliances", [
        leaf("appliances-home", "Appliances"),
        leaf("small-appliances-home", "Small Appliances"),
      ]),
      group("home-kitchen", "Home & Kitchen", [
        leaf("cookware", "Cookware"),
        leaf("small-appliances-2", "Small Appliances"),
        leaf("bakeware", "Bakeware"),
        leaf("cutlery", "Cutlery & Knife Accessories"),
      ]),
      group("home", "Home", [
        leaf("bedding", "Bedding"),
        leaf("home-decor", "Home Decor"),
        leaf("kitchen-dining", "Kitchen & Dining"),
        leaf("lighting", "Lighting"),
        leaf("stationery", "Stationery"),
        leaf("storage", "Storage & Organization"),
        leaf("bath", "Bath"),
        leaf("wall-art", "Wall Art"),
        leaf("floor-care", "Vacuums & Floor Care"),
        leaf("furniture", "Furniture"),
        leaf("crafts", "Arts, Crafts & Sewing"),
      ]),
      group("office-products", "Office Products", [
        leaf("school-supplies", "Office & School Supplies"),
        leaf("office-electronics", "Office Electronics"),
        leaf("office-furniture", "Office Furniture & Lighting"),
        leaf("packaging", "Packaging Materials"),
      ]),
    ],
  },
  {
    slug: "phones-tablets",
    label: "Phones & Tablets",
    query: "phones tablets",
    groups: [
      group("mobile-phones", "Mobile Phones", [
        leaf("smartphones", "Smartphones"),
        leaf("cell-phones", "Cell Phones"),
      ]),
      group("tablets", "Tablets", [
        leaf("android-tablets", "Android Tablets"),
        leaf("educational-tablets", "Educational Tablets"),
        leaf("tablet-accessories", "Tablet Accessories"),
        leaf("ipad-tablets", "iPad Tablets"),
      ]),
      group("phone-accessories", "Accessories", [
        leaf("accessory-kits", "Accessory Kits"),
        leaf("adapters", "Adapters"),
        leaf("phone-batteries", "Batteries"),
        leaf("battery-chargers", "Battery Chargers"),
        leaf("bluetooth-headsets", "Bluetooth Headsets"),
        leaf("cables", "Cables"),
        leaf("car-accessories", "Car Accessories"),
        leaf("phone-cases", "Cases"),
        leaf("chargers", "Chargers"),
        leaf("headsets", "Headsets"),
        leaf("screen-protectors", "Screen Protectors"),
        leaf("selfie-sticks", "Selfie Sticks & Tripods"),
        leaf("smart-watches", "Smart Watches"),
      ]),
    ],
  },
  {
    slug: "fashion",
    label: "Fashion",
    query: "fashion",
    groups: [
      group("mens-fashion", "Men's Fashion", [
        leaf("mens-bags", "Bags"),
        leaf("big-tall", "Big & Tall"),
        leaf("mens-clothing", "Clothing"),
        leaf("mens-jewelry", "Jewelry"),
        leaf("mens-accessories", "Accessories"),
        leaf("mens-shoes", "Shoes"),
        leaf("traditional-wear", "Traditional & Cultural Wear"),
        leaf("mens-underwear", "Underwear & Sleepwear"),
        leaf("mens-watches", "Watches"),
        leaf("t-shirts", "T-Shirts"),
      ]),
      group("womens-fashion", "Women's Fashion", [
        leaf("womens-clothing", "Clothing"),
        leaf("handbags-wallets", "Handbags & Wallets"),
        leaf("womens-jewelry", "Jewelry"),
        leaf("maternity", "Maternity"),
        leaf("plus-size", "Plus-Size"),
        leaf("womens-shoes", "Shoes"),
        leaf("women", "Women"),
        leaf("womens-accessories", "Accessories"),
      ]),
      group("kids-fashion", "Kid's Fashion", [
        leaf("boys-fashion", "Boy's Fashion"),
        leaf("boys", "Boys"),
        leaf("girls-fashion", "Girl's Fashion"),
      ]),
      group("watches-sunglasses", "Watches & Sunglasses", [
        leaf("mens-watches-2", "Men's Watches"),
        leaf("unisex-watches", "Unisex Watches"),
        leaf("womens-watches", "Women's Watches"),
        leaf("mens-sunglasses", "Men's Sunglasses"),
        leaf("womens-sunglasses", "Women's Sunglasses"),
      ]),
      group("travel-gear", "Luggage & Travel Gear", [
        leaf("backpacks", "Backpacks"),
        leaf("briefcases", "Briefcases"),
        leaf("gym-bags", "Gym Bags"),
        leaf("laptop-bags", "Laptop Bags"),
        leaf("luggage", "Luggage"),
        leaf("luggage-sets", "Luggage Sets"),
        leaf("messenger-bags", "Messenger Bags"),
        leaf("travel-accessories", "Travel Accessories"),
        leaf("travel-duffels", "Travel Duffels"),
      ]),
    ],
  },
  {
    slug: "health-beauty",
    label: "Health & Beauty",
    query: "health beauty",
    groups: [
      group("makeup", "Makeup", [
        leaf("concealers", "Concealers & Color Correctors"),
        leaf("foundation", "Foundation"),
        leaf("powder", "Powder"),
        leaf("lip-gloss", "Lip Gloss"),
        leaf("lip-liner", "Lip Liner"),
        leaf("lipstick", "Lipstick"),
        leaf("eyeliner", "Eyeliner & Kajal"),
        leaf("eyeshadow", "Eyeshadow"),
        leaf("mascara", "Mascara"),
      ]),
      group("fragrance", "Fragrance", [
        leaf("mens-fragrance", "Men's"),
        leaf("womens-fragrance", "Women's"),
      ]),
      group("hair-care", "Hair Care", [
        leaf("hair-scalp", "Hair & Scalp Care"),
        leaf("hair-accessories", "Hair Accessories"),
        leaf("hair-tools", "Hair Cutting Tools"),
        leaf("shampoo", "Shampoo"),
        leaf("extensions", "Extensions, Wigs & Accessories"),
      ]),
      group("personal-care", "Personal Care", [
        leaf("feminine-care", "Feminine Care"),
        leaf("body-care", "Body"),
      ]),
      group("oral-care", "Oral Care", [
        leaf("teeth-whitening", "Teeth Whitening"),
        leaf("toothbrushes", "Toothbrushes"),
        leaf("toothpaste", "Toothpaste"),
        leaf("breath-fresheners", "Breath Fresheners"),
      ]),
      group("health-care", "Health Care", [
        leaf("face-protection", "Face Protection"),
        leaf("thermometers", "Thermometers"),
        leaf("hand-sanitizers", "Hand Sanitizers"),
        leaf("safety-gloves", "Lab, Safety & Work Gloves"),
      ]),
    ],
  },
  {
    slug: "electronics",
    label: "Electronics",
    query: "electronics",
    groups: [
      group("television-video", "Television & Video", [
        leaf("televisions", "Televisions"),
        leaf("smart-tvs", "Smart TVs"),
        leaf("led-lcd-tvs", "LED & LCD TVs"),
        leaf("oled-tvs", "QLED & OLED TVs"),
        leaf("curved-tvs", "Curved TV"),
        leaf("tv-accessories", "TV Accessories"),
        leaf("dvd-players", "DVD Players & Recorders"),
      ]),
      group("camera-photo", "Cameras & Photos", [
        leaf("digital-cameras", "Digital Cameras"),
        leaf("projectors", "Projectors"),
        leaf("surveillance", "Video Surveillance"),
        leaf("cctv", "CCTV Cameras"),
        leaf("camcorders", "Camcorders"),
        leaf("action-cameras", "Sport & Action Cameras"),
      ]),
      group("home-audio", "Home Audio", [
        leaf("home-theater", "Home Theater Systems"),
        leaf("receivers", "Receivers & Amplifiers"),
        leaf("sound-bars", "Sound Bars"),
        leaf("bluetooth-speakers", "Bluetooth Speakers"),
        leaf("subwoofers", "Subwoofers"),
      ]),
      group("portable-power", "Generators & Portable Power", [
        leaf("generators", "Generators"),
        leaf("power-inverters", "Power Inverters"),
        leaf("solar-wind", "Solar & Wind Power"),
        leaf("stabilizers", "Stabilizers"),
        leaf("batteries-power", "Batteries"),
      ]),
    ],
  },
  {
    slug: "computing",
    label: "Computing",
    query: "computing",
    groups: [
      group("computers", "Computers", [
        leaf("desktops", "Desktops"),
        leaf("laptops", "Laptops"),
        leaf("macbooks", "Macbooks"),
        leaf("gaming-laptops", "Gaming Laptops"),
        leaf("business-laptops", "Business Laptops"),
      ]),
      group("data-storage", "Data Storage", [
        leaf("external-hard-drives", "External Hard Drives"),
        leaf("usb-flash-drives", "USB Flash Drives"),
        leaf("external-ssd", "External Solid State Drives"),
      ]),
      group("printers", "Printers", [
        leaf("inkjet-printers", "Inkjet Printers"),
        leaf("laser-printers", "Laser Printers"),
        leaf("printer-ink", "Printer Ink & Toner"),
      ]),
      group("computer-accessories", "Computer Accessories", [
        leaf("keyboards-mice", "Keyboards & Mice"),
        leaf("pc-gaming", "PC Gaming Hardware"),
        leaf("ups", "Uninterrupted Power Supply"),
        leaf("memory-cards", "Memory Cards"),
        leaf("batteries", "Batteries"),
        leaf("scanners", "Scanners"),
        leaf("video-projectors", "Video Projectors"),
        leaf("bluetooth-keyboards", "Bluetooth Keyboards"),
        leaf("bluetooth-mouse", "Bluetooth Mouse"),
      ]),
      group("top-brands", "Top Brands", [
        leaf("hp", "HP"),
        leaf("lenovo", "Lenovo"),
        leaf("apple-computing", "Apple"),
        leaf("asus", "ASUS"),
        leaf("huawei", "Huawei"),
        leaf("microsoft", "Microsoft"),
        leaf("kingston", "Kingston"),
        leaf("seagate", "Seagate"),
        leaf("samsung-computing", "Samsung"),
        leaf("sandisk", "Sandisk"),
        leaf("toshiba", "Toshiba"),
      ]),
    ],
  },
  {
    slug: "grocery",
    label: "Grocery",
    desktopLabel: "Grocery",
    query: "grocery",
    groups: [
      group("food-cupboard", "Food Cupboard", [
        leaf("rice-grains", "Rice & Grains"),
        leaf("pasta-noodles", "Pasta & Noodles"),
        leaf("spices", "Herbs, Spices & Seasonings"),
        leaf("flours-meals", "Flours & Meals"),
        leaf("cooking-oil", "Cooking Oil"),
        leaf("canned-food", "Canned, Jarred & Packaged Food"),
        leaf("candy-chocolate", "Candy & Chocolate"),
        leaf("breakfast-foods", "Breakfast Foods"),
      ]),
      group("beverages", "Beverages", [
        leaf("soft-drinks", "Soft Drinks"),
        leaf("milk-cream", "Milk & Cream"),
        leaf("energy-drinks", "Energy Drinks"),
        leaf("bottled-beverages", "Bottled Beverages"),
        leaf("juices", "Juices"),
      ]),
      group("household-cleaning", "Household Care", [
        leaf("laundry", "Laundry"),
        leaf("air-fresheners", "Air Fresheners"),
        leaf("paper-wipes", "Toilet Paper & Wipes"),
        leaf("bathroom-cleaners", "Bathroom Cleaners"),
        leaf("dishwashing", "Dishwashing"),
        leaf("cleaning-tools", "Cleaning Tools"),
      ]),
    ],
  },
  {
    slug: "garden-outdoors",
    label: "Garden & Outdoors",
    query: "garden outdoors",
    desktop: false,
    groups: [
      group("generators", "Generators", []),
      group("power-inverters", "Power Inverters", []),
      group("power-stations", "Power Stations", []),
      group("generator-parts", "Generator Replacement Parts", []),
    ],
  },
  {
    slug: "automobile",
    label: "Automobile",
    query: "automobile",
    desktop: false,
    groups: [
      group("oils-fluids", "Oils & Fluids", [
        leaf("brake-fluids", "Brake Fluids"),
        leaf("greases-lubricants", "Greases & Lubricants"),
        leaf("oils", "Oils"),
      ]),
      group("interior-accessories", "Interior Accessories", [
        leaf("air-fresheners-auto", "Air Fresheners"),
        leaf("organizers", "Consoles & Organizers"),
        leaf("cup-holders", "Cup Holders"),
        leaf("floor-mats", "Floor Mats"),
        leaf("key-chains", "Key Chains"),
        leaf("seat-covers", "Seat Covers"),
      ]),
      group("cleaning-care", "Cleaning & Care", [
        leaf("cleaning-kits", "Cleaning Kits"),
        leaf("exterior-care", "Exterior Care"),
        leaf("interior-care", "Interior Care"),
      ]),
      group("car-electronics", "Car Electronics & Accessories", [
        leaf("car-electronics", "Car Electronics"),
        leaf("car-electronics-accessories", "Car Electronics Accessories"),
      ]),
      group("lighting-accessories", "Lights & Lighting Accessories", [
        leaf("bulbs", "Bulbs"),
        leaf("accent-lighting", "Accent & Off Road Lighting"),
      ]),
    ],
  },
  {
    slug: "sporting-goods",
    label: "Sporting Goods",
    query: "sporting goods",
    desktop: false,
    groups: [
      group("cardio", "Cardio Training", [
        leaf("exercise-bikes", "Exercise Bikes"),
        leaf("treadmills", "Treadmills"),
        leaf("elliptical", "Elliptical Trainers"),
      ]),
      group("strength", "Strength Training Equipment", [
        leaf("core-training", "Core & Abdominal Training"),
        leaf("dumbbells", "Dumbbells"),
        leaf("bars", "Bars"),
      ]),
      group("sport-accessories", "Accessories", [
        leaf("exercise-bands", "Exercise Bands"),
        leaf("exercise-mats", "Exercise Mats"),
        leaf("jump-ropes", "Jump Ropes"),
      ]),
      group("team-sports", "Team Sports", [
        leaf("basketball", "Basketball"),
        leaf("team-accessories", "Team Sport Accessories"),
        leaf("racquet-sports", "Tennis & Racquet Sports"),
        leaf("swimming", "Swimming"),
      ]),
      group("outdoor-adventure", "Outdoor & Adventure", [
        leaf("cycling", "Cycling"),
        leaf("running", "Running"),
      ]),
    ],
  },
  {
    slug: "gaming",
    label: "Gaming",
    query: "gaming",
    groups: [
      group("playstation", "Playstation", [
        leaf("playstation-5", "PlayStation 5"),
        leaf("playstation-4", "PlayStation 4"),
        leaf("playstation-3", "PlayStation 3"),
        leaf("playstation-2", "PlayStation 2"),
        leaf("playstation-vita", "PlayStation Vita"),
      ]),
      group("nintendo", "Nintendo", [
        leaf("nintendo-3ds", "Nintendo 3DS"),
        leaf("nintendo-ds", "Nintendo DS"),
        leaf("nintendo-switch", "Nintendo Switch"),
        leaf("nintendo-wii", "Nintendo Wii"),
      ]),
      group("xbox", "Xbox", [
        leaf("xbox-one", "Xbox One"),
        leaf("xbox-360", "Xbox 360"),
        leaf("xbox", "Xbox"),
      ]),
      group("top-games", "Top Games", [
        leaf("fifa", "FIFA"),
        leaf("god-of-war", "God of War"),
        leaf("spiderman", "Spiderman"),
        leaf("call-of-duty", "Call of Duty"),
        leaf("assassins-creed", "Assassin's Creed"),
        leaf("grand-theft-auto", "Grand Theft Auto"),
      ]),
    ],
  },
  {
    slug: "baby-products",
    label: "Baby Products",
    query: "baby products",
    groups: [
      group("gear", "Gear", [
        leaf("carriers", "Backpacks & Carriers"),
        leaf("swings", "Swings, Jumpers & Bouncers"),
        leaf("walkers", "Walkers"),
      ]),
      group("bathing-skin", "Bathing & Skin Care", [
        leaf("skin-care", "Skin Care"),
        leaf("washcloths", "Washcloths & Towels"),
        leaf("bathing-seats", "Bathing Tubs & Seats"),
        leaf("grooming-kits", "Grooming & Healthcare Kits"),
      ]),
      group("potty-training", "Potty Training", [
        leaf("potties", "Potties & Seats"),
        leaf("seat-covers", "Seat Covers"),
        leaf("training-pants", "Training Pants"),
      ]),
      group("safety", "Safety", [
        leaf("monitors", "Monitors"),
        leaf("rails", "Rails & Rail Guards"),
        leaf("corner-guards", "Edge & Corner Guards"),
      ]),
      group("feeding", "Feeding", [
        leaf("bibs", "Bibs & Burp Cloths"),
        leaf("bottle-feeding", "Bottle-Feeding"),
        leaf("breastfeeding", "Breastfeeding"),
        leaf("food-storage", "Food Storage"),
        leaf("highchairs", "Highchairs & Booster Seats"),
        leaf("pacifiers", "Pacifiers & Accessories"),
        leaf("solid-feeding", "Solid Feeding"),
      ]),
      group("baby-toys", "Baby & Toddler Toys", [
        leaf("bath-toys", "Bath Toys"),
        leaf("music-sound", "Music & Sound"),
        leaf("learning", "Learning & Education"),
      ]),
      group("baby-apparel", "Apparel & Accessories", [
        leaf("baby-boys", "Baby Boys"),
        leaf("baby-girls", "Baby Girls"),
      ]),
      group("diapering", "Diapering", [
        leaf("disposable-diapers", "Disposable Diapers"),
        leaf("diaper-bags", "Diaper Bags"),
        leaf("wipes-holders", "Wipes & Holders"),
        leaf("cloth-diapers", "Cloth Diapers"),
        leaf("changing-tables", "Changing Tables"),
      ]),
    ],
  },
  {
    slug: "other-categories",
    label: "Other Categories",
    query: "other categories",
    mobile: false,
    groups: [
      group("musical-instruments", "Musical Instruments", [
        leaf("musical-instruments-all", "Musical Instruments"),
        leaf("studio-live-equipment", "Studio & Live Equipment"),
        leaf("electronic-music", "Electronic Music & DJ Equipment"),
        leaf("amplifiers-effects", "Amplifiers & Effects"),
      ]),
      group("toys-games", "Toys & Games", [
        leaf("games", "Games"),
        leaf("pretend-play", "Dress Up & Pretend Play"),
        leaf("outdoor-play", "Sports & Outdoor Play"),
        leaf("top-toys", "Top Toys & Games"),
      ]),
      group("automobile-other", "Automobile", [
        leaf("car-care", "Car Care"),
        leaf("car-electronics-other", "Car Electronics & Accessories"),
        leaf("lighting-other", "Lights & Lighting Accessories"),
        leaf("exterior-accessories", "Exterior Accessories"),
        leaf("oils-fluids-other", "Oils & Fluids"),
        leaf("interior-accessories-other", "Interior Accessories"),
        leaf("tyres-rims", "Tyre & Rims"),
      ]),
      group("sporting-goods-other", "Sporting Goods", [
        leaf("cardio-other", "Cardio Training"),
        leaf("strength-other", "Strength Training Equipment"),
        leaf("accessories-other", "Accessories"),
        leaf("team-sports-other", "Team Sports"),
        leaf("outdoor-adventure-other", "Outdoor & Adventure"),
      ]),
      group("books-media", "Books, Movies and Music", []),
      group("pet-supplies", "Pet Supplies", []),
      group("wholesale", "Wholesale", []),
    ],
  },
];
