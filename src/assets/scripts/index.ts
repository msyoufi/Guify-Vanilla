import { listen, create, get, showMessage, promptUser } from "./utils.js";

let guisCach: GUI[] = [];
const guisContainer = <HTMLDivElement>get('guis_container');
const nameInput = <HTMLInputElement>get('name_input');
const nameInputBox = <HTMLInputElement>get('name_input_box');

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
  const actions = create('div', ['gui-actions']);
  const edit = create('i', ['bi', 'bi-pencil-square']);
  const del = create('i', ['bi', 'bi-trash-fill']);

  listen(guiBar, 'click', onGuiBarClick);
  listen(edit, 'click', onEditClick);
  listen(del, 'click', onDeleteClick);

  guiBar.innerHTML = `<span>${gui.gui_name}</span>`;
  guiBar.dataset.guiId = guiId;
  edit.dataset.guiId = guiId;
  del.dataset.guiId = guiId;

  actions.append(edit, del);
  guiBar.appendChild(actions);

  return guiBar;
}

listen('new_gui_btn', 'click', showNameBox);
listen('close_name_btn', 'click', hideNameBox);
listen(nameInput, 'keydown', onKeyDown);

function showNameBox(): void {
  nameInputBox.classList.add('show');
  nameInput.focus();
}

function hideNameBox(): void {
  nameInputBox.classList.remove('show');
  nameInput.value = '';
}

async function onKeyDown(e: KeyboardEvent): Promise<void> {
  try {
    if (e.code === 'Enter') {
      const guiName = nameInput.value;

      if (!guiName) {
        showMessage('Ungültiger Name!');
        return;
      }

      await window.electron.handle<number>('gui:insert', guiName);
      hideNameBox();
      renderGuis();
    }

    if (e.code === 'Escape')
      hideNameBox();

  } catch (err: unknown) {
    showMessage('blabalbla');
  }
}

function onGuiBarClick(e: MouseEvent): void {
  const gui = getGUI(e);
  window.electron.handle<void>('gui:use', gui);
}

function onEditClick(e: MouseEvent): void {
  e.stopPropagation();
  const gui = getGUI(e);
  window.electron.handle<void>('gui:edit', gui);
}

async function onDeleteClick(e: MouseEvent): Promise<void> {
  e.stopPropagation();
  const gui = getGUI(e);
  const action = await promptUser(`${gui.gui_name} endgütlig löschen?`, 'Löschen');

  if (action === 'confirm')
    deleteGui(gui.gui_id);
}

async function deleteGui(guiId: number): Promise<void> {
  try {
    const changes = await window.electron.handle<number>('gui:delete', guiId);

    if (!changes) throw new Error;
    renderGuis();

  } catch (err: unknown) {
    showMessage('blabalbla');
  }
}

function getGUI(e: MouseEvent): GUI {
  const gui_id = Number((<HTMLElement>e.currentTarget).dataset.guiId);
  const gui_name = guisCach.find(g => g.gui_id === gui_id)?.gui_name as string;
  return { gui_id, gui_name };
}