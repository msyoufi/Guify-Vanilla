import { create } from "./utils.js";

export function createControlElement(control: FormControl): HTMLElement {
  const wrapper = create('div', ['control-wrapper']);
  const container = create('div', ['form-control']);
  const placeholder = create('div');

  switch (control.guify_ctrl_type) {
    case 'text':
    case 'number':
    case 'date':
    case 'time':
      container.innerHTML = createTextInput(control);
      break;
    case 'textArea':
      container.innerHTML = createTextArea(control);
      break;
    case 'select':
      container.innerHTML = createSelectInput(control);
      break;
    case 'checkbox':
    case 'radio':
      container.innerHTML = createMcInput(control);
  }

  wrapper.append(placeholder, container);
  return wrapper;
}

function createTextInput(ctrl: FormControl): string {
  return `
    <label for="${ctrl.guify_ctrl_name}">${ctrl.guify_ctrl_label}${ctrl.guify_ctrl_required ? ' *' : ''}</label>
    <input type="${ctrl.guify_ctrl_type}" class="guify-input" id="${ctrl.guify_ctrl_name}" name="${ctrl.guify_ctrl_name}">
  `;
}

function createTextArea(ctrl: FormControl): string {
  return `
    <label for="${ctrl.guify_ctrl_name}">${ctrl.guify_ctrl_label}${ctrl.guify_ctrl_required ? ' *' : ''}</label>
    <textarea class="guify-input" id="${ctrl.guify_ctrl_name}" name="${ctrl.guify_ctrl_name}"></textarea>
  `;
}

function createSelectInput(ctrl: FormControl): string {
  return `
    <label for="${ctrl.guify_ctrl_name}">${ctrl.guify_ctrl_label}${ctrl.guify_ctrl_required ? ' *' : ''}</label>
    <select class="guify-input" id="${ctrl.guify_ctrl_name}" name="${ctrl.guify_ctrl_name}">
      <option value="" hidden selected disabled></option>
      ${ctrl.guify_ctrl_choices.map(choice => `<option value="${choice.chValue}">${choice.chLabel}</option>`).join('')}
    </select>
  `;
}

function createMcInput(ctrl: FormControl): string {
  return `
    <label for="${ctrl.guify_ctrl_name}">${ctrl.guify_ctrl_label}${ctrl.guify_ctrl_required ? ' *' : ''}</label>
    <div class="radios-wrapper">
      ${ctrl.guify_ctrl_choices.map(choice => {
    return `
      <div class="radio-container">
        <input type="${ctrl.guify_ctrl_type}" name="${ctrl.guify_ctrl_name}" value="${choice.chValue}" id="${ctrl.guify_ctrl_name}_${choice.chValue}">
        <label for="${ctrl.guify_ctrl_name}_${choice.chValue}">${choice.chLabel}</label>
      </div>
    `}).join('')}
    </div>
  `;
}