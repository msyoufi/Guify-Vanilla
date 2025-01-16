import { IpcMainEvent, IpcMainInvokeEvent, IpcMessageEvent, IpcRendererEvent } from "electron";
import { createControlElement } from "./control-renderer.js";
import { create, get, getFormValues, listen, showMessage } from "./utils.js";

let PROJECT: GuifyProject;
const ctrlsContainer = <HTMLDivElement>get('ctrls_container');

// Render logic

window.electron.recieve('entry-form:data',
  (e: IpcRendererEvent, projects: GuifyProject, controls: FormControl[], entry: any, parent: any) => {
    PROJECT = projects;
    renderControls(controls);
    populateForm(entry);
    (get('title') as HTMLParagraphElement).innerText = PROJECT.name;
  });

async function renderControls(controls: FormControl[]): Promise<void> {
  ctrlsContainer.innerHTML = '';

  for (const ctrl of controls) {
    const ctrlNode = createControlElement(ctrl);
    const actions = createActionButtons(ctrl.guify_ctrl_name);
    (ctrlNode.querySelector('.tool-bar') as HTMLDivElement).prepend(actions);
    ctrlsContainer.appendChild(ctrlNode);
  }
}

function createActionButtons(ctrlName: string): HTMLElement {
  const container = create('div', ['actions']);
  const reset = create('i', ['bi', 'bi-arrow-counterclockwise']);

  listen(reset, 'click', onResetCtrlClick);
  reset.dataset.name = ctrlName;

  container.append(reset);
  return container;
}

function onResetCtrlClick(e: MouseEvent): void {
  const ctrlName = (e.currentTarget as HTMLElement).dataset.name;
  console.log(ctrlName);
}


// Form logic

const entryForm = <HTMLFormElement>get('entry_form');
const submitBtn = <HTMLButtonElement>entryForm.querySelector('input[type="submit"]');

listen(entryForm, 'submit', onFormSubmit);
listen(entryForm, 'input', onFormInput);

async function onFormSubmit(event: SubmitEvent): Promise<void> {
  try {
    event.preventDefault();

    let changes = 0;
    const entry = getFormValues(entryForm);
    const entry_id = (<HTMLInputElement>get('entry_id')).value;
    let type: 'insert' | 'update' = 'insert';

    entry.project_id = PROJECT.id;

    if (entry_id !== '') {
      type = 'update';
      entry.entry_id = entry_id;
    }

    changes = await window.electron.handle<number>('entry:update', PROJECT, entry, type);
    if (!changes) throw new Error();

    window.electron.handle('window:close');

  } catch (err: unknown) {
    console.log(err);
    showMessage('Es ist ein Fehler bei der Speicherung aufgetreten!');
  }
}

function populateForm(entry: any): void {
  if (!entry) return;

  const inputs = entryForm.querySelectorAll<HTMLInputElement>('input, select, textarea');

  for (const input of inputs) {
    if (input.type === 'submit' || input.type === 'reset') continue;

    const key = input.name;
    const value = entry[key];

    if (input.type === 'radio' || input.type === 'checkbox')
      input.checked = input.value == value;
    else
      input.value = value;
  }
}

function onFormInput(): void {
  submitBtn.disabled = entryForm.checkValidity() ? false : true;
}