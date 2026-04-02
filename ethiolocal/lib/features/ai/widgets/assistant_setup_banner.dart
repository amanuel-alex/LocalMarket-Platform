import 'package:flutter/material.dart';

import '../../../core/config/api_config.dart';

/// Explains that Gemini is configured on the API, not in the Flutter app.
class AssistantSetupBanner extends StatelessWidget {
  const AssistantSetupBanner({
    super.key,
    this.isReachabilityIssue = false,
    required this.onDismiss,
  });

  final bool isReachabilityIssue;
  final VoidCallback onDismiss;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final base = scheme.primaryContainer.withValues(alpha: Theme.of(context).brightness == Brightness.dark ? 0.22 : 0.55);
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
      child: Material(
        color: base,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(14, 12, 8, 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.info_outline_rounded, color: scheme.primary, size: 22),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isReachabilityIssue ? 'Could not reach assistant status' : 'Gemini runs on your API server',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      isReachabilityIssue
                          ? 'Check that the LocalMarket API is running and Flutter is pointed at it (currently ${ApiConfig.baseUrl}). Tap refresh in the app bar after fixing.'
                          : 'Your Google AI Studio key must live in api/.env as GOOGLE_AI_API_KEY=... or GEMINI_API_KEY=... (not in the Flutter app). Restart the API, then tap refresh — the subtitle should say “Google Gemini + live catalog”.',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: scheme.onSurface.withValues(alpha: 0.82),
                            height: 1.4,
                          ),
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: onDismiss,
                icon: Icon(Icons.close_rounded, size: 20, color: scheme.onSurface.withValues(alpha: 0.45)),
                visualDensity: VisualDensity.compact,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
