import {
  IAnalogInputToggles,
  IAnalogInputValues,
  IDigitalInputCounters,
  IDigitalInputStatuses,
  IDigitalInputToggles,
  IDigitalOutputStatuses,
  IDigitalOutputToggles,
  IModbus,
  IPayload,
} from "./types/type";

/* ******************************************
 * Constant Value
 ********************************************/

const DISABLE = 0;
const ENABLE = 1;
const LOW = 0;
const HIGH = 1;
const CLOSE = 0;
const OPEN = 1;
const DIGITAL_INPUT_MODE = 1;
const COUNTER_STOP_COUNTING_MODE = 2;
const COUNTER_START_COUNTING_MODE = 3;
const COLLECTED_SUCCESS = 1;
const COLLECTED_FAIL = 2;
const ERROR = -1;

/* ******************************************
 * Data Template
 ********************************************/

const BYTE_LENGTH = {
  PACKET_LENGTH: 2,
  TIMESTAMP_LENGTH: 4,
  TOGGLE_ANALOG_INPUT_LENGTH: 2,
  INT16_LENGTH: 2,
  INT32_LENGTH: 4,
  FLOAT_LENGTH: 4,
};

const DIGITAL_OUTPUT_TOGGLES_TEMPLATE: IDigitalOutputToggles[] = [
  { name: "DO1", toggle: 0 },
  { name: "DO2", toggle: 0 },
];

const DIGITAL_OUTPUT_STATUSES_TEMPLATE: IDigitalOutputStatuses[] = [
  { name: "DO1", status: null },
  { name: "DO2", status: null },
];

const DIGITAL_INPUT_TOGGLES_TEMPLATE: IDigitalInputToggles[] = [
  { name: "DI1", toggle: 0 },
  { name: "DI2", toggle: 0 },
  { name: "DI3", toggle: 0 },
  { name: "DI4", toggle: 0 },
];

const DIGITAL_INPUT_STATUSES_TEMPLATE: IDigitalInputStatuses[] = [
  { name: "DI1", status: null },
  { name: "DI2", status: null },
  { name: "DI3", status: null },
  { name: "DI4", status: null },
];

const DIGITAL_COUNTER_TEMPLATE: IDigitalInputCounters[] = [
  { name: "DI1", counter: null },
  { name: "DI2", counter: null },
  { name: "DI3", counter: null },
  { name: "DI4", counter: null },
];

const ANALOG_INPUT_TOGGLE_TEMPLATE: IAnalogInputToggles[] = [
  { name: "i4_20mA_1", toggle: 0 },
  { name: "i4_20mA_2", toggle: 0 },
  { name: "i0_10V_1", toggle: 0 },
  { name: "i0_10V_2", toggle: 0 },
  { name: "iPT100_1", toggle: 0 },
  { name: "iPT100_2", toggle: 0 },
];

const ANALOG_INPUT_VALUE_TEMPLATE: IAnalogInputValues[] = [
  { name: "i4_20mA_1", value: null },
  { name: "i4_20mA_2", value: null },
  { name: "i0_10V_1", value: null },
  { name: "i0_10V_2", value: null },
  { name: "iPT100_1", value: null },
  { name: "iPT100_2", value: null },
];

const DATA_TYPE_TEMPLATE = [
  "Coil",
  "Discrete",
  "Input16",
  "Hold16",
  "Hold32",
  "Hold_float",
  "Input32",
  "Input_float",
  "Input_int32_with upper 16 bits",
  "Input_int32_with lower 16 bits",
  "Hold_int32_with upper 16 bits",
  "Hold_int32_with lower 16 bits",
];

const OUTPUT_TEMPLATE: IPayload = {
  data_type: "" as string,
  packet_length: 0 as number,
  packet_version: 0 as number,
  timestamp: "" as string,
  signal_strength: 0 as number,
  toggles_of_digital_outputs: [
    ...DIGITAL_OUTPUT_TOGGLES_TEMPLATE,
  ] as IDigitalOutputToggles[],
  digital_output_statuses: [
    ...DIGITAL_OUTPUT_STATUSES_TEMPLATE,
  ] as IDigitalOutputStatuses[],
  toggles_of_digital_inputs: [
    ...DIGITAL_INPUT_TOGGLES_TEMPLATE,
  ] as IDigitalInputToggles[],
  digital_input_statuses: [
    ...DIGITAL_INPUT_STATUSES_TEMPLATE,
  ] as IDigitalInputStatuses[],
  di_counters: [...DIGITAL_COUNTER_TEMPLATE] as IDigitalInputCounters[],
  toggles_of_analog_inputs: [
    ...ANALOG_INPUT_TOGGLE_TEMPLATE,
  ] as IAnalogInputToggles[],
  analog_input_values: [...ANALOG_INPUT_VALUE_TEMPLATE] as IAnalogInputValues[],
  modbus: [] as IModbus[],
};

