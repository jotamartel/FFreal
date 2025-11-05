// Types for Branches

export interface DBBranch {
  id: string;
  merchant_id: string | null;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBranchParams {
  merchantId?: string;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
}

