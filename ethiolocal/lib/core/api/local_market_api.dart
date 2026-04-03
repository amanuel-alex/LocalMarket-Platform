import '../models/auth_session.dart';
import '../models/order.dart';
import '../models/product.dart';
import '../models/product_detail_bundle.dart';
import 'local_market_client.dart';

class LocalMarketApi {
  LocalMarketApi(this._client);

  final LocalMarketClient _client;

  Future<AuthSession> login({required String phone, required String password}) async {
    final json = await _client.postJson('/auth/login', {'identifier': phone, 'password': password});
    return AuthSession.fromLoginJson(json);
  }

  Future<AuthSession> refreshSession({required String refreshToken}) async {
    final json = await _client.postJson('/auth/refresh', {'refreshToken': refreshToken});
    return AuthSession.fromLoginJson(json);
  }

  Future<List<Product>> fetchRankedProducts({
    double? lat,
    double? lng,
    int limit = 24,
    String? category,
  }) async {
    final q = <String, String>{'limit': '$limit'};
    if (lat != null && lng != null) {
      q['lat'] = '$lat';
      q['lng'] = '$lng';
    }
    if (category != null && category.isNotEmpty) {
      q['category'] = category;
    }
    final json = await _client.getJson('/products/ranked', query: q);
    final list = json['products'] as List<dynamic>? ?? [];
    return list.map((e) => Product.fromRankedJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<Product>> searchProducts({required String q, int limit = 30}) async {
    final json = await _client.getJson('/products/search', query: {'q': q, 'limit': '$limit'});
    final list = json['products'] as List<dynamic>? ?? [];
    return list.map((e) => Product.fromCatalogJson(e as Map<String, dynamic>)).toList();
  }

  Future<Product> fetchProduct(String id) async {
    final json = await _client.getJson('/products/$id');
    final p = json['product'] as Map<String, dynamic>? ?? json;
    return Product.fromCatalogJson(p);
  }

  Future<List<Product>> fetchRelated(String productId) async {
    final json = await _client.getJson('/products/$productId/related');
    final list = json['products'] as List<dynamic>? ?? [];
    return list.map((e) => Product.fromCatalogJson(e as Map<String, dynamic>)).toList();
  }

  Future<ProductDetailBundle> fetchProductDetailBundle(String productId) async {
    final results = await Future.wait([
      fetchProduct(productId),
      fetchCompare(productId),
      fetchRelated(productId),
    ]);
    final product = results[0] as Product;
    final compare = results[1] as List<CompareOffer>;
    final related = results[2] as List<Product>;
    final merged = product.copyWith(comparePrices: compare);
    final others = related.where((p) => p.id != productId).toList();
    if (others.isEmpty) {
      return ProductDetailBundle(product: merged, similarProducts: const [], alsoViewedProducts: const []);
    }
    final mid = (others.length + 1) ~/ 2;
    final similar = others.sublist(0, mid);
    final also = others.length > mid ? others.sublist(mid) : <Product>[];
    return ProductDetailBundle(product: merged, similarProducts: similar, alsoViewedProducts: also);
  }

  Future<List<CompareOffer>> fetchCompare(String productId) async {
    final json = await _client.getJson('/products/$productId/compare');
    final list = json['products'] as List<dynamic>? ?? [];
    final offers = <CompareOffer>[];
    for (final e in list) {
      final m = e as Map<String, dynamic>;
      final sid = m['sellerId'] as String? ?? '';
      final short = sid.length > 6 ? sid.substring(sid.length - 6) : sid;
      offers.add(
        CompareOffer(
          storeName: 'Listing · $short',
          priceEtb: _numToDouble(m['price']),
          distanceKm: 0,
        ),
      );
    }
    return offers;
  }

  Future<List<ShopOrder>> fetchOrders(String accessToken) async {
    final json = await _client.getJson('/orders', bearerToken: accessToken);
    final list = json['orders'] as List<dynamic>? ?? [];
    return list.map((e) => ShopOrder.fromApiJson(e as Map<String, dynamic>)).toList();
  }

  Future<ShopOrder> fetchOrder(String id, String accessToken) async {
    final json = await _client.getJson('/orders/$id', bearerToken: accessToken);
    final o = json['order'] as Map<String, dynamic>? ?? json;
    return ShopOrder.fromApiJson(o);
  }

  Future<ShopOrder> createOrder({
    required String accessToken,
    required String productId,
    required int quantity,
  }) async {
    final json = await _client.postJson(
      '/orders',
      {'productId': productId, 'quantity': quantity},
      bearerToken: accessToken,
    );
    final o = json['order'] as Map<String, dynamic>? ?? json;
    return ShopOrder.fromApiJson(o);
  }

  Future<Map<String, dynamic>> assistantChat({
    required String message,
    double? lat,
    double? lng,
  }) async {
    final body = <String, dynamic>{'message': message};
    if (lat != null) body['lat'] = lat;
    if (lng != null) body['lng'] = lng;
    return _client.postJson('/assistant/chat', body);
  }

  Future<Map<String, dynamic>> assistantGeminiStatus() async {
    return _client.getJson('/assistant/gemini/status');
  }

  /// Google AI Studio (Gemini) on the server — same tools as OpenAI: live catalog + platform facts.
  Future<Map<String, dynamic>> assistantGeminiChat({
    required String message,
    List<Map<String, dynamic>> history = const [],
    double? lat,
    double? lng,
  }) async {
    final body = <String, dynamic>{
      'message': message,
      'history': history,
    };
    if (lat != null) body['lat'] = lat;
    if (lng != null) body['lng'] = lng;
    return _client.postJson('/assistant/gemini/chat', body);
  }

  static double _numToDouble(dynamic v) {
    if (v is num) return v.toDouble();
    return double.tryParse('$v') ?? 0;
  }
}
