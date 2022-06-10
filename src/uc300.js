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

const DIGITAL_INPUT_VALUE_TEMPLATE = {
  DI1: "",
  DI2: "",
  DI3: "",
  DI4: "",
};

function byte2hex(byte) {
  return parseInt(byte).toString(16);
}

function decode(bytes) {
  var output = { ...OUTPUT_TEMPLATE };

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

  var ADDITIONAL_BYTE = 0;

  // static
  output.data_type = byte2hex(bytes[DATA_TYPE]);
  output.packet_length = readInt16LE(
    bytes.slice(PACKET_LENGTH, PACKET_LENGTH + 2)
  );
  output.packet_version = readInt8LE(bytes[PACKET_VERSION]);
  var timeStamp = new Date(
    readUInt32LE(bytes.slice(TIMESTAMP, TIMESTAMP + 4)) * 1000
  ).toString();
  output.timestamp = timeStamp;
  output.signal_strength = readInt8LE(bytes[SIGNAL]);

  // digital output
  output.do_status = getToggleDigitalOutput(bytes[TOGGLE_DIGITAL_OUTPUT]);
  if (bytes[TOGGLE_DIGITAL_OUTPUT] > 0) {
    ADDITIONAL_BYTE++;
    var DIGI_OUTPUT = TOGGLE_DIGITAL_OUTPUT + ADDITIONAL_BYTE;
    output.do_status = getDigitalOutputStatus(bytes[DIGI_OUTPUT]);
  }

  // digital input
  var TOG_DIGI_INPUT = TOGGLE_DIGITAL_INPUT + ADDITIONAL_BYTE;
  var [di_status, input, counter] = getToggleDigitalInput(
    bytes[TOG_DIGI_INPUT]
  );
  output.di_status = di_status;
  if (input.length > 0) {
    ADDITIONAL_BYTE++;
    var DIGI_INPUT = TOGGLE_DIGITAL_INPUT + ADDITIONAL_BYTE;
    output.di_status = getDigitalInput(bytes[DIGI_INPUT]);
  }
  if (counter.length > 0) {
  }

  // analog input

  // modbus
  return output;
}

console.log(decode("7EF40F000A7A80576214000000007E").di_status);

/* ******************************************
 * bytes to number
 ********************************************/
function readUInt8LE(bytes) {
  return bytes & 0xff;
}

function readInt8LE(bytes) {
  var ref = readUInt8LE(bytes);
  return ref > 0x7f ? ref - 0x100 : ref;
}

function readUInt16LE(bytes) {
  var value = (bytes[1] << 8) + bytes[0];
  return value & 0xffff;
}

function readInt16LE(bytes) {
  var ref = readUInt16LE(bytes);
  return ref > 0x7fff ? ref - 0x10000 : ref;
}

function readUInt32LE(bytes) {
  var value = (bytes[3] << 24) + (bytes[2] << 16) + (bytes[1] << 8) + bytes[0];
  return value & 0xffffffff;
}

function readInt32LE(bytes) {
  var ref = readUInt32LE(bytes);
  return ref > 0x7fffffff ? ref - 0x100000000 : ref;
}

function readFloatLE(bytes) {
  // JavaScript bitwise operators yield a 32 bits integer, not a float.
  // Assume LSB (least significant byte first).
  var bits = (bytes[3] << 24) | (bytes[2] << 16) | (bytes[1] << 8) | bytes[0];
  var sign = bits >>> 31 === 0 ? 1.0 : -1.0;
  var e = (bits >>> 23) & 0xff;
  var m = e === 0 ? (bits & 0x7fffff) << 1 : (bits & 0x7fffff) | 0x800000;
  var f = sign * m * Math.pow(2, e - 150);
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

function getToggleDigitalInput(byte) {
  var di_input = { ...DIGITAL_INPUT_TEMPLATE };
  var input = [];
  var counter = [];
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
  var di_value = { ...DIGITAL_INPUT_VALUE_TEMPLATE };
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

module.exports = {
  getToggleDigitalOutput,
  getDigitalOutputStatus,
  getToggleDigitalInput,
  getToggleAnalogInput,
  getDigitalInput,
  getDigitalInputStatus,
  getDigitalInputMode,
  decode,
};
