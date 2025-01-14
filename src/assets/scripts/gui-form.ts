import { IpcMainInvokeEvent } from "electron";
import { createControlElement } from "./control-renderer.js";
import { create, get, getFormValues, listen, showMessage } from "./utils.js";

let GUI: GUI;
const entryForm = <HTMLFormElement>get('entry_form');
const ctrlsContainer = <HTMLDivElement>get('ctrls_container');

window.electron.recieve('gui:data', (e: IpcMainInvokeEvent, gui: GUI, controls: FormControl[]) => {
  renderControls(controls);
  GUI = gui;
});

async function renderControls(controls: FormControl[]): Promise<void> {
  ctrlsContainer.innerHTML = '';

  for (const ctrl of controls) {
    const ctrlNode = createControlElement(ctrl);
    const actions = createActionButtons(ctrl.guify_ctrl_name)
    ctrlNode.appendChild(actions);
    ctrlsContainer.appendChild(ctrlNode);
  }
}

function createActionButtons(ctrlName: string): HTMLElement {
  const container = create('div', ['control-actions']);
  const reset = create('i', ['bi', 'bi-arrow-counterclockwise']);

  reset.dataset.name = ctrlName;
  listen(reset, 'click', onResetCtrlClick);
  container.append(reset);

  return container;
}

function onResetCtrlClick(e: MouseEvent): void {
  const ctrlName = (e.currentTarget as HTMLElement).dataset.name;
  console.log(ctrlName);
}

listen(entryForm, 'submit', onFormSubmit);

async function onFormSubmit(event: SubmitEvent): Promise<void> {
  try {
    event.preventDefault();

    const entry = getFormValues(entryForm);
    console.log(entry);


  } catch (err: unknown) {
    console.log(err);
    showMessage('Es ist ein Fehler bei der Speicherung aufgetreten!');
  }
}