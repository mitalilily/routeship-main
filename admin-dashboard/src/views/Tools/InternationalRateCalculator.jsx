import {
  Box, Button, Flex, FormControl, FormLabel, Heading, Input, Select, SimpleGrid,
  Spinner, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, useToast,
} from '@chakra-ui/react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { b2bAdminService } from 'services/b2bAdmin.service'

const COUNTRY_CODES = 'AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI CV KH CM CA CF TD CL CN CO KM CG CD CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR GA GM GE DE GH GR GD GT GN GW GY HT HN HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LI LT LU MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL NZ NI NE NG MK NO OM PK PW PA PG PY PE PH PL PT QA RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA SS ES LK SD SR SE CH SY TW TJ TZ TH TL TG TO TT TN TR TM TV UG UA AE GB US UY UZ VU VA VE VN YE ZM ZW'.split(' ')
const countryNames = typeof Intl !== 'undefined' && Intl.DisplayNames ? new Intl.DisplayNames(['en'], { type: 'region' }) : null

const InternationalRateCalculator = () => {
  const [form, setForm] = useState({ rateCardId: '', deliveryPartner: '', originZone: '', weight: '1.000', destinationCity: '', destinationState: '', destinationCountry: 'AF' })
  const [results, setResults] = useState([])
  const toast = useToast()
  const { data: rateCards = [], isLoading } = useQuery({ queryKey: ['international-rate-cards'], queryFn: b2bAdminService.getInternationalRateCards })
  const selectedCard = useMemo(() => rateCards.find((card) => card.id === form.rateCardId), [rateCards, form.rateCardId])

  useEffect(() => {
    if (!rateCards.length) return
    setForm((current) => current.rateCardId ? current : { ...current, rateCardId: rateCards[0].id, originZone: rateCards[0].originZone })
  }, [rateCards])

  const calculate = useMutation({
    mutationFn: b2bAdminService.calculateInternationalRate,
    onSuccess: setResults,
    onError: (error) => { setResults([]); toast({ title: 'Rate calculation failed', description: error.response?.data?.error || error.message, status: 'error' }) },
  })

  const updateCard = (rateCardId) => {
    const card = rateCards.find((item) => item.id === rateCardId)
    setForm((current) => ({ ...current, rateCardId, deliveryPartner: '', originZone: card?.originZone || '' }))
  }

  return (
    <Box pt={{ base: '110px', md: '86px' }}>
      <Box mb={6}><Heading size="md">Int Rate Calculator</Heading><Text mt={2} fontSize="sm"><Text as="span" color="brand.500">Dashboard</Text> &nbsp;›&nbsp; Int Rate Calculator</Text></Box>
      <Box bg="white" border="1px solid" borderColor="gray.100" borderRadius="6px">
        <Heading size="sm" px={4} py={5} borderBottom="1px solid" borderColor="gray.100">Int Rate Calculator</Heading>
        <Box p={4}>
          {isLoading ? <Spinner color="brand.500" /> : <>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
              <FormControl isRequired><FormLabel>Rate Card</FormLabel><Select value={form.rateCardId} onChange={(event) => updateCard(event.target.value)}>{rateCards.map((card) => <option key={card.id} value={card.id}>{card.name} (#{card.id.slice(0, 4).toUpperCase()})</option>)}</Select></FormControl>
              <FormControl><FormLabel>Delivery Partner (optional)</FormLabel><Select placeholder="All partners" value={form.deliveryPartner} onChange={(event) => setForm({ ...form, deliveryPartner: event.target.value })}>{selectedCard?.deliveryPartners?.map((partner) => <option key={partner} value={partner}>{partner}</option>)}</Select><Text fontSize="xs" color="gray.400" mt={1}>Leave empty to quote all partners.</Text></FormControl>
              <FormControl><FormLabel>Origin Zone</FormLabel><Input value={form.originZone} isReadOnly /></FormControl>
            </SimpleGrid>
            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={5} mt={6}>
              <FormControl isRequired><FormLabel>Weight (kg)</FormLabel><Input type="number" min="0.001" step="0.001" value={form.weight} onChange={(event) => setForm({ ...form, weight: event.target.value })} /></FormControl>
              <FormControl><FormLabel>Dest City</FormLabel><Input placeholder="e.g. Mumbai" value={form.destinationCity} onChange={(event) => setForm({ ...form, destinationCity: event.target.value })} /></FormControl>
              <FormControl><FormLabel>Dest State</FormLabel><Input placeholder="e.g. Maharashtra" value={form.destinationState} onChange={(event) => setForm({ ...form, destinationState: event.target.value })} /></FormControl>
              <FormControl isRequired><FormLabel>Dest Country</FormLabel><Select value={form.destinationCountry} onChange={(event) => setForm({ ...form, destinationCountry: event.target.value })}>{COUNTRY_CODES.map((code) => <option key={code} value={code}>{countryNames?.of(code)?.toUpperCase() || code}</option>)}</Select></FormControl>
            </SimpleGrid>
            <Button mt={8} colorScheme="brand" isLoading={calculate.isPending} onClick={() => calculate.mutate(form)} isDisabled={!form.rateCardId}>Calculate</Button>
          </>}
        </Box>
      </Box>
      {results.length > 0 && <Box mt={5} bg="white" border="1px solid" borderColor="gray.100" borderRadius="6px" p={4}><TableContainer><Table variant="simple"><Thead><Tr><Th>Delivery Partner</Th><Th>Rate Card</Th><Th>Weight</Th><Th>Rate / Kg</Th><Th>Base Rate</Th><Th>Total</Th><Th>Estimated Delivery</Th></Tr></Thead><Tbody>{results.map((result) => <Tr key={result.id}><Td fontWeight="700">{result.deliveryPartner}</Td><Td>{result.rateCard}</Td><Td>{result.weight.toFixed(3)} kg</Td><Td>{result.currency} {result.ratePerKg.toFixed(2)}</Td><Td>{result.currency} {result.baseRate.toFixed(2)}</Td><Td fontWeight="800" color="brand.500">{result.currency} {result.total.toFixed(2)}</Td><Td>{result.estimatedDays || '-'}</Td></Tr>)}</Tbody></Table></TableContainer></Box>}
    </Box>
  )
}

export default InternationalRateCalculator
