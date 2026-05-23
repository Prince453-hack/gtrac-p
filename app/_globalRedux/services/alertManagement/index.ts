import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface VehicleService {
  id: number;
  email_id: string;
  phone_numbers: string;
  vehicle_id: string;
  vehicle_reg: string;
  user_id: string;
  service_type: string;
  description?: string;
  last_service_date?: string;
  next_due_date?: string;
  next_due_mileage?: number;
  reminder_status:
    | "pending"
    | "alerted"
    | "snoozed"
    | "completed"
    | "cancelled";
  alert_triggered_at?: string;
  alert_trigger_type: "interval_based" | "mileage_based" | "due_date_based";
  snooze_until?: string;
  created_at: string;
  updated_at: string;
  popup_required: boolean;
  email_required: boolean;
  sms_required: boolean;
  interval_days?: number;
  notes?: string;
}

export interface VehicleDocument {
  id: number;
  email_id: string;
  phone_numbers: string;
  vehicle_id: string;
  vehicle_reg: string;
  user_id: string;
  document_type: string;
  document_number?: string;
  description?: string;
  issue_date?: string;
  expiry_date: string;
  reminder_status:
    | "pending"
    | "alerted"
    | "snoozed"
    | "completed"
    | "cancelled";
  alert_triggered_at?: string;
  alert_trigger_type?: "interval_based" | "mileage_based" | "due_date_based";
  snooze_until?: string;
  created_at: string;
  updated_at: string;
  popup_required: boolean;
  email_required: boolean;
  sms_required: boolean;
  interval_days?: number;
  notes?: string;
}

export interface ReminderNotification {
  id: number;
  phone_numbers: string;
  email_id: string;
  user_id: string;
  alert_type: "service" | "document";
  service_id?: number;
  document_id?: number;
  status: "pending" | "alerted" | "snoozed" | "completed" | "cancelled";
  message: string;
  sent_at: string;
  read_at?: string;
  sent_via_email: boolean;
  sent_via_sms: boolean;
  sent_via_popup: boolean;
  created_at: string;
  updated_at: string;
  service?: VehicleService;
  document?: VehicleDocument;
}

export interface CreateVehicleServiceRequest {
  emailIds: string;
  phoneNumbers: string;
  vehicleId: string;
  vehicleReg: string;
  userId: string;
  serviceType: string;
  description?: string;
  lastServiceDate?: string;
  nextDueDate?: string;
  nextDueMileage?: number;
  alertTriggerType: "interval_based" | "mileage_based" | "due_date_based";
  intervalDays?: number;
  popupRequired: boolean;
  emailRequired: boolean;
  smsRequired: boolean;
  notes?: string;
}

export interface CreateVehicleDocumentRequest {
  emailIds: string;
  phoneNumbers: string;
  vehicleId: string;
  vehicleReg: string;
  userId: string;
  documentType: string;
  documentNumber?: string;
  description?: string;
  issueDate?: string;
  expiryDate: string;
  alertTriggerType?: "interval_based" | "mileage_based" | "due_date_based";
  intervalDays?: number;
  popupRequired: boolean;
  emailRequired: boolean;
  smsRequired: boolean;
  notes?: string;
}

export interface UpdateVehicleDocumentRequest
  extends CreateVehicleDocumentRequest {
  reminderStatus?:
    | "pending"
    | "alerted"
    | "snoozed"
    | "completed"
    | "cancelled";
}

