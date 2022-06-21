const {
  getDigitalOutputStatuses,
  getDigitalInput,
  getToggleAnalogInput,
  getDigitalInputStatus,
  getDigitalInputMode,
  getDigitalCounter,
  getDigitalOutputToggles,
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
  expect(getDigitalOutputStatuses(0x04)[0].status).toBe(-1);
  expect(getDigitalOutputStatuses(0x04)[1].status).toBe(-1);
  expect(getDigitalOutputStatuses("")[0].status).toBe(-1);
  expect(getDigitalOutputStatuses("")[1].status).toBe(-1);
});

test("getDigitalInputMode", () => {
  expect(getDigitalInputMode(0b00)).toBe(0);
  expect(getDigitalInputMode(0b01)).toBe(1);
  expect(getDigitalInputMode(0b10)).toBe(2);
  expect(getDigitalInputMode(0b11)).toBe(3);
  expect(getDigitalInputMode()).toBe(-1);
});

test("getDigitalInput", () => {
  let di0 = getDigitalInput(0x00);
  expect(di0[0].status).toBe(0);
  expect(di0[1].status).toBe(0);
  expect(di0[2].status).toBe(0);
  expect(di0[3].status).toBe(0);
  let di1 = getDigitalInput(0x01);
  expect(di0[0].status).toBe(1);
  expect(di0[1].status).toBe(0);
  expect(di0[2].status).toBe(0);
  expect(di0[3].status).toBe(0);
  let di2 = getDigitalInput(0x03);
  expect(di0[0].status).toBe(1);
  expect(di0[1].status).toBe(1);
  expect(di0[2].status).toBe(0);
  expect(di0[3].status).toBe(0);
  let di3 = getDigitalInput(0x07);
  expect(di0[0].status).toBe(1);
  expect(di0[1].status).toBe(1);
  expect(di0[2].status).toBe(1);
  expect(di0[3].status).toBe(0);
  let di4 = getDigitalInput(0x0f);
  expect(di0[0].status).toBe(1);
  expect(di0[1].status).toBe(1);
  expect(di0[2].status).toBe(1);
  expect(di0[3].status).toBe(1);
  let di5 = getDigitalInput(0x10);
  expect(di0[0].status).toBe(-1);
  expect(di0[1].status).toBe(-1);
  expect(di0[2].status).toBe(-1);
  expect(di0[3].status).toBe(-1);
  let di6 = getDigitalInput(0xff);
  expect(di0[0].status).toBe(-1);
  expect(di0[1].status).toBe(-1);
  expect(di0[2].status).toBe(-1);
  expect(di0[3].status).toBe(-1);
});

test("getDigitalInputStatus", () => {
  expect(getDigitalInputStatus(0b0)).toBe(0);
  expect(getDigitalInputStatus(0b1)).toBe(1);
  expect(getDigitalInputStatus()).toBe(-1);
});

test("getToggleAnalogInput", () => {
  expect(getToggleAnalogInput(0b00)).toBe(0);
  expect(getToggleAnalogInput(0b01)).toBe(1);
  expect(getToggleAnalogInput(0b10)).toBe(2);
  expect(getToggleAnalogInput(0b11)).toBe(-1);
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
  let output = getDigitalCounter(counterToggle, bytes);
  expect(output[0].counter).toBe(null);
  expect(output[1].counter).toBe(0);
  expect(output[2].counter).toBe(null);
  expect(output[3].counter).toBe(21);
});

test("getDigitalOutputToggles", () => {
  let output = getDigitalOutputToggles(0x00);
  expect(output[0].name).toBe("DO1");
  expect(output[0].toggle).toBe(0);
  expect(output[1].name).toBe("DO2");
  expect(output[1].toggle).toBe(0);
  output = getDigitalOutputToggles(0x01);
  expect(output[0].name).toBe("DO1");
  expect(output[0].toggle).toBe(1);
  expect(output[1].name).toBe("DO2");
  expect(output[1].toggle).toBe(0);
  output = getDigitalOutputToggles(0x02);
  expect(output[0].name).toBe("DO1");
  expect(output[0].toggle).toBe(0);
  expect(output[1].name).toBe("DO2");
  expect(output[1].toggle).toBe(1);
  output = getDigitalOutputToggles(0x03);
  expect(output[0].name).toBe("DO1");
  expect(output[0].toggle).toBe(1);
  expect(output[1].name).toBe("DO2");
  expect(output[1].toggle).toBe(1);
  output = getDigitalOutputToggles(0x04);
  expect(output[0].name).toBe("DO1");
  expect(output[0].toggle).toBe(-1);
  expect(output[1].name).toBe("DO2");
  expect(output[1].toggle).toBe(-1);
  output = getDigitalOutputToggles(0xff);
  expect(output[0].name).toBe("DO1");
  expect(output[0].toggle).toBe(-1);
  expect(output[1].name).toBe("DO2");
  expect(output[1].toggle).toBe(-1);
});

