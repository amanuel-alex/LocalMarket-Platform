import 'package:ethiolocal/app/ethiolocal_app.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('App boots and shows EthioLocal branding', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: EthioLocalApp()));
    await tester.pump(const Duration(milliseconds: 500));
    expect(find.text('EthioLocal'), findsWidgets);
  });
}
