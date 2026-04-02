import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/api/api_exception.dart';
import '../../core/config/api_config.dart';
import '../../core/models/product.dart';
import '../../core/providers/api_providers.dart';
import '../../core/widgets/pressable_scale.dart';

final _etb = NumberFormat.currency(symbol: 'Br ', decimalDigits: 0);

sealed class _Msg {
  const _Msg();
}

class _TextMsg extends _Msg {
  const _TextMsg({required this.text, required this.fromUser});
  final String text;
  final bool fromUser;
}

class _ProductMsg extends _Msg {
  const _ProductMsg({required this.product});
  final Product product;
}

class AiAssistantScreen extends ConsumerStatefulWidget {
  const AiAssistantScreen({super.key});

  @override
  ConsumerState<AiAssistantScreen> createState() => _AiAssistantScreenState();
}

class _AiAssistantScreenState extends ConsumerState<AiAssistantScreen> {
  final _scroll = ScrollController();
  final _input = TextEditingController();
  final _focus = FocusNode();
  var _typing = false;
  final _messages = <_Msg>[
    const _TextMsg(
      text:
          'Hi — I query your live LocalMarket catalog (POST /assistant/chat). Try “cheap”, “near me”, “best coffee”, or a category name.',
      fromUser: false,
    ),
  ];

  @override
  void dispose() {
    _scroll.dispose();
    _input.dispose();
    _focus.dispose();
    super.dispose();
  }

  void _scrollBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scroll.hasClients) return;
      _scroll.animateTo(
        _scroll.position.maxScrollExtent + 80,
        duration: const Duration(milliseconds: 420),
        curve: Curves.easeOutCubic,
      );
    });
  }

  Future<void> _send() async {
    final t = _input.text.trim();
    if (t.isEmpty) return;
    setState(() {
      _messages.add(_TextMsg(text: t, fromUser: true));
      _input.clear();
      _typing = true;
    });
    _scrollBottom();
    try {
      final api = ref.read(localMarketApiProvider);
      final res = await api.assistantChat(
        message: t,
        lat: ApiConfig.defaultLat,
        lng: ApiConfig.defaultLng,
      );
      if (!mounted) return;
      final productsRaw = res['products'] as List<dynamic>? ?? [];
      final products = productsRaw
          .map((e) => Product.fromCatalogJson(e as Map<String, dynamic>))
          .toList();
      final intents = res['intents'] as Map<String, dynamic>?;
      final mode = res['assistantMode'] as String? ?? 'rules';

      var text = products.isEmpty
          ? 'No listings matched. Try real category names from your database, or keywords like “cheap”, “near me”, “best”.'
          : 'Found ${products.length} listing${products.length == 1 ? '' : 's'}${mode == 'hybrid_ranking' ? ' (smart-ranked)' : ''}. Tap a card for details.';
      if (intents?['nearbyMissingCoordinates'] == true) {
        text += ' (Nearby intent needs lat/lng — using app defaults.)';
      }

      setState(() {
        _typing = false;
        _messages.add(_TextMsg(text: text, fromUser: false));
        for (final p in products.take(8)) {
          _messages.add(_ProductMsg(product: p));
        }
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _typing = false;
        _messages.add(_TextMsg(text: e.message, fromUser: false));
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _typing = false;
        _messages.add(_TextMsg(text: e.toString(), fromUser: false));
      });
    }
    _scrollBottom();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('EthioLocal AI', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
            Text('Contextual shopping', style: Theme.of(context).textTheme.labelSmall?.copyWith(color: scheme.onSurface.withValues(alpha: 0.55))),
          ],
        ),
        leading: IconButton(icon: const Icon(Icons.arrow_back_rounded), onPressed: () => context.pop()),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scroll,
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              itemCount: _messages.length + (_typing ? 1 : 0),
              itemBuilder: (context, i) {
                if (_typing && i == _messages.length) {
                  return const Padding(
                    padding: EdgeInsets.only(bottom: 14),
                    child: _TypingBubble(),
                  );
                }
                final m = _messages[i];
                return switch (m) {
                  _TextMsg(:final text, :final fromUser) => _ChatBubble(text: text, fromUser: fromUser),
                  _ProductMsg(:final product) => _InlineProductCard(
                      product: product,
                      onOpen: () => context.push('/home/product/${product.id}'),
                    ),
                };
              },
            ),
          ),
          _Composer(controller: _input, focus: _focus, onSend: _send),
        ],
      ),
    );
  }
}

