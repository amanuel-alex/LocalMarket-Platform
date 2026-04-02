import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/api_config.dart';
import '../models/product.dart';
import 'api_providers.dart';

final productsProvider = FutureProvider<List<Product>>((ref) async {
  final api = ref.watch(localMarketApiProvider);
  return api.fetchRankedProducts(
    lat: ApiConfig.defaultLat,
    lng: ApiConfig.defaultLng,
    limit: 32,
  );
});

final productWithCompareProvider = FutureProvider.family<Product, String>((ref, id) async {
  final api = ref.read(localMarketApiProvider);
  final product = await api.fetchProduct(id);
  final compare = await api.fetchCompare(id);
  return product.copyWith(comparePrices: compare);
});
