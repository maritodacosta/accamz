

export type Language = 'ID' | 'EN' | 'TET';
export type UserRole = 'ADMIN' | 'USER';
export type ViewState = 'DASHBOARD' | 'TRANSACTIONS' | 'APPROVALS' | 'REPORTS' | 'SETTINGS' | 'USERS' | 'BRANCHES' | 'INVENTORY';
export type TransactionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE' | 'KASBON';

export interface BranchData {
  id: string;
  name: string;
  location: string;
  code: string;
  created_at?: string; // For backend response
  updated_at?: string; // For backend response
}

export interface User {
  id: string;
  username: string;
  password?: string; // Only for sending, not stored/retrieved directly
  password_hash?: string; // For backend internal use
  name: string;
  role: UserRole;
  branch: string; // Refers to BranchData.name
  branch_name?: string; // Backend field name if different
  avatar?: string;
  created_at?: string; // For backend response
  updated_at?: string; // For backend response
}

export interface InventoryItem {
  id: string;
  code: string;
  category: string;
  referenceNumber?: string;
  reference_number?: string; // Backend field name if different
  stockIn: number; // Stok Masuk
  stock_in?: number; // Backend field name if different
  stockOut: number; // Stok Keluar
  stock_out?: number; // Backend field name if different
  branch: string;
  branch_name?: string; // Backend field name if different
  updatedAt: number; // Frontend timestamp
  updated_at?: string; // Backend field name if different (string ISO date)
  created_at?: string; // For backend response
}

export interface Account {
  code: string;
  name: { [key in Language]: string };
  name_id?: string; // Backend field for ID name
  name_en?: string; // Backend field for EN name
  name_tet?: string; // Backend field for TET name
  type: AccountType;
  balanceType: 'DEBIT' | 'CREDIT';
  created_at?: string; // For backend response
  updated_at?: string; // For backend response
}

export interface LedgerEntry {
  id?: number; // Backend might provide an ID
  accountId: string;
  account_code?: string; // Backend field name if different
  debit: number;
  credit: number;
  created_at?: string; // For backend response
  updated_at?: string; // For backend response
}

export interface AuditLog {
  id?: number;
  action: 'CREATED' | 'UPDATED' | 'APPROVED' | 'REJECTED' | 'LOGIN' | 'LOGOUT' | 'SETTINGS_UPDATED' | 'USER_MANAGEMENT' | 'BRANCH_MANAGEMENT' | 'INVENTORY_MUTATION' | 'ACCOUNT_MANAGEMENT';
  userId: string;
  user_id?: string; // Backend field name if different
  userName: string;
  user_name?: string; // Backend field name if different
  timestamp: number; // Frontend timestamp
  created_at?: string; // Backend field name if different (string ISO date)
  details?: string;
  transaction_id?: string; // If logs are per-transaction
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  referenceNumber?: string;
  reference_number?: string; // Backend field name if different
  branch: string;
  branch_name?: string; // Backend field name if different
  userId: string;
  user_id?: string; // Backend field name if different
  status: TransactionStatus;
  type: 'GENERAL' | 'EXPENSE' | 'KASBON' | 'CLOSE_KAS';
  entries: LedgerEntry[];
  approvedBy?: string;
  approved_by_user_id?: string; // Backend field name if different
  createdAt: number; // Frontend timestamp
  created_at?: string; // Backend field name if different (string ISO date)
  updated_at?: string; // For backend response
  logs: AuditLog[]; // This might be handled by a separate audit_logs table
  isHqEntry?: boolean; // Indicates if created by Admin/HQ
  is_hq_entry?: boolean; // Backend field name if different
}

export interface AppSettings {
  language: Language;
  currency: string;
  dateFormat: string;
  isKasbonEnabled: boolean;
  isApprovalRequired: boolean;
  companyName: string;
  companyLogo?: string; 
  companyFavicon?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
}

// Backend might return settings as an array of objects
export interface SettingEntry {
  key_name: string;
  value: string; // Values are strings, need to be converted to boolean/number
  created_at?: string; // For backend response
  updated_at?: string; // For backend response
}