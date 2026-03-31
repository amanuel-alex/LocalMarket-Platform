import { bumpProductCatalogCacheEpoch } from "../cache/productCatalog.cache.js";
import { prisma } from "../prisma/client.js";
import type { SellerShopLocationInput } from "../schemas/location.schemas.js";

export type SellerShopJson = {
  id: string;
  sellerLat: number | null;
  sellerLng: number | null;
};

export async function updateSellerShopLocation(
  userId: string,
  input: SellerShopLocationInput,
): Promise<SellerShopJson> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { sellerLat: input.lat, sellerLng: input.lng },
    select: { id: true, sellerLat: true, sellerLng: true },
  });
  await bumpProductCatalogCacheEpoch();
  return user;
}
