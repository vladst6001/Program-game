import { useEffect, useRef, useCallback } from 'react';
import * as Blockly from 'blockly';
import 'blockly/blocks';
import { javascriptGenerator } from 'blockly/javascript';

const GAME_BLOCKS: Record<string, any> = {
  event_on_start: {
    init: function (this: Blockly.Block) {
      this.appendDummyInput().appendField('При старте');
      this.appendStatementInput('DO').appendField('выполнить');
      this.setStyle('event_blocks');
      this.setDeletable(false);
      this.setMovable(false);
    },
  },
  event_every_frame: {
    init: function (this: Blockly.Block) {
      this.appendDummyInput().appendField('Каждый кадр');
      this.appendStatementInput('DO').appendField('выполнить');
      this.setStyle('event_blocks');
    },
  },
  event_key_pressed: {
    init: function (this: Blockly.Block) {
      this.appendDummyInput()
        .appendField('Когда нажата клавиша')
        .appendField(new Blockly.FieldDropdown([
          ['W', 'w'], ['A', 'a'], ['S', 's'], ['D', 'd'],
          ['Стрелка ↑', 'arrowup'], ['Стрелка ↓', 'arrowdown'],
          ['Стрелка ←', 'arrowleft'], ['Стрелка →', 'arrowright'],
          ['Пробел', ' '], ['Enter', 'enter'], ['Shift', 'shift'],
        ]), 'KEY');
      this.appendStatementInput('DO').appendField('выполнить');
      this.setStyle('event_blocks');
    },
  },
  event_collision: {
    init: function (this: Blockly.Block) {
      this.appendDummyInput()
        .appendField('При столкновении с')
        .appendField(new Blockly.FieldDropdown([['объектом', 'obj']]), 'TARGET');
      this.appendStatementInput('DO').appendField('выполнить');
      this.setStyle('event_blocks');
    },
  },
  event_hp_below: {
    init: function (this: Blockly.Block) {
      this.appendDummyInput()
        .appendField('Когда HP ниже')
        .appendField(new Blockly.FieldNumber(50, 0, 9999), 'VALUE');
      this.appendStatementInput('DO').appendField('выполнить');
      this.setStyle('event_blocks');
    },
  },

  action_move: {
    init: function (this: Blockly.Block) {
      this.appendValueInput('OBJECT').appendField('Двигать');
      this.appendValueInput('X').appendField('X');
      this.appendValueInput('Y').appendField('Y');
      this.appendValueInput('Z').appendField('Z');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setStyle('action_blocks');
    },
  },
  action_move_to: {
    init: function (this: Blockly.Block) {
      this.appendValueInput('FROM').appendField('Двигать');
      this.appendValueInput('TO').appendField('к объекту');
      this.appendValueInput('SPEED').appendField('скорость');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setStyle('action_blocks');
    },
  },
  action_rotate: {
    init: function (this: Blockly.Block) {
      this.appendValueInput('OBJECT').appendField('Поворачивать');
      this.appendValueInput('ANGLE').appendField('на');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setStyle('action_blocks');
    },
  },
  action_set_hp: {
    init: function (this: Blockly.Block) {
      this.appendValueInput('OBJECT').appendField('Установить HP');
      this.appendValueInput('VALUE').appendField('в');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setStyle('action_blocks');
    },
  },
  action_add_hp: {
    init: function (this: Blockly.Block) {
      this.appendValueInput('OBJECT').appendField('Изменить HP');
      this.appendValueInput('VALUE').appendField('на');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setStyle('action_blocks');
    },
  },
  action_play_sound: {
    init: function (this: Blockly.Block) {
      this.appendDummyInput().appendField('Воспроизвести звук').appendField(new Blockly.FieldDropdown([
        ['Мелодия', 'melody'],
        ['Взрыв', 'explosion'],
        ['Прыжок', 'jump'],
        ['Монета', 'coin'],
        ['Удар', 'hit'],
        ['Победа', 'win'],
        ['Проигрыш', 'lose'],
        ['Клик', 'click'],
      ]), 'SOUND');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setStyle('action_blocks');
    },
  },
  action_show_message: {
    init: function (this: Blockly.Block) {
      this.appendValueInput('TEXT').appendField('Показать сообщение');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setStyle('action_blocks');
    },
  },
  action_hide_message: {
    init: function (this: Blockly.Block) {
      this.appendDummyInput().appendField('Скрыть сообщение');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setStyle('action_blocks');
    },
  },
  action_change_score: {
    init: function (this: Blockly.Block) {
      this.appendValueInput('VALUE').appendField('Изменить счёт на');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setStyle('action_blocks');
    },
  },
  action_show_text: {
    init: function (this: Blockly.Block) {
      this.appendValueInput('TEXT').appendField('Показать текст');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setStyle('action_blocks');
    },
  },
  action_create_object: {
    init: function (this: Blockly.Block) {
      this.appendDummyInput().appendField('Создать').appendField(new Blockly.FieldDropdown([['Куб', 'cube'], ['Сферу', 'sphere'], ['Плоскость', 'plane']]), 'TYPE');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setStyle('action_blocks');
    },
  },
  action_delete_object: {
    init: function (this: Blockly.Block) {
      this.appendValueInput('OBJECT').appendField('Удалить');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setStyle('action_blocks');
    },
  },

  variable_set: {
    init: function (this: Blockly.Block) {
      this.appendDummyInput()
        .appendField('Установить')
        .appendField(new Blockly.FieldVariable('переменная'), 'VAR');
      this.appendValueInput('VALUE').appendField('в');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setStyle('variable_blocks');
    },
  },
  variable_change: {
    init: function (this: Blockly.Block) {
      this.appendDummyInput()
        .appendField('Изменить')
        .appendField(new Blockly.FieldVariable('переменная'), 'VAR');
      this.appendValueInput('VALUE').appendField('на');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setStyle('variable_blocks');
    },
  },
  variable_get: {
    init: function (this: Blockly.Block) {
      this.appendDummyInput()
        .appendField('')
        .appendField(new Blockly.FieldVariable('переменная'), 'VAR');
      this.setOutput(true);
      this.setStyle('variable_blocks');
    },
  },

  condition_hp_above: {
    init: function (this: Blockly.Block) {
      this.appendValueInput('OBJECT').appendField('Если HP');
      this.appendValueInput('VALUE').appendField('>');
      this.appendStatementInput('DO').appendField('выполнить');
      this.setStyle('condition_blocks');
    },
  },
  condition_key_pressed: {
    init: function (this: Blockly.Block) {
      this.appendDummyInput()
        .appendField('Если клавиша')
        .appendField(new Blockly.FieldDropdown([
          ['W', 'w'], ['A', 'a'], ['S', 's'], ['D', 'd'],
          ['Пробел', ' '], ['Enter', 'enter'],
        ]), 'KEY')
        .appendField('нажата');
      this.appendStatementInput('DO').appendField('выполнить');
      this.setStyle('condition_blocks');
    },
  },
  condition_touching: {
    init: function (this: Blockly.Block) {
      this.appendValueInput('OBJECT').appendField('Если касается');
      this.appendStatementInput('DO').appendField('выполнить');
      this.setStyle('condition_blocks');
    },
  },

  loop_repeat: {
    init: function (this: Blockly.Block) {
      this.appendValueInput('COUNT').appendField('Повторить');
      this.appendDummyInput().appendField('раз');
      this.appendStatementInput('DO').appendField('выполнить');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setStyle('loop_blocks');
    },
  },

  value_number: {
    init: function (this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldNumber(0), 'NUM');
      this.setOutput(true, 'Number');
      this.setStyle('value_blocks');
    },
  },
  value_string: {
    init: function (this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldTextInput('текст'), 'TEXT');
      this.setOutput(true, 'String');
      this.setStyle('value_blocks');
    },
  },
  value_get_hp: {
    init: function (this: Blockly.Block) {
      this.appendValueInput('OBJECT').appendField('HP объекта');
      this.setOutput(true, 'Number');
      this.setStyle('value_blocks');
    },
  },
  value_get_pos: {
    init: function (this: Blockly.Block) {
      this.appendValueInput('OBJECT').appendField('Позиция');
      this.appendDummyInput().appendField(new Blockly.FieldDropdown([
        ['X', 'x'], ['Y', 'y'], ['Z', 'z'],
      ]), 'AXIS');
      this.setOutput(true, 'Number');
      this.setStyle('value_blocks');
    },
  },
  value_random: {
    init: function (this: Blockly.Block) {
      this.appendValueInput('MIN').appendField('Случайное число от');
      this.appendValueInput('MAX').appendField('до');
      this.setOutput(true, 'Number');
      this.setStyle('value_blocks');
    },
  },
};

