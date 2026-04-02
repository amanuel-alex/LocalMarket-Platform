import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/models/order.dart';
import '../../core/providers/orders_provider.dart';
import '../../core/widgets/gradient_cta.dart';

final _etb = NumberFormat.currency(symbol: 'Br ', decimalDigits: 0);

class OrderDetailScreen extends ConsumerWidget {
  const OrderDetailScreen({super.key, required this.orderId});

  final String orderId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final order = ref.watch(orderProvider(orderId));
    if (order == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Order')),
        body: const Center(child: Text('Order not found')),
      );
    }

    final scheme = Theme.of(context).colorScheme;
    final statusLabel = switch (order.status) {
      OrderStatus.pending => 'Pending payment',
      OrderStatus.paid => 'Paid — awaiting delivery',
      OrderStatus.delivered => 'Delivered',
    };

    return Scaffold(
      appBar: AppBar(
        title: const Text('Order details'),
        leading: IconButton(icon: const Icon(Icons.arrow_back_rounded), onPressed: () => context.pop()),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(22),
              gradient: LinearGradient(
                colors: [
                  scheme.primary.withValues(alpha: 0.12),
                  scheme.primary.withValues(alpha: 0.04),
                ],
              ),
              border: Border.all(color: scheme.outline.withValues(alpha: 0.08)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(statusLabel, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
                const SizedBox(height: 6),
                Text(
                  'Placed ${DateFormat.yMMMd().add_jm().format(order.createdAt)}',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(color: scheme.onSurface.withValues(alpha: 0.6)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Text('Items', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 12),
          ...order.items.map(
            (it) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                children: [
                  Expanded(child: Text(it.title, style: Theme.of(context).textTheme.bodyLarge)),
                  Text('×${it.qty}'),
                  const SizedBox(width: 12),
                  Text(_etb.format(it.unitPrice * it.qty), style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
                ],
              ),
            ),
          ),
          const Divider(height: 32),
          Row(
            children: [
              Text('Subtotal', style: Theme.of(context).textTheme.bodyLarge),
              const Spacer(),
              Text(_etb.format(order.subtotal), style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
            ],
          ),
          const SizedBox(height: 24),
          if (order.status != OrderStatus.delivered)
            GradientCta(
              label: 'Show delivery QR',
              icon: Icons.qr_code_2_rounded,
              onPressed: () => context.push('/qr/${order.id}'),
            ),
        ],
      ),
    );
  }
}
