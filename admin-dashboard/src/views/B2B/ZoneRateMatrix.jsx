import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  NumberInput,
  NumberInputField,
  Input,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import CustomModal from 'components/Modal/CustomModal'
import FileUploader from 'components/upload/FileUploader'
import { useCouriers } from 'hooks/useCouriers'
import { useZones } from 'hooks/useZones'
import { useState } from 'react'
import { GenericTable } from 'views/Dashboard/Tables/components/GenericTable'
import { useB2BZoneRates } from '../../hooks/useB2BZoneRates'

const STATIC_CHARGE_FIELDS = [
  'Docket Charge', 'Minimum ODA1 Charge', 'ODA1 Charge Per Kg', 'Minimum ODA2 Charge',
  'ODA2 Charge Per Kg', 'Minimum ODA3 Charge', 'ODA3 Charge Per Kg', 'Minimum ODA4 Charge',
  'ODA4 Charge Per Kg', 'Minimum RAS Charge', 'RAS Charge Per Kg', 'FSC Percentage',
  'ROV Owner Risk Charge', 'ROV Owner Percentage', 'ROV Carrier Charge', 'ROV Carrier Percentage',
  'Liquid ROV Owner Risk Charge', 'Liquid ROV Owner Percentage', 'Liquid ROV Carrier Charge',
  'Liquid ROV Carrier Percentage', 'Appointment Delivery Charge', 'Appointment Charge Per Kg',
  'FM Charge Per Kg', 'Minimum FM Charge', 'Minimum COD Charge', 'COD Charge Percentage',
  'To Pay Charge', 'Minimum Critical Pickup Charge', 'Critical Pickup Charge Per Kg',
  'Minimum Critical Delivery Charge', 'Critical Delivery Charge Per Kg', 'Minimum LR Charge',
  'Minimum Handling Charge Upto 50 Kg', 'Handling Charge Per Kg Upto 50 Kg',
  'Minimum Handling Charge 50 To 100 Kg', 'Handling Charge Per Kg 50 To 100 Kg',
  'Minimum Handling Charge 100 To 250 Kg', 'Handling Charge Per Kg 100 To 250 Kg',
  'Minimum Handling Charge 250 To 500 Kg', 'Handling Charge Per Kg 250 To 500 Kg',
  'Minimum Handling Charge More Than 500 Kg', 'Handling Charge Per Kg More Than 500 Kg',
  'Minimum Green Charge', 'Green Charge Per Kg', 'Additional RTO Charge', 'Volumetric Dividend',
]

const buildCourierScope = (courierId, couriers = []) => {
  if (!courierId) return {}
  const courier = couriers.find((c) => c.id?.toString() === courierId?.toString())
  return {
    courier_id: courier?.id,
    courierId: courier?.id,
    service_provider: courier?.serviceProvider ?? courier?.service_provider,
    serviceProvider: courier?.serviceProvider ?? courier?.service_provider,
  }
}

