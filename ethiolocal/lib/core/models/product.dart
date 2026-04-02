class Product {
  const Product({
    required this.id,
    required this.title,
    required this.priceEtb,
    required this.imageUrl,
    required this.distanceKm,
    required this.sellerName,
    required this.sellerRating,
    required this.locationLabel,
    required this.description,
    this.comparePrices = const [],
  });

  final String id;
  final String title;
  final double priceEtb;
  final String imageUrl;
  final double distanceKm;
  final String sellerName;
  final double sellerRating;
  final String locationLabel;
  final String description;
  final List<CompareOffer> comparePrices;

  static String _placeholderImage(String id) =>
      'https://picsum.photos/seed/${id.hashCode.abs()}/600/600';

  static String _shortSeller(String? sellerId) {
    if (sellerId == null || sellerId.isEmpty) return '…';
    return sellerId.length > 6 ? sellerId.substring(sellerId.length - 6) : sellerId;
  }

  factory Product.fromRankedJson(Map<String, dynamic> j) {
    final loc = j['location'] as Map<String, dynamic>?;
    final lat = loc?['lat'];
    final lng = loc?['lng'];
    final trust = (j['sellerTrustScore'] as num?)?.toDouble() ?? 50;
    final id = j['id'] as String;
    final rawImage = j['imageUrl'] as String?;
    return Product(
      id: id,
      title: j['title'] as String,
      priceEtb: (j['price'] as num).toDouble(),
      imageUrl: (rawImage != null && rawImage.isNotEmpty) ? rawImage : _placeholderImage(id),
      distanceKm: (j['distanceKm'] as num?)?.toDouble() ?? 0,
      sellerName: 'Seller ${_shortSeller(j['sellerId'] as String?)}',
      sellerRating: (trust / 20).clamp(0, 5).toDouble(),
      locationLabel: lat != null && lng != null
          ? '${(lat as num).toStringAsFixed(2)}, ${(lng as num).toStringAsFixed(2)}'
          : 'Local',
      description: j['description'] as String? ?? '',
      comparePrices: const [],
    );
  }

  factory Product.fromCatalogJson(Map<String, dynamic> j) {
    final id = j['id'] as String;
    final rawImage = j['imageUrl'] as String?;
    final loc = j['location'] as Map<String, dynamic>?;
    final lat = loc?['lat'];
    final lng = loc?['lng'];
    final dist = (j['distanceKm'] as num?)?.toDouble();
    return Product(
      id: id,
      title: j['title'] as String,
      priceEtb: (j['price'] as num).toDouble(),
      imageUrl: (rawImage != null && rawImage.isNotEmpty) ? rawImage : _placeholderImage(id),
      distanceKm: dist ?? 0,
      sellerName: 'Seller ${_shortSeller(j['sellerId'] as String?)}',
      sellerRating: (((j['sellerTrustScore'] as num?)?.toDouble() ?? 50) / 20).clamp(0.0, 5.0).toDouble(),
      locationLabel: lat != null && lng != null
          ? '${(lat as num).toStringAsFixed(2)}, ${(lng as num).toStringAsFixed(2)}'
          : 'Local',
      description: j['description'] as String? ?? '',
      comparePrices: const [],
    );
  }

  Product copyWith({List<CompareOffer>? comparePrices}) {
    return Product(
      id: id,
      title: title,
      priceEtb: priceEtb,
      imageUrl: imageUrl,
      distanceKm: distanceKm,
      sellerName: sellerName,
      sellerRating: sellerRating,
      locationLabel: locationLabel,
      description: description,
      comparePrices: comparePrices ?? this.comparePrices,
    );
  }
}

class CompareOffer {
  const CompareOffer({
    required this.storeName,
    required this.priceEtb,
    required this.distanceKm,
  });

  final String storeName;
  final double priceEtb;
  final double distanceKm;
}
