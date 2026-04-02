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
