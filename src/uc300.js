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
  toggles_of_digital_inputs: {},
  digital_input_status: {},
  di_counter: {},
  toggles_of_analog_inputs: {},
  analog_input_value: {},
  modbus: {},
};

function byte2hex(byte) {
  return parseInt(byte).toString(16);
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
    case "Hold_float":
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
      return 0;
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
      return () => {};
  }
}

function hasDigitalOutputStatuses(toggles) {
  for (const { toggle } of toggles) {
    if (toggle == "enable") {
      return true;
    }
  }
  return false;
}

function decode(bytes) {
  let output = { ...OUTPUT_TEMPLATE };

  const {
    PACKET_LENGTH,
    TIMESTAMP_LENGTH,
    TOGGLE_ANALOG_INPUT_LENGTH,
    INT16_LENGTH,
    INT32_LENGTH,
    FLOAT_LENGTH,
  } = BYTE_LENGTH;

  let reader = Reader(bytes);
  reader.skip(1); // skip start byte

  // get data_type
  output.data_type = byte2hex(reader.read(1)[0]);

  output.packet_length = readInt16LE(reader.read(PACKET_LENGTH));

  // get version
  output.packet_version = readInt8LE(reader.read(1)[0]);

  // get timeStamp
  let timeStamp = new Date(
    readUInt32LE(reader.read(TIMESTAMP_LENGTH)) * 1000
  ).toString();
  output.timestamp = timeStamp;

  // get signal strength
  output.signal_strength = readInt8LE(reader.read(1)[0]);

  // digital output
  let toggleDigitalOutputByte = reader.read(1)[0];
  let digitalOutputToggle = getDigitalOutputToggle(toggleDigitalOutputByte);
  output.digital_output_toggles = digitalOutputToggle;

  if (hasDigitalOutputStatuses(digitalOutputToggle)) {
    output.digital_output_statuses = getDigitalOutputStatuses(
      reader.read(1)[0]
    );
  }

  // digital input
  let toggleDigitalInputByte = reader.read(1)[0];
  let digitalInputToggle = getDigitalInputToggles(toggleDigitalInputByte);
  output.toggles_of_digital_inputs = digitalInputToggle;

  if (hasInputMode(digitalInputToggle)) {
    output.digital_input_statuses = getDigitalInput(reader.read(1)[0]);
  }
  if (hasCounterMode(digitalInputToggle)) {
    let counterToggleSize = getCounterToggleSize(digitalInputToggle);
    console.log("counter Size", counterToggleSize);
    let counterByte = reader.read(counterToggleSize);
    let di_counter = getDigitalCounter(digitalInputToggle, counterByte);
    output.di_counter = di_counter;
  }

  // analog input
  let [toggles_of_analog_inputs, analogInput] = getToggleAnalogStatus(
    reader.read(TOGGLE_ANALOG_INPUT_LENGTH)
  );
  if (analogInput.length > 0) {
    let analog_input_value = getAnalogInput(
      reader.read(FLOAT_LENGTH * analogInput.length),
      analogInput
    );
    output.analog_input_value = analog_input_value;
  }
  output.toggles_of_analog_inputs = toggles_of_analog_inputs;

  // modbus
  let modbus = [];
  while (reader.hasNext() && reader.getSize() !== reader.index() + 1) {
    let [channelId, dataType] = getModbusChannelDataType(reader.read(1)[0]);
    let [sign, decimal, status, quantity] = getModbusRegisterSetting(
      reader.read(1)[0]
    );
    let data = [];
    let dataSize = getDataSize(dataType);
    let parser = getParser(dataType);
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
}

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

/* ******************************************
 *
 ********************************************/
function getToggleDigitalOutput(byte) {
  switch (byte) {
    case 0x00:
      return "DO1 and DO2 disabled";
    case 0x01:
      return "DO1 enabled, DO2 disabled";
    case 0x02:
      return "DO1 disabled, DO2 enabled";
    case 0x03:
      return "DO1 and DO2 enabled";
    default:
      return "Not Valid Input";
  }
}

function getDigitalOutputStatuses(byte) {
  switch (byte) {
    case 0x00:
      return "DO1 and DO2 closed";
    case 0x01:
      return "DO1 open, DO2 closed";
    case 0x02:
      return "DO1 closed, DO2 open";
    case 0x03:
      return "DO1 and DO2 open";
    default:
      return "Not Valid Input";
  }
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
      return "Not Valid Input";
  }
}
const DISABLE = 0;
const DIGITAL_INPUT_MODE = 1;
const COUNTER_STOP_COUNTING_MODE = 2;
const COUNTER_START_COUNTING_MODE = 3;

const DIGITAL_INPUT_TEMPLATE = [
  { name: "DI1", toggle: DISABLE },
  { name: "DI2", toggle: DISABLE },
  { name: "DI3", toggle: DISABLE },
  { name: "DI4", toggle: DISABLE },
];

const DIGITAL_INPUT_VALUE_TEMPLATE = {
  DI1: "",
  DI2: "",
  DI3: "",
  DI4: "",
};

