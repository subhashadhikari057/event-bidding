export type WorkRequestStatus = "DRAFT" | "OPEN" | "BOOKED" | "CANCELLED";
export type InvitationStatus = "PENDING" | "RESPONDED";
export type BidStatus = "SUBMITTED" | "ACCEPTED" | "REJECTED";
export type BookingStatus = "CONFIRMED" | "CANCELLED";
export type PaymentStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID";

export interface VendorSummary {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  isActive: boolean;
}

export interface WorkRequestSummary {
  id: string;
  title: string;
  eventDate: string;
  eventLocation: string;
  status: WorkRequestStatus;
  createdAt: string;
  updatedAt: string;
  _count: { items: number; invitations: number };
}

export interface AdminBidSummary {
  totalBids: number;
  submitted: number;
  accepted: number;
  rejected: number;
}

export interface PaymentSummary {
  bookingAmount: string;
  totalPaid: string;
  pendingAmount: string;
  paymentStatus: PaymentStatus;
}

export interface AdminBooking {
  id: string;
  amount: string;
  status: BookingStatus;
  createdAt: string;
  workRequest: {
    id: string;
    title: string;
    eventDate: string;
    eventLocation: string;
    status: WorkRequestStatus;
  };
  vendor: {
    id: string;
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
  };
  summary: PaymentSummary;
}

export interface AssignedRequest {
  id: string;
  status: InvitationStatus;
  createdAt: string;
  workRequest: {
    id: string;
    title: string;
    eventDate: string;
    eventLocation: string;
    status: WorkRequestStatus;
    createdAt: string;
  };
}

export interface VendorBid {
  id: string;
  amount: string;
  notes: string | null;
  status: BidStatus;
  submittedAt: string;
  workRequest: {
    id: string;
    title: string;
    eventDate: string;
    eventLocation: string;
    status: WorkRequestStatus;
  };
}

export interface VendorBooking {
  id: string;
  status: BookingStatus;
  createdAt: string;
  acceptedAmount: string;
  workRequest: AdminBooking["workRequest"];
  summary: PaymentSummary;
}
