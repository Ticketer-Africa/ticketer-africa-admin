export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ORGANIZER" | "ADMIN" | "SUPERADMIN";
  isVerified: boolean;
  createdAt: string;
  eventsCount: number;
  totalSpent: number;
}

export interface AdminUserDetail {
  id: string;
  email: string;
  name: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  tickets: Array<{
    id: string;
    code: string;
    createdAt: string;
    event: { id: string; name: string; date: string } | null;
    ticketCategory: { id: string; name: string; price: number } | null;
  }>;
  transactions: Array<{
    id: string;
    reference: string;
    amount: number;
    status: string;
    type: string;
    createdAt: string;
    event: { id: string; name: string } | null;
  }>;
}

export interface AdminTicketCategory {
  id: string;
  name: string;
  price: number;
  maxTickets: number;
  minted: number;
}

export interface AdminEvent {
  id: string;
  name: string;
  date: string;
  location: string | null;
  category: string;
  isActive: boolean;
  organizer: { id: string; name: string; email: string };
  ticketCategories: AdminTicketCategory[];
}

export interface AdminTransaction {
  id: string;
  reference: string;
  amount: number;
  type: "PURCHASE" | "RESALE" | "WITHDRAW" | "FUND";
  status: "PENDING" | "SUCCESS" | "FAILED";
  createdAt: string;
  user: { id: string; name: string; email: string };
  event: { id: string; name: string } | null;
}

export interface AdminOrganizerEvent {
  id: string;
  name: string;
  isActive: boolean;
}

export interface AdminOrganizer {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  // Wallet.balance is a Prisma Decimal, passed through unconverted by listOrganizers() — may arrive as a JSON string
  wallet: { balance: number | string } | null;
  events: AdminOrganizerEvent[];
}

export interface AdminStats {
  users: number;
  events: number;
  tickets: number;
  totalRevenue: number;
}

export interface AdminRevenueSummary {
  totalProcessed: number;
  lifetimeProfit: number;
  platformWalletBalance: number;
}

export interface AdminDailyRevenue {
  date: string;
  totalProcessed: number;
  profit: number;
  ticketsSold: number;
}

export interface AdminEventCategoryBreakdown {
  name: string;
  value: string;
  count: number;
}

export interface AdminWalletsSummary {
  totalOrganizerBalance: number;
}

export interface AdminEventTransaction {
  id: string;
  reference: string;
  amount: number;
  type: string;
  status: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

export interface AdminEventDetail {
  event: AdminEvent & {
    bannerUrl: string | null;
    description: string | null;
    slug: string;
  };
  transactions: AdminEventTransaction[];
  totalProcessed: number;
  profit: number;
}

export interface AdminTransactionTicket {
  ticket: {
    id: string;
    code: string;
    isUsed: boolean;
  };
}

export interface AdminTransactionDetail {
  id: string;
  reference: string;
  amount: number;
  baseAmount: number | null;
  discountAmount: number | null;
  type: "PURCHASE" | "RESALE" | "WITHDRAW" | "FUND";
  status: "PENDING" | "SUCCESS" | "FAILED";
  createdAt: string;
  user: { id: string; name: string; email: string };
  event: { id: string; name: string } | null;
  discountCode: { code: string } | null;
  tickets: AdminTransactionTicket[];
}

export interface AdminOrganizerEventDetail {
  id: string;
  name: string;
  date: string;
  category: string;
  isActive: boolean;
  ticketCategories: AdminTicketCategory[];
}

export interface AdminOrganizerDetail {
  organizer: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    wallet: { balance: number | string } | null;
    events: AdminOrganizerEventDetail[];
  };
  totalProcessed: number;
  profit: number;
}

export interface AdminKoraBalance {
  [currency: string]: {
    availableBalance: number;
    pendingBalance: number;
  };
}
