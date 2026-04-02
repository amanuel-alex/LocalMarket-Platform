import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/config/order_fees.dart';
import '../../core/providers/cart_provider.dart';
import '../../core/widgets/empty_state.dart';
import '../../core/widgets/glass_card.dart';
import '../../core/widgets/gradient_cta.dart';

final _etb = NumberFormat.currency(symbol: 'Br ', decimalDigits: 0);

class CartScreen extends ConsumerWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lines = ref.watch(cartProvider);
    final subtotal = lines.subtotal;
    final fee = platformFeeEtb(subtotal);
    final estTotal = estimatedOrderTotalEtb(subtotal);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Your cart'),
        leading: IconButton(icon: const Icon(Icons.close_rounded), onPressed: () => context.pop()),
      ),
      body: lines.isEmpty
          ? EthioEmptyState(
              title: 'Your cart is ready',
              subtitle: 'Browse trending near you and tap “Add to cart” to fill this space.',
              icon: Icons.shopping_bag_outlined,
              actionLabel: 'Discover',
              onAction: () {
                context.pop();
                context.go('/home');
              },
            )
          : Column(
              children: [
                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.all(20),
                    itemCount: lines.length,
                    separatorBuilder: (context, unusedIndex) => const SizedBox(height: 12),
                    itemBuilder: (context, i) {
                      final line = lines[i];
                      final p = line.product;
                      return Dismissible(
                        key: ValueKey(p.id),
                        direction: DismissDirection.endToStart,
                        background: Container(
                          alignment: Alignment.centerRight,
                          padding: const EdgeInsets.only(right: 20),
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.errorContainer,
                            borderRadius: BorderRadius.circular(18),
                          ),
                          child: Icon(Icons.delete_outline_rounded, color: Theme.of(context).colorScheme.error),
                        ),
                        onDismissed: (_) => ref.read(cartProvider.notifier).remove(p.id),
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(18),
                            color: Theme.of(context).colorScheme.surface,
                            border: Border.all(color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.08)),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.05),
                                blurRadius: 16,
                                offset: const Offset(0, 8),
                              ),
                            ],
                          ),
                          child: Row(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(14),
                                child: SizedBox(
                                  width: 72,
                                  height: 72,
                                  child: CachedNetworkImage(imageUrl: p.imageUrl, fit: BoxFit.cover),
                                ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      p.title,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
                                    ),
                                    const SizedBox(height: 6),
                                    Text('Qty ${line.qty}', style: Theme.of(context).textTheme.labelMedium),
                                    const SizedBox(height: 4),
                                    Text(
                                      _etb.format(p.priceEtb * line.qty),
                                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                            color: Theme.of(context).colorScheme.primary,
                                            fontWeight: FontWeight.w800,
                                          ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      GlassCard(
                        padding: const EdgeInsets.all(18),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Price breakdown', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800)),
                            const SizedBox(height: 12),
                            _CartPriceRow(label: 'Products', value: _etb.format(subtotal)),
                            const SizedBox(height: 8),
                            _CartPriceRow(
                              label: 'Platform fee (${(kPlatformFeeRate * 100).toStringAsFixed(0)}%)',
                              value: _etb.format(fee),
                            ),
                            const SizedBox(height: 8),
                            _CartPriceRow(label: 'Delivery (est.)', value: _etb.format(kDeliveryEstimateEtb)),
                            const Divider(height: 22),
                            Row(
                              children: [
                                Text('Estimated total', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800)),
                                const Spacer(),
                                Text(
                                  _etb.format(estTotal),
                                  style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Final amounts are confirmed at checkout and payment.',
                              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                    color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                                  ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),
                      GradientCta(
                        label: 'Continue to checkout',
                        icon: Icons.payments_rounded,
                        onPressed: () => context.push('/checkout'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}

class _CartPriceRow extends StatelessWidget {
  const _CartPriceRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Row(
      children: [
        Expanded(
          child: Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: scheme.onSurface.withValues(alpha: 0.65)),
          ),
        ),
        Text(value, style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600)),
      ],
    );
  }
}