class _ChatBubble extends StatelessWidget {
  const _ChatBubble({required this.text, required this.fromUser});

  final String text;
  final bool fromUser;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Align(
      alignment: fromUser ? Alignment.centerRight : Alignment.centerLeft,
      child: TweenAnimationBuilder<double>(
        tween: Tween(begin: 0, end: 1),
        duration: const Duration(milliseconds: 280),
        curve: Curves.easeOutCubic,
        builder: (context, v, child) => Opacity(
          opacity: v,
          child: Transform.translate(offset: Offset(0, 10 * (1 - v)), child: child),
        ),
        child: Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.82),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.only(
              topLeft: const Radius.circular(20),
              topRight: const Radius.circular(20),
              bottomLeft: Radius.circular(fromUser ? 20 : 6),
              bottomRight: Radius.circular(fromUser ? 6 : 20),
            ),
            gradient: fromUser
                ? LinearGradient(colors: [scheme.primary, scheme.primary.withValues(alpha: 0.85)])
                : null,
            color: fromUser ? null : scheme.surfaceContainerHighest.withValues(alpha: 0.65),
            boxShadow: [
              if (!fromUser)
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
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
                ),
          ),
        ),
      ),
    );
  }
}

class _TypingBubble extends StatefulWidget {
  const _TypingBubble();

  @override
  State<_TypingBubble> createState() => _TypingBubbleState();
}

class _TypingBubbleState extends State<_TypingBubble> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))..repeat();

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
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
        decoration: BoxDecoration(
          color: scheme.surfaceContainerHighest.withValues(alpha: 0.65),
          borderRadius: BorderRadius.circular(20),
        ),
        child: AnimatedBuilder(
          animation: _c,
          builder: (context, child) {
            final t = _c.value;
            return Row(
              mainAxisSize: MainAxisSize.min,
              children: List.generate(3, (i) {
                final phase = (t + i * 0.2) % 1.0;
                final y = (phase < 0.5 ? phase * 2 : 2 - phase * 2) * 4;
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

class _InlineProductCard extends StatelessWidget {
  const _InlineProductCard({required this.product, required this.onOpen});

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
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: Row(
            children: [
              SizedBox(
                width: 96,
                height: 96,
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
                      Text(
                        _etb.format(product.priceEtb),
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(color: scheme.primary, fontWeight: FontWeight.w900),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${product.distanceKm.toStringAsFixed(1)} km · ${product.sellerName}',
                        style: Theme.of(context).textTheme.labelMedium?.copyWith(color: scheme.onSurface.withValues(alpha: 0.55)),
                      ),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(right: 12),
                child: Icon(Icons.chevron_right_rounded, color: scheme.onSurface.withValues(alpha: 0.35)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Composer extends StatelessWidget {
  const _Composer({required this.controller, required this.focus, required this.onSend});

  final TextEditingController controller;
  final FocusNode focus;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final bottom = MediaQuery.paddingOf(context).bottom;
    return Material(
      elevation: 8,
      shadowColor: Colors.black26,
      color: Theme.of(context).scaffoldBackgroundColor,
      child: Padding(
        padding: EdgeInsets.fromLTRB(16, 10, 16, bottom + 12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(22),
                  color: scheme.surfaceContainerHighest.withValues(alpha: 0.55),
                  border: Border.all(color: scheme.outline.withValues(alpha: 0.08)),
                ),
                child: TextField(
                  controller: controller,
                  focusNode: focus,
                  minLines: 1,
                  maxLines: 4,
                  textInputAction: TextInputAction.send,
                  onSubmitted: (_) => onSend(),
                  decoration: const InputDecoration(
                    hintText: 'Ask anything…',
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(horizontal: 18, vertical: 14),
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
