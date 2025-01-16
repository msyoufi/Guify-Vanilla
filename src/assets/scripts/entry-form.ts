import { IpcMainInvokeEvent } from "electron";
import { createControlElement } from "./control-renderer.js";
import { create, get, getFormValues, listen, showMessage } from "./utils.js";

let PROJECT: GuifyProject;
const ctrlsContainer = <HTMLDivElement>get('ctrls_container');

// Render logic

window.electron.recieve('project:data', async (e: IpcMainInvokeEvent, projects: GuifyProject) => {
  PROJECT = projects;
  const controls = await window.electron.handle<FormControl[]>('form-control:get-all', projects.id);
  renderControls(controls);
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

    const entry = getFormValues(entryForm);
    entry.project_id = PROJECT.id;
    const changes = await window.electron.handle<number>('entry:insert', PROJECT, entry);
    if (!changes) throw new Error();

    showMessage('Eintrag erfolgreich gespeichert', 'green');

  } catch (err: unknown) {
    console.log(err);
    showMessage('Es ist ein Fehler bei der Speicherung aufgetreten!');
  }
}

function onFormInput(): void {
  submitBtn.disabled = entryForm.checkValidity() ? false : true;
}