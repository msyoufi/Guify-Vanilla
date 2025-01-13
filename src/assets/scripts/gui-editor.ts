import { get, getFormValues, listen, create, promptUser, showMessage } from "./utils.js";
import { createControlElement } from './control-renderer.js';
import { IpcMainInvokeEvent } from "electron";

let GUI: GUI;
let controlsCach: FormControl[] = [];
const typesWithChoices = ['select', 'radio', 'checkbox'];
const ctrlsContainer = <HTMLDivElement>get('ctrls_container');
const guiName = <HTMLParagraphElement>get('gui_name');

window.electron.recieve('gui:get', (e: IpcMainInvokeEvent, gui: GUI) => {
  GUI = gui;
  guiName.innerText = gui.gui_name;
  renderControls();
});

async function renderControls(): Promise<void> {
  controlsCach = await window.electron.handle<FormControl[]>('form-control:get-all', GUI.gui_id);
  ctrlsContainer.innerHTML = '';

  for (const ctrl of controlsCach) {
    const ctrlNode = createControlElement(ctrl);
    const actions = createActionButtons(ctrl.guify_ctrl_id)
    ctrlNode.appendChild(actions);
    ctrlsContainer.appendChild(ctrlNode);
  }
}

function createActionButtons(ctrlId: number): HTMLElement {
  const container = create('div', ['control-actions']);
  const del = create('i', ['bi', 'bi-trash-fill']);
  const edit = create('i', ['bi', 'bi-pencil-square']);

  listen(del, 'click', onDeleteClick);
  listen(edit, 'click', e => {
    openCtrlForm();
    populateCtrlForm(e);
    toggleChoices();
  });

  del.dataset.id = ctrlId.toString();
  edit.dataset.id = ctrlId.toString();

  container.append(edit, del);
  return container;
}

// Control form logic

const ctrlOverlay = <HTMLDivElement>get('ctrl_form_overlay');
const ctrlForm = <HTMLFormElement>get('ctrl_form');
const submitBtn = <HTMLButtonElement>ctrlForm.querySelector('input[type="submit"]');
const choicesField = <HTMLTextAreaElement>get('guify_ctrl_choices');
const nameInput = <HTMLInputElement>get('guify_ctrl_name');
const idInput = <HTMLInputElement>get('guify_ctrl_id');
const nameErr = <HTMLElement>get('name_err');

listen(ctrlForm, 'submit', onCtrlSubmit);
listen(ctrlForm, 'input', onCtrlFormInput);
listen(ctrlForm, 'reset', closeCtrlForm);
listen(nameInput, 'input', checkValidName);
listen('ctrl_new_btn', 'click', () => {
  submitBtn.value = 'Hinzufügen';
  openCtrlForm();
});

async function onCtrlSubmit(event: SubmitEvent): Promise<void> {
  try {
    event.preventDefault();

    const { guify_ctrl_choices, ...control } = getFormValues('ctrl_form');
    control.gui_id = GUI.gui_id;

    if (guify_ctrl_choices) {
      const cleanChoices = getCleanChoices(guify_ctrl_choices);
      if (!cleanChoices.length) return;
      control.guify_ctrl_choices = cleanChoices;

    } else
      control.guify_ctrl_choices = [];

    if (submitBtn.value === 'Hinzufügen') {
      delete control.guify_ctrl_id;
      await insertControl(control);

    } else {
      await updateControl(control);
    }

    renderControls();
    closeCtrlForm();

  } catch (err: unknown) {
    showMessage('Es ist ein Fehler bei der Speicherung aufgetreten!');
  }
}

function getCleanChoices(choicesString: string): FormControlChoice[] {
  const counter: any = {};
  const cleanChoices: FormControlChoice[] = [];
  const choices = choicesString.split('\n');

  for (const choice of choices) {
    if (choice === '') continue;

    if (!/^\s*[^=\s]+(?:\s[^=\s]*)?\s*=\s*[^=\s]+(?:\s[^=\s]*)?\s*$/.test(choice)) {
      showMessage(`Option ${choice} nicht korrekt formatiert!`);
      return [];
    }

    const ch = choice.split('=');
    const val = ch[0].trim();
    counter[val] = (counter[val] ?? 0) + 1;

    cleanChoices.push({
      chValue: val,
      chLabel: ch[1].trim()
    });
  }

  for (const [key, val] of Object.entries(counter))
    if (val !== 1) {
      showMessage(`Die Werte der Optionen müssen unterschiedlich sein.\nWert: ${key} ist ${val} Fach vorhanden!`, 'red', 4000);
      return [];
    }

  return cleanChoices;
}

