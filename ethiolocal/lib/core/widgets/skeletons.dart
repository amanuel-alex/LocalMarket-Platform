import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

class ProductCardSkeleton extends StatelessWidget {
  const ProductCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    final base = Theme.of(context).colorScheme.surfaceContainerHighest;
    return Shimmer.fromColors(
      baseColor: base.withValues(alpha: 0.5),
      highlightColor: base.withValues(alpha: 0.15),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 148,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
            ),
          ),
          const SizedBox(height: 12),
          Container(height: 14, width: 140, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8))),
          const SizedBox(height: 8),
          Container(height: 12, width: 90, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8))),
        ],
      ),
    );
  }
}

class CategoryStripSkeleton extends StatelessWidget {
  const CategoryStripSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    final base = Theme.of(context).colorScheme.surfaceContainerHighest;
    return SizedBox(
      height: 100,
      child: Shimmer.fromColors(
        baseColor: base.withValues(alpha: 0.5),
        highlightColor: base.withValues(alpha: 0.12),
        child: ListView.separated(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          scrollDirection: Axis.horizontal,
          itemCount: 6,
          separatorBuilder: (_, unusedIndex) => const SizedBox(width: 10),
          itemBuilder: (_, unusedIndex) => Container(
            width: 88,
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18)),
          ),
        ),
      ),
    );
  }
}

class OrderTileSkeleton extends StatelessWidget {
  const OrderTileSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    final base = Theme.of(context).colorScheme.surfaceContainerHighest;
    return Shimmer.fromColors(
      baseColor: base.withValues(alpha: 0.5),
      highlightColor: base.withValues(alpha: 0.15),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(height: 14, width: 72, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8))),
                const Spacer(),
                Container(height: 28, width: 88, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(99))),
              ],
            ),
            const SizedBox(height: 14),
            Container(height: 16, width: double.infinity, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8))),
            const SizedBox(height: 8),
            Container(height: 16, width: 180, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8))),
            const SizedBox(height: 14),
            Row(
              children: [
                Container(height: 14, width: 64, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8))),
                const Spacer(),
                Container(height: 18, width: 72, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8))),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class HomeHeaderSkeleton extends StatelessWidget {
  const HomeHeaderSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    final base = Theme.of(context).colorScheme.surfaceContainerHighest;
    return Shimmer.fromColors(
      baseColor: base.withValues(alpha: 0.5),
      highlightColor: base.withValues(alpha: 0.15),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(height: 18, width: 200, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8))),
          const SizedBox(height: 12),
          Container(height: 52, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18))),
        ],
      ),
    );
  }
}
