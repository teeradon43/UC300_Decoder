const {
  getToggleDigitalOutput,
  getDigitalOutputStatus,
  getToggleDigitalInput,
  getAnalogInputStatus,
  decode,
} = require("./uc300");

test("getToggleDigitalOutput", () => {
  expect(getToggleDigitalOutput(0x00)).toBe("DO1 and DO2 disabled");
  expect(getToggleDigitalOutput(0x01)).toBe("DO1 enabled, DO2 disabled");
  expect(getToggleDigitalOutput(0x02)).toBe("DO1 disabled, DO2 enabled");
  expect(getToggleDigitalOutput(0x03)).toBe("DO1 and DO2 enabled");
  expect(getToggleDigitalOutput("")).toBe("Not Valid Input");
});

test("getDigitalOutputStatus", () => {
  expect(getDigitalOutputStatus(0x00)).toBe("DO1 and DO2 closed");
  expect(getDigitalOutputStatus(0x01)).toBe("DO1 open, DO2 closed");
  expect(getDigitalOutputStatus(0x02)).toBe("DO1 closed, DO2 open");
  expect(getDigitalOutputStatus(0x03)).toBe("DO1 and DO2 open");
  expect(getDigitalOutputStatus("")).toBe("Not Valid Input");
});

test("getToggleDigitalInput", () => {
  expect(getToggleDigitalInput(0x00)).toBe("disabled");
  expect(getToggleDigitalInput(0x01)).toBe("Digital Input Mode");
  expect(getToggleDigitalInput(0x10)).toBe("Counter mode stop counting");
  expect(getToggleDigitalInput(0x11)).toBe("Counter mode pulse-start counting");
  expect(getToggleDigitalInput("")).toBe("Not Valid Input");
});

test("getAnalogInputStatus", () => {
  expect(getAnalogInputStatus(0x00)).toBe("disabled");
  expect(getAnalogInputStatus(0x01)).toBe("collected successfully");
  expect(getAnalogInputStatus(0x10)).toBe("collect failed");
  expect(getAnalogInputStatus(0x11)).toBe("Not Valid Input");
});

test("decode case 1", () => {
  const rawData = "7EF40F000A7A80576214000000007E";
  const bytes = Buffer.from(rawData, "hex");
  output = decode(bytes);
  expect(output.data_type).toBe("f4");
  expect(output.packet_length).toBe(15);
  expect(output.packet_version).toBe(10);
  expect(output.timestamp);
  expect(output.signal_strength).toBe(20);
  expect(output.do_status).toBe("DO1 and DO2 disabled");
});