/* ******************************************
 * bytes to number
 ********************************************/

const readUInt8LE = (byte: number) => {
  return byte & 0xff;
};

const readInt8LE = (byte: Buffer) => {
  let ref = readUInt8LE(byte[0]);
  return ref > 0x7f ? ref - 0x100 : ref;
};

const readUInt16LE = (bytes: Buffer) => {
  let value = (bytes[1] << 8) + bytes[0];
  return value & 0xffff;
};

const readInt16LE = (bytes: Buffer) => {
  let ref = readUInt16LE(bytes);
  return ref > 0x7fff ? ref - 0x10000 : ref;
};

const readUInt32LE = (bytes: Buffer) => {
  let value = (bytes[3] << 24) + (bytes[2] << 16) + (bytes[1] << 8) + bytes[0];
  return value & 0xffffffff;
};

const readInt32LE = (bytes: Buffer) => {
  let ref = readUInt32LE(bytes);
  return ref > 0x7fffffff ? ref - 0x100000000 : ref;
};

const readFloatLE = (bytes: Buffer) => {
  // JavaScript bitwise operators yield a 32 bits integer, not a float.
  // Assume LSB (least significant byte first).
  let bits = (bytes[3] << 24) | (bytes[2] << 16) | (bytes[1] << 8) | bytes[0];
  let sign = bits >>> 31 === 0 ? 1.0 : -1.0;
  let e = (bits >>> 23) & 0xff;
  let m = e === 0 ? (bits & 0x7fffff) << 1 : (bits & 0x7fffff) | 0x800000;
  let f = sign * m * Math.pow(2, e - 150);
  return f;
};

const byte2hex = (byte: number) => {
  return byte.toString(16);
};

/* ******************************************
 * sub function
 ********************************************/
const getDataType = (bytes: Buffer) => {
  return byte2hex(bytes[0]);
};

const getPacketLength = (bytes: Buffer) => {
  return readInt16LE(bytes);
};

const getPacketVersion = (bytes: Buffer) => {
  return readInt8LE(bytes);
};

const getTimeStamp = (bytes: Buffer) => {
  return new Date(readUInt32LE(bytes) * 1000).toString();
};

const getSignalStrength = (bytes: Buffer) => {
  return readInt8LE(bytes);
};

const getDigitalOutputToggles = (byte: number) => {
  switch (byte) {
    case 0x00:
      return [
        { name: "DO1", toggle: DISABLE },
        { name: "DO2", toggle: DISABLE },
      ];
    case 0x01:
      return [
        { name: "DO1", toggle: ENABLE },
        { name: "DO2", toggle: DISABLE },
      ];
    case 0x02:
      return [
        { name: "DO1", toggle: DISABLE },
        { name: "DO2", toggle: ENABLE },
      ];
    case 0x03:
      return [
        { name: "DO1", toggle: ENABLE },
        { name: "DO2", toggle: ENABLE },
      ];
    default:
      return [
        { name: "DO1", toggle: ERROR },
        { name: "DO2", toggle: ERROR },
      ];
  }
};

const hasDigitalOutputStatuses = (toggles: IDigitalOutputToggles[]) => {
  for (const { toggle } of toggles) {
    if (toggle == ENABLE) {
      return true;
    }
  }
  return false;
};

const getDigitalOutputStatuses = (bytes: number) => {
  let do_statuses = [...DIGITAL_OUTPUT_STATUSES_TEMPLATE];
  switch (bytes) {
    case 0x00:
      do_statuses[0].status = CLOSE;
      do_statuses[1].status = CLOSE;
      break;
    case 0x01:
      do_statuses[0].status = OPEN;
      do_statuses[1].status = CLOSE;
      break;
    case 0x02:
      do_statuses[0].status = CLOSE;
      do_statuses[1].status = OPEN;
      break;
    case 0x03:
      do_statuses[0].status = OPEN;
      do_statuses[1].status = OPEN;
      break;
    default:
      do_statuses[0].status = ERROR;
      do_statuses[1].status = ERROR;
      break;
  }
  return do_statuses;
};

