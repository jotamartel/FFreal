export interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  can_create_groups: boolean;
  max_members_per_group: number | null;
  discount_tier_identifier: string | null;
  shopify_customer_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface CreateUserParams {
  email: string;
  password: string;
  name?: string | null;
  phone?: string | null;
  role?: string;
  canCreateGroups?: boolean;
  maxMembersPerGroup?: number | null;
  discountTierIdentifier?: string | null;
  shopifyCustomerId?: string | null;
  isActive?: boolean;
}

export interface UpdateUserParams {
  name?: string | null;
  phone?: string | null;
  role?: string;
  canCreateGroups?: boolean;
  maxMembersPerGroup?: number | null;
  discountTierIdentifier?: string | null;
  shopifyCustomerId?: string | null;
  isActive?: boolean;
  lastLoginAt?: Date | null;
}

export interface ImportUserRecord {
  email: string;
  name?: string;
  can_create_groups: boolean;
  max_members_per_group?: number;
  discount_tier_identifier?: string;
  shopify_customer_id?: string;
  action: 'create' | 'update' | 'delete';
}
