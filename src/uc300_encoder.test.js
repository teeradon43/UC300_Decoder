const {
  reverseHex,
  getPacketLengthHex,
  getPacketVersionHex,
  getTimestampHex,
  getSignalStrengthHex,
  getDigitalOutputTogglesHex,
  getDigitalOutputStatusesHex,
  getDigitalInputTogglesHex,
  getDigitalInputStatusesHex,
  getDigitalInputCountersHex,
} = require("./uc300_encoder");

const MESSAGE = {
  data_type: "f4",
  packet_length: null,
  packet_version: null,
  timestamp: "",
  signal_strength: null,
  toggles_of_digital_outputs: {},
  digital_output_statuses: {},
  toggles_of_digital_inputs: {},
  digital_input_statuses: {},
  di_counters: {},
  toggles_of_analog_inputs: {},
  analog_input_values: {},
  modbus: {},
};

test("reverseHex", () => {
  expect(reverseHex("0000")).toBe("0000");
  expect(reverseHex("1001")).toBe("0110");
  expect(reverseHex("f400")).toBe("00f4");
  expect(reverseHex("00000000")).toBe("00000000");
  expect(reverseHex("01020304")).toBe("04030201");
  expect(reverseHex("00010203")).toBe("03020100");
});

test("getPacketLengthHex", () => {
  expect(getPacketLengthHex(0)).toBe("0000");
  expect(getPacketLengthHex(15)).toBe("0f00");
  expect(getPacketLengthHex(24)).toBe("1800");
  expect(getPacketLengthHex(37)).toBe("2500");
  expect(getPacketLengthHex(81)).toBe("5100");
});

test("getPacketVersionHex", () => {
  expect(getPacketVersionHex(0)).toBe("00");
  expect(getPacketVersionHex(1)).toBe("01");
  expect(getPacketVersionHex(10)).toBe("0a");
  expect(getPacketVersionHex(16)).toBe("10");
  expect(getPacketVersionHex(26)).toBe("1a");
  expect(getPacketVersionHex(249)).toBe("f9");
  expect(getPacketVersionHex(255)).toBe("ff");
});

test("getTimestampHex", () => {
  expect(
    getTimestampHex("Thu Apr 14 2022 09:01:30 GMT+0700 (เวลาอินโดจีน)")
  ).toBe("7a805762");
  expect(
    getTimestampHex("Fri May 27 2022 14:26:30 GMT+0700 (เวลาอินโดจีน)")
  ).toBe("267d9062");

  expect(
    getTimestampHex("Fri May 27 2022 15:17:46 GMT+0700 (เวลาอินโดจีน)")
  ).toBe("2a899062");
});

test("getSignalStrengthHex", () => {
  expect(getSignalStrengthHex(0)).toBe("00");
  expect(getSignalStrengthHex(1)).toBe("01");
  expect(getSignalStrengthHex(10)).toBe("0a");
  expect(getSignalStrengthHex(16)).toBe("10");
  expect(getSignalStrengthHex(25)).toBe("19");
  expect(getSignalStrengthHex(255)).toBe("ff");
});

const DIGITAL_OUTPUT_TOGGLES_TEMPLATE = [
  { name: "DO1", toggle: null },
  { name: "DO2", toggle: null },
];

test("getDigitalOutputTogglesHex", () => {
  let DOToggles = [...DIGITAL_OUTPUT_TOGGLES_TEMPLATE];
  DOToggles[0].toggle = 0;
  DOToggles[1].toggle = 0;
  expect(getDigitalOutputTogglesHex(DOToggles)).toBe("00");
  DOToggles[0].toggle = 1;
  expect(getDigitalOutputTogglesHex(DOToggles)).toBe("01");
  DOToggles[1].toggle = 1;
  expect(getDigitalOutputTogglesHex(DOToggles)).toBe("03");
  DOToggles[0].toggle = 0;
  expect(getDigitalOutputTogglesHex(DOToggles)).toBe("02");
});

const DIGITAL_OUTPUT_STATUSES_TEMPLATE = [
  { name: "DO1", status: null },
  { name: "DO2", status: null },
];

test("getDigitalOutputStatusesHex", () => {
  let DOStatuses = [...DIGITAL_OUTPUT_STATUSES_TEMPLATE];
  DOStatuses[0].status = 0;
  DOStatuses[1].status = 0;
  expect(getDigitalOutputStatusesHex(DOStatuses)).toBe("00");
  DOStatuses[0].status = 1;
  expect(getDigitalOutputStatusesHex(DOStatuses)).toBe("01");
  DOStatuses[1].status = 1;
  expect(getDigitalOutputStatusesHex(DOStatuses)).toBe("03");
  DOStatuses[0].status = 0;
  expect(getDigitalOutputStatusesHex(DOStatuses)).toBe("02");
});