const getDigitalInputToggles = (byte: number) => {
  let di_toggles = [...DIGITAL_INPUT_TOGGLES_TEMPLATE];
  for (let index = 0; index < di_toggles.length; index++) {
    let mode = getDigitalInputMode((byte >> (2 * index)) & 0b11);
    di_toggles[index].toggle = mode;
  }
  return di_toggles;
};

const getDigitalInputMode = (bits: number) => {
  switch (bits) {
    case 0b00:
      return DISABLE;
    case 0b01:
      return DIGITAL_INPUT_MODE;
    case 0b10:
      return COUNTER_STOP_COUNTING_MODE;
    case 0b11:
      return COUNTER_START_COUNTING_MODE;
    default:
      return ERROR;
  }
};

const hasInputMode = (inputToggles: IDigitalInputToggles[]) => {
  for (const { toggle } of inputToggles) {
    if (toggle == DIGITAL_INPUT_MODE) {
      return true;
    }
  }
  return false;
};

const getDigitalInput = (byte: number) => {
  let digital_input_statuses = [...DIGITAL_INPUT_STATUSES_TEMPLATE];
  for (let i = 0; i < 4; i++) {
    if (byte > 0x0f) digital_input_statuses[i].status = ERROR;
    else
      digital_input_statuses[i].status = getDigitalInputStatus((byte >> i) & 1);
  }
  return digital_input_statuses;
};

const getDigitalInputStatus = (bit: number) => {
  switch (bit) {
    case 0:
      return LOW;
    case 1:
      return HIGH;
    default:
      return ERROR;
  }
};

const hasCounterMode = (inputToggles: IDigitalInputToggles[]) => {
  for (const { toggle } of inputToggles) {
    if (
      toggle == COUNTER_START_COUNTING_MODE ||
      toggle == COUNTER_STOP_COUNTING_MODE
    ) {
      return true;
    }
  }
  return false;
};

const getCounterToggleSize = (inputToggles: IDigitalInputToggles[]) => {
  let byteSize = 0;
  let { INT32_LENGTH } = BYTE_LENGTH;
  for (const { toggle } of inputToggles) {
    if (
      toggle == COUNTER_START_COUNTING_MODE ||
      toggle == COUNTER_STOP_COUNTING_MODE
    ) {
      byteSize += INT32_LENGTH;
    }
  }
  return byteSize;
};

const getDigitalCounter = (
  inputToggles: IDigitalInputToggles[],
  counterBytes: Buffer
) => {
  let di_counters = [...DIGITAL_COUNTER_TEMPLATE];
  let { INT32_LENGTH } = BYTE_LENGTH;
  let counterIndex = 0;
  for (const index in inputToggles) {
    let mToggle = inputToggles[index].toggle;
    if (mToggle == DISABLE || mToggle == DIGITAL_INPUT_MODE) {
      continue;
    } else if (
      mToggle == COUNTER_STOP_COUNTING_MODE ||
      mToggle == COUNTER_START_COUNTING_MODE
    ) {
      let val = readInt32LE(
        counterBytes.slice(counterIndex, counterIndex + INT32_LENGTH)
      );
      di_counters[index].counter = val;
      counterIndex += INT32_LENGTH;
    }
  }
  return di_counters;
};

const getToggleAnalogInput = (bits: number) => {
  switch (bits) {
    case 0b00:
      return DISABLE;
    case 0b01:
      return COLLECTED_SUCCESS;
    case 0b10:
      return COLLECTED_FAIL;
    default:
      return ERROR;
  }
};

const getToggleAnalogStatus = (bytes: Buffer) => {
  let toggles_of_analog_inputs = [...ANALOG_INPUT_TOGGLE_TEMPLATE];
  let byte1 = bytes[0];
  let byte2 = bytes[1];
  // setAnalog for Byte1 (4-20mA , 0-10v)
  for (let i = 0; i < 4; i++) {
    toggles_of_analog_inputs[i].toggle = getToggleAnalogInput(
      (byte1 >> (i * 2)) & 0x3
    );
  }
  // setAnalog for Byte2 (PT100)
  for (let i = 0; i < 2; i++) {
    toggles_of_analog_inputs[i + 4].toggle = getToggleAnalogInput(
      (byte2 >> (i * 2)) & 0x3
    );
  }

  return toggles_of_analog_inputs;
};

const hasAnalogInput = (analogToggles: IAnalogInputToggles[]) => {
  for (const { toggle } of analogToggles) {
    if (toggle == COLLECTED_FAIL || toggle == COLLECTED_SUCCESS) {
      return true;
    }
  }
  return false;
};

