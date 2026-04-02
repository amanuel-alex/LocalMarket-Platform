import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/api_exception.dart';
import '../../core/config/api_config.dart';
import '../../core/models/product.dart';
import '../../core/providers/api_providers.dart';
import '../../core/providers/assistant_provider.dart';
import 'widgets/ai_chat_widgets.dart';
import 'widgets/assistant_setup_banner.dart';

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
  var _setupBannerDismissed = false;
  final _messages = <_Msg>[
    const _TextMsg(
      text:
          'Hi — ask in plain language and I’ll search your live EthioLocal catalog. Try “cheap”, “near me”, “best coffee”, or a category name.',
      fromUser: false,
    ),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      ref.invalidate(assistantGeminiEnabledProvider);
    });
  }

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

  List<Map<String, dynamic>> _geminiHistoryBeforeSend() {
    final list = <Map<String, dynamic>>[];
    var skippedWelcome = false;
    for (final m in _messages) {
      if (m is! _TextMsg) continue;
      // Gemini chat history should start with a user turn; skip the static welcome bubble.
      if (!skippedWelcome && !m.fromUser) {
        skippedWelcome = true;
        continue;
      }
      skippedWelcome = true;
      list.add({
        'role': m.fromUser ? 'user' : 'assistant',
        'content': m.text,
      });
    }
    return list;
  }

  Future<void> _send() async {
    final t = _input.text.trim();
    if (t.isEmpty) return;
    final historyForGemini = _geminiHistoryBeforeSend();
    setState(() {
      _messages.add(_TextMsg(text: t, fromUser: true));
      _input.clear();
      _typing = true;
    });
    _scrollBottom();
    try {
      final api = ref.read(localMarketApiProvider);
      final useGemini = await ref.read(assistantGeminiEnabledProvider.future);

      if (useGemini) {
        final res = await api.assistantGeminiChat(
          message: t,
          history: historyForGemini,
          lat: ApiConfig.defaultLat,
          lng: ApiConfig.defaultLng,
        );
        if (!mounted) return;
        final reply = (res['reply'] as String?)?.trim() ?? '';
        final productsRaw = res['products'] as List<dynamic>? ?? [];
        final products = productsRaw
            .map((e) => Product.fromCatalogJson(e as Map<String, dynamic>))
            .toList();

        setState(() {
          _typing = false;
          if (reply.isNotEmpty) {
            _messages.add(_TextMsg(text: reply, fromUser: false));
          }
          for (final p in products.take(8)) {
            _messages.add(_ProductMsg(product: p));
          }
          if (reply.isEmpty && products.isEmpty) {
            _messages.add(
              const _TextMsg(
                text: 'I could not generate a reply. Try rephrasing or use a product search keyword.',
                fromUser: false,
              ),
            );
          }
        });
        _scrollBottom();
        return;
      }

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
    final geminiAsync = ref.watch(assistantGeminiEnabledProvider);
    final subtitle = geminiAsync.when(
      data: (on) => on ? 'Google Gemini + live catalog' : 'Rules engine + live catalog',
      loading: () => 'Checking assistant mode…',
      error: (_, _) => 'Live catalog',
    );

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('EthioLocal AI', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
            Text(subtitle, style: Theme.of(context).textTheme.labelSmall?.copyWith(color: scheme.onSurface.withValues(alpha: 0.55))),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Refresh Gemini status',
            onPressed: () {
              setState(() => _setupBannerDismissed = false);
              ref.invalidate(assistantGeminiEnabledProvider);
            },
            icon: const Icon(Icons.sync_rounded),
          ),
        ],
        leading: IconButton(icon: const Icon(Icons.arrow_back_rounded), onPressed: () => context.pop()),
      ),
      body: Column(
        children: [
          if (!_setupBannerDismissed)
            geminiAsync.maybeWhen(
              data: (enabled) {
                if (enabled) return const SizedBox.shrink();
                return AssistantSetupBanner(
                  onDismiss: () => setState(() => _setupBannerDismissed = true),
                );
              },
              error: (error, stackTrace) => AssistantSetupBanner(
                isReachabilityIssue: true,
                onDismiss: () => setState(() => _setupBannerDismissed = true),
              ),
              orElse: () => const SizedBox.shrink(),
            ),
          Expanded(
            child: ListView.builder(
              controller: _scroll,
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              itemCount: _messages.length + (_typing ? 1 : 0),
              itemBuilder: (context, i) {
                if (_typing && i == _messages.length) {
                  return const AiTypingIndicator();
                }
                final m = _messages[i];
                return switch (m) {
                  _TextMsg(:final text, :final fromUser) => AiChatBubble(text: text, fromUser: fromUser),
                  _ProductMsg(:final product) => AiChatProductCard(
                      product: product,
                      onOpen: () => context.push('/home/product/${product.id}'),
                    ),
                };
              },
            ),
          ),
          AiChatComposer(controller: _input, focus: _focus, onSend: _send),
        ],
      ),
    );
  }
}
