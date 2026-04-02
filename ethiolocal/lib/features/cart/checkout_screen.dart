import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/providers/cart_provider.dart';
import '../../core/providers/orders_provider.dart';
import '../../core/widgets/glass_card.dart';
import '../../core/widgets/gradient_cta.dart';

final _etb = NumberFormat.currency(symbol: 'Br ', decimalDigits: 0);

final _paymentProvider = StateProvider<String>((ref) => 'telebirr');

class CheckoutScreen extends ConsumerWidget {
  const CheckoutScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lines = ref.watch(cartProvider);
    final subtotal = lines.subtotal;
    const commissionRate = 0.03;
    const deliveryFlat = 85.0;
    final commission = subtotal * commissionRate;
    final total = subtotal + commission + deliveryFlat;
    final pay = ref.watch(_paymentProvider);

    if (lines.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Checkout')),
        body: Center(
          child: TextButton(onPressed: () => context.go('/home'), child: const Text('Back to shopping')),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Checkout'),
        leading: IconButton(icon: const Icon(Icons.arrow_back_rounded), onPressed: () => context.pop()),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 120),
        children: [
          Text('Order summary', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 12),
          GlassCard(
            padding: const EdgeInsets.all(18),
            child: Column(
              children: [
                ...lines.map(
                  (l) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Row(
                      children: [
                        Expanded(child: Text('${l.product.title} ×${l.qty}', maxLines: 2, overflow: TextOverflow.ellipsis)),
                        Text(_etb.format(l.product.priceEtb * l.qty)),
                      ],
                    ),
                  ),
                ),
                const Divider(height: 28),
                _PriceRow(label: 'Product total', value: _etb.format(subtotal)),
                const SizedBox(height: 8),
                _PriceRow(label: 'Platform commission (3%)', value: _etb.format(commission)),
                const SizedBox(height: 8),
                _PriceRow(label: 'Delivery estimate', value: _etb.format(deliveryFlat)),
                const Divider(height: 28),
                Row(
                  children: [
                    Text('Total', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
                    const Spacer(),
                    Text(
                      _etb.format(total),
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 28),
          Text('Pay with', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 12),
          _PayTile(
            title: 'Telebirr',
            subtitle: 'Instant wallet debit',
            icon: Icons.account_balance_wallet_rounded,
            selected: pay == 'telebirr',
            onTap: () => ref.read(_paymentProvider.notifier).state = 'telebirr',
          ),
          const SizedBox(height: 10),
          _PayTile(
            title: 'M-Pesa',
            subtitle: 'Safaricom mobile money',
            icon: Icons.phone_android_rounded,
            selected: pay == 'mpesa',
            onTap: () => ref.read(_paymentProvider.notifier).state = 'mpesa',
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
          child: GradientCta(
            label: 'Confirm & pay',
            icon: Icons.lock_rounded,
            onPressed: () {
              ref.read(ordersProvider.notifier).placeFromCart(lines);
              ref.read(cartProvider.notifier).clear();
              if (!context.mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Order placed — pending payment')),
              );
              context.go('/orders');
            },
          ),
        ),
      ),
    );
  }
}

class _PriceRow extends StatelessWidget {
  const _PriceRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.65),
                ),
          ),
        ),
        Text(value, style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600)),
      ],
    );
  }
}

class _PayTile extends StatelessWidget {
  const _PayTile({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.selected,
    required this.onTap,
  });
  final String title;
  final String subtitle;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Material(
      color: selected ? scheme.primary.withValues(alpha: 0.08) : scheme.surface,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: selected ? scheme.primary : scheme.outline.withValues(alpha: 0.12),
              width: selected ? 1.5 : 1,
            ),
          ),
          child: Row(
            children: [
              Icon(icon, color: scheme.primary),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
                    Text(subtitle, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: scheme.onSurface.withValues(alpha: 0.55))),
                  ],
                ),
              ),
              Icon(
                selected ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
                color: selected ? scheme.primary : scheme.onSurface.withValues(alpha: 0.35),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
