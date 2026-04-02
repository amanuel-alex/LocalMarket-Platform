import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/product.dart';

class CartLine {
  const CartLine({required this.product, required this.qty});

  final Product product;
  final int qty;
}

class CartNotifier extends Notifier<List<CartLine>> {
  @override
  List<CartLine> build() => [];

  void add(Product p, {int qty = 1}) {
    final i = state.indexWhere((l) => l.product.id == p.id);
    if (i >= 0) {
      final copy = [...state];
      final line = copy[i];
      copy[i] = CartLine(product: line.product, qty: line.qty + qty);
      state = copy;
    } else {
      state = [...state, CartLine(product: p, qty: qty)];
    }
  }

  void remove(String productId) {
    state = state.where((l) => l.product.id != productId).toList();
  }

  void clear() => state = [];
}

final cartProvider = NotifierProvider<CartNotifier, List<CartLine>>(CartNotifier.new);

extension CartTotals on List<CartLine> {
  double get subtotal => fold(0, (s, l) => s + l.product.priceEtb * l.qty);
}