const DIGITAL_INPUT_TOGGLES_TEMPLATE = [
  { name: "DI1", toggle: null },
  { name: "DI2", toggle: null },
  { name: "DI3", toggle: null },
  { name: "DI4", toggle: null },
];

test("getDigitalInputTogglesHex", () => {
  let DIToggles = [...DIGITAL_INPUT_TOGGLES_TEMPLATE];
  DIToggles[0].toggle = 0;
  DIToggles[1].toggle = 0;
  DIToggles[2].toggle = 0;
  DIToggles[3].toggle = 0;
  expect(getDigitalInputTogglesHex(DIToggles)).toBe("00");
  DIToggles[0].toggle = 1;
  DIToggles[1].toggle = 1;
  DIToggles[2].toggle = 1;
  DIToggles[3].toggle = 1;
  expect(getDigitalInputTogglesHex(DIToggles)).toBe("55");
  DIToggles[0].toggle = 2;
  DIToggles[1].toggle = 2;
  DIToggles[2].toggle = 2;
  DIToggles[3].toggle = 2;
  expect(getDigitalInputTogglesHex(DIToggles)).toBe("aa");
  DIToggles[0].toggle = 3;
  DIToggles[1].toggle = 3;
  DIToggles[2].toggle = 3;
  DIToggles[3].toggle = 3;
  expect(getDigitalInputTogglesHex(DIToggles)).toBe("ff");
  DIToggles[0].toggle = 0;
  DIToggles[1].toggle = 1;
  DIToggles[2].toggle = 2;
  DIToggles[3].toggle = 3;
  expect(getDigitalInputTogglesHex(DIToggles)).toBe("e4");
});

const DIGITAL_INPUT_STATUSES_TEMPLATE = [
  { name: "DI1", status: null },
  { name: "DI2", status: null },
  { name: "DI3", status: null },
  { name: "DI4", status: null },
];

test("getDigitalInputStatusesHex", () => {
  let DIStatuses = [...DIGITAL_INPUT_STATUSES_TEMPLATE];
  DIStatuses[0].status = 0;
  DIStatuses[1].status = 0;
  DIStatuses[2].status = 0;
  DIStatuses[3].status = 0;
  expect(getDigitalInputStatusesHex(DIStatuses)).toBe("00");
  DIStatuses[0].status = 0;
  DIStatuses[1].status = 1;
  DIStatuses[2].status = 1;
  DIStatuses[3].status = 0;
  expect(getDigitalInputStatusesHex(DIStatuses)).toBe("06");
  DIStatuses[0].status = 1;
  DIStatuses[1].status = 0;
  DIStatuses[2].status = 0;
  DIStatuses[3].status = 1;
  expect(getDigitalInputStatusesHex(DIStatuses)).toBe("09");
  DIStatuses[0].status = 1;
  DIStatuses[1].status = 1;
  DIStatuses[2].status = 1;
  DIStatuses[3].status = 1;
  expect(getDigitalInputStatusesHex(DIStatuses)).toBe("0f");
});

const DIGITAL_INPUT_COUNTERS_TEMPLATE = [
  { name: "DI1", counter: null },
  { name: "DI2", counter: null },
  { name: "DI3", counter: null },
  { name: "DI4", counter: null },
];

test("getDigitalInputCountersHex", () => {
  let DICounters = [...DIGITAL_INPUT_COUNTERS_TEMPLATE];
  expect(getDigitalInputCountersHex(DICounters)).toBe("");
  DICounters[1].counter = 0;
  DICounters[3].counter = 21;
  expect(getDigitalInputCountersHex(DICounters)).toBe("0000000015000000");
  DICounters[0].counter = 0;
  DICounters[2].counter = 0;
  DICounters[3].counter = 0;
  expect(getDigitalInputCountersHex(DICounters)).toBe(
    "00000000000000000000000000000000"
  );
});

// test("encode case 1", () => {
//   let payload = { ...MESSAGE };
//   payload.packet_length = 15
//   expect(getDigitalOutputStatuses(0x00)[0].status).toBe(
//     "7EF40F000A7A80576214000000007E"
//   );
// });