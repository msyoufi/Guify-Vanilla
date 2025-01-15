import { listen, create, get, showMessage, promptUser } from "./utils.js";

let guisCach: GUI[] = [];
const guisContainer = <HTMLDivElement>get('guis_container');
const nameInput = <HTMLInputElement>get('name_input');
const nameInputBox = <HTMLInputElement>get('name_input_box');

window.electron.recieve('gui:data', renderGuis);

renderGuis();

async function renderGuis(): Promise<void> {
  guisCach = await window.electron.handle<GUI[]>('gui:get-all');
  guisContainer.innerHTML = '';

  for (const gui of guisCach)
    guisContainer.append(createGuiElement(gui));
}

function createGuiElement(gui: GUI): HTMLElement {
  const guiId = gui.gui_id.toString();

  const guiBar = create('div', ['gui-bar']);
  const actions = create('div', ['actions']);
  const del = create('i', ['bi', 'bi-trash-fill']);

  if (gui.production) guiBar.classList.add('prod');

  listen(guiBar, 'click', onGuiBarClick);
  listen(del, 'click', onDeleteClick);

  guiBar.innerHTML = `<span>${gui.gui_name}</span>`;
  guiBar.dataset.guiId = guiId;
  del.dataset.guiId = guiId;

  actions.append(del);
  guiBar.appendChild(actions);

  return guiBar;
}

listen('new_gui_btn', 'click', showNameBox);
listen('close_name_btn', 'click', hideNameBox);
listen(nameInput, 'keyup', onKeyUp);

function showNameBox(): void {
  nameInputBox.classList.add('show');
  nameInput.disabled = false;
  nameInput.focus();
}

function hideNameBox(): void {
  nameInputBox.classList.remove('show');
  nameInput.classList.remove('invalid');
  nameInput.value = '';
  nameInput.disabled = true;
}

async function onKeyUp(e: KeyboardEvent): Promise<void> {
  if (e.code === 'Escape')
    return hideNameBox();

  const guiName = nameInput.value;
  if (!guiName) return;

  const invalid = !/^[a-zA-Z_][a-zA-Z0-9_ ]*$/.test(guiName) || checkNameExists(guiName);

  if (invalid)
    nameInput.classList.add('invalid');
  else
    nameInput.classList.remove('invalid');

  if (e.code === 'Enter') {
    if (invalid) return showMessage('Projektname unzulässig oder bereits vergeben!');

    try {
      await window.electron.handle<number>('gui:insert', guiName);
      hideNameBox();
      renderGuis();

    } catch (err: unknown) {
      showMessage('Es ist ein Fehler bei der Erstellung des Projekts aufgetreten!');
    }
  }
}

function checkNameExists(guiName: string): boolean {
  if (guisCach.findIndex(g => g.gui_name === guiName) > -1)
    return true;

  return false;
}

function onGuiBarClick(e: MouseEvent): void {
  const gui = getGUI(e);
  window.electron.handle<void>('gui:open', gui);
}

async function onDeleteClick(e: MouseEvent): Promise<void> {
  e.stopPropagation();
  const gui = getGUI(e);
  const action = await promptUser(`${gui.gui_name} endgütlig löschen?`, 'Löschen');

  if (action === 'confirm')
    deleteGui(gui);
}

async function deleteGui(gui: GUI): Promise<void> {
  try {
    await window.electron.handle<void>('gui:delete', gui);
    showMessage(`Projekt ${gui.gui_name} samt dessen Daten endgütlig gelöscht`);
    renderGuis();

  } catch (err: unknown) {
    showMessage('Es ist ein Fehler bei der Löschung aufgetreten');
  }
}

function getGUI(e: MouseEvent): GUI {
  const gui_id = Number((<HTMLElement>e.currentTarget).dataset.guiId);
  return guisCach.find(g => g.gui_id === gui_id) as GUI;
}