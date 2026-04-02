/// LocalMarket HTTP API (`/api/v1`).
///
/// Override at build/run time, e.g.:
/// `flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000/api/v1`
/// (Android emulator → host machine). iOS simulator: `http://localhost:4000/api/v1`.
abstract final class ApiConfig {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:4000/api/v1',
  );

  /// Default map pin for ranked / assistant when GPS is not wired yet (Addis Ababa).
  static const double defaultLat = 9.032;
  static const double defaultLng = 38.748;
}
