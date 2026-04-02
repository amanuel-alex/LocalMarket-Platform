enum OrderStatus { pending, paid, delivered, cancelled }

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
    this.pickupQrToken,
  });

  final String id;
  final List<OrderItem> items;
  final OrderStatus status;
  final DateTime createdAt;
  /// Shown in QR screen when [pickupQrToken] is null (fallback payload).
  final String deliveryQrPayload;
  /// Server-issued pickup token for buyer QR (when paid, not yet consumed).
  final String? pickupQrToken;

  double get subtotal => items.fold(0, (s, i) => s + i.unitPrice * i.qty);

  factory ShopOrder.fromApiJson(Map<String, dynamic> j) {
    final product = j['product'] as Map<String, dynamic>? ?? {};
    final statusStr = j['status'] as String? ?? 'pending';
    final id = j['id'] as String;
    final token = j['pickupQrToken'] as String?;
    return ShopOrder(
      id: id,
      items: [
        OrderItem(
          productId: product['id'] as String? ?? '',
          title: product['title'] as String? ?? 'Product',
          qty: (j['quantity'] as num?)?.toInt() ?? 1,
          unitPrice: (product['price'] as num?)?.toDouble() ?? 0,
        ),
      ],
      status: _mapStatus(statusStr),
      createdAt: DateTime.tryParse(j['createdAt'] as String? ?? '') ?? DateTime.now(),
      deliveryQrPayload: token ?? 'ETHIOLOCAL|$id|$statusStr',
      pickupQrToken: token,
    );
  }

  static OrderStatus _mapStatus(String s) {
    return switch (s) {
      'pending' => OrderStatus.pending,
      'paid' => OrderStatus.paid,
      'completed' => OrderStatus.delivered,
      'cancelled' => OrderStatus.cancelled,
      _ => OrderStatus.pending,
    };
  }
}
