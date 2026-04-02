import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'api_providers.dart';

bool _jsonBool(dynamic v) => v == true || v == 'true' || v == 1;

/// True when the **API server** has `GOOGLE_AI_API_KEY` in `api/.env` (Google AI Studio).
///
/// Keys in the Flutter app do nothing — the backend calls Gemini and keeps the key private.
/// Auto-dispose so reopening the assistant re-checks after you fix `.env` / restart the API.
final assistantGeminiEnabledProvider = FutureProvider.autoDispose<bool>((ref) async {
  final api = ref.read(localMarketApiProvider);
  final j = await api.assistantGeminiStatus();
  return _jsonBool(j['enabled']);
});
