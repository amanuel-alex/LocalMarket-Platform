/// Estimated fees shown before payment completes on the platform.
const kPlatformFeeRate = 0.03;
const kDeliveryEstimateEtb = 85.0;

double platformFeeEtb(double subtotal) => subtotal * kPlatformFeeRate;

double estimatedOrderTotalEtb(double subtotal) => subtotal + platformFeeEtb(subtotal) + kDeliveryEstimateEtb;
