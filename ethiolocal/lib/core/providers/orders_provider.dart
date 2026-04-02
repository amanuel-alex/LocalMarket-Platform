import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/api_exception.dart';
import '../models/auth_session.dart';
import '../models/order.dart';
import 'api_providers.dart';
import 'auth_session_provider.dart';

AuthSession? _readSession(Ref ref) => ref.read(authSessionProvider.notifier).session;

Future<List<ShopOrder>> _fetchOrdersWith401Refresh(Ref ref) async {
  ref.watch(authSessionProvider.notifier.select((n) => n.session));
  final api = ref.read(localMarketApiProvider);
  var auth = _readSession(ref);
  if (auth == null) return [];
  try {
    return await api.fetchOrders(auth.accessToken);
  } on ApiException catch (e) {
    if (e.statusCode != 401) rethrow;
    final ok = await ref.read(authSessionProvider.notifier).tryRefreshOrSignOut();
    if (!ok) return [];
    auth = _readSession(ref);
    if (auth == null) return [];
    return api.fetchOrders(auth.accessToken);
  }
}

Future<ShopOrder?> _fetchOrderWith401Refresh(Ref ref, String orderId) async {
  ref.watch(authSessionProvider.notifier.select((n) => n.session));
  final api = ref.read(localMarketApiProvider);
  var auth = _readSession(ref);
  if (auth == null) return null;
  try {
    return await api.fetchOrder(orderId, auth.accessToken);
  } on ApiException catch (e) {
    if (e.statusCode != 401) rethrow;
    final ok = await ref.read(authSessionProvider.notifier).tryRefreshOrSignOut();
    if (!ok) return null;
    auth = _readSession(ref);
    if (auth == null) return null;
    return api.fetchOrder(orderId, auth.accessToken);
  }
}

final ordersProvider = FutureProvider<List<ShopOrder>>((ref) => _fetchOrdersWith401Refresh(ref));

final orderDetailProvider = FutureProvider.family<ShopOrder?, String>(
  (ref, orderId) => _fetchOrderWith401Refresh(ref, orderId),
);
