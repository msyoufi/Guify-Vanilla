interface Window {
  electron: {
    handle: <T>(channel: GuifyChannel, ...args: any) => Promise<T>,
    recieve: (channel: GuifyChannel, listener: (...args: any) => void) => void
  }
};

const channels = {
  'window:open': '',
  'window:close': '',

  'gui:insert': '',
  'gui:delete': '',
  'gui:get-all': '',
  'gui:edit': '',
  'gui:get': '',

  'form-control:insert': '',
  'form-control:update': '',
  'form-control:delete': '',
  'form-control:get-all': ''
} as const;

type GuifyChannel = keyof typeof channels;

interface GUI {
  gui_id: number,
  gui_name: string
}

interface FormControlNoID {
  guify_ctrl_guiName: string,
  guify_ctrl_name: string,
  guify_ctrl_type: string,
  guify_ctrl_label: string,
  guify_ctrl_required: '0' | '1',
  guify_ctrl_choices: FormControlChoice[]
}

interface FormControlChoice {
  chValue: string,
  chLabel: string
}

interface FormControl extends FormControlNoID {
  guify_ctrl_id: number
}