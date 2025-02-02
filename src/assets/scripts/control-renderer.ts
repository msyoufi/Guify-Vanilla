import { create } from "./utils.js";

export function createControlElement(control: FormControl): HTMLElement {
  const formControl = create('div', ['form-control']);

  switch (control.guify_ctrl_type) {
    case 'text':
    case 'number':
    case 'date':
    case 'time':
      formControl.innerHTML = createTextInput(control);
      break;
    case 'textArea':
      formControl.innerHTML = createTextArea(control);
      break;
    case 'select':
      formControl.innerHTML = createSelectInput(control);
      break;
    case 'checkbox':
    case 'radio':
      formControl.innerHTML = createMcInput(control);
  }

  return formControl;
}

function createTextInput(ctrl: FormControl): string {
  return `
    ${createLabel(ctrl)}
    <input type="${ctrl.guify_ctrl_type}" class="guify-input" id="${ctrl.guify_ctrl_name}" name="${ctrl.guify_ctrl_name}">
  `;
}

function createTextArea(ctrl: FormControl): string {
  return `
    ${createLabel(ctrl)}
    <textarea class="guify-input" id="${ctrl.guify_ctrl_name}" name="${ctrl.guify_ctrl_name}"></textarea>
  `;
}

function createSelectInput(ctrl: FormControl): string {
  return `
    ${createLabel(ctrl)}
    <select class="guify-input" id="${ctrl.guify_ctrl_name}" name="${ctrl.guify_ctrl_name}">
      <option value="" hidden selected disabled></option>
      ${ctrl.guify_ctrl_choices.map(choice => `<option value="${choice.ch_value}">${choice.ch_label}</option>`).join('')}
    </select>
  `;
}

function createMcInput(ctrl: FormControl): string {
  return `
    ${createLabel(ctrl)}
    <div class="radios-wrapper">
      ${ctrl.guify_ctrl_choices.map(choice => {
    return `
      <div class="radio-container">
        <input type="${ctrl.guify_ctrl_type}" name="${ctrl.guify_ctrl_name}" value="${choice.ch_value}" id="${ctrl.guify_ctrl_name}_${choice.ch_value}">
        <label for="${ctrl.guify_ctrl_name}_${choice.ch_value}">${choice.ch_label}</label>
      </div>
    `}).join('')}
    </div>
  `;
}

function createLabel(ctrl: FormControl): string {
  return `
    <div class="tool-bar">
      <span class="var-name">Vaiable: ${ctrl.guify_ctrl_name}${ctrl.guify_ctrl_required ? '*' : ''}</span>
    </div>
    <label for="${ctrl.guify_ctrl_name}">${ctrl.guify_ctrl_label}</label>
  `;
}

