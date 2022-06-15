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

const OUTPUT_TEMPLATE = {
  data_type: "",
  packet_length: "",
  packet_version: "",
  timestamp: "",
  signal_strength: "",
  toggles_of_digital_outputs: {},
  digital_output_statuses: {},
  toggles_of_digital_inputs: {},
  digital_input_statuses: {},
  di_counters: {},
  toggles_of_analog_inputs: {},
  analog_input_value: {},
  modbus: {},
};

const DO_STATUSES_TEMPLATE = [
  { name: "DO1", status: null }, // TODO: NULL?
  { name: "DO2", status: null },
];

const DIGITAL_INPUT_TEMPLATE = [
  { name: "DI1", toggle: DISABLE },
  { name: "DI2", toggle: DISABLE },
  { name: "DI3", toggle: DISABLE },
  { name: "DI4", toggle: DISABLE },
];

const DIGITAL_INPUT_VALUE_TEMPLATE = [
  { name: "DI1", value: null }, // TODO: NULL?
  { name: "DI2", value: null },
  { name: "DI3", value: null },
  { name: "DI4", value: null },
];

const DIGITAL_COUNTER_TEMPLATE = [
  { name: "DI1", counter: null }, // TODO: NULL?
  { name: "DI2", counter: null },
  { name: "DI3", counter: null },
  { name: "DI4", counter: null },
];

const ANALOG_INPUT_TOGGLE_TEMPLATE = [
  { name: "i4_20mA_1", toggle: DISABLE }, // TODO: NULL
  { name: "i4_20mA_2", toggle: DISABLE },
  { name: "i0_10V_1", toggle: DISABLE },
  { name: "i0_10V_2", toggle: DISABLE },
  { name: "iPT100_1", toggle: DISABLE },
  { name: "iPT100_2", toggle: DISABLE },
];

const ANALOG_INPUT_VALUE_TEMPLATE = [
  { name: "i4_20mA_1", value: null }, // TODO: NULL?
  { name: "i4_20mA_2", value: null },
  { name: "i0_10V_1", value: null },
  { name: "i0_10V_2", value: null },
  { name: "iPT100_1", value: null },
  { name: "iPT100_2", value: null },
];

const DATA_TYPE_TEMPLATE = {
  0: "Coil",
  1: "Discrete",
  2: "Input16",
  3: "Hold16",
  4: "Hold32",
  5: "Hold_float",
  6: "Input32",
  7: "Input_float",
  8: "Input_int32_with upper 16 bits",
  9: "Input_int32_with lower 16 bits",
  10: "Hold_int32_with upper 16 bits",
  11: "Hold_int32_with lower 16 bits",
};

/* ******************************************
 * bytes to number
 ********************************************/

function readUInt8LE(bytes) {
  return bytes & 0xff;
}

function readInt8LE(bytes) {
  let ref = readUInt8LE(bytes);
  return ref > 0x7f ? ref - 0x100 : ref;
}

function readUInt16LE(bytes) {
  let value = (bytes[1] << 8) + bytes[0];
  return value & 0xffff;
}

function readInt16LE(bytes) {
  let ref = readUInt16LE(bytes);
  return ref > 0x7fff ? ref - 0x10000 : ref;
}

function readUInt32LE(bytes) {
  let value = (bytes[3] << 24) + (bytes[2] << 16) + (bytes[1] << 8) + bytes[0];
  return value & 0xffffffff;
}

function readInt32LE(bytes) {
  let ref = readUInt32LE(bytes);
  return ref > 0x7fffffff ? ref - 0x100000000 : ref;
}

function readFloatLE(bytes) {
  // JavaScript bitwise operators yield a 32 bits integer, not a float.
  // Assume LSB (least significant byte first).
  let bits = (bytes[3] << 24) | (bytes[2] << 16) | (bytes[1] << 8) | bytes[0];
  let sign = bits >>> 31 === 0 ? 1.0 : -1.0;
  let e = (bits >>> 23) & 0xff;
  let m = e === 0 ? (bits & 0x7fffff) << 1 : (bits & 0x7fffff) | 0x800000;
  let f = sign * m * Math.pow(2, e - 150);
  return f;
}

