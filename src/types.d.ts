interface Window {
  electron: {
    handle: <T>(channel: GuifyChannel, ...args: any) => Promise<T>,
    recieve: (channel: GuifyChannel, listener: (...args: any) => void) => void
  }
};

interface GUI {
  gui_id: number,
  gui_name: string,
  production: 0 | 1
}

interface NewFormControl {
  gui_id: number,
  guify_ctrl_name: string,
  guify_ctrl_type: string,
  guify_ctrl_label: string,
  guify_ctrl_required: 0 | 1,
  guify_ctrl_choices: FormControlChoice[]
}

interface FormControl extends NewFormControl {
  guify_ctrl_id: number
}

interface FormControlChoice {
  ch_value: string,
  ch_label: string
}

const channels = {
  'window:close': '',

  'gui:insert': '',
  'gui:delete': '',
  'gui:get-all': '',
  'gui:open': '',
  'gui:data': '',
  'gui:production': '',

  'form-control:insert': '',
  'form-control:update': '',
  'form-control:delete': '',
  'form-control:get-all': ''
} as const;

type GuifyChannel = keyof typeof channels;