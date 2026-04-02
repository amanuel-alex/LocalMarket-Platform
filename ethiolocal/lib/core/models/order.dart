enum OrderStatus { pending, paid, delivered }

class OrderItem {
  const OrderItem({required this.productId, required this.title, required this.qty, required this.unitPrice});

  final String productId;
  final String title;
  final int qty;
  final double unitPrice;
}

class ShopOrder {
  const ShopOrder({
    required this.id,
    required this.items,
    required this.status,
    required this.createdAt,
    required this.deliveryQrPayload,
  });

  final String id;
  final List<OrderItem> items;
  final OrderStatus status;
  final DateTime createdAt;
  final String deliveryQrPayload;

  double get subtotal => items.fold(0, (s, i) => s + i.unitPrice * i.qty);
}