function byte2hex(byte) {
  return parseInt(byte).toString(16);
}

/* ******************************************
 * sub function
 ********************************************/

function getDigitalOutputToggle(byte) {
  switch (byte) {
    case 0x00:
      return [
        { name: "DO1", toggle: 0 },
        { name: "DO2", toggle: 0 },
      ];
    case 0x01:
      return [
        { name: "DO1", toggle: 1 },
        { name: "DO2", toggle: 0 },
      ];
    case 0x02:
      return [
        { name: "DO1", toggle: 0 },
        { name: "DO2", toggle: 1 },
      ];
    case 0x03:
      return [
        { name: "DO1", toggle: 1 },
        { name: "DO2", toggle: 1 },
      ];
    default:
      return [
        { name: "DO1", toggle: "Not Valid Input" }, // TODO: -1 or else ?
        { name: "DO2", toggle: "Not Valid Input" },
      ];
  }
}

function hasDigitalOutputStatuses(toggles) {
  for (const { toggle } of toggles) {
    if (toggle == ENABLE) {
      return true;
    }
  }
  return false;
}

function getDigitalOutputStatuses(byte) {
  let do_statuses = [...DO_STATUSES_TEMPLATE];
  switch (byte) {
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
      return "Not Valid Input"; // TODO: -1 or else ?
  }
  return do_statuses;
}

function getDigitalInputToggles(byte) {
  let di_toggle = [...DIGITAL_INPUT_TEMPLATE];
  for (const toggle in di_toggle) {
    let mode = getDigitalInputMode((byte >> (2 * toggle)) & 0b11);
    di_toggle[toggle].toggle = mode;
  }
  return di_toggle;
}

function getDigitalInputMode(bits) {
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
      return "Not Valid Input"; // TODO: -1
  }
}

function hasInputMode(inputToggles) {
  for (const { toggle } of inputToggles) {
    if (toggle == DIGITAL_INPUT_MODE) {
      return true;
    }
  }
  return false;
}

function getDigitalInput(byte) {
  let digital_input_status = [...DIGITAL_INPUT_VALUE_TEMPLATE];
  if (byte > 0x0f) return "Not Valid Input"; // TODO: -1 or else ?
  for (let i = 0; i < 4; i++) {
    digital_input_status[i].value = getDigitalInputStatus((byte >> i) & 1);
  }
  return digital_input_status;
}

function getDigitalInputStatus(bits) {
  switch (bits) {
    case 0:
      return LOW;
    case 1:
      return HIGH;
    default:
      return "Not Valid Input"; // TODO: -1 or else ?
  }
}

function hasCounterMode(inputToggles) {
  for (const { toggle } of inputToggles) {
    if (
      toggle == COUNTER_START_COUNTING_MODE ||
      toggle == COUNTER_STOP_COUNTING_MODE
    ) {
      return true;
    }
  }
  return false;
}

function getCounterToggleSize(inputToggles) {
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
}

function getDigitalCounter(inputToggles, counterByte) {
  let di_counters = [...DIGITAL_COUNTER_TEMPLATE];
  let { INT32_LENGTH } = BYTE_LENGTH;
  let counterIndex = 0;
  for (const toggle in inputToggles) {
    let mToggle = inputToggles[toggle].toggle;
    if (mToggle == DISABLE || mToggle == DIGITAL_INPUT_MODE) {
      continue;
    } else if (
      mToggle == COUNTER_STOP_COUNTING_MODE ||
      mToggle == COUNTER_START_COUNTING_MODE
    ) {
      let val = readInt32LE(
        counterByte.slice(counterIndex, counterIndex + INT32_LENGTH)
      );
      di_counters[toggle].counter = val;
      counterIndex += INT32_LENGTH;
    }
  }
  return di_counters;
}

