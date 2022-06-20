// console.log("hey")
// console.log('Thu Apr 14 2022 09:01:30 GMT+0700 (เวลาอินโดจีน)')
// let deserialized = new Date('Thu Apr 14 2022 09:01:30 GMT+0700 (เวลาอินโดจีน)')
// console.log(Number(deserialized))

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

function NumToHexString(value, numberOfByte = 1) {
  let hexString = value.toString(16);
  hexString = hexString.padStart(numberOfByte * 2, "0");
  return hexString;
}

function FloatToHexString(value) {
  //https://stackoverflow.com/a/47187116
  let view = new DataView(new ArrayBuffer(4)),
    result;
  view.setFloat32(0, value);
  result = Array.apply(null, { length: 4 })
    .map((_, i) => view.getUint8(i).toString(16))
    .join("");
  result = result.padEnd(8, "0");
  return reverseHex(result);
}
/***********************************/

/******** Get Hex from Data ********/
function getPacketLengthHex(value) {
  let hexString = NumToHexString(value, 2);
  return reverseHex(hexString);
}

function getPacketVersionHex(value) {
  return NumToHexString(value, 1);
}

function getTimestampHex(dateString) {
  let dateNum = Number(new Date(dateString)) / 1000;
  let hexString = NumToHexString(dateNum, 4);
  return reverseHex(hexString);
}

function getSignalStrengthHex(value) {
  return NumToHexString(value, 1);
}

function getDigitalOutputTogglesHex(digitalOutputToggles) {
  let result = 0;
  for (const toggles of digitalOutputToggles) {
    if (toggles.name === "DO1") result += toggles.toggle;
    else if (toggles.name === "DO2") result += toggles.toggle * 2;
  }
  return NumToHexString(result, 1);
}

function getDigitalOutputStatusesHex(digitalOutputStatuses) {
  let result = 0;
  for (const statuses of digitalOutputStatuses) {
    if (statuses.name === "DO1") result += statuses.status;
    else if (statuses.name === "DO2") result += statuses.status * 2;
  }
  return NumToHexString(result, 1);
}

function getDigitalInputTogglesHex(digitalInputToggles) {
  let result = 0;
  for (const index in digitalInputToggles) {
    result += digitalInputToggles[index].toggle << (2 * index);
  }
  return NumToHexString(result, 1);
}

function getDigitalInputStatusesHex(digitalInputStatuses) {
  let result = 0;
  for (const index in digitalInputStatuses) {
    result += digitalInputStatuses[index].status << index;
  }
  return NumToHexString(result, 1);
}

function getDigitalInputCountersHex(digitalInputCounter) {
  let result = "";
  let hexString = "";
  for (const { counter } of digitalInputCounter) {
    if (counter != null) {
      hexString = NumToHexString(counter, 4);
      result += reverseHex(hexString);
    }
  }
  return result;
}

function getAnalogInputTogglesHex(analogInputToggles) {
  //TODO: Refactor this code
  let result = 0;
  for (let index = 0; index < 4; index++) {
    result += analogInputToggles[index].toggle << (index * 2);
  }
  result <<= 8;
  for (let index = 4; index < 6; index++) {
    result += analogInputToggles[index].toggle << ((index - 4) * 2);
  }
  return NumToHexString(result, 2);
}

function getAnalogInputValuesHex(analogInputValues) {
  let result = "";
  let hexString = "";
  for (const { value } of analogInputValues) {
    if (value != null) {
      hexString = FloatToHexString(value);
      result += hexString;
    }
  }
  return result;
}
/***********************************/

module.exports = {
  reverseHex,
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
};
