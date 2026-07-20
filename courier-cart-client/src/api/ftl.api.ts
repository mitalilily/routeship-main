import axiosInstance from './axiosInstance'

export type FtlRequestPayload = {
  customerName: string
  customerPhone: string
  customerEmail?: string
  companyName?: string
  originCity: string
  originState?: string
  originPincode: string
  originAddress?: string
  destinationCity: string
  destinationState?: string
  destinationPincode: string
  destinationAddress?: string
  vehicleType: string
  materialType: string
  weightKg?: string | number
  truckCount?: string | number
  loadingDate?: string
  notes?: string
}

export type FtlRequest = FtlRequestPayload & {
  id: string
  requestNumber: string
  status: string
  awbNumber?: string | null
  processedDate?: string | null
  adminNotes?: string | null
  createdAt?: string
  updatedAt?: string
}

export async function createFtlRequest(payload: FtlRequestPayload) {
  const { data } = await axiosInstance.post('/ftl/requests', payload)
  return data
}

export async function fetchMyFtlRequests(params: {
  page?: number
  limit?: number
  status?: string
  search?: string
}) {
  const { data } = await axiosInstance.get('/ftl/requests', { params })
  return data as { success: boolean; requests: FtlRequest[]; totalCount: number; totalPages: number }
}