const GENERATORS: Record<string, (block: Blockly.Block) => string | (string | number)[]> = {
  event_on_start: (block) => {
    const stmts = javascriptGenerator.statementToCode(block, 'DO');
    return `function onStart() {\n${stmts}}\n\nonStart();\n`;
  },
  event_every_frame: (block) => {
    const stmts = javascriptGenerator.statementToCode(block, 'DO');
    return `function onFrame() {\n${stmts}}\n\nengine.onUpdate(onFrame);\n`;
  },
  event_key_pressed: (block) => {
    const key = block.getFieldValue('KEY') as string;
    const stmts = javascriptGenerator.statementToCode(block, 'DO');
    return `game.onKey('${key}', function() {\n${stmts}});\n`;
  },
  event_collision: (block) => {
    const stmts = javascriptGenerator.statementToCode(block, 'DO');
    return `game.onCollision(function(other) {\n${stmts}});\n`;
  },
  event_hp_below: (block) => {
    const value = block.getFieldValue('VALUE') as number;
    const stmts = javascriptGenerator.statementToCode(block, 'DO');
    return `game.onHpBelow(${value}, function() {\n${stmts}});\n`;
  },

  action_move: (block) => {
    const obj = javascriptGenerator.valueToCode(block, 'OBJECT', 0) || '"player"';
    const x = javascriptGenerator.valueToCode(block, 'X', 0) || '0';
    const y = javascriptGenerator.valueToCode(block, 'Y', 0) || '0';
    const z = javascriptGenerator.valueToCode(block, 'Z', 0) || '0';
    return `game.move(${obj}, ${x}, ${y}, ${z});\n`;
  },
  action_move_to: (block) => {
    const from = javascriptGenerator.valueToCode(block, 'FROM', 0) || '"player"';
    const to = javascriptGenerator.valueToCode(block, 'TO', 0) || '"target"';
    const speed = javascriptGenerator.valueToCode(block, 'SPEED', 0) || '5';
    return `game.moveTowards(${from}, ${to}, ${speed});\n`;
  },
  action_rotate: (block) => {
    const obj = javascriptGenerator.valueToCode(block, 'OBJECT', 0) || '"player"';
    const angle = javascriptGenerator.valueToCode(block, 'ANGLE', 0) || '90';
    return `game.rotate(${obj}, ${angle});\n`;
  },
  action_set_hp: (block) => {
    const obj = javascriptGenerator.valueToCode(block, 'OBJECT', 0) || '"player"';
    const value = javascriptGenerator.valueToCode(block, 'VALUE', 0) || '100';
    return `game.setHp(${obj}, ${value});\n`;
  },
  action_add_hp: (block) => {
    const obj = javascriptGenerator.valueToCode(block, 'OBJECT', 0) || '"player"';
    const value = javascriptGenerator.valueToCode(block, 'VALUE', 0) || '10';
    return `game.addHp(${obj}, ${value});\n`;
  },
  action_play_sound: (block) => {
    const sound = block.getFieldValue('SOUND');
    return `game.playSound('${sound}');\n`;
  },
  action_show_message: (block) => {
    const text = javascriptGenerator.valueToCode(block, 'TEXT', 0) || '""';
    return `game.showMessage(${text});\n`;
  },
  action_hide_message: () => {
    return `game.hideMessage();\n`;
  },
  action_change_score: (block) => {
    const value = javascriptGenerator.valueToCode(block, 'VALUE', 0) || '1';
    return `game.changeScore(${value});\n`;
  },
  action_show_text: (block) => {
    const text = javascriptGenerator.valueToCode(block, 'TEXT', 0) || '""';
    return `game.showText(${text});\n`;
  },
  action_create_object: (block) => {
    const type = block.getFieldValue('TYPE');
    return `game.createObject('${type}');\n`;
  },
  action_delete_object: (block) => {
    const obj = javascriptGenerator.valueToCode(block, 'OBJECT', 0) || '"object"';
    return `game.deleteObject(${obj});\n`;
  },

  variable_set: (block) => {
    const varName = javascriptGenerator.getVariableName(block.getFieldValue('VAR') as string);
    const value = javascriptGenerator.valueToCode(block, 'VALUE', 0) || '0';
    return `${varName} = ${value};\n`;
  },
  variable_change: (block) => {
    const varName = javascriptGenerator.getVariableName(block.getFieldValue('VAR') as string);
    const value = javascriptGenerator.valueToCode(block, 'VALUE', 0) || '1';
    return `${varName} += ${value};\n`;
  },
  variable_get: (block) => {
    const varName = javascriptGenerator.getVariableName(block.getFieldValue('VAR') as string);
    return [varName, 0];
  },

  condition_hp_above: (block) => {
    const obj = javascriptGenerator.valueToCode(block, 'OBJECT', 0) || '"player"';
    const value = javascriptGenerator.valueToCode(block, 'VALUE', 0) || '50';
    const stmts = javascriptGenerator.statementToCode(block, 'DO');
    return `if (game.getHp(${obj}) > ${value}) {\n${stmts}}\n`;
  },
  condition_key_pressed: (block) => {
    const key = block.getFieldValue('KEY') as string;
    const stmts = javascriptGenerator.statementToCode(block, 'DO');
    return `if (game.isKeyPressed('${key}')) {\n${stmts}}\n`;
  },
  condition_touching: (block) => {
    const obj = javascriptGenerator.valueToCode(block, 'OBJECT', 0) || '"object"';
    const stmts = javascriptGenerator.statementToCode(block, 'DO');
    return `if (game.isTouching(${obj})) {\n${stmts}}\n`;
  },

  loop_repeat: (block) => {
    const count = javascriptGenerator.valueToCode(block, 'COUNT', 0) || '10';
    const stmts = javascriptGenerator.statementToCode(block, 'DO');
    return `for (var i = 0; i < ${count}; i++) {\n${stmts}}\n`;
  },

  value_number: (block) => {
    const num = block.getFieldValue('NUM') as number;
    return [String(num), 0];
  },
  value_string: (block) => {
    const text = block.getFieldValue('TEXT') as string;
    return [`'${text}'`, 0];
  },
  value_get_hp: (block) => {
    const obj = javascriptGenerator.valueToCode(block, 'OBJECT', 0) || '"player"';
    return [`game.getHp(${obj})`, 0];
  },
  value_get_pos: (block) => {
    const obj = javascriptGenerator.valueToCode(block, 'OBJECT', 0) || '"player"';
    const axis = block.getFieldValue('AXIS') as string;
    return [`game.getPosition(${obj}, '${axis}')`, 0];
  },
  value_random: (block) => {
    const min = javascriptGenerator.valueToCode(block, 'MIN', 0) || '0';
    const max = javascriptGenerator.valueToCode(block, 'MAX', 0) || '100';
    return [`game.random(${min}, ${max})`, 0];
  },
};

