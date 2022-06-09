const BYTE_INDEX = {
  DATA_TYPE: 1,
  PACKET_LENGTH: 2,
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

function byte2hex(byte) {
  return parseInt(byte).toString(16);
}

function decode(bytes) {
  var output = { ...OUTPUT_TEMPLATE };

  const { DATA_TYPE, PACKET_LENGTH } = BYTE_INDEX;
  output.data_type = byte2hex(bytes[DATA_TYPE]);
  output.packet_length = readInt16LE(
    bytes.slice(PACKET_LENGTH, PACKET_LENGTH + 2)
  );

  return output;
}

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

function getDigitalInputStatus(bits) {
  switch (bits) {
    case "00":
      return "disabled";
    case "01":
      return "Digital Input Mode";
    case "10":
      return "Counter mode stop counting";
    case "11":
      return "Counter mode pulse-start counting";
    default:
      return "Not Valid Input";
  }
}

function getAnalogInputStatus(bits) {
  switch (bits) {
    case "00":
      return "disabled";
    case "01":
      return "collected successfully";
    case "10":
      return "collect failed";
    default:
      return "error";
  }
}

module.exports = {
  getDigitalInputStatus,
  getAnalogInputStatus,
  decode,
};
