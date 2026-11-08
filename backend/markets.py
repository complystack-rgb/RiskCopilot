"""Market config, product catalogs and hero demo cases (all values in local currency)."""
_P = "/images/heroes/"
_H = {
    "in1": ["109b7066525d466935868bfd5b6f865685c26929fef7f12843040576c1e45086", "a21d25dd250175312e9c2d6d13ec4997969be5d8ca42f91876da5ad73c81e5b7", "0f8bcd8382f8173f712c8edac22b51741f6b811355b10f0f27db53b96ee54020"],
    "in2": ["8cc066439c5dbc2e7e8a424e68e75d8c3728fc9806b13001a22b930fea1115e9", "2ce0f542ae8acde9b052d3dc1207025bc3c65171003cf6f6be9c5c16bcd4fec6", "efbd9a2bbf7c0c2dc2e57696a88fed911f08911ea45fd44c3355ad45a5d2e5f6"],
    "in3": ["0cb9c45a3019f4d74504cfb5681048d969550572a1d16961fcd08acf27fa06f3", "6ea45e25924847ad22341b014ef80c10c8756d82de3e53376f2fc7bf25ed0d8d", "449ff6f42cd2db718c049ca54e714cce74c859f82256fe803d3d0c56b895cc33"],
    "in4": ["a674011e65ff12ff5dc252a33054b401ad8196383c0d2032c5c0fb1e54330d12", "48960cbe5ebec4268d911d250bf546fdf058739044d0d76ff6a1011bc431d450", "5d3f8b104f85f20283ad520d45b3339d70b277f1d3cb40a7d35e7d8f4c06758e"],
    "in5": ["9b9b20ea23e36e67b71fae4e294cf1165980f9205904bbd8cb336e4e80515754", "82a17ff9dfdc2f65d8532e9beb72b2d16f20b867d1bb7b985842b53d8c80fe82", "faabf15de2acdc57e206a273248848e4e13564dbac9771c253a86be644929927"],
    "in6": ["e0f7c9022ba4c4e6e445d047a56c6f60aeb2e117a914b9bb338622130d5a042e", "bfffc1f8280b29014fb833db1821ef4db1d684b4aba01ff54a07981b0f550a35", "95d03121d26bfe6b2728a0a4a460b62b46721bd80ff67385a4726ee9583d8bcc"],
    "my1": ["526b374e9d7288f2184395694eb21eebdfdada25fa700bd5305062ecd2dd3500", "1fb259a17712c1a70a5e69cafeffe3d4b2cd332b826b76e5d1fa090b703ac8fc", "81f12d249c6e3e8004db1701394d74ac6a4051b1b8601b392778a5c6e2595497"],
    "my2": ["5439c45b78e994a86a1a41c32233cd58e8aeb82da977455027e600afad4d03b0", "df2c5abb2b4ccd56358f58d5261ccd22066604122e6a3282586ef7da474218de", "5948a1e8dd7f0572354d2af277d9b7fc82ede92fe962ef41047021eefc93b3de"],
    "my3": ["44a450e74c299789d498f469a93b3ea0848f86dd1ba0e3979f73a3fc7f2e8b0b", "ac6004107edbdafddff50bcb9139579464cf3fefcc7a6501c2ce0db26a8b2d40", "7b4134772771009307b4e499228e5254cb540b5af1bc962fe74f020cf971270c"],
    "my4": ["ede667b53c8d10290c205f3d4d3c122945e0c9a046cc218bd3fc1d9302f585f4", "70eab6e5ca897a644baa3cfc5642845b48938a669dbeb367fcae3b7d918dd55d", "2ff52e9da63484e7ba9b85bbc1c59c19f4a2436b8da9a182a8ccc19a42fce031"],
    "my5": ["e012901a3a373cb9176bfcce4b4297e89fd502a854053d546c974e7c27f25bd1", "cf67cbd3c2823f8715274a0f329579d619899c18c707363936d92efe7145e733", "506d955a9530c2a4bd9bdf5d88bd859b1f16302dda357351272e11fb8b75c01b"],
    "my6": ["978da040fc05acc89c828697ecc0db2ca2fa0a37f2fac2213185d0166f38580b", "3152a1b68e9cb2c2fed7be384bc1bdb20502345d10044b06beef1c00713989fe", "c5572f9cfe0150a2df00b3c761914c5369128268edc9bce87f370be0b5101212"],
    "id1": ["9ef840fa694af100c3af4f345cf2ac74b6ebb148bedb7ff8882b0ba30b9a638d", "6c1c84b4092df346894af97aed75c98842fb393760209bb69d1035d8223000d5", "13683e81abe6a93c16ec03ae8aef407d79cf606c23ef600cf55a525df3b3b435"],
    "id2": ["8443795aaa1da1d322abd205d14003e2a1be1db3387bf4314030c2ddd33c44fc", "2a7631e285105239077993f5e5534219f55df4274742c693315b6c7eee083832", "7f58642e950eeece7e5ee67f45d1dec1be98d698d9c3ac9386d94cde6b4ca560"],
    "id3": ["878ba368f53b87c666345e36678534e01dcdcba4647b50abeaddd01062d53310", "33f53bbee109c7798f58fa179b64f4b87c014f9f622a6fc918c7870be79b7183", "fb675a4ff2a1f802cb4837c733e9402a45a427e02c4c79be14ad48e114c0e306"],
    "id4": ["d156c48ec628670c39e9b8291f58936b6a452df8acc2c3301dfc6eda5adc0847", "9ef2db6f6adb7af2b764e6752d87b8ff3611e6b19405f702163987afd4cfe64e", "b23165a9b7e4a28697efeb41dc2db0012027bb5bab6b52e76aebdb9891d919f3"],
    "id5": ["e3c8ec8e8096069bca65059073da19a47a36ae157496a2955e43379405ed17af", "f2a946863a614d8292bb30ac3cdcd36d35d322d886b833bc120a3aa8200d9f4e", "d5bfb91f0a64dbfc89b752c741855d965ebcabdcf599582bd34b45bd19a70462"],
    "id6": ["a8f1d9d17091058365a66901b41f22c87aea555feb58354e9fbf0df9a49b234b", "68a53f37d65970337656835ff14fe727e708b675f426531ae2bfd0225ab5e8ca", "bf8899ec7852d52a882ff45dba0c06c21926f5de483ade16e6645437102f4268"],
}
IMAGES = {k: [_P + h + ".jpeg" for h in v] for k, v in _H.items()}

