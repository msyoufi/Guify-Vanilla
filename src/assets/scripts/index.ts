import { listen, create, get, showMessage, promptUser } from "./utils.js";

let projectsCach: GuifyProject[] = [];
const projectsContainer = <HTMLDivElement>get('projects_container');
const nameInput = <HTMLInputElement>get('name_input');
const nameInputBox = <HTMLInputElement>get('name_input_box');

window.electron.recieve('project:data', renderProjects);

renderProjects();

async function renderProjects(): Promise<void> {
  projectsCach = await window.electron.handle<GuifyProject[]>('project:get-all');
  projectsContainer.innerHTML = '';

  for (const project of projectsCach)
    projectsContainer.append(createProjectElement(project));
}

function createProjectElement(project: GuifyProject): HTMLElement {
  const projectId = project.id.toString();

  const projectBar = create('div', ['project-bar']);
  const actions = create('div', ['actions']);
  const del = create('i', ['bi', 'bi-trash-fill']);

  if (project.production) projectBar.classList.add('prod');

  listen(projectBar, 'click', onProjectBarClick);
  listen(del, 'click', onDeleteClick);

  projectBar.innerHTML = `<span>${project.name}</span>`;
  projectBar.dataset.projectId = projectId;
  del.dataset.projectId = projectId;

  actions.append(del);
  projectBar.appendChild(actions);

  return projectBar;
}

listen('new_project_btn', 'click', showNameBox);
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

  const projectName = nameInput.value;
  if (!projectName) return;

  const invalid = !/^[a-zA-Z_][a-zA-Z0-9_ ]*$/.test(projectName) || checkNameExists(projectName);

  if (invalid)
    nameInput.classList.add('invalid');
  else
    nameInput.classList.remove('invalid');

  if (e.code === 'Enter') {
    if (invalid) return showMessage('Projektname unzulässig oder bereits vergeben!');

    try {
      await window.electron.handle<number>('project:insert', projectName);
      hideNameBox();
      renderProjects();

    } catch (err: unknown) {
      showMessage('Es ist ein Fehler bei der Erstellung des Projekts aufgetreten!');
    }
  }
}

function checkNameExists(projectName: string): boolean {
  if (projectsCach.findIndex(p => p.name === projectName) > -1)
    return true;

  return false;
}

function onProjectBarClick(e: MouseEvent): void {
  const project = getProject(e);
  window.electron.handle<void>('project:open', project);
}

async function onDeleteClick(e: MouseEvent): Promise<void> {
  e.stopPropagation();
  const project = getProject(e);
  const action = await promptUser(`${project.name} endgütlig löschen?`, 'Löschen');

  if (action === 'confirm')
    deleteProject(project);
}

async function deleteProject(project: GuifyProject): Promise<void> {
  try {
    await window.electron.handle<void>('project:delete', project);
    showMessage(`Projekt ${project.name} samt dessen Daten endgütlig gelöscht`);
    renderProjects();

  } catch (err: unknown) {
    showMessage('Es ist ein Fehler bei der Löschung aufgetreten');
  }
}

function getProject(e: MouseEvent): GuifyProject {
  const project_id = Number((<HTMLElement>e.currentTarget).dataset.projectId);
  return projectsCach.find(p => p.id === project_id) as GuifyProject;
}