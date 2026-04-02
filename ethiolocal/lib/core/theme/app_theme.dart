import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';

abstract final class AppTheme {
  static ThemeData light() {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.accent,
        brightness: Brightness.light,
        primary: AppColors.accent,
        surface: AppColors.lightSurface,
        onSurface: const Color(0xFF0F172A),
      ),
    );
    return _applyTypography(base);
  }

  static ThemeData dark() {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.accentLight,
        brightness: Brightness.dark,
        primary: AppColors.accentLight,
        surface: AppColors.darkSurface,
        onSurface: const Color(0xFFF8FAFC),
      ),
    );
    return _applyTypography(base);
  }

  static ThemeData _applyTypography(ThemeData theme) {
    final textTheme = GoogleFonts.plusJakartaSansTextTheme(theme.textTheme).copyWith(
      headlineLarge: GoogleFonts.plusJakartaSans(
        fontWeight: FontWeight.w700,
        letterSpacing: -0.5,
        height: 1.15,
      ),
      headlineMedium: GoogleFonts.plusJakartaSans(
        fontWeight: FontWeight.w700,
        letterSpacing: -0.35,
      ),
      titleLarge: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600),
      titleMedium: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600),
      bodyLarge: GoogleFonts.plusJakartaSans(height: 1.45),
      bodyMedium: GoogleFonts.plusJakartaSans(height: 1.45),
      labelLarge: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600, letterSpacing: 0.2),
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
        backgroundColor: Colors.transparent,
        foregroundColor: theme.colorScheme.onSurface,
        titleTextStyle: textTheme.titleLarge,
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        color: theme.brightness == Brightness.light
            ? AppColors.lightSurface
            : AppColors.darkSurface,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: theme.brightness == Brightness.light
            ? AppColors.lightSurfaceVariant
            : AppColors.darkSurfaceVariant.withValues(alpha: 0.5),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: theme.colorScheme.primary, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
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
