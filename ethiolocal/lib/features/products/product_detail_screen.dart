import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/models/product.dart';
import '../../core/models/product_detail_bundle.dart';
import '../../core/providers/cart_provider.dart';
import '../../core/providers/catalog_provider.dart';
import '../../core/widgets/error_retry.dart';
import '../../core/widgets/gradient_cta.dart';
import '../../core/widgets/pressable_scale.dart';
import '../../core/widgets/section_header.dart';
import 'widgets/horizontal_product_strip.dart';

final _etb = NumberFormat.currency(symbol: 'Br ', decimalDigits: 0);

List<String> _bulletsFromDescription(String raw) {
  if (raw.trim().isEmpty) return ['No written description for this listing yet.'];
  final byBreak = raw.split(RegExp(r'[\n•]+')).map((e) => e.trim()).where((e) => e.length > 3).toList();
  if (byBreak.length >= 2) return byBreak.take(8).toList();
  final sentences = raw.split(RegExp(r'(?<=[.!?])\s+')).map((e) => e.trim()).where((e) => e.length > 6).toList();
  if (sentences.isNotEmpty) return sentences.take(8).toList();
  return [raw.trim()];
}

class ProductDetailScreen extends ConsumerWidget {
  const ProductDetailScreen({super.key, required this.productId});

  final String productId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(productDetailBundleProvider(productId));

    return async.when(
      loading: () => Scaffold(
        appBar: AppBar(title: const Text('Product')),
        body: const Center(child: CircularProgressIndicator.adaptive()),
      ),
      error: (e, _) => Scaffold(
        appBar: AppBar(title: const Text('Product')),
        body: ErrorRetryView(
          message: e.toString(),
          onRetry: () => ref.invalidate(productDetailBundleProvider(productId)),
        ),
      ),
      data: (bundle) => _ProductDetailBody(bundle: bundle),
    );
  }
}

class _ProductDetailBody extends ConsumerWidget {
  const _ProductDetailBody({required this.bundle});

  final ProductDetailBundle bundle;

