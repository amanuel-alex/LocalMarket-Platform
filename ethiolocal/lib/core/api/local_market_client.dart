import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import 'api_exception.dart';

class LocalMarketClient {
  LocalMarketClient({http.Client? httpClient}) : _http = httpClient ?? http.Client();

  final http.Client _http;

  Uri _uri(String path, [Map<String, String>? query]) {
    final base = ApiConfig.baseUrl.replaceAll(RegExp(r'/+$'), '');
    final p = path.startsWith('/') ? path : '/$path';
    return Uri.parse('$base$p').replace(queryParameters: query);
  }

  void _throwIfError(http.Response r) {
    if (r.statusCode >= 200 && r.statusCode < 300) return;
    String msg = r.body;
    String? code;
    try {
      final j = jsonDecode(r.body) as Map<String, dynamic>?;
      final err = j?['error'] as Map<String, dynamic>?;
      if (err != null) {
        msg = err['message'] as String? ?? msg;
        code = err['code'] as String?;
      }
    } catch (_) {}
    throw ApiException(r.statusCode, msg.isEmpty ? 'Request failed' : msg, code: code);
  }

  Future<Map<String, dynamic>> postJson(
    String path,
    Map<String, dynamic> body, {
    String? bearerToken,
    Map<String, String>? query,
  }) async {
    final r = await _http.post(
      _uri(path, query),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        if (bearerToken != null) 'Authorization': 'Bearer $bearerToken',
      },
      body: jsonEncode(body),
    );
    _throwIfError(r);
    if (r.body.isEmpty) return {};
    return jsonDecode(r.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getJson(
    String path, {
    String? bearerToken,
    Map<String, String>? query,
  }) async {
    final r = await _http.get(
      _uri(path, query),
      headers: {
        'Accept': 'application/json',
        if (bearerToken != null) 'Authorization': 'Bearer $bearerToken',
      },
    );
    _throwIfError(r);
    if (r.body.isEmpty) return {};
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
}
