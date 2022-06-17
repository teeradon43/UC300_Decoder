// console.log("hey")
// console.log('Thu Apr 14 2022 09:01:30 GMT+0700 (เวลาอินโดจีน)')
// let deserialized = new Date('Thu Apr 14 2022 09:01:30 GMT+0700 (เวลาอินโดจีน)')
// console.log(Number(deserialized))
function reverseHex(hexString) {
  var chunks = [];
  for (var i = 0, charsLength = hexString.length; i < charsLength; i += 2) {
    chunks.push(hexString.substring(i, i + 2));
  }
  chunks.reverse();
  return chunks.join("");
}

function getPacketLengthHex(value) {
  let hexString = value.toString(16);
  hexString = hexString.padStart(4, "0");
  return reverseHex(hexString);
}

function getPacketVersionHex(value) {
  let hexString = value.toString(16);
  return hexString.padStart(2, "0");
}

function getTimestampHex(dateString) {
  let dateNum = Number(new Date(dateString)) / 1000;
  let hexString = dateNum.toString(16);
  hexString = hexString.padStart(4, "0");
  return reverseHex(hexString);
}

console.log(
  getTimestampHex("Thu Apr 14 2022 09:01:30 GMT+0700 (เวลาอินโดจีน)")
);

module.exports = {
  reverseHex,
  getPacketLengthHex,
  getPacketVersionHex,
  getTimestampHex,
};
