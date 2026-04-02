import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../core/providers/orders_provider.dart';
import '../../core/widgets/error_retry.dart';
import '../../core/widgets/glass_card.dart';

class QrDeliveryScreen extends ConsumerWidget {
  const QrDeliveryScreen({super.key, required this.orderId});

  final String orderId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(orderDetailProvider(orderId));
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Delivery QR'),
        leading: IconButton(icon: const Icon(Icons.close_rounded), onPressed: () => context.pop()),
      ),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator.adaptive()),
        error: (e, _) => ErrorRetryView(
          message: e.toString(),
          onRetry: () => ref.invalidate(orderDetailProvider(orderId)),
        ),
        data: (order) {
          final payload = order?.pickupQrToken ?? order?.deliveryQrPayload ?? 'ETHIOLOCAL|$orderId';
          return LayoutBuilder(
            builder: (context, constraints) {
              return SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                child: ConstrainedBox(
                  constraints: BoxConstraints(minHeight: constraints.maxHeight - 40),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Delivery QR',
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'The seller scans this code to verify your order.',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                              color: scheme.onSurface.withValues(alpha: 0.65),
                              height: 1.45,
                            ),
                      ),
                      const SizedBox(height: 28),
                      _QrInstructionStep(number: 1, text: 'Keep brightness up so the code scans clearly.'),
                      const SizedBox(height: 10),
                      _QrInstructionStep(number: 2, text: 'Hand your phone to the seller or hold it steady.'),
                      const SizedBox(height: 10),
                      _QrInstructionStep(number: 3, text: 'Wait for confirmation before leaving.'),
                      const SizedBox(height: 32),
                      Center(
                        child: GlassCard(
                          padding: const EdgeInsets.all(24),
                          borderRadius: 28,
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(18),
                                decoration: BoxDecoration(
                                  color: Theme.of(context).brightness == Brightness.dark ? scheme.surface : Colors.white,
                                  borderRadius: BorderRadius.circular(22),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.08),
                                      blurRadius: 28,
                                      offset: const Offset(0, 14),
                                    ),
                                  ],
                                ),
                                child: QrImageView(
                                  data: payload,
                                  version: QrVersions.auto,
                                  size: 240,
                                  eyeStyle: QrEyeStyle(
                                    eyeShape: QrEyeShape.square,
                                    color: scheme.primary,
                                  ),
                                  dataModuleStyle: QrDataModuleStyle(
                                    dataModuleShape: QrDataModuleShape.square,
                                    color: scheme.onSurface.withValues(alpha: 0.9),
                                  ),
                                  gapless: true,
                                ),
                              ),
                              const SizedBox(height: 18),
                              Text(
                                'Order · ${orderId.length > 10 ? orderId.substring(orderId.length - 8) : orderId}',
                                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                                      color: scheme.onSurface.withValues(alpha: 0.55),
                                      letterSpacing: 0.2,
                                    ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 32),
                      FilledButton.tonalIcon(
                        onPressed: () => context.pop(),
                        icon: const Icon(Icons.check_circle_outline_rounded),
                        label: const Text('Done'),
                        style: FilledButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class _QrInstructionStep extends StatelessWidget {
  const _QrInstructionStep({required this.number, required this.text});

  final int number;
  final String text;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 28,
          height: 28,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: scheme.primary.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
            '$number',
            style: Theme.of(context).textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w800, color: scheme.primary),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: scheme.onSurface.withValues(alpha: 0.72),
                  height: 1.4,
                ),
          ),
        ),
      ],
    );
  }
}
