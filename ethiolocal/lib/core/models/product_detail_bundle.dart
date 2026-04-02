import 'product.dart';

/// Product detail payload: main listing, compare offers, and related catalog rows from API.
class ProductDetailBundle {
  const ProductDetailBundle({
    required this.product,
    required this.similarProducts,
    required this.alsoViewedProducts,
  });

  final Product product;
  final List<Product> similarProducts;
  final List<Product> alsoViewedProducts;
}
