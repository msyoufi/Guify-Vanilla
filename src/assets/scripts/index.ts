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
  const guiBar = create('div', ['gui-bar']);
  const actions = create('div', ['gui-actions']);
  const edit = create('i', ['bi', 'bi-pencil-square']);
  const del = create('i', ['bi', 'bi-trash-fill']);

  listen(guiBar, 'click', onUseClick);
  listen(edit, 'click', onEditClick);
  listen(del, 'click', onDeleteClick);

  guiBar.innerHTML = `<span>${gui.gui_name}</span>`;
  guiBar.dataset.guiId = gui.gui_id.toString();

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

function onUseClick(e: MouseEvent): void {
  const guiId = (e.currentTarget as HTMLElement).dataset.guiId;
  console.log(guiId)
}

function onEditClick(e: MouseEvent): void {
  e.stopPropagation();
  const gui_id = getGuiId(e);
  const gui_name = guisCach.find(g => g.gui_id.toString() === gui_id)?.gui_name;
  window.electron.handle<void>('gui:edit', { gui_id, gui_name });
}

async function onDeleteClick(e: MouseEvent): Promise<void> {
  e.stopPropagation();
  const guiId = getGuiId(e);
  const guiName = guisCach.find(g => g.gui_id.toString() === guiId)?.gui_name;
  const action = await promptUser(`${guiName} endgütlig löschen?`, 'Löschen');

  if (action === 'confirm')
    deleteGui(guiId);
}

async function deleteGui(guiId: string): Promise<void> {
  try {
    const changes = await window.electron.handle<number>('gui:delete', guiId);

    if (!changes) throw new Error;
    renderGuis();

  } catch (err: unknown) {
    showMessage('blabalbla');
  }
}

function getGuiId(e: MouseEvent): string {
  return (e.currentTarget as HTMLElement)
    .parentElement?.parentElement?.dataset.guiId as string;
}