test("getDataSize", () => {
  expect(getDataSize(0)).toBe(1);
  expect(getDataSize(1)).toBe(1);
  expect(getDataSize(2)).toBe(2);
  expect(getDataSize(3)).toBe(2);
  expect(getDataSize(4)).toBe(4);
  expect(getDataSize(5)).toBe(4);
  expect(getDataSize(6)).toBe(4);
  expect(getDataSize(7)).toBe(4);
  expect(getDataSize(8)).toBe(4);
  expect(getDataSize(9)).toBe(4);
  expect(getDataSize(0xa)).toBe(4);
  expect(getDataSize(0xb)).toBe(4);
  expect(getDataSize(0xc)).toBe(-1);
  expect(getDataSize()).toBe(-1);
});

test("getParser", () => {
  expect(getParser(0)).toBe(readInt8LE);
  expect(getParser(1)).toBe(readInt8LE);
  expect(getParser(2)).toBe(readInt16LE);
  expect(getParser(3)).toBe(readInt16LE);
  expect(getParser(4)).toBe(readInt32LE);
  expect(getParser(5)).toBe(readFloatLE);
  expect(getParser(6)).toBe(readInt32LE);
  expect(getParser(7)).toBe(readFloatLE);
  expect(getParser(8)).toBe(readInt32LE);
  expect(getParser(9)).toBe(readInt32LE);
  expect(getParser(0xa)).toBe(readInt32LE);
  expect(getParser(0xb)).toBe(readInt32LE);
  // expect(getParser("")).toEqual(() => {});
});

test("decode case 1", () => {
  const rawData = "7EF40F000A7A80576214000000007E";
  const bytes = Buffer.from(rawData, "hex");
  let output = decode(bytes);
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
  let output = decode(bytes);
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
  expect(output.digital_input_statuses[0].status).toBe(0);
  expect(output.digital_input_statuses[1].status).toBe(0);
  expect(output.digital_input_statuses[2].status).toBe(0);
  expect(output.digital_input_statuses[3].status).toBe(0);
  expect(output.di_counters[1].counter).toBe(0);
  expect(output.di_counters[3].counter).toBe(21);
  expect(output.toggles_of_analog_inputs[0].toggle).toBe(1);
  expect(output.toggles_of_analog_inputs[1].toggle).toBe(0);
  expect(output.toggles_of_analog_inputs[2].toggle).toBe(0);
  expect(output.toggles_of_analog_inputs[3].toggle).toBe(0);
  expect(output.toggles_of_analog_inputs[4].toggle).toBe(1);
  expect(output.toggles_of_analog_inputs[5].toggle).toBe(1);
  expect(output.analog_input_values[0].value).toBe(0);
  expect(output.analog_input_values[1].value).toBe(null);
  expect(output.analog_input_values[2].value).toBe(null);
  expect(output.analog_input_values[3].value).toBe(null);
  expect(output.analog_input_values[4].value).toBe(27.2);
  expect(output.analog_input_values[5].value).toBe(0);
  expect(output.modbus);
});

test("decode case 3", () => {
  const rawData = "7EF418000A7A8057621100000000022A150020001021007E";
  const bytes = Buffer.from(rawData, "hex");
  let output = decode(bytes);
  //console.log(JSON.stringify(output, null, 2));
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
  expect(modbus[0].channel_id).toBe(0);
  expect(modbus[0].register_setting.status).toBe(1);
  expect(modbus[0].data).toEqual([21, 32]);
  expect(modbus[1].channel_id).toBe(1);
  expect(modbus[1].register_setting.status).toBe(0);
  expect(modbus[1].data).toEqual([0]);
});

test("decode case 4", () => {
  const rawData =
    "7ef47f000a2a89906219030055005505000000000000000000000000000000000000000000000000003901113901223901803339018046b90180ffff56b90180ffff66b90180ffff76b90180ffff87b925529ac497b925529ac4a7b925529ac4b7b925529ac4c4b90180ffffd4b90180ffffe4b90180fffff4b90180ffff7e";
  const bytes = Buffer.from(rawData, "hex");
  let output = decode(bytes);
});
