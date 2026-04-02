import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/auth_session.dart';
import 'api_providers.dart';

const _kAccess = 'ethiolocal_access_token';
const _kRefresh = 'ethiolocal_refresh_token';
const _kUserName = 'ethiolocal_user_name';
const _kPhone = 'ethiolocal_user_phone';
const _kRole = 'ethiolocal_user_role';

final authSessionProvider = NotifierProvider<AuthSessionNotifier, AuthSession?>(AuthSessionNotifier.new);

class AuthSessionNotifier extends Notifier<AuthSession?> {
  @override
  AuthSession? build() {
    _restore();
    return null;
  }

  Future<void> _restore() async {
    await ensureLoaded();
  }

  Future<void> ensureLoaded() async {
    final p = await SharedPreferences.getInstance();
    final access = p.getString(_kAccess);
    if (access == null || access.isEmpty) {
      state = null;
      return;
    }
    state = AuthSession(
      accessToken: access,
      refreshToken: p.getString(_kRefresh) ?? '',
      userName: p.getString(_kUserName) ?? 'Member',
      phone: p.getString(_kPhone) ?? '',
      role: p.getString(_kRole) ?? 'buyer',
    );
  }

  Future<void> loginWithPassword({required String phone, required String password}) async {
    final api = ref.read(localMarketApiProvider);
    final session = await api.login(phone: phone, password: password);
    await _persist(session);
    state = session;
  }

  Future<void> _persist(AuthSession s) async {
    final p = await SharedPreferences.getInstance();
    await p.setString(_kAccess, s.accessToken);
    await p.setString(_kRefresh, s.refreshToken);
    await p.setString(_kUserName, s.userName);
    await p.setString(_kPhone, s.phone);
    await p.setString(_kRole, s.role);
  }

  Future<void> signOut() async {
    final p = await SharedPreferences.getInstance();
    await p.remove(_kAccess);
    await p.remove(_kRefresh);
    await p.remove(_kUserName);
    await p.remove(_kPhone);
    await p.remove(_kRole);
    state = null;
  }
}
