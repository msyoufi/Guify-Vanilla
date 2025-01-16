interface Window {
  electron: {
    handle: <T>(channel: GuifyChannel, ...args: any) => Promise<T>,
    recieve: (channel: GuifyChannel, listener: (...args: any) => void) => void
  }
};

interface GuifyProject {
  id: number,
  name: string,
  production: 0 | 1
}

interface NewFormControl {
  project_id: number,
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

  'project:insert': '',
  'project:delete': '',
  'project:get-all': '',
  'project:open': '',
  'project:data': '',
  'project:production': '',

  'form-control:insert': '',
  'form-control:update': '',
  'form-control:delete': '',
  'form-control:get-all': '',

  'entry:insert': ''
} as const;

type GuifyChannel = keyof typeof channels;