function getDigitalInputToggles(byte) {
  let di_toggle = [...DIGITAL_INPUT_TEMPLATE];
  for (const toggle in di_toggle) {
    let mode = getDigitalInputMode((byte >> (2 * toggle)) & 0b11);
    di_toggle[toggle].toggle = mode;
  }
  return di_toggle;
}

function getDigitalInput(byte) {
  let digital_input_status = { ...DIGITAL_INPUT_VALUE_TEMPLATE };
  if (byte > 0x0f) return "Not Valid Input";
  for (let i = 0; i < 4; i++) {
    digital_input_status[`DI${i + 1}`] = getDigitalInputStatus((byte >> i) & 1);
  }
  return digital_input_status;
}

function getDigitalInputStatus(bits) {
  switch (bits) {
    case 0:
      return "low";
    case 1:
      return "high";
    default:
      return "Not Valid Input";
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

function hasCounterMode(inputToggles) {
  for (const { toggle } of inputToggles) {
    if (toggle == COUNTER_START_COUNTING_MODE) {
      return true;
    } else if (toggle == COUNTER_STOP_COUNTING_MODE) {
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

const DIGITAL_COUNTER_TEMPLATE = [
  { name: "DI1", counter: null },
  { name: "DI2", counter: null },
  { name: "DI3", counter: null },
  { name: "DI4", counter: null },
];

function getDigitalCounter(inputToggles, counterByte) {
  let di_counter = [...DIGITAL_COUNTER_TEMPLATE];
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
      di_counter[toggle].counter = val;
      counterIndex += INT32_LENGTH;
    }
  }
  // console.log("DI_COUNTER", di_counter);
  return di_counter;
}

function getToggleAnalogInput(bits) {
  switch (bits) {
    case 0b00:
      return "disabled";
    case 0b01:
      return "collected successfully";
    case 0b10:
      return "collect failed";
    default:
      return "Not Valid Input";
  }
}
const ANALOG_INPUT_STATUS_TEMPLATE = {
  i4_20mA_1: "",
  i4_20mA_2: "",
  i0_10V_1: "",
  i0_10V_2: "",
  iPT100_1: "",
  iPT100_2: "",
};

function getToggleAnalogStatus(bytes) {
  let toggles_of_analog_inputs = { ...ANALOG_INPUT_STATUS_TEMPLATE };
  let analogInput = [];
  let byte1 = bytes[0];
  let byte2 = bytes[1];
  Object.keys(toggles_of_analog_inputs).forEach((keys, index) => {
    // console.log(interface);
    if (index < 4) {
      toggles_of_analog_inputs[`${keys}`] = getToggleAnalogInput(
        (byte1 >> (index * 2)) & 0x3
      );
    } else {
      toggles_of_analog_inputs[`${keys}`] = getToggleAnalogInput(
        (byte2 >> ((index - 4) * 2)) & 0x3
      );
    }
    if (toggles_of_analog_inputs[`${keys}`].includes("collected")) {
      analogInput.push(`${keys}`);
    }
  });

  return [toggles_of_analog_inputs, analogInput];
}

function getAnalogInput(bytes, analogInput) {
  let analog_input_value = {};
  let reader = Reader(bytes);
  const { FLOAT_LENGTH } = BYTE_LENGTH;
  analogInput.forEach((ai, index) => {
    analog_input_value[`${ai}`] =
      Math.round(readFloatLE(reader.read(FLOAT_LENGTH)) * 100, 2) / 100;
  });
  return analog_input_value;
}

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

function getModbusChannelDataType(byte) {
  let DataType = { ...DATA_TYPE_TEMPLATE };
  let channelId = ((byte >> 4) & 0xf) + 1;
  let dataTypeBit = byte & 0xf;
  let dataType = DataType[dataTypeBit];
  return [channelId, dataType];
}

function getModbusRegisterSetting(byte) {
  let sign = (byte >> 7) & 1;
  let decimal = (byte >> 4) & 0b111;
  let status =
    ((byte >> 3) & 1) == 0 ? "collected failed" : "collected successfully";
  let quantity = byte & 0b111;
  return [sign, decimal, status, quantity];
}

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

function getDigitalOutputToggle(byte) {
  switch (byte) {
    case 0x00:
      return [
        { name: "DO1", toggle: "disable" },
        { name: "DO2", toggle: "disable" },
      ];
    case 0x01:
      return [
        { name: "DO1", toggle: "enable" },
        { name: "DO2", toggle: "disable" },
      ];
    case 0x02:
      return [
        { name: "DO1", toggle: "disable" },
        { name: "DO2", toggle: "enable" },
      ];
    case 0x03:
      return [
        { name: "DO1", toggle: "enable" },
        { name: "DO2", toggle: "enable" },
      ];
    default:
      return [
        { name: "DO1", toggle: "Not Valid Input" },
        { name: "DO2", toggle: "Not Valid Input" },
      ];
  }
}

module.exports = {
  getToggleDigitalOutput,
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

const rawData =
  "7EF425000A7A805762110301D80000000000150000000105000000009A99D941000000007E";
const bytes = Buffer.from(rawData, "hex");
output = decode(bytes);
console.log(
  "this one is ",
  output.toggles_of_digital_inputs,
  output.di_counter
);
// console.log(output);