function getToggleAnalogInput(bits) {
  switch (bits) {
    case 0b00:
      return DISABLE;
    case 0b01:
      return COLLECTED_SUCCESS;
    case 0b10:
      return COLLECTED_FAIL;
    default:
      return "Not Valid Input"; // TODO: -1 or else ?
  }
}

function getToggleAnalogStatus(bytes) {
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
}

function hasAnalogInput(toggleAnalog) {
  for (const { toggle } of toggleAnalog) {
    if (toggle == COLLECTED_FAIL || toggle == COLLECTED_SUCCESS) {
      return true;
    }
  }
  return false;
}

function getAnalogInputSize(toggleAnalog) {
  let byteSize = 0;
  let { FLOAT_LENGTH } = BYTE_LENGTH;
  for (const { toggle } of toggleAnalog) {
    if (toggle == COLLECTED_FAIL || toggle == COLLECTED_SUCCESS) {
      byteSize += FLOAT_LENGTH;
    }
  }
  return byteSize;
}

function getAnalogValue(toggleAnalog, analogInputByte) {
  let analog_input_value = [...ANALOG_INPUT_VALUE_TEMPLATE];
  const { FLOAT_LENGTH } = BYTE_LENGTH;
  let analogIndex = 0;
  for (const toggle in toggleAnalog) {
    if (
      toggleAnalog[toggle].toggle == COLLECTED_FAIL ||
      toggleAnalog[toggle].toggle == COLLECTED_SUCCESS
    ) {
      analog_input_value[toggle].value =
        Math.round(
          readFloatLE(
            analogInputByte.slice(analogIndex, analogIndex + FLOAT_LENGTH)
          ) * 100,
          2
        ) / 100;
      analogIndex += FLOAT_LENGTH;
    }
  }
  return analog_input_value;
}

function isStopByte(readerIndex, readerLength) {
  return readerIndex + 1 == readerLength;
}

function getModbusChannelDataType(byte) {
  let DataType = { ...DATA_TYPE_TEMPLATE };
  let channelId = ((byte >> 4) & 0xf) + 1;
  let dataTypeBit = byte & 0xf;
  let dataType = DataType[dataTypeBit];
  return { channelId, dataType };
}

function getModbusRegisterSetting(byte) {
  let sign = (byte >> 7) & 1;
  let decimal = (byte >> 4) & 0b111;
  let status =
    ((byte >> 3) & 1) == 0 ? "collected failed" : "collected successfully";
  let quantity = byte & 0b111;
  return { sign, decimal, status, quantity };
}

function getDataSize(dataType) {
  switch (dataType) {
    case "Coil":
      return 1;
    case "Discrete":
      return 1;
    case "Input16":
      return 2;
    case "Hold16":
      return 2;
    case "Hold32":
      return 4;
    case "Hold_float": // TODO: Reformat return 4 cases ?
      return 4;
    case "Input32":
      return 4;
    case "Input_float":
      return 4;
    case "Input_int32_with upper 16 bits":
      return 4;
    case "Input_int32_with lower 16 bits":
      return 4;
    case "Hold_int32_with upper 16 bits":
      return 4;
    case "Hold_int32_with lower 16 bits":
      return 4;
    default:
      return 0; // TODO: -1 or else ?
  }
}

function getParser(dataType) {
  switch (dataType) {
    case "Coil":
      return readInt8LE;
    case "Discrete":
      return readInt8LE;
    case "Input16":
      return readInt16LE;
    case "Hold16":
      return readInt16LE;
    case "Hold32":
      return readInt32LE;
    case "Hold_float":
      return readFloatLE;
    case "Input32":
      return readInt32LE;
    case "Input_float":
      return readFloatLE;
    case "Input_int32_with upper 16 bits":
      return readInt32LE;
    case "Input_int32_with lower 16 bits":
      return readInt32LE;
    case "Hold_int32_with upper 16 bits":
      return readInt32LE;
    case "Hold_int32_with lower 16 bits":
      return readInt32LE;
    default:
      return () => {}; // TODO: Invalid DataType Function()=>{return rawData(hex)}
  }
}