const TOOLBOX: Blockly.utils.toolbox.ToolboxDefinition = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category', name: 'События', categorystyle: 'event_category',
      contents: [
        { kind: 'block', type: 'event_on_start' },
        { kind: 'block', type: 'event_every_frame' },
        { kind: 'block', type: 'event_key_pressed' },
        { kind: 'block', type: 'event_collision' },
        { kind: 'block', type: 'event_hp_below' },
      ],
    },
    {
      kind: 'category', name: 'Действия', categorystyle: 'action_category',
      contents: [
        { kind: 'block', type: 'action_move' },
        { kind: 'block', type: 'action_move_to' },
        { kind: 'block', type: 'action_rotate' },
        { kind: 'block', type: 'action_set_hp' },
        { kind: 'block', type: 'action_add_hp' },
        { kind: 'block', type: 'action_play_sound' },
        { kind: 'block', type: 'action_show_message' },
        { kind: 'block', type: 'action_hide_message' },
        { kind: 'block', type: 'action_change_score' },
        { kind: 'block', type: 'action_show_text' },
        { kind: 'block', type: 'action_create_object' },
        { kind: 'block', type: 'action_delete_object' },
      ],
    },
    {
      kind: 'category', name: 'Переменные', categorystyle: 'variable_category',
      contents: [
        { kind: 'block', type: 'variable_set' },
        { kind: 'block', type: 'variable_change' },
        { kind: 'block', type: 'variable_get' },
      ],
    },
    {
      kind: 'category', name: 'Условия', categorystyle: 'condition_category',
      contents: [
        { kind: 'block', type: 'condition_hp_above' },
        { kind: 'block', type: 'condition_key_pressed' },
        { kind: 'block', type: 'condition_touching' },
      ],
    },
    {
      kind: 'category', name: 'Циклы', categorystyle: 'loop_category',
      contents: [
        { kind: 'block', type: 'loop_repeat' },
      ],
    },
    {
      kind: 'category', name: 'Значения', categorystyle: 'value_category',
      contents: [
        { kind: 'block', type: 'value_number' },
        { kind: 'block', type: 'value_string' },
        { kind: 'block', type: 'value_get_hp' },
        { kind: 'block', type: 'value_get_pos' },
        { kind: 'block', type: 'value_random' },
      ],
    },
  ],
};

