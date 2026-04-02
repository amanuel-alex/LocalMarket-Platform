import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../core/models/product.dart';
import '../../../core/widgets/pressable_scale.dart';

final _etb = NumberFormat.currency(symbol: 'Br ', decimalDigits: 0);

class AiChatBubble extends StatelessWidget {
  const AiChatBubble({super.key, required this.text, required this.fromUser});

  final String text;
  final bool fromUser;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Align(
      alignment: fromUser ? Alignment.centerRight : Alignment.centerLeft,
      child: TweenAnimationBuilder<double>(
        tween: Tween(begin: 0, end: 1),
        duration: const Duration(milliseconds: 260),
        curve: Curves.easeOutCubic,
        builder: (context, v, child) => Opacity(
          opacity: v,
          child: Transform.translate(offset: Offset(0, 8 * (1 - v)), child: child),
        ),
        child: Container(
          margin: const EdgeInsets.only(bottom: 14),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.84),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.only(
              topLeft: const Radius.circular(22),
              topRight: const Radius.circular(22),
              bottomLeft: Radius.circular(fromUser ? 22 : 5),
              bottomRight: Radius.circular(fromUser ? 5 : 22),
            ),
            gradient: fromUser
                ? LinearGradient(colors: [scheme.primary, scheme.primary.withValues(alpha: 0.88)])
                : null,
            color: fromUser ? null : scheme.surfaceContainerHighest.withValues(alpha: 0.72),
            border: Border.all(
              color: fromUser
                  ? Colors.transparent
                  : scheme.outline.withValues(alpha: Theme.of(context).brightness == Brightness.dark ? 0.35 : 0.12),
            ),
            boxShadow: [
              if (!fromUser)
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 12,
                  offset: const Offset(0, 6),
                ),
            ],
          ),
          child: Text(
            text,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: fromUser ? Colors.white : scheme.onSurface,
                  height: 1.45,
                  fontWeight: fromUser ? null : FontWeight.w500,
                ),
          ),
        ),
      ),
    );
  }
}

class AiTypingIndicator extends StatefulWidget {
  const AiTypingIndicator({super.key});

  @override
  State<AiTypingIndicator> createState() => _AiTypingIndicatorState();
}

class _AiTypingIndicatorState extends State<AiTypingIndicator> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 1100))..repeat();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        decoration: BoxDecoration(
          color: scheme.surfaceContainerHighest.withValues(alpha: 0.72),
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: scheme.outline.withValues(alpha: 0.06)),
        ),
        child: AnimatedBuilder(
          animation: _c,
          builder: (context, child) {
            final t = _c.value;
            return Row(
              mainAxisSize: MainAxisSize.min,
              children: List.generate(3, (i) {
                final phase = (t + i * 0.18) % 1.0;
                final y = (phase < 0.5 ? phase * 2 : 2 - phase * 2) * 4.0;
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 3),
                  child: Transform.translate(
                    offset: Offset(0, -y),
                    child: Container(
                      width: 7,
                      height: 7,
                      decoration: BoxDecoration(
                        color: scheme.primary.withValues(alpha: 0.35 + 0.45 * phase),
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                );
              }),
            );
          },
        ),
      ),
    );
  }
}

class AiChatProductCard extends StatelessWidget {
  const AiChatProductCard({super.key, required this.product, required this.onOpen});

  final Product product;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: PressableScale(
        onTap: onOpen,
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            color: scheme.surface,
            border: Border.all(color: scheme.outline.withValues(alpha: 0.1)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.06),
                blurRadius: 18,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: Row(
            children: [
              SizedBox(
                width: 100,
                height: 100,
                child: CachedNetworkImage(imageUrl: product.imageUrl, fit: BoxFit.cover),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        product.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Text(
                            _etb.format(product.priceEtb),
                            style: Theme.of(context).textTheme.titleSmall?.copyWith(color: scheme.primary, fontWeight: FontWeight.w900),
                          ),
                          const Spacer(),
                          Icon(Icons.star_rounded, size: 16, color: Colors.amber.shade600),
                          Text(product.sellerRating.toStringAsFixed(1), style: Theme.of(context).textTheme.labelMedium),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${product.distanceKm.toStringAsFixed(1)} km · ${product.sellerName}',
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(color: scheme.onSurface.withValues(alpha: 0.5)),
                      ),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(right: 10),
                child: Icon(Icons.chevron_right_rounded, color: scheme.onSurface.withValues(alpha: 0.35)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class AiChatComposer extends StatelessWidget {
  const AiChatComposer({super.key, required this.controller, required this.focus, required this.onSend});

  final TextEditingController controller;
  final FocusNode focus;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final bottom = MediaQuery.paddingOf(context).bottom;
    return Material(
      elevation: 12,
      shadowColor: Colors.black26,
      color: Theme.of(context).scaffoldBackgroundColor,
      child: Padding(
        padding: EdgeInsets.fromLTRB(16, 12, 16, bottom + 12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(24),
                  color: scheme.surfaceContainerHighest.withValues(alpha: 0.55),
                  border: Border.all(color: scheme.outline.withValues(alpha: 0.08)),
                ),
                child: TextField(
                  controller: controller,
                  focusNode: focus,
                  minLines: 1,
                  maxLines: 5,
                  textInputAction: TextInputAction.send,
                  onSubmitted: (_) => onSend(),
                  style: TextStyle(color: scheme.onSurface, fontSize: 16),
                  cursorColor: scheme.primary,
                  decoration: InputDecoration(
                    hintText: 'Ask EthioLocal…',
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                    hintStyle: TextStyle(color: scheme.onSurfaceVariant, fontSize: 16),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            FilledButton(
              onPressed: onSend,
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.all(16),
                shape: const CircleBorder(),
              ),
              child: const Icon(Icons.send_rounded, size: 22),
            ),
          ],
        ),
      ),
    );
  }
}
