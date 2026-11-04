import type { WorkRequestStatus } from "@/features/work-requests/work-requests.types";

export type BidStatus = "SUBMITTED" | "ACCEPTED" | "REJECTED";

export interface SubmittedBid {
  id: string;
  invitationId: string;
  amount: string;
  notes: string | null;
  status: BidStatus;
  submittedAt: string;
}

export interface VendorBid extends SubmittedBid {
  workRequest: {
    id: string;
    title: string;
    eventDate: string;
    eventLocation: string;
    status: WorkRequestStatus;
  };
}

export interface ComparisonBid {
  id: string;
  vendor: {
    id: string;
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
  };
  amount: string;
  notes: string | null;
  status: BidStatus;
  submittedAt: string;
  accepted: boolean;
}

export interface BidComparison {
  workRequestId: string;
  totalBids: number;
  lowestBid: string | null;
  bids: ComparisonBid[];
}

export interface AcceptedBooking {
  id: string;
  workRequestId: string;
  bidId: string;
  amount: string;
  status: "CONFIRMED";
  createdAt: string;
}
