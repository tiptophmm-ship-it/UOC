/* SITE SETTINGS
   Edit this file to change the shop name, WhatsApp number, branches and hours.
   Phone numbers: international format, digits only.
   Nigeria: 234 + the number without its leading 0 (0806 810 3067 becomes 2348068103067). */

window.SITE = {
  name: "OUC Concept", // check the spelling against the shop signboard
  tagline: "Motorcycle spare parts and engine oil",
  area: "Akure and Ado Ekiti",

  // Main WhatsApp number. Used everywhere unless a branch has its own number below.
  whatsapp: "2348068103067",

  // Shown beside the price notice. Change it whenever you refresh prices.
  pricesUpdated: "October 2026",

  // Leave phone and whatsapp as "" to hide a phone line / use the main number.
  // Replace mapsUrl with the real Google Maps link for each branch (open the shop in Maps, tap Share, copy the link).
  branches: [
    {
      id: "akure",
      name: "Akure Branch",
      street: "Car Street",
      city: "Akure",
      region: "Ondo State",
      phone: "",
      whatsapp: "",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=OUC+Concept+Car+Street+Akure",
      hours: [
        ["Monday to Friday", "8:00am to 6:30pm"],
        ["Saturday", "8:00am to 6:30pm"],
      ],
    },
    {
      id: "ado",
      name: "Ado Ekiti Branch",
      street: "", // add the street when you have it
      city: "Ado Ekiti",
      region: "Ekiti State",
      phone: "",
      whatsapp: "",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=OUC+Concept+Ado+Ekiti",
      hours: [
        ["Monday to Friday", "8:00am to 6:30pm"],
        ["Saturday", "8:00am to 6:30pm"],
      ],
    },
  ],

  // Bike brands shown as quick filters. Products list the brands they fit in products.js.
  bikeBrands: ["TVS", "Honda", "Shiroro", "Chalin"],

  customerTypes: ["Rider or owner", "Mechanic or workshop", "Reseller"],

  // id is what products.js uses in its "cat" field. icon is one of:
  // oil, can, filter, disc, chain, gear, clutch, spring, bolt, body, tyre, mirror, box
  categories: [
    { id: "oils", name: "Engine oils", icon: "oil" },
    { id: "lubricants", name: "Lubricants", icon: "can" },
    { id: "filters", name: "Filters", icon: "filter" },
    { id: "brakes", name: "Brake system", icon: "disc" },
    { id: "chains", name: "Chains and sprockets", icon: "chain" },
    { id: "engine", name: "Engine parts", icon: "gear" },
    { id: "clutch", name: "Clutch system", icon: "clutch" },
    { id: "suspension", name: "Suspension", icon: "spring" },
    { id: "electrical", name: "Electrical parts", icon: "bolt" },
    { id: "body", name: "Body parts", icon: "body" },
    { id: "tyres", name: "Tyres and tubes", icon: "tyre" },
    { id: "accessories", name: "Accessories", icon: "mirror" },
  ],
};
