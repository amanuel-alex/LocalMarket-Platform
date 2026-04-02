import '../models/product.dart';

final mockProducts = <Product>[
  Product(
    id: 'p1',
    title: 'Yirgacheffe Coffee — 500g',
    priceEtb: 890,
    imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80',
    distanceKm: 0.8,
    sellerName: 'Buna House',
    sellerRating: 4.9,
    locationLabel: 'Bole, Addis Ababa',
    description:
        'Single-origin washed process. Floral aroma with citrus notes. Roasted weekly for peak freshness.',
    comparePrices: const [
      CompareOffer(storeName: 'Mega Mart', priceEtb: 920, distanceKm: 1.2),
      CompareOffer(storeName: 'Fresh Corner', priceEtb: 875, distanceKm: 2.4),
      CompareOffer(storeName: 'City Market', priceEtb: 905, distanceKm: 3.1),
    ],
  ),
  Product(
    id: 'p2',
    title: 'Teff Flour — 2kg',
    priceEtb: 320,
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
    distanceKm: 1.1,
    sellerName: 'Grain & Roots',
    sellerRating: 4.7,
    locationLabel: 'Piassa',
    description: 'Stone-ground teff flour. Ideal for injera and gluten-sensitive baking.',
    comparePrices: const [
      CompareOffer(storeName: 'Open Market', priceEtb: 300, distanceKm: 4.0),
      CompareOffer(storeName: 'Neighborhood Co-op', priceEtb: 335, distanceKm: 0.9),
    ],
  ),
  Product(
    id: 'p3',
    title: 'Shea Butter Skincare Set',
    priceEtb: 650,
    imageUrl: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80',
    distanceKm: 2.0,
    sellerName: 'Nile Glow',
    sellerRating: 4.8,
    locationLabel: 'Kazanchis',
    description: 'Cold-pressed shea with beeswax balm. Paraben-free, crafted in small batches.',
    comparePrices: const [
      CompareOffer(storeName: 'Beauty Hub', priceEtb: 720, distanceKm: 1.5),
      CompareOffer(storeName: 'Organic Lane', priceEtb: 640, distanceKm: 2.8),
    ],
  ),
  Product(
    id: 'p4',
    title: 'Handwoven Cotton Scarf',
    priceEtb: 450,
    imageUrl: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800&q=80',
    distanceKm: 3.2,
    sellerName: 'Threads Studio',
    sellerRating: 5.0,
    locationLabel: 'Merkato',
    description: 'Ethically sourced cotton, natural dyes. Lightweight for all seasons.',
    comparePrices: const [
      CompareOffer(storeName: 'Craft Collective', priceEtb: 480, distanceKm: 2.1),
    ],
  ),
];

Product? productById(String id) {
  try {
    return mockProducts.firstWhere((p) => p.id == id);
  } catch (_) {
    return null;
  }
}
