import { AddIcon, QuestionOutlineIcon } from "@chakra-ui/icons";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Spinner,
  Switch,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useToast,
} from "@chakra-ui/react";
import Papa from "papaparse";
import { useEffect, useMemo, useRef, useState } from "react";
import { useUpdateShippingRate } from "hooks/useCouriers";

const ZONE_HELP = {
  A: "Within city and local shipments.",
  B: "Metro city to metro city.",
  C: "Metro to non-metro and non-metro to metro.",
  D: "Rest of India.",
  E: "Northeast, Jammu and Kashmir, and special regions.",
  F: "Remote and ODA service locations.",
};

const CONFIG_FIELDS = [
  ["fscPercentage", "FSC Percentage"],
  ["minimumCodCharge", "Minimum COD Charge"],
  ["codChargePercentage", "COD Charge Percentage"],
  ["toPayCharge", "To Pay Charge"],
  ["minimumRasCharge", "Minimum RAS Charge"],
  ["rasChargePerKg", "RAS Charge per kg"],
  ["minimumCriticalPickupCharge", "Minimum Critical Pickup Charge"],
  ["criticalPickupChargePerKg", "Critical Pickup Charge per kg"],
  ["minimumCriticalDeliveryCharge", "Minimum Critical Delivery Charge"],
  ["criticalDeliveryChargePerKg", "Critical Delivery Charge per kg"],
];

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();
const courierKey = (courier) =>
  `${courier.id}_${normalize(
    courier.serviceProvider || courier.service_provider
  )}_${normalize(courier.mode || "surface")}`;

const ZoneHeading = ({ zone }) => (
  <HStack spacing={2} justify="center" whiteSpace="nowrap">
    <Text>ZONE {zone.code}</Text>
    <Tooltip
      label={
        zone.description || ZONE_HELP[zone.code] || "Configured service zone."
      }
      hasArrow
      placement="top"
    >
      <QuestionOutlineIcon color="gray.500" cursor="help" boxSize="14px" />
    </Tooltip>
  </HStack>
);

const blankSlab = (zones) => ({
  minWeight: "",
  maxWeight: "",
  rates: Object.fromEntries(zones.map((zone) => [zone.code, ""])),
});
const blankAddition = (zones) => ({
  ruleType: "Additional Step",
  fromKg: "0.50",
  stepKg: "0.50",
  label: "Additional 500 GM",
  rates: Object.fromEntries(zones.map((zone) => [zone.code, ""])),
});

const buildInitialState = (zones, existing) => {
  const slabCount = Math.max(
    1,
    ...zones.map(
      (zone) => existing?.zone_slabs?.[zone.name]?.forward?.length || 0
    )
  );
  const slabs = Array.from({ length: slabCount }, (_, index) => {
    const sample = zones
      .map((zone) => existing?.zone_slabs?.[zone.name]?.forward?.[index])
      .find(Boolean);
    return {
      minWeight: sample?.weight_from ?? "",
      maxWeight: sample?.weight_to ?? "",
      rates: Object.fromEntries(
        zones.map((zone) => [
          zone.code,
          existing?.zone_slabs?.[zone.name]?.forward?.[index]?.rate ?? "",
        ])
      ),
    };
  });
  const config = existing?.b2c_config || {};
  return {
    slabs,
    additions:
      Array.isArray(config.additionRules) && config.additionRules.length
        ? config.additionRules
        : [blankAddition(zones)],
    config: {
      useShippingChargeApi: Boolean(config.useShippingChargeApi),
      ...Object.fromEntries(
        CONFIG_FIELDS.map(([key]) => [key, config[key] ?? ""])
      ),
    },
  };
};