const DO = () => {};
// Decorator Pattern
DO.getToggles = (bytes) => {
  return getDigitalOutputToggle(bytes[0]);
};
DO.hasStatuses = hasDigitalOutputStatuses;
DO.getStatuses = (bytes) => {
  return getDigitalOutputStatuses(bytes[0]);
};

const DI = () => {};
DI.getToggles = (bytes) => {
  return getDigitalInputToggles(bytes[0]);
};
DI.hasInputMode = hasInputMode;
DI.getStatuses = (bytes) => {
  return getDigitalInput(bytes[0]);
};
DI.hasCounterMode = hasCounterMode;
DI.getCounterSize = getCounterToggleSize;
DI.getCounters = getDigitalCounter;

const AI = () => {};
AI.getToggles = getToggleAnalogStatus;
AI.hasAnalogInput = hasAnalogInput;
AI.getSize = getAnalogInputSize;
AI.getValue = getAnalogValue;

const MB = () => {};
MB.getChannelDataType = (bytes) => {
  return getModbusChannelDataType(bytes[0]);
};
MB.getRegisterSetting = (bytes) => {
  return getModbusRegisterSetting(bytes[0]);
};
MB.getDataSize = getDataSize;
MB.getParser = getParser;

/* ******************************************
 * Reader
 ********************************************/

let Reader = (arr) => {
  let i = 0;
  const read = (size) => {
    const result = arr.slice(i, i + size);
    i += size;
    return result;
  };

  const skip = (size) => {
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

function decode(bytes) {
  let output = { ...OUTPUT_TEMPLATE };

  const { PACKET_LENGTH, TIMESTAMP_LENGTH, TOGGLE_ANALOG_INPUT_LENGTH } =
    BYTE_LENGTH;

  let reader = Reader(bytes);
  reader.skip(1); // skip start byte

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
  if (AI.hasAnalogInput(togglesOfAnalogInput)) {
    let analogInputSize = AI.getSize(togglesOfAnalogInput);
    let analogInputByte = reader.read(analogInputSize);
    let ai_value = AI.getValue(togglesOfAnalogInput, analogInputByte);
    output.analog_input_value = ai_value;
  }
  output.toggles_of_analog_inputs = togglesOfAnalogInput;

  // modbus
  let modbus = [];
  while (reader.hasNext() && !isStopByte(reader.index(), reader.getSize())) {
    // TODO: Change isStopByte
    let { channelId, dataType } = MB.getChannelDataType(reader.read(1));
    // TODO: CHECK DATATYPE VALID :: TERMINATE FUNCTION
    let { status, quantity } = MB.getRegisterSetting(reader.read(1));
    let dataSize = MB.getDataSize(dataType);
    let parser = MB.getParser(dataType);
    let data = [];
    for (let i = 0; i < quantity; i++) {
      let mBytes = reader.read(dataSize);
      data.push(parser(mBytes));
    }
    modbus.push({
      channel_id: channelId,
      data_type: dataType,
      status: status,
      quantity: quantity,
      data: data,
    });
  }
  output.modbus = modbus;

  return output;

  function getDataType(bytes) {
    return byte2hex(bytes[0]);
  }

  function getPacketLength(bytes) {
    return readInt16LE(bytes);
  }

  function getPacketVersion(bytes) {
    return readInt8LE(bytes[0]);
  }

  function getTimeStamp(bytes) {
    return new Date(readUInt32LE(bytes) * 1000).toString();
  }

  function getSignalStrength(bytes) {
    return readInt8LE(bytes[0]);
  }
}

module.exports = {
  getDigitalOutputStatuses,
  getDigitalInputToggles,
  getToggleAnalogInput,
  getDigitalInput,
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
};
