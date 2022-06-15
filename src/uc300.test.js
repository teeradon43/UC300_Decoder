const {
  getDigitalOutputStatuses,
  getDigitalInput,
  getToggleAnalogInput,
  getDigitalInputStatus,
  getDigitalInputMode,
  getDigitalCounter,
  getDigitalOutputToggle,
  getDataSize,
  getParser,
  decode,
  readInt8LE,
  readInt16LE,
  readInt32LE,
  readFloatLE,
} = require("./uc300");

test("getDigitalOutputStatuses", () => {
  expect(getDigitalOutputStatuses(0x00)[0].status).toBe(0);
  expect(getDigitalOutputStatuses(0x00)[1].status).toBe(0);
  expect(getDigitalOutputStatuses(0x01)[0].status).toBe(1);
  expect(getDigitalOutputStatuses(0x01)[1].status).toBe(0);
  expect(getDigitalOutputStatuses(0x02)[0].status).toBe(0);
  expect(getDigitalOutputStatuses(0x02)[1].status).toBe(1);
  expect(getDigitalOutputStatuses(0x03)[0].status).toBe(1);
  expect(getDigitalOutputStatuses(0x03)[1].status).toBe(1);
  expect(getDigitalOutputStatuses(0x04)).toBe("Not Valid Input");
  expect(getDigitalOutputStatuses("")).toBe("Not Valid Input");
});

test("getDigitalInputMode", () => {
  expect(getDigitalInputMode(0b00)).toBe(0);
  expect(getDigitalInputMode(0b01)).toBe(1);
  expect(getDigitalInputMode(0b10)).toBe(2);
  expect(getDigitalInputMode(0b11)).toBe(3);
  expect(getDigitalInputMode()).toBe("Not Valid Input");
});

test("getDigitalInput", () => {
  expect(getDigitalInput(0x00)[0].value).toBe(0);
  expect(getDigitalInput(0x01)[0].value).toBe(1);
  expect(getDigitalInput(0x02)[1].value).toBe(1);
  expect(getDigitalInput(0x03)[0].value).toBe(1);
  expect(getDigitalInput(0x03)[1].value).toBe(1);
  expect(getDigitalInput(0xff)).toBe("Not Valid Input");
});

test("getDigitalInputStatus", () => {
  expect(getDigitalInputStatus(0b0)).toBe(0);
  expect(getDigitalInputStatus(0b1)).toBe(1);
  expect(getDigitalInputStatus()).toBe("Not Valid Input");
});

test("getToggleAnalogInput", () => {
  expect(getToggleAnalogInput(0b00)).toBe(0);
  expect(getToggleAnalogInput(0b01)).toBe(1);
  expect(getToggleAnalogInput(0b10)).toBe(2);
  expect(getToggleAnalogInput(0b11)).toBe("Not Valid Input");
});

test("getDigitalCounter", () => {
  const counterToggle = [
    { name: "DI1", toggle: 0 },
    { name: "DI2", toggle: 2 },
    { name: "DI3", toggle: 1 },
    { name: "DI4", toggle: 3 },
  ];
  const rawData = "0000000015000000";
  const bytes = Buffer.from(rawData, "hex");
  output = getDigitalCounter(counterToggle, bytes);
  expect(output[0].counter).toBe(null);
  expect(output[1].counter).toBe(0);
  expect(output[2].counter).toBe(null);
  expect(output[3].counter).toBe(21);
});

test("getDigitalOutputToggle", () => {
  output = getDigitalOutputToggle(0x00);
  expect(output[0].name).toBe("DO1");
  expect(output[0].toggle).toBe(0);
  expect(output[1].name).toBe("DO2");
  expect(output[1].toggle).toBe(0);
  output = getDigitalOutputToggle(0x01);
  expect(output[0].name).toBe("DO1");
  expect(output[0].toggle).toBe(1);
  expect(output[1].name).toBe("DO2");
  expect(output[1].toggle).toBe(0);
  output = getDigitalOutputToggle(0x02);
  expect(output[0].name).toBe("DO1");
  expect(output[0].toggle).toBe(0);
  expect(output[1].name).toBe("DO2");
  expect(output[1].toggle).toBe(1);
  output = getDigitalOutputToggle(0x03);
  expect(output[0].name).toBe("DO1");
  expect(output[0].toggle).toBe(1);
  expect(output[1].name).toBe("DO2");
  expect(output[1].toggle).toBe(1);
  output = getDigitalOutputToggle(0x04);
  expect(output[0].name).toBe("DO1");
  expect(output[0].toggle).toBe("Not Valid Input");
  expect(output[1].name).toBe("DO2");
  expect(output[1].toggle).toBe("Not Valid Input");
  output = getDigitalOutputToggle(0xff);
  expect(output[0].name).toBe("DO1");
  expect(output[0].toggle).toBe("Not Valid Input");
  expect(output[1].name).toBe("DO2");
  expect(output[1].toggle).toBe("Not Valid Input");
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
  expect(output.toggles_of_digital_outputs[0].name).toBe("DO1");
  expect(output.toggles_of_digital_outputs[0].toggle).toBe(0);
  expect(output.toggles_of_digital_outputs[1].name).toBe("DO2");
  expect(output.toggles_of_digital_outputs[1].toggle).toBe(0);
  expect(output.toggles_of_digital_inputs[0].toggle).toBe(0);
  expect(output.toggles_of_digital_inputs[1].toggle).toBe(0);
  expect(output.toggles_of_digital_inputs[2].toggle).toBe(0);
  expect(output.toggles_of_digital_inputs[3].toggle).toBe(0);
  expect(output.toggles_of_analog_inputs[0].toggle).toBe(0);
  expect(output.toggles_of_analog_inputs[1].toggle).toBe(0);
  expect(output.toggles_of_analog_inputs[2].toggle).toBe(0);
  expect(output.toggles_of_analog_inputs[3].toggle).toBe(0);
  expect(output.toggles_of_analog_inputs[4].toggle).toBe(0);
  expect(output.toggles_of_analog_inputs[5].toggle).toBe(0);
});