const getAnalogInputSize = (analogToggles: IAnalogInputToggles[]) => {
  let byteSize = 0;
  let { FLOAT_LENGTH } = BYTE_LENGTH;
  for (const { toggle } of analogToggles) {
    if (toggle == COLLECTED_FAIL || toggle == COLLECTED_SUCCESS) {
      byteSize += FLOAT_LENGTH;
    }
  }
  return byteSize;
};

const getAnalogValues = (
  analogToggles: IAnalogInputToggles[],
  analogInputBytes: Buffer
) => {
  let analog_input_values = [...ANALOG_INPUT_VALUE_TEMPLATE];
  const { FLOAT_LENGTH } = BYTE_LENGTH;
  let analogIndex = 0;
  for (const toggle in analogToggles) {
    if (
      analogToggles[toggle].toggle == COLLECTED_FAIL ||
      analogToggles[toggle].toggle == COLLECTED_SUCCESS
    ) {
      let readFloat = readFloatLE(
        analogInputBytes.slice(analogIndex, analogIndex + FLOAT_LENGTH)
      );
      analog_input_values[toggle].value = toPrecision(readFloat, 2);
      analogIndex += FLOAT_LENGTH;
    }
  }
  return analog_input_values;
};

const toPrecision = (number: number, precision: number = 1) => {
  let precisionNumber = 10 ** precision;
  let result = Math.round(number * precisionNumber) / precisionNumber;
  return result;
};

const isStopByte = (bytes: Buffer) => {
  return bytes[0] == 0x7e;
};

const getModbusChannelDataType = (byte: number) => {
  let channelId = (byte >> 4) & 0xf;
  let dataType = byte & 0xf;
  if (dataType > 11 || dataType < 0) {
    dataType = ERROR;
  }
  return { channelId, dataType };
};

const isValidDataType = (dataType: number) => {
  return dataType !== ERROR;
};

const getModbusRegisterSetting = (byte: number) => {
  let sign = (byte >> 7) & 1;
  let decimal = (byte >> 4) & 0b111;
  let status = (byte >> 3) & 1;
  let quantity = byte & 0b111;
  return { sign, decimal, status, quantity };
};

const getDataSize = (dataType: number) => {
  const DATA_TYPE = [...DATA_TYPE_TEMPLATE];
  switch (DATA_TYPE[dataType]) {
    case "Coil":
    case "Discrete":
      return 1;
    case "Input16":
    case "Hold16":
      return 2;
    case "Hold32":
    case "Hold_float":
      return 4;
    case "Input32":
    case "Input_float":
    case "Input_int32_with upper 16 bits":
    case "Input_int32_with lower 16 bits":
    case "Hold_int32_with upper 16 bits":
    case "Hold_int32_with lower 16 bits":
      return 4;
    default:
      return -1;
  }
};

const getParser = (dataType: number) => {
  const DATA_TYPE = [...DATA_TYPE_TEMPLATE];
  switch (DATA_TYPE[dataType]) {
    case "Coil":
    case "Discrete":
      return readInt8LE;

    case "Input16":
    case "Hold16":
      return readInt16LE;

    case "Input32":
    case "Hold32":
      return readInt32LE;

    case "Hold_float":
    case "Input_float":
      return readFloatLE;

    case "Input_int32_with upper 16 bits":
    case "Input_int32_with lower 16 bits":
    case "Hold_int32_with upper 16 bits":
    case "Hold_int32_with lower 16 bits":
      return readInt32LE;
    default:
      return readInt8LE;
  }
};

const DO = () => {};
// Decorator Pattern
DO.getToggles = (bytes: Buffer) => {
  return getDigitalOutputToggles(bytes[0]);
};
DO.hasStatuses = hasDigitalOutputStatuses;
DO.getStatuses = (bytes: Buffer) => {
  return getDigitalOutputStatuses(bytes[0]);
};

const DI = () => {};
DI.getToggles = (bytes: Buffer) => {
  return getDigitalInputToggles(bytes[0]);
};
DI.hasInputMode = hasInputMode;
DI.getStatuses = (bytes: Buffer) => {
  return getDigitalInput(bytes[0]);
};
DI.hasCounterMode = hasCounterMode;
DI.getCounterSize = getCounterToggleSize;
DI.getCounters = getDigitalCounter;