CATEGORIES = {"property": "Property & fire", "bi": "Business interruption", "machinery": "Machinery breakdown", "marine": "Marine & transit", "liability": "Liability", "cyber": "Cyber"}

MARKETS = {
    "IN": {"code": "IN", "name": "India", "currency": "INR", "symbol": "₹", "fx": 83.0, "insurer": "ABC Insure India", "regulator": "IRDAI", "prefix": "ZIN", "tax": "GST 18%",
           "id_label": "GSTIN", "categories": ["property", "bi", "machinery", "marine", "liability", "cyber"],
           "catalog": {"property": "Bharat Laghu Udyam Suraksha", "bi": "Fire Loss of Profit", "machinery": "Machinery Breakdown", "marine": "Marine Cargo Open Policy", "liability": "Commercial General Liability", "cyber": "Cyber Secure SME"}},
    "MY": {"code": "MY", "name": "Malaysia", "currency": "MYR", "symbol": "RM", "fx": 4.7, "insurer": "ABC Insure Malaysia Berhad", "regulator": "BNM", "prefix": "ZMY", "tax": "SST 8%",
           "id_label": "SSM No.", "categories": ["property", "bi", "machinery", "marine", "liability", "cyber"],
           "catalog": {"property": "Fire & Allied Perils", "bi": "Consequential Loss", "machinery": "Machinery Breakdown", "marine": "Marine Cargo", "liability": "Public Liability", "cyber": "Cyber Insurance"}},
    "ID": {"code": "ID", "name": "Indonesia", "currency": "IDR", "symbol": "Rp", "fx": 15800.0, "insurer": "PT ABC Insure Indonesia", "regulator": "OJK", "prefix": "ZID", "tax": "PPN 11%",
           "id_label": "NIB", "categories": ["property", "bi", "machinery", "marine", "liability", "cyber"],
           "catalog": {"property": "Property All Risks (PAR)", "bi": "Business Interruption", "machinery": "Machinery Breakdown", "marine": "Marine Cargo", "liability": "Public Liability", "cyber": "Cyber Insurance"}},
}

ORGS = [
    {"id": "org-bharat", "market": "IN", "name": "Bharat Risk Brokers", "type": "Broking firm", "city": "Mumbai", "licence": "IRDAI DB 712/2019"},
    {"id": "org-kavach", "market": "IN", "name": "Kavach Insurance Distribution", "type": "Corporate agent", "city": "Coimbatore", "licence": "IRDAI CA 0457/2021"},
    {"id": "org-lumen", "market": "MY", "name": "Lumen Insurance Brokers Sdn Bhd", "type": "Broking firm", "city": "Kuala Lumpur", "licence": "BNM IB-0291"},
    {"id": "org-nusantara", "market": "ID", "name": "PT Nusantara Proteksi Broker", "type": "Broking firm", "city": "Jakarta", "licence": "OJK KEP-118/NB.1/2020"},
]

