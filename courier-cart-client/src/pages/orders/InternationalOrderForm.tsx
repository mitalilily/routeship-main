import {
  Box,
  Button,
  FormControlLabel,
  Grid,
  InputAdornment,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import type React from 'react'
import { FiChevronUp, FiPlus, FiTrash2, FiX } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { toast } from '../../components/UI/Toast'
import { usePickupAddresses } from '../../hooks/Pickup/usePickupAddresses'

const BRAND_PURPLE = '#7357FF'
const PAGE_BG = '#F4F5F9'
const BORDER = '#DEE4F0'
const TEXT = '#07132D'
const MUTED = '#8C96BC'

type ProductRow = {
  id: number
  productName: string
  sku: string
  unitPrice: string
  quantity: string
}

type PackageRow = {
  id: number
  length: string
  breadth: string
  height: string
  physicalWeight: string
  count: string
}

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    minHeight: 36,
    borderRadius: '4px',
    backgroundColor: '#FFFFFF',
    fontSize: '0.82rem',
    '& fieldset': {
      borderColor: BORDER,
    },
    '&:hover fieldset': {
      borderColor: '#B9C3DA',
    },
    '&.Mui-focused fieldset': {
      borderColor: BRAND_PURPLE,
      borderWidth: 1,
    },
  },
  '& .MuiOutlinedInput-input': {
    py: 0.9,
    px: 1.4,
  },
  '& .MuiInputBase-input::placeholder': {
    color: '#9AA3C4',
    opacity: 1,
  },
}

const labelSx = {
  fontSize: '0.78rem',
  color: TEXT,
  mb: 0.7,
  fontWeight: 500,
}

function Section({
  title,
  subtitle,
  children,
  headerRight,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  headerRight?: React.ReactNode
}) {
  return (
    <Box
      sx={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E8ECF4',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        sx={{ px: 2, py: 2.1, borderBottom: '1px solid #E8ECF4' }}
      >
        <Box>
          <Typography sx={{ color: TEXT, fontWeight: 700, fontSize: '1rem' }}>{title}</Typography>
          {subtitle ? (
            <Typography sx={{ color: MUTED, fontSize: '0.72rem', mt: 0.45 }}>{subtitle}</Typography>
          ) : null}
        </Box>
        {headerRight}
      </Stack>
      <Box sx={{ p: 2 }}>{children}</Box>
    </Box>
  )
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  required,
  type = 'text',
  disabled,
  select,
  children,
  adornment,
}: {
  label: string
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  required?: boolean
  type?: string
  disabled?: boolean
  select?: boolean
  children?: React.ReactNode
  adornment?: string
}) {
  return (
    <Box>
      <Typography sx={labelSx}>
        {label}
        {required ? ' *' : ''}
      </Typography>
      <TextField
        fullWidth
        size="small"
        type={type}
        select={select}
        value={value ?? ''}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange?.(event.target.value)}
        sx={fieldSx}
        InputProps={{
          endAdornment: adornment ? (
            <InputAdornment position="end" sx={{ '& .MuiTypography-root': { fontSize: '0.78rem' } }}>
              {adornment}
            </InputAdornment>
          ) : undefined,
        }}
      >
        {children}
      </TextField>
    </Box>
  )
}