export const ZoneRateMatrix = ({ embedded = false } = {}) => {
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isImportOpen, onOpen: onImportOpen, onClose: onImportClose } = useDisclosure()
  const [selectedRate, setSelectedRate] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [useShippingApi, setUseShippingApi] = useState(false)
  const [commission, setCommission] = useState('10.00')
  const [staticCharges, setStaticCharges] = useState({ 'Volumetric Dividend': '4500' })
  const [dynamicRules, setDynamicRules] = useState([])
  const [filters, setFilters] = useState({
    courierId: '',
    originZoneId: '',
    destinationZoneId: '',
  })

  const { data: couriers = [] } = useCouriers()
  const { zones: b2bZones = [] } = useZones('B2B', { include_global: true })

  const courierScope = buildCourierScope(filters.courierId, couriers)

  const { rates, isLoading, upsertRate, deleteRate, importRates } = useB2BZoneRates({
    courier_id: courierScope.courierId,
    service_provider: courierScope.serviceProvider,
    origin_zone_id: filters.originZoneId || undefined,
    destination_zone_id: filters.destinationZoneId || undefined,
  })

  const [rateForm, setRateForm] = useState({
    originZoneId: '',
    destinationZoneId: '',
    ratePerKg: '',
    minCharge: '',
    maxWeightLimit: '',
  })

  const handleOpenModal = (rate) => {
    if (rate) {
      setSelectedRate(rate)
      setRateForm({
        originZoneId: rate.origin_zone_id,
        destinationZoneId: rate.destination_zone_id,
        ratePerKg: Number(rate.rate_per_kg || 0),
        minCharge: rate.min_charge ? Number(rate.min_charge) : '',
        maxWeightLimit: rate.max_weight_limit ? Number(rate.max_weight_limit) : '',
      })
    } else {
      setSelectedRate(null)
      setRateForm({
        originZoneId: '',
        destinationZoneId: '',
        ratePerKg: '',
        minCharge: '',
        maxWeightLimit: '',
      })
    }
    onOpen()
  }

  const handleSaveRate = () => {
    if (!rateForm.originZoneId || !rateForm.destinationZoneId || !rateForm.ratePerKg) {
      toast({ title: 'Please fill origin, destination and rate', status: 'warning' })
      return
    }

    upsertRate.mutate(
      {
        id: selectedRate?.id,
        originZoneId: rateForm.originZoneId,
        destinationZoneId: rateForm.destinationZoneId,
        ratePerKg: Number(rateForm.ratePerKg),
        minCharge: rateForm.minCharge ? Number(rateForm.minCharge) : undefined,
        maxWeightLimit: rateForm.maxWeightLimit ? Number(rateForm.maxWeightLimit) : undefined,
        courierScope,
      },
      {
        onSuccess: () => {
          onClose()
          setSelectedRate(null)
        },
      },
    )
  }

  const handleDeleteRate = (id) => {
    deleteRate.mutate(id)
  }

  const handleImport = async (files) => {
    if (!files?.length) return
    const file = files[0]
    const formData = new FormData()
    formData.append('file', file.file)
    if (courierScope.courierId) formData.append('courier_id', courierScope.courierId)
    if (courierScope.serviceProvider)
      formData.append('service_provider', courierScope.serviceProvider)

    try {
      setUploading(true)
      await importRates.mutateAsync(formData)
      toast({ title: 'Rates imported', status: 'success', duration: 3000, isClosable: true })
    } catch (error) {
      toast({
        title: 'Failed to import rates',
        description: error?.message || 'Unknown error',
        status: 'error',
      })
    } finally {
      setUploading(false)
      onImportClose()
    }
  }

  const sortedZones = b2bZones.slice().sort((a, b) => a.code.localeCompare(b.code))
  const rateMap = new Map(rates.map((r) => [`${r.origin_zone_id}|${r.destination_zone_id}`, r]))

  return (
    <Stack spacing={embedded ? 4 : 6} pt={embedded ? 0 : { base: '120px', md: '75px' }}>
      <Flex justify="space-between" align="center">
        <Text fontSize="2xl" fontWeight="bold">
          B2B Zone-to-Zone Rates
        </Text>
        <HStack>
          <Button colorScheme="blue" onClick={() => handleOpenModal(null)}>
            Add Rate
          </Button>
          <Button variant="outline" onClick={onImportOpen}>
            Import CSV
          </Button>
        </HStack>
      </Flex>

      <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
        <FormControl maxW={{ base: '100%', md: '250px' }}>
          <FormLabel>Courier</FormLabel>
          <Select
            placeholder="Global Rates"
            value={filters.courierId}
            onChange={(e) => setFilters((prev) => ({ ...prev, courierId: e.target.value }))}
          >
            {couriers.map((courier) => (
              <option key={courier.id} value={courier.id}>
                {courier.name}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl maxW={{ base: '100%', md: '220px' }}>
          <FormLabel>Origin Zone</FormLabel>
          <Select
            placeholder="All"
            value={filters.originZoneId}
            onChange={(e) => setFilters((prev) => ({ ...prev, originZoneId: e.target.value }))}
          >
            {b2bZones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name} ({zone.code})
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl maxW={{ base: '100%', md: '220px' }}>
          <FormLabel>Destination Zone</FormLabel>
          <Select
            placeholder="All"
            value={filters.destinationZoneId}
            onChange={(e) => setFilters((prev) => ({ ...prev, destinationZoneId: e.target.value }))}
          >
            {b2bZones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name} ({zone.code})
              </option>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {sortedZones.length > 0 && (
        <Box>
          <Text fontWeight="semibold" mb={3}>
            Zone-to-Zone Matrix ({filters.courierId ? 'Courier specific' : 'Global'})
          </Text>
          <TableContainer borderWidth="1px" borderRadius="md" overflow="auto">
            <Table size="sm" variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th whiteSpace="nowrap">From / To</Th>
                  {sortedZones.map((zone) => (
                    <Th key={`matrix-header-${zone.id}`} whiteSpace="nowrap">
                      {zone.code}
                    </Th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {sortedZones.map((originZone) => (
                  <Tr key={`matrix-row-${originZone.id}`}>
                    <Th bg="gray.50" position="sticky" left={0} zIndex={1} whiteSpace="nowrap">
                      {originZone.code}
                    </Th>
                    {sortedZones.map((destZone) => {
                      const rate = rateMap.get(`${originZone.id}|${destZone.id}`)

                      if (!rate) {
                        return (
                          <Td key={`${originZone.id}-${destZone.id}`} textAlign="center">
                            —
                          </Td>
                        )
                      }

                      const ratePerKg = Number(rate.rate_per_kg ?? rate.ratePerKg ?? 0)
                      const minCharge = Number(rate.min_charge ?? rate.minCharge ?? 0)
                      const maxWeight = rate.max_weight_limit ?? rate.maxWeightLimit

                      return (
                        <Td key={`${originZone.id}-${destZone.id}`} whiteSpace="nowrap">
                          <Text fontWeight="semibold">₹ {ratePerKg.toFixed(2)}</Text>
                          {minCharge > 0 && (
                            <Text fontSize="xs" color="gray.600">
                              Min ₹ {minCharge.toFixed(2)}
                            </Text>
                          )}
                          {maxWeight && (
                            <Text fontSize="xs" color="gray.600">
                              Max {Number(maxWeight)} kg
                            </Text>
                          )}
                        </Td>
                      )
                    })}
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      )}

      <GenericTable
        title="Zone Rates"
        data={rates.map((rate, idx) => ({
          sno: idx + 1,
          origin: rate.origin_zone_id,
          destination: rate.destination_zone_id,
          rate_per_kg: Number(rate.rate_per_kg || 0),
          min_charge: rate.min_charge ? Number(rate.min_charge) : 0,
          max_weight_limit: rate.max_weight_limit ? Number(rate.max_weight_limit) : '-',
          id: rate.id,
        }))}
        captions={[
          'S.No',
          'Origin Zone',
          'Destination Zone',
          'Rate / Kg',
          'Min Charge',
          'Max Weight',
          'Actions',
        ]}
        columnKeys={[
          'sno',
          'origin',
          'destination',
          'rate_per_kg',
          'min_charge',
          'max_weight_limit',
        ]}
        loading={isLoading}
        renderers={{
          origin: (value) => {
            const zone = b2bZones.find((z) => z.id === value)
            return zone ? `${zone.name} (${zone.code})` : value
          },
          destination: (value) => {
            const zone = b2bZones.find((z) => z.id === value)
            return zone ? `${zone.name} (${zone.code})` : value
          },
          rate_per_kg: (val) => `₹ ${Number(val || 0).toFixed(2)}`,
          min_charge: (val) => `₹ ${Number(val || 0).toFixed(2)}`,
          max_weight_limit: (val) => (val && val !== '-' ? `${val} kg` : 'No limit'),
        }}
        renderActions={(row) => (
          <HStack>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenModal(rates.find((rate) => rate.id === row.id))}
            >
              Edit
            </Button>
            <Button size="sm" colorScheme="red" onClick={() => handleDeleteRate(row.id)}>
              Delete
            </Button>
          </HStack>
        )}
      />

      <Box borderWidth="1px" borderRadius="6px" overflow="hidden">
        <Flex bg="brand.500" color="white" px={5} py={4} justify="space-between" align="center">
          <Text fontWeight="700">Static Charges</Text>
          <Button size="sm" colorScheme="whiteAlpha" onClick={() => toast({ title: 'Static charges saved', status: 'success' })}>Submit</Button>
        </Flex>
        <Box p={5}>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} mb={5}>
            <FormControl>
              <FormLabel>Use Shipping Charge API</FormLabel>
              <HStack><Switch colorScheme="brand" isChecked={useShippingApi} onChange={(e) => setUseShippingApi(e.target.checked)} /><Text fontSize="sm">Enable</Text></HStack>
            </FormControl>
            <FormControl>
              <FormLabel>Commission %</FormLabel>
              <Input type="number" value={commission} onChange={(e) => setCommission(e.target.value)} />
            </FormControl>
          </SimpleGrid>
          <SimpleGrid columns={{ base: 1, md: 3, xl: 6 }} spacing={4}>
            {STATIC_CHARGE_FIELDS.map((label) => (
              <FormControl key={label}>
                <FormLabel fontSize="xs" minH="32px" display="flex" alignItems="flex-end">{label}</FormLabel>
                <Input type="number" value={staticCharges[label] || ''} onChange={(e) => setStaticCharges((current) => ({ ...current, [label]: e.target.value }))} />
              </FormControl>
            ))}
          </SimpleGrid>
        </Box>
      </Box>

      <Box borderWidth="1px" borderRadius="6px" overflow="hidden">
        <Flex bg="brand.500" color="white" px={5} py={4} justify="space-between" align="center">
          <Text fontWeight="700">Dynamic Additional Charges</Text>
          <Button size="sm" colorScheme="whiteAlpha" onClick={() => setDynamicRules((rules) => [...rules, { name: '', value: '' }])}>Add Rule</Button>
        </Flex>
        <Stack p={5} spacing={3}>
          {!dynamicRules.length && <Text color="gray.500">No additional rules configured.</Text>}
          {dynamicRules.map((rule, index) => (
            <HStack key={index}>
              <Input placeholder="Rule name" value={rule.name} onChange={(e) => setDynamicRules((rules) => rules.map((item, itemIndex) => itemIndex === index ? { ...item, name: e.target.value } : item))} />
              <Input type="number" placeholder="Charge" value={rule.value} onChange={(e) => setDynamicRules((rules) => rules.map((item, itemIndex) => itemIndex === index ? { ...item, value: e.target.value } : item))} />
              <Button colorScheme="red" variant="ghost" onClick={() => setDynamicRules((rules) => rules.filter((_, itemIndex) => itemIndex !== index))}>Delete</Button>
            </HStack>
          ))}
        </Stack>
      </Box>

      <CustomModal
        isOpen={isOpen}
        onClose={() => {
          onClose()
          setSelectedRate(null)
        }}
        title={selectedRate ? 'Edit Zone Rate' : 'Add Zone Rate'}
        footer={
          <HStack spacing={3}>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" isLoading={upsertRate.isPending} onClick={handleSaveRate}>
              Save
            </Button>
          </HStack>
        }
      >
        <Stack spacing={3}>
          <FormControl isRequired>
            <FormLabel>Origin Zone</FormLabel>
            <Select
              placeholder="Select origin"
              value={rateForm.originZoneId}
              onChange={(e) => setRateForm((prev) => ({ ...prev, originZoneId: e.target.value }))}
            >
              {b2bZones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name} ({zone.code})
                </option>
              ))}
            </Select>
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Destination Zone</FormLabel>
            <Select
              placeholder="Select destination"
              value={rateForm.destinationZoneId}
              onChange={(e) =>
                setRateForm((prev) => ({ ...prev, destinationZoneId: e.target.value }))
              }
            >
              {b2bZones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name} ({zone.code})
                </option>
              ))}
            </Select>
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Rate per Kg (₹)</FormLabel>
            <NumberInput
              min={0}
              value={rateForm.ratePerKg}
              onChange={(value) => setRateForm((prev) => ({ ...prev, ratePerKg: value }))}
            >
              <NumberInputField />
            </NumberInput>
          </FormControl>
          <HStack spacing={3}>
            <FormControl>
              <FormLabel>Minimum Charge (₹)</FormLabel>
              <NumberInput
                min={0}
                value={rateForm.minCharge}
                onChange={(value) => setRateForm((prev) => ({ ...prev, minCharge: value }))}
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>
            <FormControl>
              <FormLabel>Max Weight Limit (Kg)</FormLabel>
              <NumberInput
                min={0}
                value={rateForm.maxWeightLimit}
                onChange={(value) => setRateForm((prev) => ({ ...prev, maxWeightLimit: value }))}
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>
          </HStack>
        </Stack>
      </CustomModal>

      <CustomModal
        isOpen={isImportOpen}
        onClose={onImportClose}
        title="Import Zone Rates"
        footer={
          <HStack>
            <Button variant="ghost" onClick={onImportClose}>
              Close
            </Button>
          </HStack>
        }
      >
        <Text fontSize="sm" mb={3}>
          Upload a CSV file with columns:{' '}
          <b>origin_zone_code, destination_zone_code, rate_per_kg, min_charge, max_weight_limit</b>.
        </Text>
        <FileUploader
          maxSizeMb={5}
          uploadLoading={uploading}
          showUploadButton={false}
          onUploaded={handleImport}
        />
      </CustomModal>
    </Stack>
  )
}

export default ZoneRateMatrix
