class AuthSession {
  const AuthSession({
    required this.accessToken,
    required this.refreshToken,
    required this.userName,
    required this.phone,
    required this.role,
  });

  final String accessToken;
  final String refreshToken;
  final String userName;
  final String phone;
  final String role;

  factory AuthSession.fromLoginJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>? ?? {};
    return AuthSession(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      userName: user['name'] as String? ?? 'Member',
      phone: user['phone'] as String? ?? '',
      role: user['role'] as String? ?? 'buyer',
    );
  }
}
