import {
  Badge,
  Box,
  Flex,
  HStack,
  Select,
  SimpleGrid,
  Spinner,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { b2bAdminService } from 'services/b2bAdmin.service'

const INTERNATIONAL_COURIERS = ['FedEx', 'UPS', 'DHL', 'Self Network']

const InternationalRateCardWorkspace = ({ planName }) => {
  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['international-rate-cards'],
    queryFn: b2bAdminService.getInternationalRateCards,
  })
  const [selectedCardId, setSelectedCardId] = useState('')

  const selectedCard = useMemo(
    () => cards.find((card) => card.id === (selectedCardId || cards[0]?.id)) || cards[0],
    [cards, selectedCardId],
  )

  const couriers = useMemo(() => {
    const configured = selectedCard?.deliveryPartners || []
    const merged = [...new Set([...configured, ...INTERNATIONAL_COURIERS])]
    return merged
  }, [selectedCard])

  const zoneRows = useMemo(() => {
    const countries = selectedCard?.destinationCountries || []
    const grouped = new Map()
    for (const country of countries) {
      const zoneCode = country.zoneCode || '-'
      if (!grouped.has(zoneCode)) grouped.set(zoneCode, [])
      grouped.get(zoneCode).push(country.countryName)
    }
    return [...grouped.entries()]
      .sort(([a], [b]) => String(a).localeCompare(String(b), undefined, { numeric: true }))
      .map(([zoneCode, countryNames]) => ({
        zoneCode,
        count: countryNames.length,
        preview: countryNames.slice(0, 8).join(', '),
      }))
  }, [selectedCard])

  if (isLoading) return <Spinner color="brand.500" />

  return (
    <Box>
      <Flex justify="space-between" gap={4} align={{ base: 'stretch', md: 'center' }} direction={{ base: 'column', md: 'row' }} mb={5}>
        <Box>
          <Text fontWeight="800" fontSize="lg">{planName || 'International'} Rate Card</Text>
          <Text color="gray.500" fontSize="sm">
            Manual international rates use the Excel destination-zone mapping. Additional charge masters stay shared with the existing rate-card configuration.
          </Text>
        </Box>
        <Select
          maxW={{ base: '100%', md: '360px' }}
          value={selectedCard?.id || ''}
          onChange={(event) => setSelectedCardId(event.target.value)}
        >
          {cards.map((card) => (
            <option key={card.id} value={card.id}>{card.name}</option>
          ))}
        </Select>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={5}>
        <Box border="1px solid" borderColor="gray.100" borderRadius="6px" p={4}>
          <Text color="gray.500" fontSize="xs" fontWeight="700" textTransform="uppercase">Couriers</Text>
          <HStack wrap="wrap" mt={3}>
            {couriers.map((courier) => (
              <Badge key={courier} colorScheme="purple" px={2} py={1}>{courier}</Badge>
            ))}
          </HStack>
        </Box>
        <Box border="1px solid" borderColor="gray.100" borderRadius="6px" p={4}>
          <Text color="gray.500" fontSize="xs" fontWeight="700" textTransform="uppercase">Zones</Text>
          <Text fontSize="2xl" fontWeight="800" mt={2}>{selectedCard?.destinationZones?.length || zoneRows.length}</Text>
          <Text color="gray.500" fontSize="sm">International destination zones</Text>
        </Box>
        <Box border="1px solid" borderColor="gray.100" borderRadius="6px" p={4}>
          <Text color="gray.500" fontSize="xs" fontWeight="700" textTransform="uppercase">Destinations</Text>
          <Text fontSize="2xl" fontWeight="800" mt={2}>{selectedCard?.destinationCountries?.length || 0}</Text>
          <Text color="gray.500" fontSize="sm">Countries mapped from Sheet 2</Text>
        </Box>
      </SimpleGrid>

      <TableContainer border="1px solid" borderColor="gray.100" borderRadius="6px">
        <Table size="sm">
          <Thead bg="gray.50">
            <Tr>
              <Th>Zone</Th>
              <Th>Destination Count</Th>
              <Th>Mapped Destinations</Th>
            </Tr>
          </Thead>
          <Tbody>
            {zoneRows.map((row) => (
              <Tr key={row.zoneCode}>
                <Td fontWeight="800">{row.zoneCode}</Td>
                <Td>{row.count}</Td>
                <Td color="gray.600">{row.preview}{row.count > 8 ? '...' : ''}</Td>
              </Tr>
            ))}
            {!zoneRows.length && (
              <Tr>
                <Td colSpan={3} textAlign="center" py={8} color="gray.500">
                  No international zone mapping found. Run the international rate seed first.
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default InternationalRateCardWorkspace
