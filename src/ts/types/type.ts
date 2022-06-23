export interface IPayload {
  data_type: string;
  packet_length: number;
  packet_version: number;
  timestamp: string;
  signal_strength: number;
  toggles_of_digital_outputs: IDigitalOutputToggles[];
  digital_output_statuses: IDigitalOutputStatuses[];
  toggles_of_digital_inputs: IDigitalInputToggles[];
  digital_input_statuses: IDigitalInputStatuses[];
  di_counters: IDigitalInputCounters[];
  toggles_of_analog_inputs: IAnalogInputToggles[];
  analog_input_values: IAnalogInputValues[];
  modbus: IModbus[];
}

export interface IDigitalOutputToggles {
  name: string;
  toggle: number;
}
export interface IDigitalOutputStatuses {
  name: string;
  status: number | null;
}
export interface IDigitalInputToggles {
  name: string;
  toggle: number;
}
export interface IDigitalInputStatuses {
  name: string;
  status: number | null;
}
export interface IDigitalInputCounters {
  name: string;
  counter: number | null;
}
export interface IAnalogInputToggles {
  name: string;
  toggle: number;
}
export interface IAnalogInputValues {
  name: string;
  value: number | null;
}
export interface IModbus {
  channel_id: number;
  data_type: number;
  register_setting: IModbusRegisterSetting;
  data: number[];
}

export interface IModbusRegisterSetting {
  sign: number;
  decimal: number;
  status: number;
  quantity: number;
}