export default function InternationalOrderForm() {
  const navigate = useNavigate()
  const [paymentMethod, setPaymentMethod] = useState('prepaid')
  const [rov, setRov] = useState('owner-risk')
  const [itemType, setItemType] = useState('non-commercial')
  const [itemCategory, setItemCategory] = useState('document')
  const [shippingMode, setShippingMode] = useState('')
  const [selectedPickupId, setSelectedPickupId] = useState('')
  const { data: pickupData } = usePickupAddresses({ page: 1, limit: 100 })
  const [products, setProducts] = useState<ProductRow[]>([
    { id: 1, productName: '', sku: '', unitPrice: '', quantity: '' },
  ])
  const [packages, setPackages] = useState<PackageRow[]>([
    { id: 1, length: '', breadth: '', height: '', physicalWeight: '', count: '1' },
  ])

  const productTotal = useMemo(
    () =>
      products.reduce((sum, product) => {
        const unitPrice = Number(product.unitPrice) || 0
        const quantity = Number(product.quantity) || 0
        return sum + unitPrice * quantity
      }, 0),
    [products],
  )

  const packageTotals = useMemo(() => {
    return packages.reduce(
      (acc, row) => {
        const length = Number(row.length) || 0
        const breadth = Number(row.breadth) || 0
        const height = Number(row.height) || 0
        const weight = Number(row.physicalWeight) || 0
        const count = Number(row.count) || 0
        const volumetric = length && breadth && height ? (length * breadth * height * count) / 5000 : 0
        return {
          boxes: acc.boxes + count,
          physical: acc.physical + weight * count,
          volumetric: acc.volumetric + volumetric,
        }
      },
      { boxes: 0, physical: 0, volumetric: 0 },
    )
  }, [packages])

  const applicableWeight = Math.max(packageTotals.physical, packageTotals.volumetric)
  const pickupAddresses = pickupData?.pickupAddresses ?? []
  const selectedPickup = pickupAddresses.find((row) => row.pickupId === selectedPickupId)

  useEffect(() => {
    if (selectedPickupId || pickupAddresses.length === 0) return

    const defaultPickup = pickupAddresses.find((row) => row.isPrimary) ?? pickupAddresses[0]
    setSelectedPickupId(defaultPickup.pickupId)
  }, [pickupAddresses, selectedPickupId])

  const formatPickupAddress = (row: (typeof pickupAddresses)[number]) => {
    const pickup = row.pickup
    return [
      pickup?.addressNickname || pickup?.contactName || 'Warehouse',
      [pickup?.addressLine1, pickup?.addressLine2, pickup?.landmark].filter(Boolean).join(', '),
      [pickup?.city, pickup?.state].filter(Boolean).join(', '),
      pickup?.pincode,
    ]
      .filter(Boolean)
      .join(' - ')
  }

  const updateProduct = (id: number, field: keyof ProductRow, value: string) => {
    setProducts((current) =>
      current.map((product) => (product.id === id ? { ...product, [field]: value } : product)),
    )
  }

  const updatePackage = (id: number, field: keyof PackageRow, value: string) => {
    setPackages((current) =>
      current.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    )
  }

  return (
    <Box sx={{ minHeight: 'calc(100vh - 52px)', backgroundColor: PAGE_BG, p: { xs: 1, md: 2 } }}>
      <Stack spacing={2.2}>
        <Section title="Pickup From">
          <Stack direction="row" spacing={1.6} alignItems="center">
            <TextField
              select
              value={selectedPickupId}
              onChange={(event) => setSelectedPickupId(event.target.value)}
              placeholder="Select saved warehouse address"
              size="small"
              sx={{ ...fieldSx, width: { xs: '100%', md: 840 } }}
            >
              {pickupAddresses.length === 0 ? (
                <MenuItem value="" disabled>
                  No saved warehouse address found
                </MenuItem>
              ) : (
                pickupAddresses.map((row) => (
                  <MenuItem key={row.pickupId} value={row.pickupId}>
                    {formatPickupAddress(row)}
                  </MenuItem>
                ))
              )}
            </TextField>
            <Button
              variant="contained"
              onClick={() => navigate('/settings/manage_pickups')}
              sx={{
                minWidth: 40,
                height: 34,
                borderRadius: '4px',
                backgroundColor: BRAND_PURPLE,
                px: 0,
              }}
            >
              <FiPlus size={18} />
            </Button>
          </Stack>
          {selectedPickup ? (
            <Typography sx={{ color: MUTED, fontSize: '0.72rem', mt: 1 }}>
              Pickup contact: {selectedPickup.pickup?.contactName || '-'} -{' '}
              {selectedPickup.pickup?.contactPhone || '-'}
            </Typography>
          ) : null}
        </Section>

        <Section
          title="Deliver To"
          subtitle="Select saved consignee or add delivery details manually"
        >
          <Stack spacing={1.8}>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
              <Box sx={{ width: { xs: '100%', md: 860 } }}>
                <Field
                  label="Search Saved Consignee"
                  placeholder="Search by name, mobile, email, city or pincode"
                />
              </Box>
              <Button
                variant="contained"
                sx={{
                  alignSelf: { xs: 'stretch', md: 'flex-end' },
                  width: { md: 260 },
                  minHeight: 34,
                  borderRadius: '4px',
                  backgroundColor: BRAND_PURPLE,
                  textTransform: 'none',
                }}
              >
                Hide Consignee Details
              </Button>
            </Stack>

            <Box sx={{ border: '1px solid #E8ECF4', borderRadius: '4px', p: 1.6 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography sx={{ color: TEXT, fontWeight: 600 }}>Consignee Details</Typography>
                <Typography sx={{ color: MUTED, fontSize: '0.72rem' }}>
                  Fields marked * are required
                </Typography>
              </Stack>

              <Typography sx={{ color: MUTED, fontSize: '0.76rem', mb: 1.4 }}>
                Contact Information
              </Typography>
              <Grid container spacing={1.6}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Field label="Name" required />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Field label="Mobile" required />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Field label="Alternate Mobile" />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Field label="Email" />
                </Grid>
              </Grid>

              <Typography sx={{ color: MUTED, fontSize: '0.76rem', mt: 2, mb: 1.4 }}>
                Additional Details
              </Typography>
              <Grid container spacing={1.6}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Field label="GSTIN" placeholder="ENTER GSTIN" />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Field label="Floor No" placeholder="Eg: 2nd Floor" />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Field label="Landmark" placeholder="Eg: Near SBI Bank" />
                </Grid>
              </Grid>

              <Typography sx={{ color: TEXT, fontSize: '0.78rem', mt: 2, mb: 1.4, fontWeight: 600 }}>
                Search on Google Map
              </Typography>
              <Typography sx={{ color: MUTED, fontSize: '0.76rem', mb: 1.4 }}>
                Address Information
              </Typography>
              <Grid container spacing={1.6}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Field label="Address Line 1" required />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Field label="Address Line 2" />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Field label="Pincode" required />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Field label="City" required />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Field label="State" required />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Field label="Country" required value="India" />
                </Grid>
              </Grid>
            </Box>
          </Stack>
        </Section>

        <Section title="Payment Method">
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <RadioGroup row value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <FormControlLabel value="cod" control={<Radio size="small" />} label="COD" />
                <FormControlLabel value="prepaid" control={<Radio size="small" />} label="Prepaid" />
              </RadioGroup>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Field label="ROV" select value={rov} onChange={setRov}>
                <MenuItem value="owner-risk">Owner Risk</MenuItem>
                <MenuItem value="carrier-risk">Carrier Risk</MenuItem>
              </Field>
            </Grid>
          </Grid>
        </Section>

        <Section title="Product Details">
          <Stack spacing={1.8}>
            <Box sx={{ width: { xs: '100%', md: 510 } }}>
              <Field
                label="Order Value / Total Invoice Value"
                required
                value={productTotal ? productTotal.toFixed(2) : ''}
                placeholder="Total Order Value"
                disabled
              />
              <Typography sx={{ color: MUTED, fontSize: '0.72rem', mt: 0.5 }}>
                Calculated from products.
              </Typography>
            </Box>

            {products.map((product) => {
              const total = (Number(product.unitPrice) || 0) * (Number(product.quantity) || 0)
              return (
                <Box key={product.id}>
                  <Grid container spacing={1.6} alignItems="flex-end">
                    <Grid size={{ xs: 12, md: 2 }}>
                      <Field
                        label="Product Name"
                        required
                        value={product.productName}
                        onChange={(value) => updateProduct(product.id, 'productName', value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                      <Field
                        label="SKU"
                        value={product.sku}
                        onChange={(value) => updateProduct(product.id, 'sku', value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                      <Field
                        label="Unit Price"
                        required
                        value={product.unitPrice}
                        onChange={(value) => updateProduct(product.id, 'unitPrice', value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                      <Field
                        label="QTY"
                        required
                        value={product.quantity}
                        onChange={(value) => updateProduct(product.id, 'quantity', value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                      <Field label="Total" required value={total.toString()} disabled />
                    </Grid>
                    <Grid size={{ xs: 12, md: 1 }}>
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<FiX />}
                        disabled={products.length === 1}
                        onClick={() => setProducts((rows) => rows.filter((row) => row.id !== product.id))}
                        sx={{ minHeight: 34, borderRadius: '4px', textTransform: 'none' }}
                      >
                        Delete
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              )
            })}

            <Box sx={{ borderTop: '1px solid #E8ECF4', pt: 1.6 }}>
              <Button
                variant="contained"
                startIcon={<FiPlus />}
                onClick={() =>
                  setProducts((rows) => [
                    ...rows,
                    { id: Date.now(), productName: '', sku: '', unitPrice: '', quantity: '' },
                  ])
                }
                sx={{ borderRadius: '4px', backgroundColor: BRAND_PURPLE, textTransform: 'none' }}
              >
                Add New
              </Button>
            </Box>
          </Stack>
        </Section>

        <Section title="Item Details">
          <Stack spacing={1.8}>
            <RadioGroup row value={itemType} onChange={(e) => setItemType(e.target.value)}>
              <Box
                sx={{
                  display: 'inline-flex',
                  border: '1px solid #E8ECF4',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: '#F4F5FA',
                }}
              >
                <FormControlLabel
                  value="non-commercial"
                  control={<Radio size="small" />}
                  label="Non Commercial"
                  sx={{
                    m: 0,
                    px: 1.2,
                    borderRight: '1px solid #C8D8FF',
                    backgroundColor: itemType === 'non-commercial' ? '#EEF4FF' : 'transparent',
                  }}
                />
                <FormControlLabel
                  value="commercial"
                  control={<Radio size="small" />}
                  label="Commercial"
                  sx={{
                    m: 0,
                    px: 1.2,
                    backgroundColor: itemType === 'commercial' ? '#EEF4FF' : 'transparent',
                  }}
                />
              </Box>
            </RadioGroup>

            <Grid container spacing={2.4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ border: `1px solid ${BORDER}`, borderRadius: '4px', p: 1.2, minHeight: 126 }}>
                  <Typography sx={{ color: MUTED, fontSize: '0.76rem' }}>Non Commercial</Typography>
                  <RadioGroup value={itemCategory} onChange={(e) => setItemCategory(e.target.value)}>
                    <FormControlLabel value="document" control={<Radio size="small" />} label="Document" />
                    <FormControlLabel value="sample" control={<Radio size="small" />} label="Sample" />
                    <FormControlLabel value="gift" control={<Radio size="small" />} label="Gift" />
                  </RadioGroup>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ border: `1px solid ${BORDER}`, borderRadius: '4px', p: 1.2, minHeight: 126 }}>
                  <Typography sx={{ color: MUTED, fontSize: '0.76rem' }}>Commercial</Typography>
                  <RadioGroup value={itemCategory} onChange={(e) => setItemCategory(e.target.value)}>
                    <FormControlLabel value="cargo" control={<Radio size="small" />} label="Cargo" />
                    <FormControlLabel
                      value="non-document-csb5"
                      control={<Radio size="small" />}
                      label="Non document / CSB5"
                    />
                  </RadioGroup>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ width: { xs: '100%', md: '50%' } }}>
              <Field label="Shipping Mode" select value={shippingMode} onChange={setShippingMode}>
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="air">Air</MenuItem>
                <MenuItem value="express">Express</MenuItem>
                <MenuItem value="economy">Economy</MenuItem>
              </Field>
            </Box>
          </Stack>
        </Section>

        <Section title="Package Details">
          <Stack spacing={1.8}>
            <Box sx={{ border: '1px solid #E8ECF4', borderRadius: '4px', p: 1.6 }}>
              {packages.map((row) => {
                const vol =
                  (Number(row.length) || 0) && (Number(row.breadth) || 0) && (Number(row.height) || 0)
                    ? ((Number(row.length) * Number(row.breadth) * Number(row.height)) / 5000).toFixed(2)
                    : '0.00'
                return (
                  <Grid key={row.id} container spacing={1} alignItems="flex-end">
                    <Grid size={{ xs: 12, md: 2 }}>
                      <Field
                        label="Length (cm)"
                        required
                        value={row.length}
                        onChange={(value) => updatePackage(row.id, 'length', value)}
                        adornment="cm"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                      <Field
                        label="Breadth (cm)"
                        required
                        value={row.breadth}
                        onChange={(value) => updatePackage(row.id, 'breadth', value)}
                        adornment="cm"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                      <Field
                        label="Height (cm)"
                        required
                        value={row.height}
                        onChange={(value) => updatePackage(row.id, 'height', value)}
                        adornment="cm"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                      <Field label="Vol. Weight" required value={vol} disabled adornment="kg" />
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                      <Field
                        label="Physical Weight"
                        required
                        value={row.physicalWeight}
                        onChange={(value) => updatePackage(row.id, 'physicalWeight', value)}
                        adornment="kg"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 1 }}>
                      <Field
                        label="Count"
                        value={row.count}
                        onChange={(value) => updatePackage(row.id, 'count', value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 1 }}>
                      <Button
                        variant="contained"
                        color="error"
                        disabled={packages.length === 1}
                        onClick={() => setPackages((rows) => rows.filter((item) => item.id !== row.id))}
                        sx={{ minHeight: 34, width: '100%', borderRadius: '4px' }}
                      >
                        X
                      </Button>
                    </Grid>
                  </Grid>
                )
              })}
            </Box>

            <Box sx={{ borderTop: '1px solid #E8ECF4', pt: 1.6 }}>
              <Button
                variant="contained"
                startIcon={<FiPlus />}
                onClick={() =>
                  setPackages((rows) => [
                    ...rows,
                    { id: Date.now(), length: '', breadth: '', height: '', physicalWeight: '', count: '1' },
                  ])
                }
                sx={{ borderRadius: '4px', backgroundColor: BRAND_PURPLE, textTransform: 'none' }}
              >
                Add New
              </Button>
            </Box>

            <Box
              sx={{
                border: '1px solid #A8E7B4',
                backgroundColor: '#F2FFF4',
                borderRadius: '6px',
                p: 1.5,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'auto 1fr 1fr 1fr' },
                gap: 2,
                alignItems: 'center',
              }}
            >
              <Box sx={{ color: '#12C66B', display: 'flex', justifyContent: 'center' }}>
                <FiTrash2 size={27} />
              </Box>
              <Typography sx={{ color: TEXT, fontSize: '1rem' }}>
                Applicable Weight: <strong>{applicableWeight.toFixed(2)} kg</strong>
              </Typography>
              <Typography sx={{ fontSize: '0.82rem' }}>
                No Of Boxes * <strong>{packageTotals.boxes || 1}</strong>
              </Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} gap={5}>
                <Typography sx={{ fontSize: '0.82rem' }}>
                  Total Weight: <strong>{packageTotals.physical.toFixed(2)} kg</strong>
                </Typography>
                <Typography sx={{ fontSize: '0.82rem' }}>
                  Total Volumetric Wt: <strong>{packageTotals.volumetric.toFixed(2)} kg</strong>
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Section>

        <Box sx={{ backgroundColor: '#FFFFFF', borderRadius: '4px', p: 1.6 }}>
          <Box sx={{ backgroundColor: '#FBFCFE', p: 1.4, mb: 1.6 }}>
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography sx={{ color: TEXT, fontSize: '1.05rem', fontWeight: 700 }}>
                Other Details
              </Typography>
              <FiChevronUp />
            </Stack>
          </Box>
          <Grid container spacing={1.8}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Field label="Invoice Number" placeholder="Invoice Number" />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Field label="Order Date" type="date" />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Field label="Eway Bill No" placeholder="Eway Bill No" />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }} />
            <Grid size={{ xs: 12, md: 3 }}>
              <Field label="Customer Reference No" placeholder="Customer Reference No" />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Field label="Seller Name" placeholder="Seller Name" />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Field label="AWB No" placeholder="AWB No" />
            </Grid>
          </Grid>
        </Box>

        <Stack direction="row" justifyContent="flex-end">
          <Button
            variant="contained"
            startIcon={<FiTrash2 />}
            onClick={() =>
              toast.open({
                message: 'International order form is ready. Backend booking is not connected yet.',
                severity: 'info',
              })
            }
            sx={{
              minWidth: 98,
              borderRadius: '4px',
              backgroundColor: BRAND_PURPLE,
              textTransform: 'none',
            }}
          >
            Submit
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
