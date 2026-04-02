import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/api_exception.dart';
import '../../core/config/api_config.dart';
import '../../core/providers/api_providers.dart';
import '../../core/providers/auth_session_provider.dart';
import '../../core/providers/cart_provider.dart';
import '../../core/providers/catalog_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/empty_state.dart';
import '../../core/widgets/error_retry.dart';
import '../../core/widgets/product_card.dart';
import '../../core/widgets/section_header.dart';
import '../../core/widgets/skeletons.dart';

class _Category {
  const _Category(this.label, this.icon);
  final String label;
  final IconData icon;
}

const _categories = [
  _Category('Fresh', Icons.eco_rounded),
  _Category('Pantry', Icons.kitchen_rounded),
  _Category('Craft', Icons.brush_rounded),
  _Category('Beauty', Icons.spa_rounded),
  _Category('Deals', Icons.local_offer_rounded),
];

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _refresh() async {
    ref.invalidate(productsProvider);
    await ref.read(productsProvider.future);
  }

  Future<void> _searchCatalog(String raw) async {
    final q = raw.trim();
    if (q.isEmpty) return;
    FocusScope.of(context).unfocus();
    try {
      final api = ref.read(localMarketApiProvider);
      final list = await api.searchProducts(q: q, limit: 40);
      if (!mounted) return;
      await showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        showDragHandle: true,
        backgroundColor: Theme.of(context).colorScheme.surface,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        builder: (ctx) {
          return DraggableScrollableSheet(
            expand: false,
            initialChildSize: 0.58,
            minChildSize: 0.35,
            maxChildSize: 0.94,
            builder: (_, scrollController) {
              if (list.isEmpty) {
                return Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Text('No results for “$q”', textAlign: TextAlign.center),
                  ),
                );
              }
              return ListView.separated(
                controller: scrollController,
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
                itemCount: list.length,
                separatorBuilder: (_, unusedIndex) => const SizedBox(height: 4),
                itemBuilder: (_, i) {
                  final p = list[i];
                  return ListTile(
                    contentPadding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    title: Text(p.title, maxLines: 2, overflow: TextOverflow.ellipsis),
                    subtitle: Text('Br ${p.priceEtb.toStringAsFixed(0)} · ${p.sellerRating.toStringAsFixed(1)} ★'),
                    onTap: () {
                      Navigator.pop(ctx);
                      context.push('/home/product/${p.id}');
                    },
                  );
                },
              );
            },
          );
        },
      );
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final asyncProducts = ref.watch(productsProvider);
    final cart = ref.watch(cartProvider);
    final cartQty = cart.fold<int>(0, (s, l) => s + l.qty);
    final auth = ref.watch(authSessionProvider);
    final greet = auth?.userName.split(' ').first ?? 'there';

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        elevation: 6,
        onPressed: () => context.push('/ai'),
        icon: const Icon(Icons.auto_awesome_rounded),
        label: const Text('Ask AI'),
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _refresh,
          edgeOffset: 24,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Hi, $greet 👋',
                                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800, letterSpacing: -0.3),
                                ),
                                const SizedBox(height: 6),
                                Row(
                                  children: [
                                    Icon(Icons.near_me_rounded, size: 17, color: scheme.primary),
                                    const SizedBox(width: 6),
                                    Expanded(
                                      child: Text(
                                        'Curated near ${ApiConfig.defaultLat.toStringAsFixed(2)}°, ${ApiConfig.defaultLng.toStringAsFixed(2)}°',
                                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                              color: scheme.onSurface.withValues(alpha: 0.62),
                                            ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          Material(
                            color: scheme.surfaceContainerHighest.withValues(alpha: 0.6),
                            borderRadius: BorderRadius.circular(16),
                            child: InkWell(
                              borderRadius: BorderRadius.circular(16),
                              onTap: () => context.push('/cart'),
                              child: Padding(
                                padding: const EdgeInsets.all(12),
                                child: Badge(
                                  isLabelVisible: cartQty > 0,
                                  label: Text('$cartQty'),
                                  child: Icon(Icons.shopping_bag_outlined, color: scheme.onSurface),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      TextField(
                        controller: _searchCtrl,
                        textInputAction: TextInputAction.search,
                        onSubmitted: _searchCatalog,
                        decoration: InputDecoration(
                          hintText: 'Search products, categories…',
                          prefixIcon: Icon(Icons.search_rounded, color: scheme.primary.withValues(alpha: 0.85)),
                          suffixIcon: IconButton(
                            icon: const Icon(Icons.tune_rounded),
                            onPressed: () => _searchCatalog(_searchCtrl.text),
                          ),
                          filled: true,
                          fillColor: scheme.surface,
                          contentPadding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: 16)),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: SectionHeader(
                    title: 'Browse',
                    subtitle: 'Quick filters — tap a vibe',
                    icon: Icons.grid_view_rounded,
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 108,
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    scrollDirection: Axis.horizontal,
                    itemCount: _categories.length,
                    separatorBuilder: (_, unusedIndex) => const SizedBox(width: 12),
                    itemBuilder: (context, i) {
                      final c = _categories[i];
                      return TweenAnimationBuilder<double>(
                        tween: Tween(begin: 0, end: 1),
                        duration: Duration(milliseconds: 260 + i * 35),
                        curve: Curves.easeOutCubic,
                        builder: (context, v, child) => Opacity(
                          opacity: v,
                          child: Transform.translate(offset: Offset(0, 6 * (1 - v)), child: child),
                        ),
                        child: _CategoryChip(label: c.label, icon: c.icon),
                      );
                    },
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
                sliver: SliverToBoxAdapter(
                  child: SectionHeader(
                    title: 'Trending near you',
                    subtitle: 'Ranked by price, distance, trust & popularity',
                    actionLabel: 'Refresh',
                    onAction: _refresh,
                    icon: Icons.local_fire_department_rounded,
                  ),
                ),
              ),
              asyncProducts.when(
                loading: () => SliverMainAxisGroup(
                  slivers: [
                    const SliverToBoxAdapter(
                      child: Padding(
                        padding: EdgeInsets.symmetric(horizontal: 20),
                        child: HomeHeaderSkeleton(),
                      ),
                    ),
                    const SliverToBoxAdapter(child: SizedBox(height: 12)),
                    const SliverToBoxAdapter(child: CategoryStripSkeleton()),
                    SliverPadding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      sliver: SliverGrid(
                        delegate: SliverChildBuilderDelegate(
                          (context, i) => const ProductCardSkeleton(),
                          childCount: 6,
                        ),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          mainAxisSpacing: 14,
                          crossAxisSpacing: 14,
                          childAspectRatio: 0.6,
                        ),
                      ),
                    ),
                  ],
                ),
                error: (e, _) => SliverFillRemaining(
                  hasScrollBody: false,
                  child: ErrorRetryView(message: e.toString(), onRetry: _refresh),
                ),
                data: (products) {
                  if (products.isEmpty) {
                    return SliverFillRemaining(
                      hasScrollBody: false,
                      child: EthioEmptyState(
                        title: 'No listings yet',
                        subtitle: 'When your sellers publish on LocalMarket, they appear here automatically.',
                        actionLabel: 'Pull to refresh',
                        onAction: _refresh,
                      ),
                    );
                  }
                  return SliverPadding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 120),
                    sliver: SliverGrid(
                      delegate: SliverChildBuilderDelegate(
                        (context, i) {
                          final p = products[i];
                          return ProductCard(
                            product: p,
                            onTap: () => context.push('/home/product/${p.id}'),
                          );
                        },
                        childCount: products.length,
                      ),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        mainAxisSpacing: 14,
                        crossAxisSpacing: 14,
                        childAspectRatio: 0.6,
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  const _CategoryChip({required this.label, required this.icon});

  final String label;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Material(
      color: scheme.surface,
      borderRadius: BorderRadius.circular(20),
      elevation: 0,
      child: InkWell(
        onTap: () {},
        borderRadius: BorderRadius.circular(20),
        child: Container(
          width: 96,
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: scheme.outline.withValues(alpha: 0.1)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: Theme.of(context).brightness == Brightness.dark ? 0.2 : 0.05),
                blurRadius: 12,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: [
                      scheme.primary.withValues(alpha: 0.2),
                      AppColors.accentLight.withValues(alpha: 0.15),
                    ],
                  ),
                ),
                child: Icon(icon, color: scheme.primary, size: 22),
              ),
              const SizedBox(height: 8),
              Text(label, style: Theme.of(context).textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w700)),
            ],
          ),
        ),
      ),
    );
  }
}
