import 'package:device_preview/device_preview.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/providers/app_state_provider.dart';
import '../core/providers/auth_session_provider.dart';
import '../core/providers/theme_mode_provider.dart';
import '../core/router/app_router.dart';
import '../core/router/go_router_refresh.dart';
import '../core/theme/app_theme.dart';

class EthioLocalApp extends ConsumerWidget {
  const EthioLocalApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.listen(onboardingCompleteProvider, (prev, next) {
      ref.read(goRouterRefreshProvider).notify();
    });
    ref.listen(authSessionProvider, (prev, next) {
      ref.read(goRouterRefreshProvider).notify();
    });

    final themeMode = ref.watch(themeModeProvider);
    final router = ref.watch(appRouterProvider);
    final locale = ref.watch(localeProvider);

    return MaterialApp.router(
      title: 'EthioLocal',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: themeMode,
      locale: kDebugMode ? (DevicePreview.locale(context) ?? locale) : locale,
      routerConfig: router,
      builder: DevicePreview.appBuilder,
    );
  }
}
