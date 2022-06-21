/******** Constants ********/
const START_BYTE = "7e";
const STOP_BYTE = "7e";
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
/***********************************/

/******** Data Transform ********/
function encode(payload) {
  let output = "";
  output += START_BYTE;
  output += "f4";
  output += getPacketLengthHex(payload.packet_length); //TODO: Count Actual Bytes
  output += getPacketVersionHex(payload.packet_version);
  output += getTimestampHex(payload.timestamp);
  output += getSignalStrengthHex(payload.signal_strength);
  output += DO.getTogglesHex(payload.toggles_of_digital_outputs);
  output += DO.getStatusesHex(payload.digital_output_statuses);
  output += DI.getTogglesHex(payload.toggles_of_digital_inputs);
  output += DI.getStatusesHex(payload.digital_input_statuses);
  output += DI.getCounterHex(payload.di_counters);
  output += AI.getTogglesHex(payload.toggles_of_analog_inputs);
  output += AI.getValuesHex(payload.analog_input_values);
  output += MB.getHex(payload.modbus);
  output += STOP_BYTE;
  return output;
}

/***********************************/

/******** Data Transform ********/
function reverseHex(hexString) {
  let str = [];
  for (let i = 0, charsLength = hexString.length; i < charsLength; i += 2) {
    str.push(hexString.substring(i, i + 2));
  }
  str.reverse();
  return str.join("");
}

function Int8ToHexString(value) {
  if (value < 0) {
    value = 0x100 + value;
  }
  let hexString = value.toString(16);
  return hexString.padStart(2, "0");
}

function Int16ToHexString(value) {
  if (value < 0) {
    value = 0x10000 + value;
  }
  let hexString = value.toString(16);
  return hexString.padStart(4, "0");
}

function Int32ToHexString(value) {
  if (value < 0) {
    value = 0x100000000 + value;
  }
  let hexString = value.toString(16);
  return hexString.padStart(8, "0");
}

function DecToHexString(value, numberOfBytes = 1) {
  let hexString = "";
  switch (numberOfBytes) {
    case 1:
      hexString = Int8ToHexString(value);
      break;
    case 2:
      hexString = Int16ToHexString(value);
      break;
    case 4:
      hexString = Int32ToHexString(value);
      break;
    default:
      hexString = Int8ToHexString(value);
  }
  return reverseHex(hexString);
}

function FloatToHexString(value, numberOfBytes = 4) {
  //https://stackoverflow.com/a/47187116
  let view = new DataView(new ArrayBuffer(numberOfBytes)),
    result;
  view.setFloat32(0, value);
  result = Array.apply(null, { length: numberOfBytes })
    .map((_, i) => view.getUint8(i).toString(16))
    .join("");
  result = result.padEnd(8, "0");
  return reverseHex(result);
}
/***********************************/

/******** Get Hex from Data ********/
function getPacketLengthHex(value) {
  return DecToHexString(value, 2);
}

function getPacketVersionHex(value) {
  return DecToHexString(value, 1);
}

function getTimestampHex(dateString) {
  let dateNum = Number(new Date(dateString)) / 1000;
  return DecToHexString(dateNum, 4);
}

function getSignalStrengthHex(value) {
  return DecToHexString(value, 1);
}

function getDigitalOutputTogglesHex(digitalOutputToggles) {
  let result = 0;
  for (let index in digitalOutputToggles) {
    result += digitalOutputToggles[index].toggle << index;
  }
  return DecToHexString(result, 1);
}

function getDigitalOutputStatusesHex(digitalOutputStatuses) {
  let result = 0;
  for (let index in digitalOutputStatuses) {
    if (digitalOutputStatuses[index].status == null) {
      return "";
    }
    result += digitalOutputStatuses[index].status << index;
  }
  return DecToHexString(result, 1);
}

function getDigitalInputTogglesHex(digitalInputToggles) {
  let result = 0;
  for (const index in digitalInputToggles) {
    result += digitalInputToggles[index].toggle << (index * 2);
  }
  return DecToHexString(result, 1);
}

