const {
  encode,
  reverseHex,
  DecToHexString,
  FloatToHexString,
  getPacketLengthHex,
  getPacketVersionHex,
  getTimestampHex,
  getSignalStrengthHex,
  getDigitalOutputTogglesHex,
  getDigitalOutputStatusesHex,
  getDigitalInputTogglesHex,
  getDigitalInputStatusesHex,
  getDigitalInputCountersHex,
  getAnalogInputTogglesHex,
  getAnalogInputValuesHex,
  getModbusHex,
} = require("./uc300_encoder");

const { decode } = require("./uc300");

test("reverseHex", () => {
  expect(reverseHex("0000")).toBe("0000");
  expect(reverseHex("1001")).toBe("0110");
  expect(reverseHex("f400")).toBe("00f4");
  expect(reverseHex("00000000")).toBe("00000000");
  expect(reverseHex("01020304")).toBe("04030201");
  expect(reverseHex("00010203")).toBe("03020100");
});

test("DecToHexString", () => {
  expect(DecToHexString(21)).toBe("15");
  expect(DecToHexString(25)).toBe("19");
  expect(DecToHexString(0)).toBe("00");
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
  expect(getDigitalInputStatusesHex(DIStatuses)).toBe("");
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

const ANALOG_INPUT_TOGGLES_TEMPLATE = [
  { name: "i4_20mA_1", toggle: 0 },
  { name: "i4_20mA_2", toggle: 0 },
  { name: "i0_10V_1", toggle: 0 },
  { name: "i0_10V_2", toggle: 0 },
  { name: "iPT100_1", toggle: 0 },
  { name: "iPT100_2", toggle: 0 },
];

test("getAnalogInputTogglesHex", () => {
  let AIToggles = [...ANALOG_INPUT_TOGGLES_TEMPLATE];
  expect(getAnalogInputTogglesHex(AIToggles)).toBe("0000");
  AIToggles[0].toggle = 1;
  AIToggles[1].toggle = 1;
  expect(getAnalogInputTogglesHex(AIToggles)).toBe("0500");
  AIToggles[2].toggle = 1;
  AIToggles[3].toggle = 1;
  expect(getAnalogInputTogglesHex(AIToggles)).toBe("5500");
  AIToggles[4].toggle = 1;
  AIToggles[5].toggle = 1;
  expect(getAnalogInputTogglesHex(AIToggles)).toBe("5505");
  AIToggles[2].toggle = 2;
  AIToggles[3].toggle = 2;
  expect(getAnalogInputTogglesHex(AIToggles)).toBe("a505");
  AIToggles[0].toggle = 2;
  AIToggles[1].toggle = 2;
  expect(getAnalogInputTogglesHex(AIToggles)).toBe("aa05");
  AIToggles[4].toggle = 2;
  AIToggles[5].toggle = 2;
  expect(getAnalogInputTogglesHex(AIToggles)).toBe("aa0a");
});

const ANALOG_INPUT_VALUES_TEMPLATE = [
  { name: "i4_20mA_1", value: null },
  { name: "i4_20mA_2", value: null },
  { name: "i0_10V_1", value: null },
  { name: "i0_10V_2", value: null },
  { name: "iPT100_1", value: null },
  { name: "iPT100_2", value: null },
];

test("getAnalogInputValuesHex", () => {
  let AIValues = [...ANALOG_INPUT_VALUES_TEMPLATE];
  expect(getAnalogInputValuesHex(AIValues)).toBe("");
  AIValues[0].value = 1;
  expect(getAnalogInputValuesHex(AIValues)).toBe("0000803f");
  AIValues[1].value = 1;
  expect(getAnalogInputValuesHex(AIValues)).toBe("0000803f0000803f");
  AIValues[2].value = 27.2;
  expect(getAnalogInputValuesHex(AIValues)).toBe("0000803f0000803f9a99d941");
  AIValues[3].value = 0;
  expect(getAnalogInputValuesHex(AIValues)).toBe(
    "0000803f0000803f9a99d94100000000"
  );
  AIValues[4].value = 0;
  expect(getAnalogInputValuesHex(AIValues)).toBe(
    "0000803f0000803f9a99d9410000000000000000"
  );
  AIValues[5].value = 100;
  expect(getAnalogInputValuesHex(AIValues)).toBe(
    "0000803f0000803f9a99d94100000000000000000000c842"
  );
  AIValues[0].value = null;
  expect(getAnalogInputValuesHex(AIValues)).toBe(
    "0000803f9a99d94100000000000000000000c842"
  );
});

const MODBUS_TEMPLATE = [];

test("getModbusHex", () => {
  let modbus = [...MODBUS_TEMPLATE];
  expect(getModbusHex(modbus)).toBe("");
  let ch1Data = {
    channel_id: 0,
    data_type: 0,
    register_setting: {
      sign: 0,
      decimal: 1,
      status: 1,
      quantity: 1,
    },
    data: [1],
  };
  modbus.push(ch1Data);
  expect(getModbusHex(modbus)).toBe("001901");
  let ch2Data = {
    channel_id: 1,
    data_type: 1,
    register_setting: {
      sign: 1,
      decimal: 1,
      status: 0,
      quantity: 1,
    },
    data: [0],
  };
  modbus.push(ch2Data);
  expect(getModbusHex(modbus)).toBe("001901119100");
  let ch3Data = {
    channel_id: 2,
    data_type: 2,
    register_setting: {
      sign: 0,
      decimal: 2,
      status: 1,
      quantity: 2,
    },
    data: [21, 32],
  };
  modbus.push(ch3Data);
  expect(getModbusHex(modbus)).toBe("001901119100222a15002000");
});

const MESSAGE_TEMPLATE = {
  data_type: "",
  packet_length: null,
  packet_version: null,
  timestamp: "",
  signal_strength: null,
  toggles_of_digital_outputs: [],
  digital_output_statuses: [],
  toggles_of_digital_inputs: [],
  digital_input_statuses: [],
  di_counters: [],
  toggles_of_analog_inputs: [],
  analog_input_values: [],
  modbus: [],
};

// test("encode case 1", () => {
//   const rawData = "7EF40F000A7A80576214000000007E";
//   const bytes = Buffer.from(rawData, "hex");
//   let message = decode(bytes);
//   console.log(decode(bytes));
//   let output = encode(message);
//   expect(output).toBe("7ef40f000a7a80576214000000007e");
// });

// test("encode case 2", () => {
//   let rawData =
//     "7EF425000A7A805762110301D80000000000150000000105000000009A99D941000000007E";
//   let bytes = Buffer.from(rawData, "hex");
//   let message = decode(bytes);
//   let output = encode(message);
//   expect(output).toBe(
//     "7ef425000a7a805762110301d80000000000150000000105000000009a99d941000000007e"
//   );
// });

// test("encode case 3", () => {
//   let rawData = "7EF418000A7A8057621100000000022A150020001021007E";
//   let bytes = Buffer.from(rawData, "hex");
//   let message = decode(bytes);
//   // console.log(message);
//   let output = encode(message);
//   expect(output).toBe("7ef418000a7a8057621100000000022a150020001021007e");
// });

test("encode case 4", () => {
  let rawData =
    "7ef47f000a2a89906219030055005505000000000000000000000000000000000000000000000000003901113901223901803339018046b90180ffff56b90180ffff66b90180ffff76b90180ffff87b925529ac497b925529ac4a7b925529ac4b7b925529ac4c4b90180ffffd4b90180ffffe4b90180fffff4b90180ffff7e";
  let bytes = Buffer.from(rawData, "hex");
  let message = decode(bytes);
  console.log(JSON.stringify(message, null, 2));
  let output = encode(message);
  expect(output).toBe(
    "7ef47f000a2a89906219030055005505000000000000000000000000000000000000000000000000003901113901223901803339018046b90180ffff56b90180ffff66b90180ffff76b90180ffff87b925529ac497b925529ac4a7b925529ac4b7b925529ac4c4b90180ffffd4b90180ffffe4b90180fffff4b90180ffff7e"
  );
});
