const decoder = () => {
  const readUInt8LE = (byte) => {
    return byte & 0xff;
  };

  function readInt8LE(byte) {
    let ref = readUInt8LE(byte[0]);
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
    let value =
      (bytes[3] << 24) + (bytes[2] << 16) + (bytes[1] << 8) + bytes[0];
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
};

export default decoder;
