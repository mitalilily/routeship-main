import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { FiRefreshCw, FiSend } from 'react-icons/fi'
import { createFtlRequest, fetchMyFtlRequests, type FtlRequest, type FtlRequestPayload } from '../../api/ftl.api'
import { toast } from '../../components/UI/Toast'
import ListPageLayout from '../../components/UI/layout/ListPageLayout'

const initialForm: FtlRequestPayload = {
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  companyName: '',
  originCity: '',
  originState: '',
  originPincode: '',
  originAddress: '',
  destinationCity: '',
  destinationState: '',
  destinationPincode: '',
  destinationAddress: '',
  vehicleType: '',
  materialType: '',
  weightKg: '',
  truckCount: '1',
  loadingDate: '',
  notes: '',
}

const statusLabels: Record<string, { label: string; color: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' }> = {
  requested: { label: 'Requested', color: 'warning' },
  reviewing: { label: 'Reviewing', color: 'info' },
  quote_shared: { label: 'Quote Shared', color: 'primary' },
  processed: { label: 'Processed', color: 'primary' },
  in_transit: { label: 'In Transit', color: 'info' },
  delivered: { label: 'Delivered', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'error' },
}

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN')
}

export default function FtlOrders() {
  const jotformRef = useRef<HTMLDivElement | null>(null)
  const [form, setForm] = useState(initialForm)
  const [requests, setRequests] = useState<FtlRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const loadRequests = async () => {
    setLoading(true)
    try {
      const data = await fetchMyFtlRequests({ page: 1, limit: 25 })
      setRequests(data.requests || [])
    } catch (error: any) {
      toast.open({ message: error?.response?.data?.message || 'Failed to load FTL requests', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  useEffect(() => {
    if (!jotformRef.current || jotformRef.current.dataset.loaded === 'true') return
    jotformRef.current.dataset.loaded = 'true'
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = 'https://www.jotform.com/jsform/262000142501434'
    script.async = true
    jotformRef.current.appendChild(script)
  }, [])

  const handleChange = (field: keyof FtlRequestPayload) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      await createFtlRequest(form)
      toast.open({ message: 'FTL request sent to admin team', severity: 'success' })
      setForm(initialForm)
      await loadRequests()
    } catch (error: any) {
      toast.open({ message: error?.response?.data?.message || 'Failed to submit FTL request', severity: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ListPageLayout
      title="Full Truck Load (FTL)"
      description="Submit manual FTL movement details and track the AWB/status once the admin team processes it."
      actions={[
        {
          label: loading ? 'Refreshing...' : 'Refresh',
          onClick: loadRequests,
          icon: <FiRefreshCw />,
          variant: 'outlined',
        },
      ]}
    >
      <Stack spacing={2}>
        <Alert severity="info">
          FTL bookings are handled manually. Submit the internal request below so it reaches the
          admin panel; the embedded Jotform is also available in the requested format.
        </Alert>

        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              FTL request details
            </Typography>
            <Box component="form" onSubmit={handleSubmit}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                  gap: 2,
                }}
              >
                {[
                  ['customerName', 'Contact Name *'],
                  ['customerPhone', 'Contact Phone *'],
                  ['customerEmail', 'Email'],
                  ['companyName', 'Company Name'],
                  ['originCity', 'Origin City *'],
                  ['originState', 'Origin State'],
                  ['originPincode', 'Origin Pincode *'],
                  ['destinationCity', 'Destination City *'],
                  ['destinationState', 'Destination State'],
                  ['destinationPincode', 'Destination Pincode *'],
                  ['vehicleType', 'Vehicle Type *'],
                  ['materialType', 'Material Type *'],
                  ['weightKg', 'Weight (kg)'],
                  ['truckCount', 'Truck Count'],
                  ['loadingDate', 'Loading Date'],
                ].map(([field, label]) => (
                  <Box key={field}>
                    <TextField
                      fullWidth
                      size="small"
                      type={field === 'loadingDate' ? 'date' : 'text'}
                      label={label}
                      InputLabelProps={field === 'loadingDate' ? { shrink: true } : undefined}
                      value={form[field as keyof FtlRequestPayload] || ''}
                      onChange={handleChange(field as keyof FtlRequestPayload)}
                    />
                  </Box>
                ))}
                <Box>
                  <TextField fullWidth multiline minRows={2} size="small" label="Pickup Address" value={form.originAddress} onChange={handleChange('originAddress')} />
                </Box>
                <Box>
                  <TextField fullWidth multiline minRows={2} size="small" label="Delivery Address" value={form.destinationAddress} onChange={handleChange('destinationAddress')} />
                </Box>
                <Box sx={{ gridColumn: { md: '1 / -1' } }}>
                  <TextField fullWidth multiline minRows={2} size="small" label="Notes / special instructions" value={form.notes} onChange={handleChange('notes')} />
                </Box>
              </Box>
              <Button type="submit" variant="contained" startIcon={<FiSend />} disabled={submitting} sx={{ mt: 2, borderRadius: 2, textTransform: 'none' }}>
                {submitting ? 'Submitting...' : 'Send FTL Request'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              My FTL requests
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Request</TableCell>
                    <TableCell>Route</TableCell>
                    <TableCell>Vehicle</TableCell>
                    <TableCell>AWB</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Processed Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.length ? requests.map((request) => {
                    const status = statusLabels[request.status] || { label: request.status, color: 'default' as const }
                    return (
                      <TableRow key={request.id}>
                        <TableCell>{request.requestNumber}</TableCell>
                        <TableCell>{request.originCity} → {request.destinationCity}</TableCell>
                        <TableCell>{request.vehicleType}</TableCell>
                        <TableCell>{request.awbNumber || '—'}</TableCell>
                        <TableCell><Chip size="small" label={status.label} color={status.color} /></TableCell>
                        <TableCell>{formatDate(request.processedDate)}</TableCell>
                      </TableRow>
                    )
                  }) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">{loading ? 'Loading...' : 'No FTL requests yet'}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              FTL Jotform
            </Typography>
            <Box ref={jotformRef} sx={{ minHeight: 520 }} />
          </CardContent>
        </Card>
      </Stack>
    </ListPageLayout>
  )
}
