const {
  reverseHex,
  getPacketLengthHex,
  getPacketVersionHex,
  getTimestampHex,
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

test("", () => {
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

// test("encode case 1", () => {
//   let payload = { ...MESSAGE };
//   payload.packet_length = 15
//   expect(getDigitalOutputStatuses(0x00)[0].status).toBe(
//     "7EF40F000A7A80576214000000007E"
//   );
// });