async function insertControl(control: FormControl): Promise<void> {
  const changes = await window.electron.handle<number>('form-control:insert', control);
  if (!changes) throw new Error();
  showMessage('Frage erfolgreich hinzugefügt', 'green');
}

async function updateControl(control: FormControl): Promise<void> {
  const changes = await window.electron.handle('form-control:update', control);
  if (!changes) throw new Error();
  showMessage('Frage erfolgreich geändert!', 'green');
}

function openCtrlForm(): void {
  ctrlOverlay.style.display = 'flex';
}

function closeCtrlForm(): void {
  ctrlForm.reset();
  idInput.value = '';
  choicesField.disabled = true;
  submitBtn.disabled = true;
  nameInput.setCustomValidity('');
  nameInput.classList.remove('invalid');
  nameErr.innerText = '';
  ctrlOverlay.style.display = 'none';
}

function populateCtrlForm(event: MouseEvent): void {
  const id = Number((event.currentTarget as HTMLElement).dataset.id);
  const control = controlsCach.find(ctrl => ctrl.guify_ctrl_id == id);
  if (!control) return;

  submitBtn.value = 'Speichern';
  const inputs = ctrlForm.querySelectorAll<HTMLInputElement>('input, select, textarea');

  for (const input of inputs) {
    if (input.type === 'submit' || input.type === 'reset') continue;

    const key = <keyof FormControl>input.name;
    const value = control[key];

    if (input.type === 'radio')
      input.checked = input.value == value;

    else if (key === 'guify_ctrl_choices')
      //@ts-ignore
      input.value = value.map(ch => `${ch.chValue} = ${ch.chLabel}`).join('\n');

    else
      //@ts-ignore
      input.value = value;
  }
}

function onCtrlFormInput(): void {
  toggleChoices();
  submitBtn.disabled = ctrlForm.checkValidity() ? false : true;

  if (choicesField.disabled)
    choicesField.value = '';
}

function toggleChoices(): void {
  const ctrlType = (<HTMLSelectElement>get('guify_ctrl_type')).value;
  choicesField.disabled = typesWithChoices.includes(ctrlType) ? false : true;
  choicesField.required = choicesField.disabled ? false : true;
}

function checkValidName(): void {
  const value = nameInput.value;
  const isInvalid = !/^[a-zA-Z0-9_]*$/.test(value);

  nameInput.setCustomValidity('invalid');
  nameInput.classList.add('invalid');

  if (isInvalid) {
    nameErr.innerText = 'Nur alphanumerische Zeichen und _ sind zulässig!';

  } else if (checkNameExists(value)) {
    nameErr.innerText = 'Variablenname bereits vorhanden!';

  } else {
    nameInput.setCustomValidity('');
    nameInput.classList.remove('invalid');
    nameErr.innerText = '';
  }
}

function checkNameExists(name: string): boolean {
  const id = idInput.value;

  for (const ctrl of controlsCach)
    if (ctrl.guify_ctrl_name === name && (ctrl.guify_ctrl_id.toString() !== id || !id))
      return true;

  return false;
}

async function onDeleteClick(event: MouseEvent): Promise<void> {
  const id = (event.currentTarget as HTMLElement).dataset.id as string;
  const action = await promptUser('Diese Frage endgueltig entfernen?', 'Entfernen');

  if (action === 'confirm')
    deleteControl(id);
}

async function deleteControl(id: string): Promise<void> {
  try {
    const changes = await window.electron.handle('form-control:delete', id);
    if (!changes) throw new Error();

    renderControls();
    showMessage('Frage erfolgreich entfernt!', 'green');

  } catch (err: unknown) {
    showMessage('Es is ein Fehler beim Entfernen aufgetreten!');
  }
}