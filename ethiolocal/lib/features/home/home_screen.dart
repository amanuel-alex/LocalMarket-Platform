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

    final isDark = Theme.of(context).brightness == Brightness.dark;

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
                  child: _HomeGradientHero(
                    isDark: isDark,
                    greet: greet,
                    cartQty: cartQty,
                    searchCtrl: _searchCtrl,
                    onCart: () => context.push('/cart'),
                    onSearchSubmitted: _searchCatalog,
                    onSearchPressed: () => _searchCatalog(_searchCtrl.text),
                  ),
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: 20)),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: _HomeFeaturesCluster(scheme: scheme, isDark: isDark),
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: 20)),
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
                    subtitle: 'Ranked by price, distance & popularity',
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

/// Primary (large) + secondary (accent rail) headings for long home sections.
class _HomePrimaryHeading extends StatelessWidget {
  const _HomePrimaryHeading({required this.title, this.subtitle});

  final String title;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w800,
                letterSpacing: -0.2,
                color: scheme.onSurface,
              ),
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 6),
          Text(
            subtitle!,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: scheme.onSurfaceVariant,
                  height: 1.4,
                ),
          ),
        ],
      ],
    );
  }
}

class _HomeFeatureHighlights extends StatelessWidget {
  const _HomeFeatureHighlights({required this.scheme, required this.isDark});

  final ColorScheme scheme;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    const items = [
      (Icons.storefront_rounded, 'Local sellers'),
      (Icons.shield_rounded, 'Protected pay'),
      (Icons.currency_exchange_rounded, 'ETB prices'),
      (Icons.auto_awesome_rounded, 'Ask AI'),
    ];
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        for (final it in items)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: scheme.surfaceContainerHighest.withValues(alpha: isDark ? 0.5 : 0.9),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: scheme.outline.withValues(alpha: isDark ? 0.22 : 0.1)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(it.$1, size: 18, color: scheme.primary),
                const SizedBox(width: 8),
                Text(
                  it.$2,
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w700),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class _HomeFeaturesCluster extends StatelessWidget {
  const _HomeFeaturesCluster({required this.scheme, required this.isDark});

  final ColorScheme scheme;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _HomePrimaryHeading(
          title: 'Features',
          subtitle:
              'Everything on one screen — browse nearby listings, compare prices, and checkout safely.',
        ),
        const SizedBox(height: 14),
        _HomeFeatureHighlights(scheme: scheme, isDark: isDark),
      ],
    );
  }
}

/// Indigo → violet hero with search (original EthioLocal home look).
class _HomeGradientHero extends StatelessWidget {
  const _HomeGradientHero({
    required this.isDark,
    required this.greet,
    required this.cartQty,
    required this.searchCtrl,
    required this.onCart,
    required this.onSearchSubmitted,
    required this.onSearchPressed,
  });

  final bool isDark;
  final String greet;
  final int cartQty;
  final TextEditingController searchCtrl;
  final VoidCallback onCart;
  final void Function(String) onSearchSubmitted;
  final VoidCallback onSearchPressed;

  /// Same indigo→violet accent as light mode (no extra-deep dark-only gradient).
  LinearGradient get _gradient => AppColors.accentGradient;

  @override
  Widget build(BuildContext context) {
    final subtle = Colors.white.withValues(alpha: 0.88);
    return Container(
      decoration: BoxDecoration(
        gradient: _gradient,
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.0),
            blurRadius: isDark ? 20 : 0,
            offset: const Offset(0, 12),
          ),
          BoxShadow(
            color: const Color(0xFF4F46E5).withValues(alpha: isDark ? 0.12 : 0.28),
            blurRadius: 24,
            offset: const Offset(0, 14),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 22, 20, 22),
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
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.w800,
                              letterSpacing: -0.35,
                              color: Colors.white,
                            ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(Icons.near_me_rounded, size: 17, color: subtle),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              'Curated near ${ApiConfig.defaultLat.toStringAsFixed(2)}°, ${ApiConfig.defaultLng.toStringAsFixed(2)}°',
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: subtle, height: 1.35),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Material(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(16),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: onCart,
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Badge(
                        isLabelVisible: cartQty > 0,
                        backgroundColor: Colors.white,
                        textColor: const Color(0xFF4F46E5),
                        label: Text('$cartQty'),
                        child: const Icon(Icons.shopping_bag_outlined, color: Colors.white),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            TextField(
              controller: searchCtrl,
              textInputAction: TextInputAction.search,
              onSubmitted: onSearchSubmitted,
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500),
              cursorColor: Colors.white,
              decoration: InputDecoration(
                hintText: 'Search products, categories…',
                hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.78)),
                prefixIcon: Icon(Icons.search_rounded, color: Colors.white.withValues(alpha: 0.9)),
                suffixIcon: IconButton(
                  icon: Icon(Icons.tune_rounded, color: Colors.white.withValues(alpha: 0.9)),
                  onPressed: onSearchPressed,
                ),
                filled: true,
                fillColor: Colors.white.withValues(alpha: 0.2),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
          ],
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
