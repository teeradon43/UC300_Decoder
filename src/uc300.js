const BYTE_INDEX = {
  DATA_TYPE: 1,
  PACKET_LENGTH: 2,
  PACKET_VERSION: 4,
  TIMESTAMP: 5,
  SIGNAL: 9,
  TOGGLE_DIGITAL_OUTPUT: 10,
  TOGGLE_DIGITAL_INPUT: 11,
  TOGGLE_ANALOG_INPUT: 12,
};

const OUTPUT_TEMPLATE = {
  data_type: "",
  packet_length: "",
  packet_version: "",
  timestamp: "",
  signal_strength: "",
  do_status: {},
  di_status: {},
  di_value: {},
  di_counter: {},
  ai_status: {},
  ai_value: {},
  modbus: {},
};

const DIGITAL_INPUT_TEMPLATE = {
  DI1: "",
  DI2: "",
  DI3: "",
  DI4: "",
};

function byte2hex(byte) {
  return parseInt(byte).toString(16);
}

function decode(bytes) {
  let output = { ...OUTPUT_TEMPLATE };

  const {
    DATA_TYPE,
    PACKET_LENGTH,
    PACKET_VERSION,
    TIMESTAMP,
    SIGNAL,
    TOGGLE_DIGITAL_OUTPUT,
    TOGGLE_DIGITAL_INPUT,
    TOGGLE_ANALOG_INPUT,
  } = BYTE_INDEX;

  let additionalByte = 0;

  // static
  output.data_type = byte2hex(bytes[DATA_TYPE]);
  output.packet_length = readInt16LE(
    bytes.slice(PACKET_LENGTH, PACKET_LENGTH + 2)
  );
  output.packet_version = readInt8LE(bytes[PACKET_VERSION]);
  let timeStamp = new Date(
    readUInt32LE(bytes.slice(TIMESTAMP, TIMESTAMP + 4)) * 1000
  ).toString();
  output.timestamp = timeStamp;
  output.signal_strength = readInt8LE(bytes[SIGNAL]);

  // digital output

  let toggleDigitalOutputByte = bytes[TOGGLE_DIGITAL_OUTPUT];

  output.do_status = getToggleDigitalOutput(toggleDigitalOutputByte);
  if (toggleDigitalOutputByte > 0) {
    additionalByte++;
    let digiOutput = TOGGLE_DIGITAL_OUTPUT + additionalByte;

    output.do_status = getDigitalOutputStatus(bytes[digiOutput]);
  }

  // digital input
  let toggleDigitalInputByte = TOGGLE_DIGITAL_INPUT + additionalByte;
  let [di_status, input, counter] = getToggleDigitalInput(
    bytes[toggleDigitalInputByte]
  );
  output.di_status = di_status;

  if (input.length > 0) {
    additionalByte++;
    let DIGI_INPUT_INDEX = TOGGLE_DIGITAL_INPUT + additionalByte;
    output.di_value = getDigitalInput(bytes[DIGI_INPUT_INDEX]);
  }
  if (counter.length > 0) {
    additionalByte++;
    let DIGI_COUNTER_INDEX = TOGGLE_DIGITAL_INPUT + additionalByte;
    let di_counter = getDigitalCounter(
      bytes.slice(DIGI_COUNTER_INDEX, DIGI_COUNTER_INDEX + 4 * counter.length),
      counter
    );
    additionalByte += 4 * counter.length - 1;

    output.di_counter = di_counter;
  }

  // analog input
  let toggleAnalogInputByte = TOGGLE_ANALOG_INPUT + additionalByte;
  let ai_status = getToggleAnalogStatus(
    bytes.slice(toggleAnalogInputByte, toggleAnalogInputByte + 2)
  );
  output.ai_status = ai_status;

  // modbus
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

function getDigitalOutputStatus(byte) {
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
      return "disabled";
    case 0b01:
      return "Digital Input Mode";
    case 0b10:
      return "Counter mode stop counting";
    case 0b11:
      return "Counter mode pulse-start counting";
    default:
      return "Not Valid Input";
  }
}

const DIGITAL_INPUT_VALUE_TEMPLATE = {
  DI1: "",
  DI2: "",
  DI3: "",
  DI4: "",
};

function getToggleDigitalInput(byte) {
  let di_input = { ...DIGITAL_INPUT_TEMPLATE };
  let input = [];
  let counter = [];
  for (let i = 0; i < 4; i++) {
    let result = getDigitalInputMode((byte >> (2 * i)) & 0b11);
    di_input[`DI${i + 1}`] = result;
    if (result.includes("Input Mode")) {
      input.push(i + 1);
    } else if (result.includes("Counter")) {
      counter.push(i + 1);
    }
  }
  return [di_input, input, counter];
}

function getDigitalInput(byte) {
  let di_value = { ...DIGITAL_INPUT_VALUE_TEMPLATE };
  if (byte > 0x0f) return "Not Valid Input";
  for (let i = 0; i < 4; i++) {
    di_value[`DI${i + 1}`] = getDigitalInputStatus((byte >> i) & 1);
  }
  return di_value;
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

function getDigitalCounter(bytes, counter) {
  let di_counter = {};
  counter.forEach((di, index) => {
    di_counter[`DI${di}`] = readUInt32LE(bytes.slice(index * 4, index * 4 + 4));
  });
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
// console.log(getToggleAnalogStatus([0x55, 0x05]));
function getToggleAnalogStatus(bytes) {
  let ai_status = { ...ANALOG_INPUT_STATUS_TEMPLATE };
  let input = [];
  let byte1 = bytes[0];
  let byte2 = bytes[1];
  Object.keys(ai_status).forEach((keys, index) => {
    // console.log(interface);
    if (index < 4) {
      ai_status[`${keys}`] = getToggleAnalogInput((byte1 >> (index * 2)) & 0x3);
    } else {
      ai_status[`${keys}`] = getToggleAnalogInput(
        (byte2 >> ((index - 4) * 2)) & 0x3
      );
    }
    // ai_status[`${interface}`] = getToggleAnalogInput(byte)
  });
  // ai_status.i4_20mA_1 = getToggleAnalogInput(byte1 & 0x3);
  // ai_status.i4_20mA_2 = getToggleAnalogInput((byte1 >> 2) & 0x3);
  // ai_status.i0_10V_1 = getToggleAnalogInput((byte1 >> 4) & 0x3);
  // ai_status.i0_10V_2 = getToggleAnalogInput((byte1 >> 6) & 0x3);
  // ai_status.iPT100_1 = getToggleAnalogInput(byte2 & 0x3);
  // ai_status.iPT100_2 = getToggleAnalogInput((byte2 >> 2) & 0x3);

  return ai_status;
}

module.exports = {
  getToggleDigitalOutput,
  getDigitalOutputStatus,
  getToggleDigitalInput,
  getToggleAnalogInput,
  getDigitalInput,
  getDigitalInputStatus,
  getDigitalInputMode,
  getDigitalCounter,
  decode,
};
