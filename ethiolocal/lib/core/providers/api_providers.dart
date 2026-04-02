import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/local_market_api.dart';
import '../api/local_market_client.dart';

final localMarketClientProvider = Provider<LocalMarketClient>((ref) => LocalMarketClient());

final localMarketApiProvider = Provider<LocalMarketApi>((ref) {
  return LocalMarketApi(ref.watch(localMarketClientProvider));
});