const CourierRateForm = ({ courier, existing, zones, planId }) => {
  const [state, setState] = useState(() => buildInitialState(zones, existing));
  const fileRef = useRef();
  const toast = useToast();
  const updateRate = useUpdateShippingRate();

  useEffect(() => setState(buildInitialState(zones, existing)), [
    existing,
    zones,
  ]);

  const updateSlab = (index, field, value, zoneCode) =>
    setState((current) => ({
      ...current,
      slabs: current.slabs.map((slab, slabIndex) =>
        slabIndex === index
          ? zoneCode
            ? { ...slab, rates: { ...slab.rates, [zoneCode]: value } }
            : { ...slab, [field]: value }
          : slab
      ),
    }));
  const updateAddition = (index, field, value, zoneCode) =>
    setState((current) => ({
      ...current,
      additions: current.additions.map((rule, ruleIndex) =>
        ruleIndex === index
          ? zoneCode
            ? { ...rule, rates: { ...rule.rates, [zoneCode]: value } }
            : { ...rule, [field]: value }
          : rule
      ),
    }));

  const save = () => {
    const zoneSlabs = {};
    const rates = {};
    zones.forEach((zone) => {
      const slabs = state.slabs
        .filter((slab) => slab.rates[zone.code] !== "")
        .map((slab) => ({
          weight_from: slab.minWeight,
          weight_to: slab.maxWeight || null,
          rate: slab.rates[zone.code],
        }));
      zoneSlabs[zone.name] = { forward: slabs };
      rates[zone.name] = { forward: slabs[0]?.rate ?? "" };
    });
    if (!Object.values(zoneSlabs).some((entry) => entry.forward.length)) {
      toast({ title: "Add at least one zone rate", status: "warning" });
      return;
    }
    const serviceProvider =
      courier.serviceProvider ||
      courier.service_provider ||
      existing?.service_provider ||
      "";
    const mode =
      normalize(courier.mode || existing?.mode || "surface") || "surface";
    updateRate.mutate({
      id: courier.id,
      planId,
      updates: {
        courier_id: courier.id,
        courier_name: courier.name,
        service_provider: serviceProvider,
        previous_service_provider:
          existing?.service_provider || serviceProvider,
        mode,
        previous_mode: existing?.mode || mode,
        businessType: "b2c",
        min_weight: state.slabs[0]?.minWeight || 0,
        cod_charges: state.config.minimumCodCharge,
        cod_percent: state.config.codChargePercentage,
        other_charges: state.config.toPayCharge,
        rates,
        zone_slabs: zoneSlabs,
        b2c_config: { ...state.config, additionRules: state.additions },
      },
    });
  };

  const exportCsv = () => {
    const rows = state.slabs.map((slab) => ({
      min_weight: slab.minWeight,
      max_weight: slab.maxWeight,
      ...Object.fromEntries(
        zones.map((zone) => [
          `zone_${zone.code.toLowerCase()}`,
          slab.rates[zone.code],
        ])
      ),
    }));
    const blob = new Blob([Papa.unparse(rows)], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${courier.name
      .replace(/\s+/g, "-")
      .toLowerCase()}-rates.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const importCsv = (file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        setState((current) => ({
          ...current,
          slabs: data.map((row) => ({
            minWeight: row.min_weight || "",
            maxWeight: row.max_weight || "",
            rates: Object.fromEntries(
              zones.map((zone) => [
                zone.code,
                row[`zone_${zone.code.toLowerCase()}`] || "",
              ])
            ),
          })),
        }));
        toast({ title: "Courier rates imported", status: "success" });
      },
    });
  };

  return (
    <Box py={3}>
      <Flex justify="space-between" align="center" mb={4} gap={3} wrap="wrap">
        <Text color="brand.400" fontSize="sm">
          Manage Rates
        </Text>
        <HStack spacing={2}>
          <Button
            size="sm"
            variant="outline"
            colorScheme="brand"
            leftIcon={<AddIcon />}
            onClick={() =>
              setState((current) => ({
                ...current,
                slabs: [...current.slabs, blankSlab(zones)],
              }))
            }
          >
            Add New
          </Button>
          <Button
            size="sm"
            variant="outline"
            colorScheme="brand"
            onClick={exportCsv}
          >
            Export
          </Button>
          <Button
            size="sm"
            variant="outline"
            colorScheme="brand"
            onClick={() => fileRef.current?.click()}
          >
            Import
          </Button>
          <Button
            size="sm"
            colorScheme="brand"
            onClick={save}
            isLoading={updateRate.isPending}
          >
            Submit
          </Button>
          <Input
            ref={fileRef}
            type="file"
            accept=".csv"
            display="none"
            onChange={(event) =>
              event.target.files?.[0] && importCsv(event.target.files[0])
            }
          />
        </HStack>
      </Flex>

      <TableContainer border="1px solid" borderColor="gray.100">
        <Table size="sm">
          <Thead>
            <Tr>
              <Th>Min Weight(kg)</Th>
              <Th>Max Weight(kg)</Th>
              {zones.map((zone) => (
                <Th key={zone.id || zone.code}>
                  <ZoneHeading zone={zone} />
                </Th>
              ))}
              <Th>Action</Th>
            </Tr>
          </Thead>
          <Tbody>
            {state.slabs.map((slab, index) => (
              <Tr key={index}>
                <Td>
                  <Input
                    size="sm"
                    type="number"
                    value={slab.minWeight}
                    onChange={(event) =>
                      updateSlab(index, "minWeight", event.target.value)
                    }
                  />
                </Td>
                <Td>
                  <Input
                    size="sm"
                    type="number"
                    value={slab.maxWeight}
                    onChange={(event) =>
                      updateSlab(index, "maxWeight", event.target.value)
                    }
                  />
                </Td>
                {zones.map((zone) => (
                  <Td key={zone.code}>
                    <Input
                      size="sm"
                      type="number"
                      value={slab.rates[zone.code]}
                      onChange={(event) =>
                        updateSlab(index, null, event.target.value, zone.code)
                      }
                    />
                  </Td>
                ))}
                <Td>
                  <Button
                    size="xs"
                    variant="link"
                    colorScheme="red"
                    onClick={() =>
                      setState((current) => ({
                        ...current,
                        slabs: current.slabs.filter(
                          (_, itemIndex) => itemIndex !== index
                        ),
                      }))
                    }
                  >
                    Delete
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>

      <Text mt={6} mb={3} fontWeight="700" fontSize="sm">
        Additions (Additional Step / Per KG After)
      </Text>
      <TableContainer border="1px solid" borderColor="gray.100">
        <Table size="sm">
          <Thead>
            <Tr>
              <Th>Rule Type</Th>
              <Th>From (kg)</Th>
              <Th>Step (kg)</Th>
              <Th>Label</Th>
              {zones.map((zone) => (
                <Th key={zone.code}>
                  <ZoneHeading zone={zone} />
                </Th>
              ))}
              <Th>Action</Th>
            </Tr>
          </Thead>
          <Tbody>
            {state.additions.map((rule, index) => (
              <Tr key={index}>
                <Td>
                  <Select
                    size="sm"
                    value={rule.ruleType}
                    onChange={(event) =>
                      updateAddition(index, "ruleType", event.target.value)
                    }
                  >
                    <option>Additional Step</option>
                    <option>Per KG After</option>
                  </Select>
                </Td>
                <Td>
                  <Input
                    size="sm"
                    type="number"
                    value={rule.fromKg}
                    onChange={(event) =>
                      updateAddition(index, "fromKg", event.target.value)
                    }
                  />
                </Td>
                <Td>
                  <Input
                    size="sm"
                    type="number"
                    value={rule.stepKg}
                    onChange={(event) =>
                      updateAddition(index, "stepKg", event.target.value)
                    }
                  />
                </Td>
                <Td>
                  <Input
                    size="sm"
                    value={rule.label}
                    onChange={(event) =>
                      updateAddition(index, "label", event.target.value)
                    }
                  />
                </Td>
                {zones.map((zone) => (
                  <Td key={zone.code}>
                    <Input
                      size="sm"
                      type="number"
                      value={rule.rates?.[zone.code] || ""}
                      onChange={(event) =>
                        updateAddition(
                          index,
                          null,
                          event.target.value,
                          zone.code
                        )
                      }
                    />
                  </Td>
                ))}
                <Td>
                  <Button
                    size="xs"
                    variant="link"
                    colorScheme="red"
                    onClick={() =>
                      setState((current) => ({
                        ...current,
                        additions: current.additions.filter(
                          (_, itemIndex) => itemIndex !== index
                        ),
                      }))
                    }
                  >
                    Delete
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
      <Button
        mt={2}
        size="xs"
        variant="outline"
        colorScheme="orange"
        onClick={() =>
          setState((current) => ({
            ...current,
            additions: [...current.additions, blankAddition(zones)],
          }))
        }
      >
        + Add Addition Row
      </Button>

      <FormControl mt={5}>
        <FormLabel fontSize="sm">Use Shipping Charge API</FormLabel>
        <HStack>
          <Switch
            colorScheme="brand"
            isChecked={state.config.useShippingChargeApi}
            onChange={(event) =>
              setState((current) => ({
                ...current,
                config: {
                  ...current.config,
                  useShippingChargeApi: event.target.checked,
                },
              }))
            }
          />
          <Text fontSize="sm">Enable</Text>
        </HStack>
      </FormControl>
      <SimpleGrid columns={{ base: 1, md: 2, xl: 6 }} spacing={4} mt={5}>
        {CONFIG_FIELDS.map(([key, label]) => (
          <FormControl key={key}>
            <FormLabel
              minH="32px"
              fontSize="xs"
              display="flex"
              alignItems="flex-end"
            >
              {label}
            </FormLabel>
            <Input
              type="number"
              value={state.config[key]}
              onChange={(event) =>
                setState((current) => ({
                  ...current,
                  config: { ...current.config, [key]: event.target.value },
                }))
              }
            />
          </FormControl>
        ))}
      </SimpleGrid>
    </Box>
  );
};

const B2CPlanRateEditor = ({
  couriers = [],
  zones = [],
  rates = [],
  planId,
  planName,
  loading,
}) => {
  const displayZones = useMemo(() => {
    const byCode = new Map(
      zones.map((zone) => [String(zone.code || "").toUpperCase(), zone])
    );
    return ["A", "B", "C", "D", "E", "F"].map(
      (code) =>
        byCode.get(code) || {
          code,
          name: `ZONE ${code}`,
          description: ZONE_HELP[code],
          id: code,
        }
    );
  }, [zones]);
  const rateMap = useMemo(
    () =>
      new Map(
        rates.map((rate) => [
          `${rate.courier_id}_${normalize(rate.service_provider)}_${normalize(
            rate.mode
          )}`,
          rate,
        ])
      ),
    [rates]
  );

  if (loading) return <Spinner color="brand.500" />;
  return (
    <Accordion allowToggle defaultIndex={0}>
      {couriers.map((courier) => {
        const existing = rateMap.get(courierKey(courier));
        return (
          <AccordionItem
            key={courierKey(courier)}
            mb={3}
            border="1px solid"
            borderColor="gray.100"
            bg="white"
          >
            <AccordionButton px={4} py={4} _expanded={{ bg: "gray.50" }}>
              <HStack flex="1" textAlign="left" spacing={3}>
                <Text fontWeight="700">{courier.name}</Text>
                <Text fontSize="xs" color="gray.500">
                  ({courier.id})
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {planName} Rate Card
                </Text>
              </HStack>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel px={4} pb={5}>
              <CourierRateForm
                courier={courier}
                existing={existing}
                zones={displayZones}
                planId={planId}
              />
            </AccordionPanel>
          </AccordionItem>
        );
      })}
      {!couriers.length && (
        <Box bg="white" p={8} textAlign="center" color="gray.500">
          No B2C couriers are available.
        </Box>
      )}
    </Accordion>
  );
};

export default B2CPlanRateEditor;
