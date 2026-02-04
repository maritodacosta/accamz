
export type Language = 'ID' | 'EN' | 'TET';
export type UserRole = 'ADMIN' | 'USER';
export type ViewState = 'DASHBOARD' | 'TRANSACTIONS' | 'APPROVALS' | 'REPORTS' | 'SETTINGS' | 'USERS' | 'BRANCHES' | 'INVENTORY' | 'MANUAL';
export type TransactionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE' | 'KASBON';

export interface BranchData {
  id: string;
  name: string;
  location: string;
  code: string;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  password_hash?: string;
  name: string;
  role: UserRole;
  branch: string;
  branch_name?: string;
  avatar?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryItem {
  id: string;
  code: string;
  category: string;
  referenceNumber?: string;
  reference_number?: string;
  stockIn: number;
  stock_in?: number;
  stockOut: number;
  stock_out?: number;
  branch: string;
  branch_name?: string;
  updatedAt: number;
  updated_at?: string;
  created_at?: string;
}

export interface Account {
  code: string;
  name: { [key in Language]: string };
  name_id?: string;
  name_en?: string;
  name_tet?: string;
  type: AccountType;
  balanceType: 'DEBIT' | 'CREDIT';
  created_at?: string;
  updated_at?: string;
}

export interface LedgerEntry {
  id?: number;
  accountId: string;
  account_code?: string;
  debit: number;
  credit: number;
  created_at?: string;
  updated_at?: string;
}

export interface AuditLog {
  id?: number;
  action: 'CREATED' | 'UPDATED' | 'APPROVED' | 'REJECTED' | 'LOGIN' | 'LOGOUT' | 'SETTINGS_UPDATED' | 'USER_MANAGEMENT' | 'BRANCH_MANAGEMENT' | 'INVENTORY_MUTATION' | 'ACCOUNT_MANAGEMENT';
  userId: string;
  user_id?: string;
  userName: string;
  user_name?: string;
  timestamp: number;
  created_at?: string;
  details?: string;
  transaction_id?: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  referenceNumber?: string;
  reference_number?: string;
  branch: string;
  branch_name?: string;
  userId: string;
  user_id?: string;
  status: TransactionStatus;
  type: 'GENERAL' | 'EXPENSE' | 'KASBON' | 'CLOSE_KAS';
  entries: LedgerEntry[];
  approvedBy?: string;
  approved_by_user_id?: string;
  createdAt: number;
  created_at?: string;
  updated_at?: string;
  logs: AuditLog[];
  isHqEntry?: boolean;
  is_hq_entry?: boolean;
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

export interface SettingEntry {
  key_name: string;
  value: string;
  created_at?: string;
  updated_at?: string;
}
