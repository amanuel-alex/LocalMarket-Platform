import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/ai/ai_assistant_screen.dart';
import '../../features/auth/auth_screen.dart';
import '../../features/cart/cart_screen.dart';
import '../../features/cart/checkout_screen.dart';
import '../../features/home/home_screen.dart';
import '../../features/onboarding/onboarding_screen.dart';
import '../../features/orders/order_detail_screen.dart';
import '../../features/orders/orders_screen.dart';
import '../../features/products/product_detail_screen.dart';
import '../../features/profile/profile_screen.dart';
import '../../features/qr/qr_delivery_screen.dart';
import '../../features/shell/main_shell.dart';
import '../providers/app_state_provider.dart';
import '../providers/auth_session_provider.dart';

CustomTransitionPage<void> _fadeSlide(Widget child, LocalKey key) {
  return CustomTransitionPage<void>(
    key: key,
    child: child,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      final curved = CurvedAnimation(parent: animation, curve: Curves.easeOutCubic);
      return FadeTransition(
        opacity: curved,
        child: SlideTransition(
          position: Tween<Offset>(begin: const Offset(0, 0.04), end: Offset.zero).animate(curved),
          child: child,
        ),
      );
    },
  );
}

final appRouterProvider = Provider<GoRouter>((ref) {
  ref.watch(onboardingCompleteProvider);
  ref.watch(authSessionProvider);

  return GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) {
      final onboarding = ref.read(onboardingCompleteProvider);
      final authed = ref.read(authSessionProvider) != null;
      final loc = state.matchedLocation;

      if (loc == '/splash') return null;

      if (!onboarding && loc != '/onboarding') {
        return '/onboarding';
      }
      if (onboarding && !authed && loc != '/auth' && loc != '/onboarding') {
        return '/auth';
      }
      if (authed && (loc == '/onboarding' || loc == '/auth')) {
        return '/home';
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const _SplashGate(),
      ),
      GoRoute(
        path: '/onboarding',
        pageBuilder: (context, state) => _fadeSlide(const OnboardingScreen(), state.pageKey),
      ),
      GoRoute(
        path: '/auth',
        pageBuilder: (context, state) => _fadeSlide(const AuthScreen(), state.pageKey),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return MainShell(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/home',
                pageBuilder: (context, state) => _fadeSlide(const HomeScreen(), state.pageKey),
                routes: [
                  GoRoute(
                    path: 'product/:id',
                    pageBuilder: (context, state) {
                      final id = state.pathParameters['id']!;
                      return _fadeSlide(ProductDetailScreen(productId: id), state.pageKey);
                    },
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/orders',
                pageBuilder: (context, state) => _fadeSlide(const OrdersScreen(), state.pageKey),
                routes: [
                  GoRoute(
                    path: ':id',
                    pageBuilder: (context, state) {
                      final id = state.pathParameters['id']!;
                      return _fadeSlide(OrderDetailScreen(orderId: id), state.pageKey);
                    },
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/profile',
                pageBuilder: (context, state) => _fadeSlide(const ProfileScreen(), state.pageKey),
              ),
            ],
          ),
        ],
      ),
      GoRoute(
        path: '/cart',
        pageBuilder: (context, state) => _fadeSlide(const CartScreen(), state.pageKey),
      ),
      GoRoute(
        path: '/checkout',
        pageBuilder: (context, state) => _fadeSlide(const CheckoutScreen(), state.pageKey),
      ),
      GoRoute(
        path: '/ai',
        pageBuilder: (context, state) => _fadeSlide(const AiAssistantScreen(), state.pageKey),
      ),
      GoRoute(
        path: '/qr/:orderId',
        pageBuilder: (context, state) {
          final id = state.pathParameters['orderId']!;
          return _fadeSlide(QrDeliveryScreen(orderId: id), state.pageKey);
        },
      ),
    ],
  );
});

class _SplashGate extends ConsumerStatefulWidget {
  const _SplashGate();

  @override
  ConsumerState<_SplashGate> createState() => _SplashGateState();
}

class _SplashGateState extends ConsumerState<_SplashGate> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _go());
  }

  Future<void> _go() async {
    await Future<void>.delayed(const Duration(milliseconds: 400));
    if (!mounted) return;
    await ref.read(onboardingCompleteProvider.notifier).ensureLoaded();
    await ref.read(authSessionProvider.notifier).ensureLoaded();
    if (!mounted) return;
    final onboarding = ref.read(onboardingCompleteProvider);
    final authed = ref.read(authSessionProvider) != null;
    final router = GoRouter.of(context);
    if (!onboarding) {
      router.go('/onboarding');
    } else if (!authed) {
      router.go('/auth');
    } else {
      router.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            TweenAnimationBuilder<double>(
              tween: Tween(begin: 0.85, end: 1),
              duration: const Duration(milliseconds: 700),
              curve: Curves.easeOutBack,
              builder: (context, scale, child) => Transform.scale(scale: scale, child: child),
              child: Container(
                width: 88,
                height: 88,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(24),
                  gradient: const LinearGradient(
                    colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: scheme.primary.withValues(alpha: 0.35),
                      blurRadius: 24,
                      offset: const Offset(0, 12),
                    ),
                  ],
                ),
                child: const Icon(Icons.local_mall_rounded, color: Colors.white, size: 40),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'EthioLocal',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            Text(
              'Local finds, fair prices',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: scheme.onSurface.withValues(alpha: 0.6),
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
