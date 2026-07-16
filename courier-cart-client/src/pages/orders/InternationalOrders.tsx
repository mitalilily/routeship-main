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
import { FiGlobe, FiPlusCircle } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import ListPageLayout from '../../components/UI/layout/ListPageLayout'

const sampleRows = [
  {
    id: 'INT-1001',
    consignee: 'Awaiting first international order',
    country: '-',
    mode: '-',
    status: 'Draft',
    createdAt: '-',
  },
]

export default function InternationalOrders() {
  const navigate = useNavigate()

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
                <TableCell>Status</TableCell>
                <TableCell>Created At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sampleRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.consignee}</TableCell>
                  <TableCell>{row.country}</TableCell>
                  <TableCell>{row.mode}</TableCell>
                  <TableCell>
                    <Chip size="small" label={row.status} color="warning" variant="outlined" />
                  </TableCell>
                  <TableCell>{row.createdAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ px: 2, py: 2.5, borderTop: '1px solid #E2E8F0' }}>
          <Typography sx={{ color: '#6B7280', fontSize: '0.88rem' }}>
            International shipment records will appear here once booking is connected.
          </Typography>
        </Box>
      </Paper>
    </ListPageLayout>
  )
}
