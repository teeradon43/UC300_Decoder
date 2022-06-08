/* Reference UC300-Cellular-Communication-Protocol-En.pdf
    @author Teeradon Chanhom
    Payload
        Uplink: | Start | Data Type | Packet Length | Data    |  End  |
                | 1Byte |   1Byte   |    2 Bytes    | Mutable | 1Byte |
    
        => DataType : (F2-F7)
                    Regular Report (F4) : reports data collected from sensors by interval (1800s as default interval)
                    = 10~330 bytes + defaultParams(1+1+2+1) = sum 15~335 bytes

            F4 Parameter :  PacketVersion               1bytes
                            Timestamp                   4bytes
                            SignalStrength              1bytes
                            TogglesOfDigitalOutputs     1bytes => บอกว่ามี DigitalOutput ทั้ง 2 สถานะอะไรบ้าง : 00 - DO1 & DO2 disabled
                                                                                                           01 - DO1 enabled DO2 disabled
                                                                                                           02 - DO1 disabled DO2 enabled
                                                                                                           03 - DO1 & DO2 enabled
                                DigitalOutputStatus       0~1bytes => ถ้า DO ทำงานแล้วแต่ละตัวสถานะเป็นอย่างไร : 00 - DO1 & DO2 closed
                                                                                                           01 - DO1 open DO2 closed
                                                                                                           02 - DO1 closed DO2 open
                                                                                                           03 - DO1 & DO2 open
                            ToggleOfDigitalInputs       1bytes => บอกว่า DI ทั้ง 4 interface สถานะ/โหมดอะไรบ้าง(2bit/interface 4to1)
                                DigitalInputStatus        0~1bytes => ถ้า DI ทำงานแล้วแต่ละ interface สถานะเป็นอะไร (1bit/int 4to1 reserve 4-7) : 0x1 - DI1, 0x2 - DI2, 0x4 - DI3, 0x8 - DI4
                                                                                                                                              0 - low, 1 - high
                                CounterValue             0~16bytes => ถ้าใช้ pulse counter จะมีตัวละ 4 bytes
                            ToggleOfAnalogInputs        2bytes => บอกว่า AI ทั้ง 6 interface สถานะอะไรบ้าง (2bit/int 6to1 reserve 14-15)
                                AnalogInputValue         0~24bytes => ถ้า AI ทำงาน จะได้ signed float ของแต่ละ AI ตัวละ 4 bytes
                                Modbus RS485            0~288bytes => Modbus 0~18 Channel, ประกอบด้วย Ch.ID&DataType (1) + RegSetting(1)+ Data(Mutable) 
*/