INSURER_ORGS = [
    {"id": "ins-in", "market": "IN", "name": "ABC Insure India", "type": "Insurer", "city": "Mumbai", "licence": "IRDAI Reg. No. 190"},
    {"id": "ins-my", "market": "MY", "name": "ABC Insure Malaysia Berhad", "type": "Insurer", "city": "Kuala Lumpur", "licence": "BNM Licensed Insurer"},
    {"id": "ins-id", "market": "ID", "name": "PT ABC Insure Indonesia", "type": "Insurer", "city": "Jakarta", "licence": "OJK KEP-071/D.05/2019"},
]
UNDERWRITERS = [("ins-in", "Arjun Rao", "Mumbai"), ("ins-my", "Mei Ling Wong", "Kuala Lumpur"), ("ins-id", "Sari Wijaya", "Jakarta")]
AGENTS = [
    ("org-bharat", "Ritika Mehta", "admin", "Mumbai"), ("org-bharat", "Imran Shaikh", "agent", "Surat"), ("org-bharat", "Nikhil Patil", "agent", "Pune"),
    ("org-kavach", "Lakshmi Narayanan", "admin", "Coimbatore"), ("org-kavach", "Karthik Raja", "agent", "Tiruppur"),
    ("org-lumen", "Aisyah Rahman", "admin", "Kuala Lumpur"), ("org-lumen", "Daniel Tan", "agent", "Penang"), ("org-lumen", "Kavitha Pillai", "agent", "Johor Bahru"),
    ("org-nusantara", "Budi Santoso", "admin", "Jakarta"), ("org-nusantara", "Dewi Lestari", "agent", "Bandung"), ("org-nusantara", "Rizky Pratama", "agent", "Surabaya"),
]

