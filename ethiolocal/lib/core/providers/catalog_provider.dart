import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/mock_catalog.dart';
import '../models/product.dart';

final productsProvider = FutureProvider<List<Product>>((ref) async {
  await Future<void>.delayed(const Duration(milliseconds: 900));
  return mockProducts;
});

final productProvider = Provider.family<Product?, String>((ref, id) => productById(id));
