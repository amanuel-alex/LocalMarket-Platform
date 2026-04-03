export type ProductJson = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  location: { lat: number; lng: number };
  imageUrl: string | null;
  sellerId: string;
  distanceKm?: number;
  rankScore?: number;
};

export type OrderJson = {
  id: string;
  status: string;
  quantity: number;
  totalPrice: number;
  product: { id: string; title: string; price: number };
  createdAt: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; name: string; phone: string; role: string; email?: string };
};

export type AssistantRulesResult = {
  intents: {
    cheap: boolean;
    nearby: boolean;
    smartRanking: boolean;
    category: string | null;
    nearbyMissingCoordinates: boolean;
    smartRankingMissingCoordinates: boolean;
  };
  products: ProductJson[];
  assistantMode: string;
};

export type GeminiChatResult = {
  reply: string;
  model: string;
  products: ProductJson[];
};