# key, market, org, name, city, region, industry, employees, revenue_usd, needs, ships_goods, website, plate(make, model), hazard_a, hazard_c, prior(insurer, covered cats, si_ratio) | None, status
HEROES = [
    ("in1", "IN", "org-bharat", "Shree Ganesh Weaving Mills", "Surat", "Gujarat", "Textile weaving", 64, 2_600_000, ("Rapier loom", "Picanol", "OptiMax-i", 21_000, 48), "Lint build-up on loom frames and cable trays", "Fabric stacked ~4 m high, aisle blocked, extinguisher overdue", ("New India Assurance", ["property"], 0.62), "visited"),
    ("in2", "IN", "org-kavach", "Annapurna Agro Foods", "Indore", "Madhya Pradesh", "Food processing", 85, 3_400_000, ("Steam boiler", "Thermax", "Shellmax SM-30", 48_000, 2), "Flour dust accumulation near milling motors", "Open distribution board beside packaging film rolls", ("ICICI Lombard", ["property", "liability"], 0.8), "proposal_submitted"),
    ("in3", "IN", "org-bharat", "Pune Precision Auto Components", "Pune", "Maharashtra", "Auto components", 120, 5_800_000, ("CNC turning centre", "BFW", "VF-3", 62_000, 14), "Coolant and oil on floor near CNC line", "Oily rags in open bin next to cutting-oil drums", ("HDFC ERGO", ["property", "machinery"], 0.74), "info_requested"),
    ("in4", "IN", "org-bharat", "Sai Pharma Formulations", "Baddi", "Himachal Pradesh", "Pharmaceuticals", 140, 7_200_000, ("Rotary tablet press", "Fette", "P2020", 180_000, 3), "Cleanroom HVAC ducts with no fire dampers visible", "Solvent drums stored without spill trays", None, "new"),
    ("in5", "IN", "org-kavach", "Tiruppur Knit Exports", "Tiruppur", "Tamil Nadu", "Garments & knitwear", 210, 4_900_000, ("Circular knitting machine", "Mayer & Cie", "Relanit 3.2", 38_000, 22), "Cotton fluff on sewing lines, overloaded extension boards", "Cartons of finished goods blocking the panel room door", ("United India Insurance", ["property", "marine"], 0.7), "quoted"),
    ("in6", "IN", "org-bharat", "Bhiwandi Cold Chain Logistics", "Bhiwandi", "Maharashtra", "Cold chain warehousing", 58, 2_900_000, ("Ammonia refrigeration compressor", "Kirloskar", "KC-6", 95_000, 3), "PIR panels in cold rooms with exposed wiring", "Forklift chargers next to stored cartons", None, "contacted"),
    ("my1", "MY", "org-lumen", "Penang Microtech Assembly", "Bayan Lepas", "Penang", "Electronics assembly", 180, 9_500_000, ("Reflow oven", "Heller", "1936 MK7", 140_000, 4), "SMT line ovens with nitrogen lines, no gas detection seen", "Lithium battery cabinet left open in component store", ("Allianz General", ["property", "machinery"], 0.82), "proposal_submitted"),
    ("my2", "MY", "org-lumen", "Klang Valley Gloves", "Shah Alam", "Selangor", "Rubber gloves", 260, 12_000_000, ("Thermal oil heater", "Konus Icesa", "TH-2500", 160_000, 2), "Drying ovens on dipping line run at high temperature", "Glove cartons stacked to 5 m with narrow aisles", ("Etiqa General Takaful", ["property"], 0.66), "visited"),
    ("my3", "MY", "org-lumen", "Johor Palm Kernel Processing", "Pasir Gudang", "Johor", "Palm kernel processing", 95, 8_200_000, ("Screw press", "Muar Ban Lee", "MBL-P15", 75_000, 6), "Oil-soaked kernel dust around screw presses", "Diesel genset beside stored oil drums", None, "new"),
    ("my4", "MY", "org-lumen", "Selangor Cold Logistics", "Port Klang", "Selangor", "Cold chain logistics", 72, 5_100_000, ("Reefer unit", "Thermo King", "SB-210", 22_000, 18), "Reefer plug-in points exposed to rain at loading bay", "Cartons stored inside main switchboard room", ("AIG Malaysia", ["property", "marine", "liability"], 0.9), "quoted"),
    ("my5", "MY", "org-lumen", "Melaka Batik & Textile", "Melaka", "Melaka", "Batik & textiles", 34, 1_100_000, ("LPG wax stove", "Local", "Canting set", 900, 24), "Open-flame wax pots beside drying cotton fabric", "Fabric bundles shelved floor to ceiling", None, "contacted"),
    ("my6", "MY", "org-lumen", "KL Kopi Roasters", "Kuala Lumpur", "W.P. Kuala Lumpur", "Coffee roasting & e-commerce", 28, 1_800_000, ("Drum roaster", "Diedrich", "IR-12", 54_000, 2), "Chaff build-up inside roaster exhaust duct", "Green coffee sacks stacked against hot exhaust duct", ("Takaful Ikhlas", ["property"], 0.85), "bound"),
    ("id1", "ID", "org-nusantara", "PT Bandung Garmen Nusantara", "Bandung", "Jawa Barat", "Garment manufacturing", 320, 8_800_000, ("Industrial sewing machine", "Juki", "DDL-9000C", 1_200, 280), "Thread lint on sewing lines, no extinguishers between rows", "Fabric rolls blocking the KELUAR emergency exit", ("Asuransi Sinar Mas", ["property"], 0.58), "visited"),
    ("id2", "ID", "org-nusantara", "PT Jepara Mebel Jati", "Jepara", "Jawa Tengah", "Teak furniture", 75, 2_300_000, ("Wood planer", "Powermatic", "209HH", 9_000, 6), "Sawdust layer across workshop, open-sided roof", "Lacquer and thinner cans by spray area, no extraction", None, "new"),
    ("id3", "ID", "org-nusantara", "PT Kopi Gayo Prima", "Medan", "Sumatera Utara", "Coffee processing & export", 60, 3_900_000, ("Coffee dryer", "Pinhalense", "SRE-15", 34_000, 4), "Wood-fired dryers close to hulling area", "Export sacks stacked to roof on timber pallets", ("Asuransi Astra", ["property", "marine"], 0.76), "proposal_submitted"),
    ("id4", "ID", "org-nusantara", "PT Surabaya Plastik Industri", "Surabaya", "Jawa Timur", "Plastic injection moulding", 150, 6_400_000, ("Injection moulding machine", "Haitian", "MA2500", 68_000, 16), "Hydraulic oil leaks under moulding machines", "Resin granule bags stacked next to hot dryer hopper", ("Asuransi Tugu Pratama", ["property", "machinery"], 0.71), "info_requested"),
    ("id5", "ID", "org-nusantara", "PT Bekasi Logistik Cepat", "Bekasi", "Jawa Barat", "Distribution warehousing", 110, 7_700_000, ("Forklift", "Yale", "ERP25VT", 28_000, 12), "High-bay racking without in-rack sprinklers", "Overloaded panel with daisy-chained extension cables", None, "contacted"),
    ("id6", "ID", "org-nusantara", "PT Bali Craft Exports", "Denpasar", "Bali", "Handicraft export", 42, 1_600_000, ("Spray booth fan", "Local", "SB-1", 2_500, 1), "Spray booth with no extinguisher or extraction filter", "Straw and packing material piled high near work tables", ("Asuransi Jasindo", ["property"], 0.8), "quoted"),
]
