export type WorkRequestStatus = "DRAFT" | "OPEN" | "BOOKED" | "CANCELLED";
export type InvitationStatus = "PENDING" | "RESPONDED";

export interface RequestItemInput {
  name: string;
  description?: string;
  quantity: number;
  unit?: string;
}

export interface RequestItem extends RequestItemInput {
  id: string;
  workRequestId: string;
  createdAt: string;
}

export interface RequestPhoto {
  id: string;
  workRequestId: string;
  imageUrl: string;
  createdAt: string;
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

export interface WorkRequest extends Omit<WorkRequestSummary, "_count"> {
  description: string;
  items: RequestItem[];
  photos: RequestPhoto[];
  createdBy: { id: string; name: string; email: string; role: "ADMIN" };
}

export interface WorkRequestInput {
  title: string;
  description: string;
  eventDate: string;
  eventLocation: string;
  items: RequestItemInput[];
}

export interface InvitationVendor {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  isActive: boolean;
}

export interface RequestInvitation {
  id: string;
  status: InvitationStatus;
  createdAt: string;
  updatedAt: string;
  vendor: InvitationVendor;
}

export interface AssignedRequest {
  id: string;
  status: InvitationStatus;
  createdAt: string;
  workRequest: Pick<WorkRequestSummary, "id" | "title" | "eventDate" | "eventLocation" | "status" | "createdAt">;
}

export interface AssignedRequestDetail {
  id: string;
  status: InvitationStatus;
  createdAt: string;
  workRequest: Pick<WorkRequest, "id" | "title" | "description" | "eventDate" | "eventLocation" | "status" | "items" | "photos">;
}
