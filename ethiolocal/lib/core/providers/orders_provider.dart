import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/order.dart';
import 'cart_provider.dart';

class OrdersNotifier extends Notifier<List<ShopOrder>> {
  @override
  List<ShopOrder> build() => [
        ShopOrder(
          id: 'ord_demo_1',
          items: const [
            OrderItem(productId: 'p1', title: 'Yirgacheffe Coffee — 500g', qty: 1, unitPrice: 890),
          ],
          status: OrderStatus.delivered,
          createdAt: DateTime.now().subtract(const Duration(days: 5)),
          deliveryQrPayload: 'ETHIOLOCAL|ord_demo_1|DELIVERED',
        ),
        ShopOrder(
          id: 'ord_demo_2',
          items: const [
            OrderItem(productId: 'p2', title: 'Teff Flour — 2kg', qty: 2, unitPrice: 320),
          ],
          status: OrderStatus.paid,
          createdAt: DateTime.now().subtract(const Duration(hours: 6)),
          deliveryQrPayload: 'ETHIOLOCAL|ord_demo_2|PAID',
        ),
      ];

  void placeFromCart(List<CartLine> lines) {
    if (lines.isEmpty) return;
    final id = 'ord_${DateTime.now().millisecondsSinceEpoch}';
    final items = lines
        .map(
          (l) => OrderItem(
            productId: l.product.id,
            title: l.product.title,
            qty: l.qty,
            unitPrice: l.product.priceEtb,
          ),
        )
        .toList();
    final order = ShopOrder(
      id: id,
      items: items,
      status: OrderStatus.pending,
      createdAt: DateTime.now(),
      deliveryQrPayload: 'ETHIOLOCAL|$id|PENDING',
    );
    state = [order, ...state];
  }
}

final ordersProvider = NotifierProvider<OrdersNotifier, List<ShopOrder>>(OrdersNotifier.new);

final orderProvider = Provider.family<ShopOrder?, String>((ref, id) {
  final list = ref.watch(ordersProvider);
  try {
    return list.firstWhere((o) => o.id == id);
  } catch (_) {
    return null;
  }
});
