import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { FiGlobe, FiPlusCircle } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { fetchMyInternationalShipments } from '../../api/international.api'
import { toast } from '../../components/UI/Toast'
import ListPageLayout from '../../components/UI/layout/ListPageLayout'

const statusColor = (status?: string) => {
  if (status === 'booked' || status === 'in_transit') return 'primary'
  if (status === 'delivered') return 'success'
  if (status === 'cancelled') return 'error'
  return 'warning'
}

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN')
}

export default function InternationalOrders() {
  const navigate = useNavigate()
  const [shipments, setShipments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const loadShipments = async () => {
    setLoading(true)
    try {
      const data = await fetchMyInternationalShipments({ page: 1, limit: 25 })
      setShipments(data.shipments || [])
    } catch (error: any) {
      toast.open({ message: error?.response?.data?.message || 'Failed to load international shipments', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadShipments()
  }, [])

  return (
    <ListPageLayout
      title="International Orders"
      description="Create and manage international shipments"
      actions={[
        {
          label: 'Create International Order',
          onClick: () => navigate('/orders/international/create'),
          icon: <FiPlusCircle />,
          variant: 'contained',
        },
      ]}
    >
      <Paper
        elevation={0}
        sx={{
          border: '1px solid #E2E8F0',
          borderRadius: 2,
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          gap={1.5}
          sx={{ p: 2, borderBottom: '1px solid #E2E8F0' }}
        >
          <Stack direction="row" alignItems="center" gap={1}>
            <Box sx={{ color: '#E85500', display: 'flex' }}>
              <FiGlobe size={20} />
            </Box>
            <Typography sx={{ fontWeight: 800, color: '#111827' }}>
              International Order Book
            </Typography>
          </Stack>
          <Button
            variant="outlined"
            startIcon={<FiPlusCircle />}
            onClick={() => navigate('/orders/international/create')}
            sx={{ textTransform: 'none', borderRadius: 1.5 }}
          >
            New Order
          </Button>
        </Stack>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Order #</TableCell>
                <TableCell>Consignee</TableCell>
                <TableCell>Country</TableCell>
                <TableCell>Mode</TableCell>
                <TableCell>AWB</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Booked Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shipments.length ? shipments.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.shipmentNumber}</TableCell>
                  <TableCell>{row.consigneeName}</TableCell>
                  <TableCell>{row.destinationCountry}</TableCell>
                  <TableCell>{row.shippingMode || '—'}</TableCell>
                  <TableCell>{row.awbNumber || '—'}</TableCell>
                  <TableCell>
                    <Chip size="small" label={String(row.status || '').replace(/_/g, ' ')} color={statusColor(row.status)} variant="outlined" />
                  </TableCell>
                  <TableCell>{formatDate(row.bookedDate)}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">{loading ? 'Loading...' : 'No international shipments yet'}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ px: 2, py: 2.5, borderTop: '1px solid #E2E8F0' }}>
          <Typography sx={{ color: '#6B7280', fontSize: '0.88rem' }}>
            Submit an international shipment request and the admin team will update AWB, booked
            status and booking date here after manual booking.
          </Typography>
        </Box>
      </Paper>
    </ListPageLayout>
  )
}
