export function formatCouponAvailabilityCount(count: number) {
  return `${formatOfferCount(count)} with coupons`;
}

export function formatOfferCount(count: number) {
  return `${count} ${count === 1 ? "offer" : "offers"}`;
}
