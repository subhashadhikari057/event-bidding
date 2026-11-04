export interface VendorAccount {
  id: string;
  name: string;
  email: string;
  role: "VENDOR";
  isActive: boolean;
}

export interface Vendor {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string | null;
  category: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user: VendorAccount | null;
}

export interface CreateVendorInput {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address?: string;
  category?: string;
  password: string;
}

export type UpdateVendorInput = Partial<
  Pick<Vendor, "companyName" | "contactPerson" | "email" | "phone"> & {
    address: string;
    category: string;
  }
>;

export interface ResetVendorPasswordResponse {
  message: string;
  temporaryPassword?: string;
}