export const alertManagementApi = createApi({
  reducerPath: "alertManagementApi",
  refetchOnFocus: true,
  tagTypes: ["VehicleServices", "VehicleDocuments", "ReminderNotifications"],

  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_ALERT_MANAGEMENT_API,
  }),

  endpoints: (builder) => ({
    getVehicleServices: builder.query<
      VehicleService[],
      {
        userId?: string;
        status?: string;
        serviceType?: string;
        vehicleId?: string;
        vehicleReg?: string;
        alertTriggerType?: string;
        nextDueDate?: string;
        nextDueMileage?: string;
        lastServiceDate?: string;
        nextDueDateFrom?: string;
        nextDueDateTo?: string;
      }
    >({
      query: ({
        userId,
        status,
        serviceType,
        vehicleId,
        vehicleReg,
        alertTriggerType,
        nextDueDate,
        nextDueMileage,
        lastServiceDate,
        nextDueDateFrom,
        nextDueDateTo,
      }) => {
        const params = new URLSearchParams();
        if (userId) params.append("userId", userId);
        if (status) params.append("status", status);
        if (serviceType) params.append("serviceType", serviceType);
        if (vehicleId) params.append("vehicleId", vehicleId);
        if (vehicleReg) params.append("vehicleReg", vehicleReg);
        if (alertTriggerType)
          params.append("alertTriggerType", alertTriggerType);
        if (nextDueDate) params.append("nextDueDate", nextDueDate);
        if (nextDueMileage) params.append("nextDueMileage", nextDueMileage);
        if (lastServiceDate) params.append("lastServiceDate", lastServiceDate);
        if (nextDueDateFrom) params.append("nextDueDateFrom", nextDueDateFrom);
        if (nextDueDateTo) params.append("nextDueDateTo", nextDueDateTo);
        return `vehicle-services?${params.toString()}`;
      },
      providesTags: ["VehicleServices"],
    }),

    getVehicleServiceById: builder.query<VehicleService, number>({
      query: (id) => `vehicle-services/${id}`,
      providesTags: ["VehicleServices"],
    }),

    createVehicleService: builder.mutation<
      VehicleService,
      CreateVehicleServiceRequest
    >({
      query: (body) => ({
        url: "vehicle-services",
        method: "POST",
        body,
      }),
      invalidatesTags: ["VehicleServices"],
    }),

    updateVehicleService: builder.mutation<
      VehicleService,
      { id: number; data: Partial<CreateVehicleServiceRequest> }
    >({
      query: ({ id, data }) => ({
        url: `vehicle-services/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["VehicleServices"],
    }),

    deleteVehicleService: builder.mutation<void, number>({
      query: (id) => ({
        url: `vehicle-services/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["VehicleServices"],
    }),

    // Vehicle Documents endpoints
    getVehicleDocuments: builder.query<
      VehicleDocument[],
      {
        userId?: string;
        status?: string;
        vehicleId?: string;
        vehicleReg?: string;
        documentType?: string;
        alertTriggerType?: string;
        issueDate?: string;
        expiryDateFrom?: string;
        expiryDateTo?: string;
      }
    >({
      query: ({
        userId,
        status,
        vehicleId,
        documentType,
        alertTriggerType,
        issueDate,
        expiryDateFrom,
        expiryDateTo,
      }) => {
        const params = new URLSearchParams();
        if (userId) params.append("userId", userId);
        if (status) params.append("status", status);
        if (vehicleId) params.append("vehicleId", vehicleId);
        if (documentType) params.append("documentType", documentType);
        if (alertTriggerType)
          params.append("alertTriggerType", alertTriggerType);
        if (issueDate) params.append("issueDate", issueDate);
        if (expiryDateFrom) params.append("expiryDateFrom", expiryDateFrom);
        if (expiryDateTo) params.append("expiryDateTo", expiryDateTo);

        return `vehicle-documents?${params.toString()}`;
      },
      providesTags: ["VehicleDocuments"],
    }),

    getVehicleDocumentById: builder.query<VehicleDocument, number>({
      query: (id) => `vehicle-documents/${id}`,
      providesTags: ["VehicleDocuments"],
    }),

    createVehicleDocument: builder.mutation<
      VehicleDocument,
      CreateVehicleDocumentRequest
    >({
      query: (body) => ({
        url: "vehicle-documents",
        method: "POST",
        body,
      }),
      invalidatesTags: ["VehicleDocuments"],
    }),

    updateVehicleDocument: builder.mutation<
      VehicleDocument,
      { id: number; data: Partial<UpdateVehicleDocumentRequest> }
    >({
      query: ({ id, data }) => ({
        url: `vehicle-documents/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["VehicleDocuments"],
    }),

    deleteVehicleDocument: builder.mutation<void, number>({
      query: (id) => ({
        url: `vehicle-documents/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["VehicleDocuments"],
    }),

    // Reminder Notifications endpoints
    getReminderNotifications: builder.query<
      ReminderNotification[],
      {
        userId?: string;
        status?: string;
        alertType?: "service" | "document";
        startDate: string;
        endDate: string;
      }
    >({
      query: ({ userId, status, alertType, startDate, endDate }) => {
        const params = new URLSearchParams();

        params.append("startDate", startDate);
        params.append("endDate", endDate);

        if (userId) params.append("userId", userId);
        if (status) params.append("status", status);
        if (alertType) params.append("alertType", alertType);
        return `reminder-notifications?${params.toString()}`;
      },
      providesTags: ["ReminderNotifications"],
    }),

    getReminderNotificationById: builder.query<ReminderNotification, number>({
      query: (id) => `reminder-notifications/${id}`,
      providesTags: ["ReminderNotifications"],
    }),

    markReminderAsRead: builder.mutation<ReminderNotification, number>({
      query: (id) => ({
        url: `reminder-notifications/${id}/mark-as-read`,
        method: "PUT",
      }),
      invalidatesTags: ["ReminderNotifications"],
    }),

    deleteReminderNotification: builder.mutation<void, number>({
      query: (id) => ({
        url: `reminder-notifications/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ReminderNotifications"],
    }),
  }),
});

export const {
  // Vehicle Services hooks
  useGetVehicleServicesQuery,
  useLazyGetVehicleServicesQuery,
  useGetVehicleServiceByIdQuery,
  useCreateVehicleServiceMutation,
  useUpdateVehicleServiceMutation,
  useDeleteVehicleServiceMutation,

  // Vehicle Documents hooks
  useGetVehicleDocumentsQuery,
  useLazyGetVehicleDocumentsQuery,
  useGetVehicleDocumentByIdQuery,
  useCreateVehicleDocumentMutation,
  useUpdateVehicleDocumentMutation,
  useDeleteVehicleDocumentMutation,

  // Reminder Notifications hooks
  useGetReminderNotificationsQuery,
  useLazyGetReminderNotificationByIdQuery,
  useLazyGetReminderNotificationsQuery,
  useGetReminderNotificationByIdQuery,
  useMarkReminderAsReadMutation,
  useDeleteReminderNotificationMutation,
} = alertManagementApi;
