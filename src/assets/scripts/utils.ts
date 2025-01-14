export function get(elementId: string): HTMLElement | null {
  return document.getElementById(elementId);
}

export function listen(element: string | HTMLElement, event: string, callback: (e: any) => void): void {
  if (typeof element === 'string')
    element = <HTMLElement>get(element);

  element?.addEventListener(event, callback);
}

export function create(tag: string, classes?: string[], text?: string): HTMLElement {
  const el = document.createElement(tag);
  if (classes) el.classList.add(...classes);
  if (text) el.textContent = text;
  return el;
}

export function getFormValues(form: HTMLFormElement | string): any {
  if (typeof form === 'string')
    form = get(form) as HTMLFormElement;

  const formData = new FormData(form).entries();
  const data: any = {};

  for (const [key, value] of formData)
    data[key] = value;

  return data;
}

const snackBar = get('snack_bar') as HTMLParagraphElement;
let messageTimer: any;

export function showMessage(message: string, color: 'red' | 'green' = 'red', delay: number = 3000): void {
  clearTimeout(messageTimer);

  snackBar.innerText = message;
  snackBar.style.backgroundColor = `var(--${color})`;
  snackBar.style.display = 'block';

  messageTimer = setTimeout(() => snackBar.style.display = 'none', delay);
}

export function promptUser(message: string, action: string): Promise<string> {
  const overlay = create('div', ['overlay']);
  const box = create('div', ['dialog-container']);
  const p = create('p', [], message);
  const actionBtn = create('button', ['guify-button'], action);
  const cancleBtn = create('button', ['guify-button', 'red-button'], 'Abbrechen');

  box.append(p, actionBtn, cancleBtn);
  overlay.append(box);
  document.body.append(overlay);
  overlay.style.display = 'flex';

  return new Promise<string>(resolve => {
    function response(action: string): void {
      document.body.removeChild(overlay);
      resolve(action);
    };

    listen(actionBtn, 'click', () => response('confirm'));
    listen(cancleBtn, 'click', () => response('cancle'));
  });
}