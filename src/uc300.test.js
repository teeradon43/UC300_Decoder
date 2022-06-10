const {
  getToggleDigitalOutput,
  getDigitalOutputStatus,
  getToggleDigitalInput,
  getDigitalInput,
  getToggleAnalogInput,
  getDigitalInputStatus,
  getDigitalInputMode,
  getDigitalCounter,
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

test("getDigitalInputMode", () => {
  expect(getDigitalInputMode(0b00)).toBe("disabled");
  expect(getDigitalInputMode(0b01)).toBe("Digital Input Mode");
  expect(getDigitalInputMode(0b10)).toBe("Counter mode stop counting");
  expect(getDigitalInputMode(0b11)).toBe("Counter mode pulse-start counting");
});

test("getDigitalInput", () => {
  expect(getDigitalInput(0x00).DI1).toBe("low");
  expect(getDigitalInput(0x01).DI1).toBe("high");
  expect(getDigitalInput(0xff)).toBe("Not Valid Input");
});

test("getDigitalInputStatus", () => {
  expect(getDigitalInputStatus(0b0)).toBe("low");
  expect(getDigitalInputStatus(0b1)).toBe("high");
  expect(getDigitalInputStatus()).toBe("Not Valid Input");
});

test("getToggleAnalogInput", () => {
  expect(getToggleAnalogInput(0b00)).toBe("disabled");
  expect(getToggleAnalogInput(0b01)).toBe("collected successfully");
  expect(getToggleAnalogInput(0b10)).toBe("collect failed");
  expect(getToggleAnalogInput(0b11)).toBe("Not Valid Input");
});

test("getDigitalCounter", () => {
  const rawData = "0000000015000000";
  const bytes = Buffer.from(rawData, "hex");
  const counter = [2, 4];
  output = getDigitalCounter(bytes, counter);
  expect(output.DI2).toBe(0);
  expect(output.DI4).toBe(21);
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
  expect(output.di_status.DI1).toBe("disabled");
});

test("decode case 2", () => {
  const rawData =
    "7EF425000A7A805762110301D80000000000150000000105000000009A99D941000000007E";
  const bytes = Buffer.from(rawData, "hex");
  output = decode(bytes);
  expect(output.data_type).toBe("f4");
  // expect(output.packet_length).toBe(15);
  // expect(output.packet_version).toBe(10);
  // expect(output.timestamp);
  // expect(output.signal_strength).toBe(20);
  expect(output.do_status).toBe("DO1 open, DO2 closed");
  expect(output.di_counter.DI2).toBe(0);
  expect(output.di_counter.DI4).toBe(21);
});

test("decode case 3", () => {
  const rawData = "7EF418000A7A8057621100000000022A150020001021007E";
  const bytes = Buffer.from(rawData, "hex");
  output = decode(bytes);
  expect(output.data_type).toBe("f4");
  // expect(output.packet_length).toBe(15);
  // expect(output.packet_version).toBe(10);
  // expect(output.timestamp);
  // expect(output.signal_strength).toBe(20);
  expect(output.do_status).toBe("DO1 and DO2 disabled");
});
