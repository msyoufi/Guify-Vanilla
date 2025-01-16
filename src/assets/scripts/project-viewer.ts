import { IpcMainInvokeEvent } from "electron";
import { create, get, listen, promptUser, showMessage } from "./utils.js";

let PROJECT: GuifyProject;
let entriesCach: any[] = [];
const entriesList = <HTMLUListElement>get('entries_list');

listen('new_entry_btn', 'click', () => openEntryForm(null));

window.electron.recieve('project:data', (e: IpcMainInvokeEvent, project: GuifyProject) => {
  PROJECT = project;
  renderEntries();
  (get('title') as HTMLParagraphElement).innerText = PROJECT.name;
});

async function renderEntries(): Promise<void> {
  entriesCach = await window.electron.handle('entry:get-all', PROJECT);

  entriesList.innerHTML = '';
  (<HTMLParagraphElement>get('counter')).innerText = entriesCach.length + ' Einträge';

  if (!entriesCach.length) {
    entriesList.innerHTML = '<li>Keine Einträge in diesem Projekt</li>';
    return;
  }

  for (const entry of entriesCach) {
    const entryNode = createEntryBar(entry);
    entriesList.appendChild(entryNode);
  }
}

function createEntryBar(entry: any): HTMLElement {
  const bar = create('li', ['entry-bar']);
  bar.textContent = entry.entry_id;
  bar.dataset.entryId = entry.entry_id;
  listen(bar, 'click', onEntryBarClick);

  const actions = createActionButtons(entry.entry_id);
  bar.appendChild(actions);
  return bar;
}

function createActionButtons(entryId: string): HTMLElement {
  const container = create('div', ['actions']);
  const edit = create('i', ['bi', 'bi-pencil-square']);
  const del = create('i', ['bi', 'bi-trash-fill']);

  listen(edit, 'click', onEditClick);
  listen(del, 'click', onDeleteClick);

  edit.dataset.entryId = entryId;
  del.dataset.entryId = entryId;

  container.append(edit, del);
  return container;
}

function onEntryBarClick(e: MouseEvent): void {
  const id = getEntryId(e);
  const entry = entriesCach.find(e => e.entry_id === id);
  console.log(id)
}

function onEditClick(e: MouseEvent): void {
  e.stopPropagation();

  const id = getEntryId(e);
  const entry = entriesCach.find(e => e.entry_id === id);

  openEntryForm(entry);
}

async function onDeleteClick(e: MouseEvent): Promise<void> {
  e.stopPropagation();
  const id = getEntryId(e);
  const action = await promptUser('Eintrag endgültig löschen?', 'Löschen');

  if (action === 'confirm')
    deleteEntry(id);
}

async function deleteEntry(entryId: number): Promise<void> {
  try {
    const changes = await window.electron.handle('entry:delete', PROJECT, entryId);
    if (!changes) throw new Error();

    renderEntries();
    showMessage('Eintrag erfolgreich gelöscht', 'green');

  } catch (err: unknown) {
    showMessage('Es ist ein Fehler bei der Löschung aufgetreten');
  }
}

function openEntryForm(entry: any): void {
  window.electron.handle('entry-form:open', PROJECT, entry);
}

function getEntryId(e: MouseEvent): number {
  return Number((<HTMLElement>e.currentTarget).dataset.entryId);
}