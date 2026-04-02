import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers/app_state_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/glass_card.dart';
import '../../core/widgets/gradient_cta.dart';

final _otpStepProvider = StateProvider<bool>((ref) => false);
final _phoneProvider = StateProvider<String>((ref) => '');

class AuthScreen extends ConsumerWidget {
  const AuthScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scheme = Theme.of(context).colorScheme;
    final otpStep = ref.watch(_otpStepProvider);
    final phone = ref.watch(_phoneProvider);

    return Scaffold(
      body: Stack(
        children: [
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: Theme.of(context).brightness == Brightness.dark
                      ? [AppColors.darkBackground, const Color(0xFF312E81)]
                      : [const Color(0xFFEEF2FF), Colors.white],
                ),
              ),
            ),
          ),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 12),
                  Text(
                    'Welcome in',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    otpStep ? 'Enter the code we sent you' : 'Sign in with your phone to continue',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: scheme.onSurface.withValues(alpha: 0.65),
                        ),
                  ),
                  const SizedBox(height: 32),
                  GlassCard(
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 320),
                      switchInCurve: Curves.easeOut,
                      switchOutCurve: Curves.easeIn,
                      child: otpStep ? _OtpPanel(phone: phone) : const _PhonePanel(),
                    ),
                  ),
                  const SizedBox(height: 24),
                  if (otpStep)
                    TextButton(
                      onPressed: () => ref.read(_otpStepProvider.notifier).state = false,
                      child: const Text('Edit phone number'),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PhonePanel extends ConsumerStatefulWidget {
  const _PhonePanel();

  @override
  ConsumerState<_PhonePanel> createState() => _PhonePanelState();
}

class _PhonePanelState extends ConsumerState<_PhonePanel> {
  late final TextEditingController _phoneCtrl = TextEditingController(text: ref.read(_phoneProvider));

  @override
  void dispose() {
    _phoneCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      key: const ValueKey('phone'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('Phone number', style: Theme.of(context).textTheme.labelLarge),
        const SizedBox(height: 10),
        TextField(
          controller: _phoneCtrl,
          keyboardType: TextInputType.phone,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          onChanged: (v) => ref.read(_phoneProvider.notifier).state = v,
          decoration: const InputDecoration(
            hintText: '9xx xxx xxx',
            prefixIcon: Icon(Icons.phone_android_rounded),
            prefixText: '+251 ',
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'We will send a one-time code via SMS.',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.55),
              ),
        ),
        const SizedBox(height: 24),
        GradientCta(
          label: 'Continue',
          icon: Icons.sms_rounded,
          onPressed: () {
            if (_phoneCtrl.text.length < 9) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Enter a valid mobile number')),
              );
              return;
            }
            ref.read(_phoneProvider.notifier).state = _phoneCtrl.text;
            ref.read(_otpStepProvider.notifier).state = true;
          },
        ),
      ],
    );
  }
}

class _OtpPanel extends ConsumerWidget {
  const _OtpPanel({required this.phone});

  final String phone;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Column(
      key: const ValueKey('otp'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('Code sent to +251 $phone', style: Theme.of(context).textTheme.bodyMedium),
        const SizedBox(height: 20),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: List.generate(
            4,
            (i) => SizedBox(
              width: 64,
              child: TextField(
                textAlign: TextAlign.center,
                maxLength: 1,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(counterText: ''),
                style: Theme.of(context).textTheme.titleLarge,
                onChanged: (v) {
                  if (v.isNotEmpty && i < 3) {
                    FocusScope.of(context).nextFocus();
                  }
                },
              ),
            ),
          ),
        ),
        const SizedBox(height: 24),
        GradientCta(
          label: 'Verify & continue',
          icon: Icons.verified_rounded,
          onPressed: () async {
            await ref.read(sessionProvider.notifier).signIn();
            if (!context.mounted) return;
            context.go('/home');
          },
        ),
      ],
    );
  }
}
