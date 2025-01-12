interface Window {
  electron: {
    handle: <T>(channel: GuifyChannel, ...args: any) => Promise<T>,
    recieve: (channel: GuifyChannel, listener: (...args: any) => void) => void
  }
};

const channels = {
  'form-control:insert': '',
  'form-control:update': '',
  'form-control:delete': '',
  'form-control:get-all': ''
} as const;

type GuifyChannel = keyof typeof channels;

interface FormControlNoID {
  guiName: string,
  name: string,
  type: string,
  label: string,
  required: 0 | 1,
  choices: FormControlChoice[]
}

interface FormControlChoice {
  chValue: string,
  chLabel: string
}

interface FormControl extends FormControlNoID {
  id: number
}