function flipHexString(hexValue, hexDigits) {
  // var h = hexValue.substr(0, 2);
  var h = "";
  for (var i = 0; i < hexDigits; i++) {
    h += hexValue.substr((hexDigits - 1 - i) * 2, 2);
  }
  return h;
}
function swap2byte(byte) {
  return ((byte & 0xff) << 8) | ((byte >> 8) & 0xff);
}
function swap4byte(byte) {
  return (
    ((byte & 0xff) << 24) |
    ((byte & 0xff00) << 8) |
    ((byte >> 8) & 0xff00) |
    ((byte >> 24) & 0xff)
  );
}
function unWrap(data) {
  return data.slice(2, data.length - 2);
}
function hex2bin(hex) {
  return parseInt(hex, 16).toString(2).padStart(8, "0");
}
function getDIstatus(bits) {
  return bits == "00"
    ? "disabled"
    : bits == "01"
    ? "Digital Input Mode"
    : bits == "10"
    ? "Counter mode stop counting"
    : "Counter mode pulse-start counting";
}
function getAIstatus(bits) {
  return bits == "00"
    ? "disabled"
    : bits == "01"
    ? "collected successfully"
    : bits == "10"
    ? "collect failed"
    : "error";
}
function readFloatLE(bytes) {
  /**
   * @param bytes give 4 bytes of little endian
   */
  // JavaScript bitwise operators yield a 32 bits integer, not a float.
  // Assume LSB (least significant byte first).
  var bits = (bytes[3] << 24) | (bytes[2] << 16) | (bytes[1] << 8) | bytes[0];
  var sign = bits >>> 31 === 0 ? 1.0 : -1.0;
  var e = (bits >>> 23) & 0xff;
  var m = e === 0 ? (bits & 0x7fffff) << 1 : (bits & 0x7fffff) | 0x800000;
  var f = sign * m * Math.pow(2, e - 150);
  return f;
}
function parseFloat(str) {
  if (str === "0x00000000") return 0;
  var float = 0,
    sign = 0,
    order,
    mantissa = 0,
    exp = 0,
    int = 0,
    multi = 1;
  if (/^0x/.exec(str)) {
    int = parseInt(str, 16);
  } else {
    for (var i = str.length - 1; i >= 0; i -= 1) {
      if (str.charCodeAt(i) > 255) {
        console.log("Wrong string parameter");
        return false;
      }
      int += str.charCodeAt(i) * multi;
      multi *= 256;
    }
  }
  sign = int >>> 31 ? -1 : 1;
  exp = ((int >>> 23) & 0xff) - 127;

  mantissa = ((int & 0x7fffff) + 0x800000).toString(2);
  for (i = 0; i < mantissa.length; i += 1) {
    float += parseInt(mantissa[i]) ? Math.pow(2, exp) : 0;
    exp--;
  }
  return float * sign;
}
//TODO: Create ReadBits Function
//TODO: Create ReadByte Function
//TODO: Create ReadInt Function
//TODO: Create ReadFloat Function
function decoder(payload) {
  var output = {
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

  var do_status = {};
  var di_status = {};
  var ai_status = {};
  var modbus = [];
  payload = unWrap(payload); // remove start-stop bit
  payload = payload.match(/.{1,2}/g); // slice string to arrays (byte formatted)
  // console.log(payload);

  var byte = 0; // byte counter

  /* ======= Read Data Type 1 byte ======= */
  output.data_type = payload[byte++]; // read dataType 1 byte

  /* ======= Read Packet Length 2 bytes ======= */
  var packetLength = payload[byte + 1] + payload[byte]; // read PacketLength 2 bytes
  byte += 2;
  output.packet_length = Number("0x" + packetLength).toString();

  /* ======= Read Packet Version 1 bytes ======= */
  let resolution = 0.1;
  output.packet_version = (Number("0x" + payload[byte++]) * resolution).toFixed(
    1
  );

  /* ======= Read Timestamp 4 bytes ======= */
  var timeStamp =
    payload[byte + 3] + payload[byte + 2] + payload[byte + 1] + payload[byte];
  output.timestamp = new Date(Number("0x" + timeStamp) * 1000).toString();
  byte += 4;

  /* ======= Read Signal Strength ======= */
  output.signal_strength = Number("0x" + payload[byte++]).toString(); // + " asu";

  /* ======= Read Toggle Digital Output ======= */
  let TogDOStatus = payload[byte++];
  switch (TogDOStatus) {
    case "00":
      do_status.do1 = "disabled";
      do_status.do2 = "disabled";
      break;
    case "01":
      do_status.do1 = "enabled";
      do_status.do2 = "disabled";
      break;
    case "02":
      do_status.do1 = "disabled";
      do_status.do2 = "enabled";
      break;
    case "03":
      do_status.do1 = "enabled";
      do_status.do2 = "enabled";
      break;
    default:
      do_status = "error";
  }

  /* ======= if Toggle Digital Output enabled, read Digital Output Status ======= */
  if (do_status.do1 === "enabled" || do_status.do2 === "enabled") {
    let DOStatus = payload[byte++];
    switch (DOStatus) {
      case "00":
        do_status.do1 = { en: do_status.do1, status: "closed" };
        do_status.do2 = { en: do_status.do2, status: "closed" };
        break;
      case "01":
        do_status.do1 = { en: do_status.do1, status: "open" };
        do_status.do2 = { en: do_status.do2, status: "closed" };
        break;
      case "10":
        do_status.do1 = { en: do_status.do1, status: "closed" };
        do_status.do2 = { en: do_status.do2, status: "open" };
        break;
      case "11":
        do_status.do1 = { en: do_status.do1, status: "open" };
        do_status.do2 = { en: do_status.do2, status: "open" };
        break;
    }
  }
  output.do_status = do_status;

  /* ======= Read Toggle Digital Input ======= */
  var diStatus = hex2bin(payload[byte++]);
  let di4_stat = diStatus.slice(0, 2);
  let di3_stat = diStatus.slice(2, 4);
  let di2_stat = diStatus.slice(4, 6);
  let di1_stat = diStatus.slice(6, 8);
  di_status.di1 = getDIstatus(di1_stat);
  di_status.di2 = getDIstatus(di2_stat);
  di_status.di3 = getDIstatus(di3_stat);
  di_status.di4 = getDIstatus(di4_stat);

  /* ======= if Toggle Digital Input enabled, read Digital Input Status  ======= */
  if (diStatus !== "00000000") {
    var input = [];
    var counter = [];
    for (let i = 1; i <= 4; i++) {
      if (di_status[`di${i}`].includes("Input")) {
        input.push(i);
      } else if (di_status[`di${i}`].includes("Counter")) {
        counter.push(i);
      }
    }
    if (input.length > 0) {
      var readDI = hex2bin(payload[byte++]).slice(4, 8);
      var di_value = {};
      for (let i = 0; i < input.length; i++) {
        di_value[`di${input[i]}`] =
          readDI.charAt(4 - input[i]) == "0" ? "low" : "high";
      }
      output.di_value = di_value;
    }
    /* ======= && if has Pulse Counter , read Counter Value  ======= */
    if (counter.length > 0) {
      var di_counter = {};
      while (counter.length > 0) {
        let readCounter =
          payload[byte + 3] +
          payload[byte + 2] +
          payload[byte + 1] +
          payload[byte];
        di_counter[`di${counter.shift()}`] = Number(
          "0x" + readCounter
        ).toString();
        byte += 4;
      }
      output.di_counter = di_counter;
    }
  }
  output.di_status = di_status;

  /* ======= Read Toggle Analog Input ======= */
  let togAnalog_1 = hex2bin(payload[byte++]);
  let togAnalog_2 = hex2bin(payload[byte++]);
  ai_status.i0_10v_1 = getAIstatus(togAnalog_1.slice(2, 4));
  ai_status.i0_10v_2 = getAIstatus(togAnalog_1.slice(0, 2));
  ai_status.i4_20mA_1 = getAIstatus(togAnalog_1.slice(6, 8));
  ai_status.i4_20mA_2 = getAIstatus(togAnalog_1.slice(4, 6));
  ai_status.iPT100_1 = getAIstatus(togAnalog_2.slice(6, 8));
  ai_status.iPT100_2 = getAIstatus(togAnalog_2.slice(4, 6));
  output.ai_status = ai_status;

  /* ======= if Toggle Analog Input enabled, read Analog Input Status  ======= */
  if (togAnalog_1 !== "00000000" && togAnalog_2 != "00000000") {
    var ai_value = {};
    for (const [key, value] of Object.entries(ai_status)) {
      if (value !== "disabled") {
        let readAnalog =
          payload[byte + 3] +
          payload[byte + 2] +
          payload[byte + 1] +
          payload[byte];
        ai_value[`${key}`] = parseFloat("0x" + readAnalog) // TODO: Check Float32 value
          .toFixed(2)
          .toString();
        byte += 4;
      }
    }
    output.ai_value = ai_value;
  }

  /* ======= if has byte left read Modbus  ======= */
  var MODBUS_DataType = [
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
  while (payload.length > byte) {
    //read Channel ID & dataType
    let IdType = payload[byte++];
    let channelId = Number("0x" + IdType[0]);
    let dataType = Number("0x" + IdType[1]);
    let regSetting = hex2bin("0x" + payload[byte++]);
    var sign = regSetting[0];
    var dec = regSetting.slice(1, 4);
    var stat = regSetting[4];
    var qty = Number("0b" + regSetting.slice(5, 8));
    var data = [];
    for (let i = 0; qty > i; i++) {
      if (MODBUS_DataType[dataType].includes("16")) {
        data.push(payload[byte++] + payload[byte++]);
      } //Read2Byte
      else if (
        MODBUS_DataType[dataType].includes("32") ||
        MODBUS_DataType[dataType].includes("float")
      ) {
        data.push(
          payload[byte++] + payload[byte++] + payload[byte++] + payload[byte++]
        );
      } //Read4Byte
      else data.push(payload[byte++]);
    }
    modbus.push({
      channel: (channelId + 1).toString(),
      type: MODBUS_DataType[dataType],
      regSetting: { status: stat, qty: qty },
      value: data,
    });
  }
  output.modbus = modbus;
  return output;
}

/** =====================*/
var data = {
  TEST_CASE_1: "7EF40F000A7A80576214000000007E",
  TEST_CASE_2:
    "7EF425000A7A805762110301D80000000000150000000105000000009A99D941000000007E",
  TEST_CASE_3: "7EF418000A7A8057621100000000022A150020001021007E",
  TEST_CASE_18:
    "7ef47f000a494c90621c030055005505000000000000000000000000000000000000000000000000003901113901223901803339018046b90180ffff56b90180ffff66b90180ffff76b90180ffff87b900feffc697b900feffc6a7b900feffc6b7b900feffc6c4b90180ffffd4b90180ffffe4b90180fffff4b90180ffff7e",
  TEST_CASE_134:
    "7ef47f000ad57e90621a0300550055059a993141000080400000000000000000cdccb8413333c341003900113900223900003339000046b90000000056b90000000066b90000000076b90000000087b90000000097b900000000a7b900000000b7b900000000c4b900000000d4b900000000e4b900000000f4b9000000007e",
};
/** =====================*/

/** Main ================*/
let output = JSON.stringify(decoder(data.TEST_CASE_18), null, 2);
// let output = decoder(data.TEST_CASE_134);
console.log(output);
/** =====================*/