test("decode case 2", () => {
  const rawData =
    "7EF425000A7A805762110301D80000000000150000000105000000009A99D941000000007E";
  const bytes = Buffer.from(rawData, "hex");
  output = decode(bytes);
  console.log(output);
  expect(output.data_type).toBe("f4");
  expect(output.packet_length).toBe(37);
  expect(output.packet_version).toBe(10);
  expect(output.timestamp);
  expect(output.signal_strength).toBe(17);
  expect(output.toggles_of_digital_outputs[0].name).toBe("DO1");
  expect(output.toggles_of_digital_outputs[0].toggle).toBe(1);
  expect(output.toggles_of_digital_outputs[1].name).toBe("DO2");
  expect(output.toggles_of_digital_outputs[1].toggle).toBe(1);
  expect(output.toggles_of_digital_inputs[0].toggle).toBe(0);
  expect(output.toggles_of_digital_inputs[1].toggle).toBe(2);
  expect(output.toggles_of_digital_inputs[2].toggle).toBe(1);
  expect(output.toggles_of_digital_inputs[3].toggle).toBe(3);
  expect(output.digital_input_statuses[0].value).toBe(0);
  expect(output.digital_input_statuses[1].value).toBe(0);
  expect(output.digital_input_statuses[2].value).toBe(0);
  expect(output.digital_input_statuses[3].value).toBe(0);
  expect(output.di_counters[1].counter).toBe(0);
  expect(output.di_counters[3].counter).toBe(21);
  expect(output.toggles_of_analog_inputs[0].toggle).toBe(1);
  expect(output.toggles_of_analog_inputs[1].toggle).toBe(0);
  expect(output.toggles_of_analog_inputs[2].toggle).toBe(0);
  expect(output.toggles_of_analog_inputs[3].toggle).toBe(0);
  expect(output.toggles_of_analog_inputs[4].toggle).toBe(1);
  expect(output.toggles_of_analog_inputs[5].toggle).toBe(1);
  expect(output.analog_input_value[0].value).toBe(0);
  expect(output.analog_input_value[1].value).toBe(null);
  expect(output.analog_input_value[2].value).toBe(null);
  expect(output.analog_input_value[3].value).toBe(null);
  expect(output.analog_input_value[4].value).toBe(27.2);
  expect(output.analog_input_value[5].value).toBe(0);
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
  expect(output.toggles_of_digital_outputs[0].name).toBe("DO1");
  expect(output.toggles_of_digital_outputs[0].toggle).toBe(0);
  expect(output.toggles_of_digital_outputs[1].name).toBe("DO2");
  expect(output.toggles_of_digital_outputs[1].toggle).toBe(0);
  tog_di = output.toggles_of_digital_inputs;
  expect(tog_di[0].toggle).toBe(0);
  expect(tog_di[1].toggle).toBe(0);
  expect(tog_di[2].toggle).toBe(0);
  expect(tog_di[3].toggle).toBe(0);
  expect(output.toggles_of_analog_inputs[0].toggle).toBe(0);
  expect(output.toggles_of_analog_inputs[1].toggle).toBe(0);
  expect(output.toggles_of_analog_inputs[2].toggle).toBe(0);
  expect(output.toggles_of_analog_inputs[3].toggle).toBe(0);
  expect(output.toggles_of_analog_inputs[4].toggle).toBe(0);
  expect(output.toggles_of_analog_inputs[5].toggle).toBe(0);
  modbus = output.modbus;
  expect(modbus[0].channel_id).toBe(1);
  expect(modbus[0].status).toBe("collected successfully");
  expect(modbus[0].data).toStrictEqual([21, 32]);
  expect(modbus[1].channel_id).toBe(2);
  expect(modbus[1].status).toBe("collected failed");
  expect(modbus[1].data).toStrictEqual([0]);
});
