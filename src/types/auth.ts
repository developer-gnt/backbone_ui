export interface AuthUser {
  id: number;
  email: string | null;
  username: string | null;
  firstname: string | null;
  lastname: string | null;
  companyname?: string | null;
  mobileno?: string | null;
  officeno?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipcode?: string | null;
  std_instr?: string | null;
  wallete_balance?: number | string | null;
  points?: number | null;
  feedback_points?: number | null;
  free_trial?: string | null;
  expiry_date?: string | null;
  role: string | null;
  status: string | null;
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
}
