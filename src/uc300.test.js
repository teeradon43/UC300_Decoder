const {
  getToggleDigitalOutput,
  getDigitalOutputStatus,
  getDigitalInput,
  getToggleAnalogInput,
  getDigitalInputStatus,
  getDigitalInputMode,
  getDigitalCounter,
  getDataSize,
  getParser,
  decode,
  readInt8LE,
  readInt16LE,
  readInt32LE,
  readFloatLE,
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

test("getDataSize", () => {
  expect(getDataSize("Coil")).toBe(1);
  expect(getDataSize("Discrete")).toBe(1);
  expect(getDataSize("Input16")).toBe(2);
  expect(getDataSize("Hold16")).toBe(2);
  expect(getDataSize("Hold32")).toBe(4);
  expect(getDataSize("Hold_float")).toBe(4);
  expect(getDataSize("Input32")).toBe(4);
  expect(getDataSize("Input_float")).toBe(4);
  expect(getDataSize("Input_int32_with upper 16 bits")).toBe(4);
  expect(getDataSize("Input_int32_with lower 16 bits")).toBe(4);
  expect(getDataSize("Hold_int32_with upper 16 bits")).toBe(4);
  expect(getDataSize("Hold_int32_with lower 16 bits")).toBe(4);
  expect(getDataSize("")).toBe(0);
});

test("getParser", () => {
  expect(getParser("Coil")).toBe(readInt8LE);
  expect(getParser("Discrete")).toBe(readInt8LE);
  expect(getParser("Input16")).toBe(readInt16LE);
  expect(getParser("Hold16")).toBe(readInt16LE);
  expect(getParser("Hold32")).toBe(readInt32LE);
  expect(getParser("Hold_float")).toBe(readFloatLE);
  expect(getParser("Input32")).toBe(readInt32LE);
  expect(getParser("Input_float")).toBe(readFloatLE);
  expect(getParser("Input_int32_with upper 16 bits")).toBe(readInt32LE);
  expect(getParser("Input_int32_with lower 16 bits")).toBe(readInt32LE);
  expect(getParser("Hold_int32_with upper 16 bits")).toBe(readInt32LE);
  expect(getParser("Hold_int32_with lower 16 bits")).toBe(readInt32LE);
  // expect(getParser("")).toEqual(() => {});
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
  expect(output.toggles_of_digital_outputs).toBe("DO1 and DO2 disabled");
  expect(output.toggles_of_digital_inputs.DI1).toBe("disabled");
  expect(output.toggles_of_digital_inputs.DI2).toBe("disabled");
  expect(output.toggles_of_digital_inputs.DI3).toBe("disabled");
  expect(output.toggles_of_digital_inputs.DI4).toBe("disabled");
  expect(output.toggles_of_analog_inputs.i4_20mA_1).toBe("disabled");
  expect(output.toggles_of_analog_inputs.i4_20mA_2).toBe("disabled");
  expect(output.toggles_of_analog_inputs.i0_10V_1).toBe("disabled");
  expect(output.toggles_of_analog_inputs.i0_10V_2).toBe("disabled");
  expect(output.toggles_of_analog_inputs.iPT100_1).toBe("disabled");
  expect(output.toggles_of_analog_inputs.iPT100_2).toBe("disabled");
});

test("decode case 2", () => {
  const rawData =
    "7EF425000A7A805762110301D80000000000150000000105000000009A99D941000000007E";
  const bytes = Buffer.from(rawData, "hex");
  output = decode(bytes);
  expect(output.data_type).toBe("f4");
  expect(output.packet_length).toBe(37);
  expect(output.packet_version).toBe(10);
  expect(output.timestamp);
  expect(output.signal_strength).toBe(17);
  expect(output.toggles_of_digital_outputs).toBe("DO1 open, DO2 closed");
  expect(output.toggles_of_digital_inputs.DI1).toBe("disabled");
  expect(output.toggles_of_digital_inputs.DI2).toBe(
    "Counter mode stop counting"
  );
  expect(output.toggles_of_digital_inputs.DI3).toBe("Digital Input Mode");
  expect(output.toggles_of_digital_inputs.DI4).toBe(
    "Counter mode pulse-start counting"
  );
  expect(output.digital_input_status.DI3).toBe("low");
  expect(output.di_counter.DI2).toBe(0);
  expect(output.di_counter.DI4).toBe(21);
  expect(output.toggles_of_analog_inputs.i4_20mA_1).toBe(
    "collected successfully"
  );
  expect(output.toggles_of_analog_inputs.i4_20mA_2).toBe("disabled");
  expect(output.toggles_of_analog_inputs.i0_10V_1).toBe("disabled");
  expect(output.toggles_of_analog_inputs.i0_10V_2).toBe("disabled");
  expect(output.toggles_of_analog_inputs.iPT100_1).toBe(
    "collected successfully"
  );
  expect(output.toggles_of_analog_inputs.iPT100_2).toBe(
    "collected successfully"
  );
  expect(output.analog_input_value.i4_20mA_1).toBe(0);
  expect(output.analog_input_value.iPT100_1).toBe(27.2);
  expect(output.analog_input_value.iPT100_2).toBe(0);
  expect(output.modbus);
});

test("decode case 3", () => {
  const rawData = "7EF418000A7A8057621100000000022A150020001021007E";
  const bytes = Buffer.from(rawData, "hex");
  output = decode(bytes);
  expect(output.data_type).toBe("f4");
  expect(output.packet_length).toBe(24);
  expect(output.packet_version).toBe(10);
  expect(output.timestamp);
  expect(output.signal_strength).toBe(17);
  expect(output.toggles_of_digital_outputs).toBe("DO1 and DO2 disabled");
  tog_di = output.toggles_of_digital_inputs;
  expect(tog_di.DI1).toBe("disabled");
  expect(tog_di.DI2).toBe("disabled");
  expect(tog_di.DI3).toBe("disabled");
  expect(tog_di.DI4).toBe("disabled");
  tog_ai = output.toggles_of_analog_inputs;
  expect(tog_ai.i4_20mA_1).toBe("disabled");
  expect(tog_ai.i4_20mA_2).toBe("disabled");
  expect(tog_ai.i0_10V_1).toBe("disabled");
  expect(tog_ai.i0_10V_2).toBe("disabled");
  expect(tog_ai.iPT100_1).toBe("disabled");
  expect(tog_ai.iPT100_2).toBe("disabled");
  modbus = output.modbus;
  expect(modbus[0].channel_id).toBe(1);
  expect(modbus[0].status).toBe("collected successfully");
  expect(modbus[0].data).toStrictEqual([21, 32]);
  expect(modbus[1].channel_id).toBe(2);
  expect(modbus[1].status).toBe("collected failed");
  expect(modbus[1].data).toStrictEqual([0]);
});
