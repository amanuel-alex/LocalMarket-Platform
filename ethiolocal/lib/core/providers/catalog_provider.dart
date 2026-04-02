import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/api_config.dart';
import '../models/product.dart';
import '../models/product_detail_bundle.dart';
import 'api_providers.dart';

final productsProvider = FutureProvider<List<Product>>((ref) async {
  final api = ref.watch(localMarketApiProvider);
  return api.fetchRankedProducts(
    lat: ApiConfig.defaultLat,
    lng: ApiConfig.defaultLng,
    limit: 32,
  );
});

/// Full product detail: compare prices + related lists (GET /products/:id + /compare + /related).
final productDetailBundleProvider = FutureProvider.family<ProductDetailBundle, String>((ref, id) async {
  final api = ref.read(localMarketApiProvider);
  return api.fetchProductDetailBundle(id);
});

