import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';

abstract final class AppTheme {
  static ThemeData light() {
    final scheme = ColorScheme.fromSeed(
      seedColor: AppColors.accent,
      brightness: Brightness.light,
    ).copyWith(
      primary: AppColors.accent,
      surface: AppColors.lightSurface,
      onSurface: const Color(0xFF0F172A),
      onSurfaceVariant: const Color(0xFF475569),
      surfaceContainerHighest: AppColors.lightSurfaceVariant,
      outline: const Color(0xFFCBD5E1),
    );
    final base = ThemeData(useMaterial3: true, brightness: Brightness.light, colorScheme: scheme);
    return _applyTypography(base);
  }

  static ThemeData dark() {
    // fromSeed + custom surface used to yield a dark onSurface (illegible text on AppBar/scaffold).
    // Lock explicit light-on-dark foreground and container steps for WCAG-friendly contrast.
    final scheme = ColorScheme.fromSeed(
      seedColor: AppColors.accentLight,
      brightness: Brightness.dark,
    ).copyWith(
      primary: AppColors.accentLight,
      onPrimary: Colors.white,
      primaryContainer: const Color(0xFF312E81),
      onPrimaryContainer: const Color(0xFFE8EAFF),
      surface: AppColors.darkSurface,
      surfaceContainerLowest: AppColors.darkBackground,
      surfaceContainerLow: const Color(0xFF151F30),
      surfaceContainer: const Color(0xFF1A2536),
      surfaceContainerHigh: const Color(0xFF2A384C),
      surfaceContainerHighest: const Color(0xFF334155),
      onSurface: const Color(0xFFF1F5F9),
      onSurfaceVariant: const Color(0xFFCBD5E1),
      outline: const Color(0xFF64748B),
      outlineVariant: const Color(0xFF475569),
      inverseSurface: const Color(0xFFF8FAFC),
      onInverseSurface: const Color(0xFF0F172A),
    );
    final base = ThemeData(useMaterial3: true, brightness: Brightness.dark, colorScheme: scheme);
    return _applyTypography(base);
  }

  static ThemeData _applyTypography(ThemeData theme) {
    final on = theme.colorScheme.onSurface;
    final onVar = theme.colorScheme.onSurfaceVariant;
    final textTheme = GoogleFonts.plusJakartaSansTextTheme(theme.textTheme).apply(
      bodyColor: on,
      displayColor: on,
    ).copyWith(
      headlineLarge: GoogleFonts.plusJakartaSans(
        fontWeight: FontWeight.w700,
        letterSpacing: -0.5,
        height: 1.15,
        color: on,
      ),
      headlineMedium: GoogleFonts.plusJakartaSans(
        fontWeight: FontWeight.w700,
        letterSpacing: -0.35,
        color: on,
      ),
      titleLarge: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600, color: on),
      titleMedium: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600, color: on),
      titleSmall: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600, color: on),
      bodyLarge: GoogleFonts.plusJakartaSans(height: 1.45, color: on),
      bodyMedium: GoogleFonts.plusJakartaSans(height: 1.45, color: on),
      bodySmall: GoogleFonts.plusJakartaSans(color: onVar),
      labelLarge: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600, letterSpacing: 0.2, color: on),
      labelMedium: GoogleFonts.plusJakartaSans(color: onVar),
      labelSmall: GoogleFonts.plusJakartaSans(color: onVar),
    );

    return theme.copyWith(
      textTheme: textTheme,
      scaffoldBackgroundColor: theme.brightness == Brightness.light
          ? AppColors.lightBackground
          : AppColors.darkBackground,
      appBarTheme: AppBarTheme(
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        backgroundColor: theme.brightness == Brightness.dark ? AppColors.darkBackground : Colors.transparent,
        foregroundColor: on,
        surfaceTintColor: Colors.transparent,
        iconTheme: IconThemeData(color: on),
        actionsIconTheme: IconThemeData(color: on),
        titleTextStyle: textTheme.titleLarge,
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        color: theme.brightness == Brightness.light ? AppColors.lightSurface : AppColors.darkSurface,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: theme.brightness == Brightness.light
            ? AppColors.lightSurfaceVariant
            : AppColors.darkSurfaceVariant.withValues(alpha: 0.55),
        hintStyle: TextStyle(color: onVar.withValues(alpha: theme.brightness == Brightness.dark ? 0.95 : 0.75)),
        labelStyle: TextStyle(color: onVar),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: theme.colorScheme.primary, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: theme.brightness == Brightness.dark ? AppColors.darkSurface : AppColors.lightSurface,
        surfaceTintColor: Colors.transparent,
        indicatorColor: theme.colorScheme.primaryContainer.withValues(alpha: theme.brightness == Brightness.dark ? 0.45 : 1),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return textTheme.labelMedium?.copyWith(
            fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
            color: selected ? theme.colorScheme.primary : onVar,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return IconThemeData(
            color: selected ? theme.colorScheme.primary : onVar,
            size: 24,
          );
        }),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          textStyle: textTheme.labelLarge,
        ),
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        elevation: 8,
        highlightElevation: 12,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: FadeUpwardsPageTransitionsBuilder(),
          TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
          TargetPlatform.macOS: CupertinoPageTransitionsBuilder(),
        },
      ),
    );
  }
}
