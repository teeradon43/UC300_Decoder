import {
  IPayload,
  IDigitalOutputToggles,
  IDigitalOutputStatuses,
  IDigitalInputToggles,
  IDigitalInputStatuses,
  IDigitalInputCounters,
  IAnalogInputToggles,
  IAnalogInputValues,
  IModbus,
  IModbusRegisterSetting,
} from "./types/type";

/******** Constants ********/
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
/***********************************/

/******** Data Transform ********/
const encode = (payload: IPayload) => {
  let output: string[] = [];
  output.push("7e");
  output.push("f4");
  output.push("0000");
  output.push(getPacketVersionHex(payload.packet_version));
  output.push(getTimestampHex(payload.timestamp));
  output.push(getSignalStrengthHex(payload.signal_strength));
  output.push(DO.getTogglesHex(payload.toggles_of_digital_outputs));
  output.push(DO.getStatusesHex(payload.digital_output_statuses));
  output.push(DI.getTogglesHex(payload.toggles_of_digital_inputs));
  output.push(DI.getStatusesHex(payload.digital_input_statuses));
  output.push(DI.getCounterHex(payload.di_counters));
  output.push(AI.getTogglesHex(payload.toggles_of_analog_inputs));
  output.push(AI.getValuesHex(payload.analog_input_values));
  output.push(MB.getHex(payload.modbus));
  output.push("7e");
  output[2] = getPacketLengthHex(output);
  return output.join("");
};
/***********************************/

/******** Data Transform ********/
function reverseHex(hexString: string) {
  let str: string[] = [];
  for (let i = 0, charsLength = hexString.length; i < charsLength; i += 2) {
    str.push(hexString.substring(i, i + 2));
  }
  str.reverse();
  return str.join("");
}

function Int8ToHexString(value: number) {
  if (value < 0) {
    value = 0x100 + value;
  }
  let hexString = value.toString(16);
  return hexString.padStart(2, "0");
}

function Int16ToHexString(value: number) {
  if (value < 0) {
    value = 0x10000 + value;
  }
  let hexString = value.toString(16);
  return hexString.padStart(4, "0");
}

function Int32ToHexString(value: number) {
  if (value < 0) {
    value = 0x100000000 + value;
  }
  let hexString = value.toString(16);
  return hexString.padStart(8, "0");
}

function DecToHexString(value: number, numberOfBytes: number = 1) {
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

function FloatToHexString(value: number, numberOfBytes: number = 4) {
  //https://stackoverflow.com/a/47187116
  let view = new DataView(new ArrayBuffer(numberOfBytes));
  let arr = new Array<string>(numberOfBytes);
  let result: string;

  view.setFloat32(0, value);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = view.getUint8(i).toString(16);
  }
  result = arr.join("");
  result = result.padEnd(8, "0");
  return reverseHex(result);
}
/***********************************/

/******** Get Hex from Data ********/
function getPacketLengthHex(bytes: string[]) {
  let length = bytes.join("").length / 2;
  return DecToHexString(length, 2);
}

function getPacketVersionHex(value: number) {
  return DecToHexString(value, 1);
}

function getTimestampHex(dateString: string) {
  let dateNum = Number(new Date(dateString)) / 1000;
  return DecToHexString(dateNum, 4);
}

function getSignalStrengthHex(value: number) {
  return DecToHexString(value, 1);
}

function getDigitalOutputTogglesHex(
  digitalOutputToggles: IDigitalOutputToggles[]
) {
  let result = 0;
  for (let index = 0; index < digitalOutputToggles.length; index++) {
    result += digitalOutputToggles[index].toggle << index;
  }
  return DecToHexString(result, 1);
}

function getDigitalOutputStatusesHex(
  digitalOutputStatuses: IDigitalOutputStatuses[]
) {
  let result = 0;
  for (let index = 0; index < digitalOutputStatuses.length; index++) {
    if (digitalOutputStatuses[index].status == null) {
      return "";
    }
    // @ts-ignore: Object is possibly 'null'.
    result += digitalOutputStatuses[index].status << index;
  }
  return DecToHexString(result, 1);
}

function getDigitalInputTogglesHex(
  digitalInputToggles: IDigitalInputToggles[]
) {
  let result = 0;
  for (let index = 0; index < digitalInputToggles.length; index++) {
    result += digitalInputToggles[index].toggle << (index * 2);
  }
  return DecToHexString(result, 1);
}

function getDigitalInputStatusesHex(
  digitalInputStatuses: IDigitalInputStatuses[]
) {
  let result = 0;
  for (let index = 0; index < digitalInputStatuses.length; index++) {
    if (digitalInputStatuses[index].status == null) {
      return "";
    }
    // @ts-ignore: Object is possibly 'null'.
    result += digitalInputStatuses[index].status << index;
  }
  return DecToHexString(result, 1);
}

function getDigitalInputCountersHex(
  digitalInputCounter: IDigitalInputCounters[]
) {
  let result = "";
  for (const { counter } of digitalInputCounter) {
    if (counter != null) {
      result += DecToHexString(counter, 4);
    }
  }
  return result;
}

function getAnalogInputTogglesHex(analogInputToggles: IAnalogInputToggles[]) {
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

function getAnalogInputValuesHex(analogInputValues: IAnalogInputValues[]) {
  let result = "";
  for (const { value } of analogInputValues) {
    if (value != null) {
      result += FloatToHexString(value);
    }
  }
  return result;
}

function getDataSize(dataType: number) {
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

function getParser(dataType: number) {
  const DATA_TYPE = [...DATA_TYPE_TEMPLATE];
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
      return DecToHexString;
  }
}

function getModbusHex(modbusArray: IModbus[]) {
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

function getModbusChannelDataHex(channelId: number, dataType: number) {
  let value = (channelId << 4) + dataType;
  return DecToHexString(value, 1);
}

function getModbusRegisterSettingHex(registerSetting: IModbusRegisterSetting) {
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
