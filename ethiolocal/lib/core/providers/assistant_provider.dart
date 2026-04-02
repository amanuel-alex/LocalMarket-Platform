import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'api_providers.dart';

/// True when the API has `GOOGLE_AI_API_KEY` set (Google AI Studio / Gemini).
final assistantGeminiEnabledProvider = FutureProvider<bool>((ref) async {
  final api = ref.read(localMarketApiProvider);
  final j = await api.assistantGeminiStatus();
  return j['enabled'] == true;
});
