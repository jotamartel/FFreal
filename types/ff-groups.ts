// Types for Friends & Family Groups

export interface FFGroup {
  id: string;
  merchant_id: string;
  name: string;
  owner_customer_id: string;
  owner_email: string;
  owner_user_id?: string | null;
  invite_code: string;
  discount_code?: string | null; // Shopify discount code
  max_members: number;
  current_members: number;
  status: 'active' | 'suspended' | 'terminated';
  discount_tier: number;
  created_at: string;
  updated_at: string;
}

export interface FFGroupMember {
  id: string;
  group_id: string;
  customer_id: string | null;
  user_id?: string | null;
  email: string;
  role: 'owner' | 'member';
  status: 'pending' | 'active' | 'removed' | 'inactive';
  email_verified: boolean;
  verification_token: string | null;
  verification_expires_at: string | null;
  joined_at: string | null;
  invited_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FFInvitation {
  id: string;
  group_id: string;
  email: string;
  token: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'revoked';
  expires_at: string;
  sent_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface FFDiscountConfig {
  id: string;
  merchant_id: string;
  is_enabled: boolean;
  discount_type: 'percentage' | 'fixed';
  tiers: DiscountTier[];
  rules: DiscountRules;
  max_groups_per_email: number;
  cooling_period_days: number;
  max_members_default?: number;
  invite_redirect_url?: string;
  created_at: string;
  updated_at: string;
}

export interface DiscountTier {
  memberCount?: number; // Optional: for tiers based on group size
  tierIdentifier?: string; // Optional: for tiers based on user's discount_tier_identifier
  discountValue: number;
  label?: string; // Optional: human-readable label for the tier
}

export interface DiscountRules {
  productInclusions?: string[];
  productExclusions?: string[];
  minimumPurchase?: number;
  geoRestrictions?: string[];
  timeRestrictions?: {
    startDate?: string;
    endDate?: string;
  };
}

export interface CreateGroupParams {
  merchantId: string;
  name: string;
  ownerCustomerId: string;
  ownerEmail: string;
  maxMembers?: number;
  discountTier?: number;
}

export interface CreateInvitationParams {
  groupId: string;
  email: string;
  expiresInDays?: number;
}

export interface UpdateGroupParams {
  id: string;
  name?: string;
  maxMembers?: number;
  status?: 'active' | 'suspended' | 'terminated';
}

export interface UpdateMemberParams {
  id: string;
  status?: 'pending' | 'active' | 'removed' | 'inactive';
  emailVerified?: boolean;
}

export interface UpdateDiscountConfigParams {
  merchantId: string;
  isEnabled?: boolean;
  discountType?: 'percentage' | 'fixed';
  tiers?: DiscountTier[];
  rules?: DiscountRules;
  maxGroupsPerEmail?: number;
  coolingPeriodDays?: number;
  maxMembersDefault?: number;
  inviteRedirectUrl?: string;
}

