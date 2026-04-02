import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/order.dart';
import 'api_providers.dart';
import 'auth_session_provider.dart';

final ordersProvider = FutureProvider<List<ShopOrder>>((ref) async {
  final auth = ref.watch(authSessionProvider);
  if (auth == null) return [];
  return ref.read(localMarketApiProvider).fetchOrders(auth.accessToken);
});

final orderDetailProvider = FutureProvider.family<ShopOrder?, String>((ref, orderId) async {
  final auth = ref.watch(authSessionProvider);
  if (auth == null) return null;
  return ref.read(localMarketApiProvider).fetchOrder(orderId, auth.accessToken);
});