function getDigitalInputStatusesHex(digitalInputStatuses) {
  let result = 0;
  for (const index in digitalInputStatuses) {
    if (digitalInputStatuses[index].status == null) {
      return "";
    }
    result += digitalInputStatuses[index].status << index;
  }
  return DecToHexString(result, 1);
}

function getDigitalInputCountersHex(digitalInputCounter) {
  let result = "";
  for (const { counter } of digitalInputCounter) {
    if (counter != null) {
      result += DecToHexString(counter, 4);
    }
  }
  return result;
}

function getAnalogInputTogglesHex(analogInputToggles) {
  let result = 0;
  for (let index = 0; index < 4; index++) {
    result += analogInputToggles[index].toggle << (index * 2);
  }
  result <<= 8;
  for (let index = 4; index < 6; index++) {
    result += analogInputToggles[index].toggle << ((index - 4) * 2);
  }
  return reverseHex(DecToHexString(result, 2));
}

function getAnalogInputValuesHex(analogInputValues) {
  let result = "";
  for (const { value } of analogInputValues) {
    if (value != null) {
      result += FloatToHexString(value);
    }
  }
  return result;
}

function getDataSize(dataType) {
  const DATA_TYPE = { ...DATA_TYPE_TEMPLATE };
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
}

function getParser(dataType) {
  const DATA_TYPE = { ...DATA_TYPE_TEMPLATE };
  switch (DATA_TYPE[dataType]) {
    case "Coil":
    case "Discrete":
    case "Input16":
    case "Hold16":
    case "Input32":
    case "Hold32":
    case "Input_int32_with upper 16 bits":
    case "Input_int32_with lower 16 bits":
    case "Hold_int32_with upper 16 bits":
    case "Hold_int32_with lower 16 bits":
      return DecToHexString;

    case "Hold_float":
    case "Input_float":
      return FloatToHexString;

    default:
      return;
  }
}

function getModbusHex(modbusArray) {
  let result = "";
  if (modbusArray.length == 0) return result;
  for (const modbus of modbusArray) {
    result += MB.getChannelDataHex(modbus.channel_id, modbus.data_type);
    result += MB.getRegisterSettingHex(modbus.register_setting);
    let dataSize = MB.getDataSize(modbus.data_type);
    let parser = MB.getParser(modbus.data_type);
    for (let i = 0; i < modbus.register_setting.quantity; i++) {
      result += parser(modbus.data[i], dataSize);
    }
  }
  return result;
}

function getModbusChannelDataHex(channelId, dataType) {
  let value = (channelId << 4) + dataType;
  return DecToHexString(value, 1);
}

function getModbusRegisterSettingHex(registerSetting) {
  let value =
    (registerSetting.sign << 7) +
    (registerSetting.decimal << 4) +
    (registerSetting.status << 3) +
    registerSetting.quantity;
  return DecToHexString(value, 1);
}

/***********************************/

/******** Decoration Pattern ********/
const DO = () => {};
DO.getTogglesHex = getDigitalOutputTogglesHex;
DO.getStatusesHex = getDigitalOutputStatusesHex;
const DI = () => {};
DI.getTogglesHex = getDigitalInputTogglesHex;
DI.getStatusesHex = getDigitalInputStatusesHex;
DI.getCounterHex = getDigitalInputCountersHex;
const AI = () => {};
AI.getTogglesHex = getAnalogInputTogglesHex;
AI.getValuesHex = getAnalogInputValuesHex;
const MB = () => {};
MB.getHex = getModbusHex;
MB.getChannelDataHex = getModbusChannelDataHex;
MB.getRegisterSettingHex = getModbusRegisterSettingHex;
MB.getDataSize = getDataSize;
MB.getParser = getParser;
/***********************************/

module.exports = {
  encode,
  reverseHex,
  DecToHexString,
  FloatToHexString,
  getPacketLengthHex,
  getPacketVersionHex,
  getTimestampHex,
  getSignalStrengthHex,
  getDigitalOutputTogglesHex,
  getDigitalOutputStatusesHex,
  getDigitalInputTogglesHex,
  getDigitalInputStatusesHex,
  getDigitalInputCountersHex,
  getAnalogInputTogglesHex,
  getAnalogInputValuesHex,
  getModbusHex,
};