const AI = () => {};
AI.getToggles = getToggleAnalogStatus;
AI.hasInput = hasAnalogInput;
AI.getSize = getAnalogInputSize;
AI.getValues = getAnalogValues;

const MB = () => {};
MB.getChannelDataType = (bytes: Buffer) => {
  return getModbusChannelDataType(bytes[0]);
};
MB.getRegisterSetting = (bytes: Buffer) => {
  return getModbusRegisterSetting(bytes[0]);
};
MB.getDataSize = getDataSize;
MB.getParser = getParser;
MB.isValidType = isValidDataType;

/* ******************************************
 * Reader
 ********************************************/

let Reader = (arr: Buffer) => {
  let i = 0;
  const read = (size: number) => {
    const result = arr.slice(i, i + size);
    i += size;
    return result;
  };

  const skip = (size: number) => {
    i += size;
  };

  const reset = () => {
    i = 0;
  };

  const hasNext = () => {
    return i < arr.length;
  };

  const getSize = () => {
    return arr.length;
  };

  const index = () => {
    return i;
  };

  return {
    read,
    skip,
    reset,
    hasNext,
    getSize,
    index,
  };
};

/* ******************************************
 * Main DECODE Function
 ********************************************/
const decode = (bytes: Buffer) => {
  let output = { ...OUTPUT_TEMPLATE };

  const { PACKET_LENGTH, TIMESTAMP_LENGTH, TOGGLE_ANALOG_INPUT_LENGTH } =
    BYTE_LENGTH;

  let reader = Reader(bytes);
  reader.skip(1);

  output.data_type = getDataType(reader.read(1));
  output.packet_length = getPacketLength(reader.read(PACKET_LENGTH));
  output.packet_version = getPacketVersion(reader.read(1));
  output.timestamp = getTimeStamp(reader.read(TIMESTAMP_LENGTH));
  output.signal_strength = getSignalStrength(reader.read(1));

  // digital output
  let digitalOutputToggles = DO.getToggles(reader.read(1));
  output.toggles_of_digital_outputs = digitalOutputToggles;

  if (DO.hasStatuses(digitalOutputToggles)) {
    output.digital_output_statuses = DO.getStatuses(reader.read(1));
  }

  // digital input
  let digitalInputToggles = DI.getToggles(reader.read(1));
  output.toggles_of_digital_inputs = digitalInputToggles;

  if (DI.hasInputMode(digitalInputToggles)) {
    output.digital_input_statuses = DI.getStatuses(reader.read(1));
  }
  if (DI.hasCounterMode(digitalInputToggles)) {
    let counterSize = DI.getCounterSize(digitalInputToggles);
    let counterBytes = reader.read(counterSize);
    output.di_counters = DI.getCounters(digitalInputToggles, counterBytes);
  }

  // analog input
  let togglesOfAnalogInput = AI.getToggles(
    reader.read(TOGGLE_ANALOG_INPUT_LENGTH)
  );
  if (AI.hasInput(togglesOfAnalogInput)) {
    let analogInputSize = AI.getSize(togglesOfAnalogInput);
    let analogInputBytes = reader.read(analogInputSize);
    let ai_values = AI.getValues(togglesOfAnalogInput, analogInputBytes);
    output.analog_input_values = ai_values;
  }
  output.toggles_of_analog_inputs = togglesOfAnalogInput;

  // modbus
  let modbus: IModbus[] = [];
  while (reader.hasNext()) {
    let channelByte = reader.read(1);
    if (!reader.hasNext() && isStopByte(channelByte)) {
      break;
    }
    let { channelId, dataType } = MB.getChannelDataType(channelByte);
    if (!MB.isValidType(dataType)) {
      break;
    }
    let { sign, decimal, status, quantity } = MB.getRegisterSetting(
      reader.read(1)
    );
    let dataSize = MB.getDataSize(dataType);
    let parser = MB.getParser(dataType);
    let data: number[] = [];
    for (let i = 0; i < quantity; i++) {
      let mBytes: Buffer = reader.read(dataSize);
      data.push(parser(mBytes));
    }
    modbus.push({
      channel_id: channelId,
      data_type: dataType,
      register_setting: {
        sign: sign,
        decimal: decimal,
        status: status,
        quantity: quantity,
      },
      data: data,
    });
  }
  output.modbus = modbus;
  return output;
};

// let data = "7EF40F000A7A80576214000000007E";
// let bytes = Buffer.from(data, "hex");
// let output = JSON.stringify(decode(bytes), null, 2);
// console.log(output);
