import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers/app_state_provider.dart';
import '../../core/theme/app_colors.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final _controller = PageController();
  int _page = 0;

  static const _pages = [
    _OnbPageData(
      title: 'Discover local products',
      body: 'Curated goods from trusted sellers around you — fresh, authentic, and close by.',
      icon: Icons.explore_rounded,
      gradient: [Color(0xFF4F46E5), Color(0xFF6366F1)],
    ),
    _OnbPageData(
      title: 'Compare prices instantly',
      body: 'See who offers the best deal nearby before you buy. Transparency built in.',
      icon: Icons.compare_arrows_rounded,
      gradient: [Color(0xFF7C3AED), Color(0xFFA855F7)],
    ),
    _OnbPageData(
      title: 'Secure QR delivery',
      body: 'Confirm handoff with a single scan. Peace of mind for you and the seller.',
      icon: Icons.qr_code_scanner_rounded,
      gradient: [Color(0xFF059669), Color(0xFF10B981)],
    ),
  ];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _finish() async {
    await ref.read(onboardingCompleteProvider.notifier).complete();
    if (!mounted) return;
    context.go('/auth');
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      body: Stack(
        children: [
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: Theme.of(context).brightness == Brightness.dark
                      ? [AppColors.darkBackground, const Color(0xFF1E1B4B)]
                      : [const Color(0xFFEEF2FF), AppColors.lightBackground],
                ),
              ),
            ),
          ),
          SafeArea(
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'EthioLocal',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w800,
                              letterSpacing: -0.3,
                            ),
                      ),
                      TextButton(
                        onPressed: _finish,
                        child: Text('Skip', style: TextStyle(color: scheme.primary, fontWeight: FontWeight.w600)),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: PageView.builder(
                    controller: _controller,
                    itemCount: _pages.length,
                    onPageChanged: (i) => setState(() => _page = i),
                    itemBuilder: (context, i) => _OnbPage(data: _pages[i]),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 0, 24, 28),
                  child: Row(
                    children: [
                      Row(
                        children: List.generate(
                          _pages.length,
                          (i) => AnimatedContainer(
                            duration: const Duration(milliseconds: 280),
                            curve: Curves.easeOutCubic,
                            margin: const EdgeInsets.only(right: 8),
                            height: 8,
                            width: i == _page ? 28 : 8,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(99),
                              color: i == _page ? scheme.primary : scheme.outline.withValues(alpha: 0.35),
                            ),
                          ),
                        ),
                      ),
                      const Spacer(),
                      FilledButton.tonal(
                        onPressed: () {
                          if (_page < _pages.length - 1) {
                            _controller.nextPage(duration: const Duration(milliseconds: 420), curve: Curves.easeOutCubic);
                          } else {
                            _finish();
                          }
                        },
                        style: FilledButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        child: Text(_page < _pages.length - 1 ? 'Next' : 'Get started'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _OnbPageData {
  const _OnbPageData({
    required this.title,
    required this.body,
    required this.icon,
    required this.gradient,
  });

  final String title;
  final String body;
  final IconData icon;
  final List<Color> gradient;
}

class _OnbPage extends StatelessWidget {
  const _OnbPage({required this.data});

  final _OnbPageData data;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 28),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0, end: 1),
            duration: const Duration(milliseconds: 600),
            curve: Curves.easeOutBack,
            builder: (context, v, child) => Transform.scale(scale: 0.85 + 0.15 * v, child: child),
            child: Hero(
              tag: 'onb_icon_${data.title}',
              child: Container(
                width: 132,
                height: 132,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(36),
                  gradient: LinearGradient(colors: data.gradient),
                  boxShadow: [
                    BoxShadow(
                      color: data.gradient.last.withValues(alpha: 0.45),
                      blurRadius: 40,
                      offset: const Offset(0, 18),
                    ),
                  ],
                ),
                child: Icon(data.icon, size: 56, color: Colors.white),
              ),
            ),
          ),
          const SizedBox(height: 40),
          Text(
            data.title,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800, height: 1.2),
          ),
          const SizedBox(height: 16),
          Text(
            data.body,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.65),
                  height: 1.55,
                ),
          ),
        ],
      ),
    );
  }
}