  void _openProduct(BuildContext context, Product p) {
    context.push('/home/product/${p.id}');
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final product = bundle.product;
    final scheme = Theme.of(context).colorScheme;
    final bullets = _bulletsFromDescription(product.description);

    return Scaffold(
      extendBody: true,
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverAppBar(
            expandedHeight: 340,
            pinned: true,
            stretch: true,
            backgroundColor: scheme.surface,
            leading: IconButton.filledTonal(
              onPressed: () => context.pop(),
              icon: const Icon(Icons.arrow_back_rounded),
            ),
            actions: [
              IconButton.filledTonal(
                onPressed: () => context.push('/cart'),
                icon: const Icon(Icons.shopping_bag_outlined),
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              stretchModes: const [StretchMode.zoomBackground, StretchMode.blurBackground],
              background: Hero(
                tag: 'product-${product.id}-image',
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    CachedNetworkImage(
                      imageUrl: product.imageUrl,
                      fit: BoxFit.cover,
                      placeholder: (context, progress) => Container(color: scheme.surfaceContainerHighest),
                      errorWidget: (context, url, stackTrace) => Container(color: scheme.surfaceContainerHighest),
                    ),
                    DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [Colors.transparent, Colors.black.withValues(alpha: 0.45)],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Transform.translate(
              offset: const Offset(0, -20),
              child: Container(
                decoration: BoxDecoration(
                  color: Theme.of(context).scaffoldBackgroundColor,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                ),
                padding: const EdgeInsets.fromLTRB(22, 28, 22, 120),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (product.category.isNotEmpty)
                      Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: scheme.primary.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(99),
                        ),
                        child: Text(
                          product.category,
                          style: Theme.of(context).textTheme.labelMedium?.copyWith(
                                color: scheme.primary,
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                      ),
                    Text(
                      product.title,
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800, height: 1.15),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          _etb.format(product.priceEtb),
                          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                color: scheme.primary,
                                fontWeight: FontWeight.w900,
                              ),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          'incl. listing price',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(color: scheme.onSurface.withValues(alpha: 0.5)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 22),
                    _SellerLocationCard(product: product),
                    const SizedBox(height: 28),
                    _AboutExpandable(bullets: bullets),
                    const SizedBox(height: 28),
                    SectionHeader(
                      title: 'Top rated similar',
                      subtitle: 'From the same catalog signals as this item',
                      icon: Icons.auto_awesome_rounded,
                    ),
                    HorizontalProductStrip(
                      products: bundle.similarProducts,
                      onProductTap: (p) => _openProduct(context, p),
                    ),
                    const SizedBox(height: 20),
                    SectionHeader(
                      title: 'Customers also viewed',
                      subtitle: 'Other picks buyers browsed next',
                      icon: Icons.visibility_rounded,
                    ),
                    HorizontalProductStrip(
                      products: bundle.alsoViewedProducts,
                      onProductTap: (p) => _openProduct(context, p),
                    ),
                    if (product.comparePrices.isNotEmpty) ...[
                      const SizedBox(height: 24),
                      _CompareBlock(product: product),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Container(
          padding: const EdgeInsets.fromLTRB(20, 10, 20, 16),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.06),
                blurRadius: 20,
                offset: const Offset(0, -6),
              ),
            ],
          ),
          child: GradientCta(
            label: 'Buy now',
            icon: Icons.shopping_cart_checkout_rounded,
            onPressed: () {
              ref.read(cartProvider.notifier).add(product);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: const Text('Added to cart'),
                  behavior: SnackBarBehavior.floating,
                  action: SnackBarAction(label: 'Checkout', onPressed: () => context.push('/cart')),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

class _SellerLocationCard extends StatelessWidget {
  const _SellerLocationCard({required this.product});

  final Product product;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: LinearGradient(
          colors: [
            scheme.surfaceContainerHighest.withValues(alpha: 0.5),
            scheme.surfaceContainerHighest.withValues(alpha: 0.2),
          ],
        ),
        border: Border.all(color: scheme.outline.withValues(alpha: 0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 24,
                backgroundColor: scheme.primary.withValues(alpha: 0.15),
                child: Text(
                  product.sellerName.isNotEmpty ? product.sellerName[0].toUpperCase() : '?',
                  style: TextStyle(color: scheme.primary, fontWeight: FontWeight.w800),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(product.sellerName, style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(Icons.star_rounded, size: 18, color: Colors.amber.shade600),
                        const SizedBox(width: 4),
                        Text('${product.sellerRating.toStringAsFixed(1)} seller score', style: Theme.of(context).textTheme.labelLarge),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const Divider(height: 1),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(Icons.place_rounded, size: 20, color: scheme.primary),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  product.locationLabel,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: scheme.onSurface.withValues(alpha: 0.75)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _AboutExpandable extends StatefulWidget {
  const _AboutExpandable({required this.bullets});

  final List<String> bullets;

  @override
  State<_AboutExpandable> createState() => _AboutExpandableState();
}

class _AboutExpandableState extends State<_AboutExpandable> {
  var _expanded = true;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 220),
      curve: Curves.easeOutCubic,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: scheme.outline.withValues(alpha: 0.1)),
        color: scheme.surface,
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 18, offset: const Offset(0, 8)),
        ],
      ),
      child: Column(
        children: [
          InkWell(
            onTap: () => setState(() => _expanded = !_expanded),
            borderRadius: BorderRadius.vertical(top: const Radius.circular(20), bottom: Radius.circular(_expanded ? 0 : 20)),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
              child: Row(
                children: [
                  Icon(Icons.article_outlined, color: scheme.primary),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'About this item',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
                    ),
                  ),
                  AnimatedRotation(
                    turns: _expanded ? 0.5 : 0,
                    duration: const Duration(milliseconds: 220),
                    child: Icon(Icons.expand_more_rounded, color: scheme.onSurface.withValues(alpha: 0.5)),
                  ),
                ],
              ),
            ),
          ),
          AnimatedCrossFade(
            firstChild: const SizedBox(width: double.infinity),
            secondChild: Padding(
              padding: const EdgeInsets.fromLTRB(18, 0, 18, 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: widget.bullets
                    .map(
                      (line) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              margin: const EdgeInsets.only(top: 7),
                              width: 6,
                              height: 6,
                              decoration: BoxDecoration(color: scheme.primary, shape: BoxShape.circle),
                            ),
                            const SizedBox(width: 12),
                            Expanded(child: Text(line, style: Theme.of(context).textTheme.bodyMedium?.copyWith(height: 1.45))),
                          ],
                        ),
                      ),
                    )
                    .toList(),
              ),
            ),
            crossFadeState: _expanded ? CrossFadeState.showSecond : CrossFadeState.showFirst,
            duration: const Duration(milliseconds: 220),
          ),
        ],
      ),
    );
  }
}

class _CompareBlock extends StatelessWidget {
  const _CompareBlock({required this.product});

  final Product product;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final offers = product.comparePrices;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(
          title: 'Compare prices',
          subtitle: 'Other sellers in the same catalog group',
          icon: Icons.compare_arrows_rounded,
        ),
        ...offers.map(
          (o) => Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: PressableScale(
              onTap: () {},
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: scheme.outline.withValues(alpha: 0.1)),
                  color: scheme.surface,
                  boxShadow: [
                    BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 14, offset: const Offset(0, 6)),
                  ],
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(o.storeName, style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
                          const SizedBox(height: 4),
                          Text(
                            o.distanceKm > 0 ? '${o.distanceKm.toStringAsFixed(1)} km' : 'Same group',
                            style: Theme.of(context).textTheme.labelMedium?.copyWith(color: scheme.onSurface.withValues(alpha: 0.5)),
                          ),
                        ],
                      ),
                    ),
                    Text(_etb.format(o.priceEtb), style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
