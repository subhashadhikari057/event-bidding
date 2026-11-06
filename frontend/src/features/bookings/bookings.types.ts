import type { WorkRequestStatus } from "@/features/work-requests/work-requests.types";

export type BookingStatus = "CONFIRMED" | "CANCELLED";
export type PaymentStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID";
export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "ESEWA" | "KHALTI" | "OTHER";

export interface PaymentSummary {
  bookingAmount: string;
  totalPaid: string;
  pendingAmount: string;
  paymentStatus: PaymentStatus;
}

export interface BookingPayment {
  id: string;
  amount: string;
  method: PaymentMethod;
  reference: string | null;
  notes: string | null;
  paidAt: string;
  createdAt: string;
}

export interface BookingWorkRequest {
  id: string;
  title: string;
  eventDate: string;
  eventLocation: string;
  status: WorkRequestStatus;
}

export interface AdminBooking {
  id: string;
  reference: string;
  amount: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  workRequest: BookingWorkRequest;
  vendor: {
    id: string;
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
  };
  bid: {
    id: string;
    amount: string;
    notes: string | null;
    status: "SUBMITTED" | "ACCEPTED" | "REJECTED";
    submittedAt: string;
  };
  payments: BookingPayment[];
  summary: PaymentSummary;
}

export interface VendorBooking {
  id: string;
  reference: string;
  status: BookingStatus;
  createdAt: string;
  workRequest: BookingWorkRequest;
  acceptedAmount: string;
  payments: BookingPayment[];
  summary: PaymentSummary;
}

export interface RecordPaymentInput {
  amount: string;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  paidAt?: string;
}

export interface RecordPaymentResponse {
  message: string;
  payment: BookingPayment;
  summary: PaymentSummary;
}
