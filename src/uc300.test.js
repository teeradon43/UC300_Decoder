const {
  getDigitalInputStatus,
  getAnalogInputStatus,
  decode,
} = require('./uc300');

test('getDigitalInputStatus', () => {
  expect(getDigitalInputStatus('00')).toBe('disabled');
  expect(getDigitalInputStatus('01')).toBe('Digital Input Mode');
  expect(getDigitalInputStatus('10')).toBe('Counter mode stop counting');
  expect(getDigitalInputStatus('11')).toBe('Counter mode pulse-start counting');
  expect(getDigitalInputStatus('')).toBe('Not Valid Input');
});

test('getAnalogInputStatus', () => {
  expect(getAnalogInputStatus('00')).toBe('disabled');
  expect(getAnalogInputStatus('01')).toBe('collected successfully');
  expect(getAnalogInputStatus('10')).toBe('collect failed');
  expect(getAnalogInputStatus('11')).toBe('error');
});

test('decode case 1', () => {
  const rawData = '7EF40F000A7A80576214000000007E';
  const bytes = Buffer.from(rawData, 'hex');
  output = decode(bytes);
  expect(output.data_type).toBe('f4');
  expect(output.packet_length).toBe(15);
});