const THEME = Blockly.Theme.defineTheme('gameTheme', {
  name: 'gameTheme',
  base: Blockly.Themes.Classic,
  blockStyles: {
    event_blocks: { colourPrimary: '#39ff14', colourSecondary: '#1a3d0a', colourTertiary: '#0d1f05', hat: '' },
    action_blocks: { colourPrimary: '#00f0ff', colourSecondary: '#003d40', colourTertiary: '#001f20' },
    value_blocks: { colourPrimary: '#bf00ff', colourSecondary: '#3d0052', colourTertiary: '#1f0029' },
    variable_blocks: { colourPrimary: '#ffaa00', colourSecondary: '#4d3300', colourTertiary: '#261a00' },
    condition_blocks: { colourPrimary: '#ff3366', colourSecondary: '#4d0f1e', colourTertiary: '#260810' },
    loop_blocks: { colourPrimary: '#00ff88', colourSecondary: '#004d2a', colourTertiary: '#002615' },
  },
  categoryStyles: {
    event_category: { colour: '#39ff14' },
    action_category: { colour: '#00f0ff' },
    value_category: { colour: '#bf00ff' },
    variable_category: { colour: '#ffaa00' },
    condition_category: { colour: '#ff3366' },
    loop_category: { colour: '#00ff88' },
  },
  componentStyles: {
    workspaceBackgroundColour: '#0a0a0f',
    toolboxBackgroundColour: '#12121a',
    flyoutBackgroundColour: '#1a1a25',
    scrollbarColour: '#353548',
  },
});

interface Props {
  onCodeGenerated: (code: string) => void;
}

export default function BlocklyWorkspace({ onCodeGenerated }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);

  const generateAllCode = useCallback((ws: Blockly.WorkspaceSvg) => {
    for (const [name, fn] of Object.entries(GENERATORS)) {
      (javascriptGenerator.forBlock as any)[name] = fn;
    }
    return javascriptGenerator.workspaceToCode(ws);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    Object.entries(GAME_BLOCKS).forEach(([name, def]) => {
      if (!Blockly.Blocks[name]) {
        Blockly.Blocks[name] = def;
      }
    });

    const ws = Blockly.inject(containerRef.current, {
      toolbox: TOOLBOX,
      theme: THEME,
      grid: { spacing: 20, length: 3, colour: '#252532', snap: true },
      zoom: { controls: true, wheel: true, startScale: 1 },
      trashcan: true,
    });

    workspaceRef.current = ws;

    ws.addChangeListener(() => {
      const code = generateAllCode(ws);
      onCodeGenerated(code);
    });

    return () => { ws.dispose(); };
  }, [generateAllCode, onCodeGenerated]);

  return <div ref={containerRef} className="w-full h-full" />;
}
