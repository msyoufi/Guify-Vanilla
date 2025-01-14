import { get, getFormValues, listen, create, promptUser, showMessage } from "./utils.js";
import { createControlElement } from './control-renderer.js';
import { IpcMainInvokeEvent } from "electron";

let GUI: GUI;
let controlsCach: FormControl[] = [];
const typesWithChoices = ['select', 'radio', 'checkbox'];

const productionBtn = <HTMLButtonElement>get('production_btn');
const ctrlsContainer = <HTMLDivElement>get('ctrls_container');

window.electron.recieve('gui:data', (e: IpcMainInvokeEvent, gui: GUI) => {
  GUI = gui;
  renderControls();
  setPageTitle();
});

async function renderControls(): Promise<void> {
  controlsCach = await window.electron.handle<FormControl[]>('form-control:get-all', GUI.gui_id);

  productionBtn.disabled = controlsCach.length ? false : true;
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
  const id = ctrlId.toString();

  listen(del, 'click', onDeleteClick);
  listen(edit, 'click', e => {
    openCtrlForm();
    populateCtrlForm(e);
    toggleChoices();
  });

  del.dataset.id = id;
  edit.dataset.id = id;

  container.append(edit, del);
  return container;
}

function setPageTitle(): void {
  (get('title') as HTMLParagraphElement).innerHTML = `
    <span>${GUI.gui_name}</span>
    <span>Entwicklungsmodus</span>
  `;
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
listen('production_btn', 'click', onProductionClick);
listen('new_ctrl_btn', 'click', openCtrlForm);

async function onCtrlSubmit(event: SubmitEvent): Promise<void> {
  try {
    event.preventDefault();
    const control = cleanFormData();
    if (!control) return;

    if ('guify_ctrl_id' in control)
      await updateControl(control);
    else
      await insertControl(control);

    renderControls();
    closeCtrlForm();

  } catch (err: unknown) {
    showMessage('Es ist ein Fehler bei der Speicherung aufgetreten!');
  }
}

function cleanFormData(): FormControl | NewFormControl | null {
  const { guify_ctrl_choices, ...control } = getFormValues(ctrlForm);
  control.gui_id = GUI.gui_id;

  if (guify_ctrl_choices) {
    const cleanedChoices = cleanChoices(guify_ctrl_choices);
    if (!cleanedChoices) return null;

    control.guify_ctrl_choices = cleanedChoices;

  } else {
    control.guify_ctrl_choices = [];
  }

  if (!control.guify_ctrl_id.length)
    delete control.guify_ctrl_id;

  return control;
}

function cleanChoices(choicesString: string): FormControlChoice[] | null {
  const counter: Record<string, number> = {};
  const cleanedChoices: FormControlChoice[] = [];
  const choices = choicesString.split('\n');

  for (const choice of choices) {
    if (choice === '') continue;

    if (!/^\s*[^=\s]+(?:\s[^=\s]*)?\s*=\s*[^=\s]+(?:\s[^=\s]*)?\s*$/.test(choice)) {
      showMessage(`Option ${choice} nicht korrekt formatiert!`);
      return null;
    }

    const ch = choice.split('=');
    const val = ch[0].trim();
    counter[val] = (counter[val] ?? 0) + 1;

    cleanedChoices.push({
      ch_value: val,
      ch_label: ch[1].trim()
    });
  }

  for (const [key, val] of Object.entries(counter))
    if (val !== 1) {
      showMessage(`Die Werte der Optionen müssen unterschiedlich sein.\nWert: ${key} ist ${val} Fach vorhanden!`, 'red', 4000);
      return null;
    }

  return cleanedChoices;
}

async function insertControl(control: NewFormControl): Promise<void> {
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

  const inputs = ctrlForm.querySelectorAll<HTMLInputElement>('input, select, textarea');

  for (const input of inputs) {
    if (input.type === 'submit' || input.type === 'reset') continue;

    const key = <keyof FormControl>input.name;
    const value = control[key];

    if (input.type === 'radio')
      input.checked = input.value == value;

    else if (key === 'guify_ctrl_choices')
      //@ts-ignore
      input.value = value.map(c => `${c.ch_value} = ${c.ch_label}`).join('\n');

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

  for (const ctrl of controlsCach) {
    if (
      ctrl.guify_ctrl_name === name
      && (!id || ctrl.guify_ctrl_id.toString() !== id)
    )
      return true;
  }

  return false;
}

async function onDeleteClick(event: MouseEvent): Promise<void> {
  const id = (event.currentTarget as HTMLElement).dataset.id as string;
  const action = await promptUser('Diese Frage endgültig entfernen?', 'Entfernen');

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

async function onProductionClick(): Promise<void> {
  const action = await promptUser('In den Productionsmodus wechseln?', 'Bestätigen');

  if (action === 'confirm')
    makeProduction();
}

async function makeProduction(): Promise<void> {
  try {
    await window.electron.handle<number>('gui:production', GUI, controlsCach);
    lockView();

  } catch (err: unknown) {
    showMessage('Es is ein Fehler beim Wechseln in den Produktionsmodus aufgetreten!');
  }
}

function lockView(): void {
  const locker = <HTMLDivElement>get('guify_locker_overlay');
  locker.style.display = 'flex';
}