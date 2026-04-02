import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Drives [GoRouter.refreshListenable] without tying the router provider to auth/onboarding
/// (avoids Riverpod's "Cannot use ref after dependency changed" during redirect).
class GoRouterRefresh extends ChangeNotifier {
  void notify() => notifyListeners();
}

final goRouterRefreshProvider = Provider<GoRouterRefresh>((ref) {
  final n = GoRouterRefresh();
  ref.onDispose(n.dispose);
  return n;
});
