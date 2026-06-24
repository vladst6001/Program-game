import { useEffect, useRef, useCallback } from 'react';
import * as Blockly from 'blockly';
import 'blockly/blocks';
import { javascriptGenerator } from 'blockly/javascript';
import { useEditorStore } from '../../store/editorStore';

const GAME_BLOCKS = {
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
      this.setDeletable(false);
    },
  },
  action_move: {
    init: function (this: Blockly.Block) {
      this.appendValueInput('OBJECT').appendField('Двигать');
      this.appendValueInput('X').appendField('на X');
      this.appendValueInput('Y').appendField('Y');
      this.appendValueInput('Z').appendField('Z');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setStyle('action_blocks');
    },
  },
  action_rotate: {
    init: function (this: Blockly.Block) {
      this.appendValueInput('OBJECT').appendField('Поворачивать');
      this.appendValueInput('X').appendField('на X');
      this.appendValueInput('Y').appendField('Y');
      this.appendValueInput('Z').appendField('Z');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setStyle('action_blocks');
    },
  },
  condition_touch: {
    init: function (this: Blockly.Block) {
      this.appendValueInput('OBJECT').appendField('Если коснулся');
      this.appendStatementInput('DO').appendField('выполнить');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setStyle('condition_blocks');
    },
  },
  condition_key: {
    init: function (this: Blockly.Block) {
      this.appendDummyInput()
        .appendField('Если нажата клавиша')
        .appendField(new Blockly.FieldDropdown([
          ['Пробел', 'Space'],
          ['Стрелка влево', 'ArrowLeft'],
          ['Стрелка вправо', 'ArrowRight'],
          ['Стрелка вверх', 'ArrowUp'],
          ['Стрелка вниз', 'ArrowDown'],
          ['Enter', 'Enter'],
          ['W', 'KeyW'],
          ['A', 'KeyA'],
          ['S', 'KeyS'],
          ['D', 'KeyD'],
        ]), 'KEY');
      this.appendStatementInput('DO').appendField('выполнить');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setStyle('condition_blocks');
    },
  },
  action_play_sound: {
    init: function (this: Blockly.Block) {
      this.appendDummyInput()
        .appendField('Воспроизвести звук')
        .appendField(new Blockly.FieldTextInput('jump'), 'NAME');
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
      this.appendDummyInput()
        .appendField('Создать объект')
        .appendField(new Blockly.FieldDropdown([
          ['Куб', 'cube'],
          ['Сфера', 'sphere'],
          ['Цилиндр', 'cylinder'],
          ['Плоскость', 'plane'],
        ]), 'TYPE');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setStyle('action_blocks');
    },
  },
  action_delete_object: {
    init: function (this: Blockly.Block) {
      this.appendValueInput('OBJECT').appendField('Удалить объект');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setStyle('action_blocks');
    },
  },
  action_set_position: {
    init: function (this: Blockly.Block) {
      this.appendValueInput('OBJECT').appendField('Установить позицию');
      this.appendValueInput('X').appendField('X');
      this.appendValueInput('Y').appendField('Y');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setStyle('action_blocks');
    },
  },
  value_get_position: {
    init: function (this: Blockly.Block) {
      this.appendValueInput('OBJECT').appendField('Получить позицию');
      this.setOutput(true, 'Array');
      this.setStyle('value_blocks');
    },
  },
  value_object_name: {
    init: function (this: Blockly.Block) {
      this.appendDummyInput()
        .appendField(new Blockly.FieldTextInput('player'), 'NAME');
      this.setOutput(true, 'String');
      this.setStyle('value_blocks');
    },
  },
  value_number: {
    init: function (this: Blockly.Block) {
      this.appendDummyInput()
        .appendField(new Blockly.FieldNumber(0), 'NUM');
      this.setOutput(true, 'Number');
      this.setStyle('value_blocks');
    },
  },
  value_string: {
    init: function (this: Blockly.Block) {
      this.appendDummyInput()
        .appendField('"')
        .appendField(new Blockly.FieldTextInput('текст'), 'TEXT')
        .appendField('"');
      this.setOutput(true, 'String');
      this.setStyle('value_blocks');
    },
  },
};

const THEME = Blockly.Theme.defineTheme('game_theme', {
  name: 'game_theme',
  base: Blockly.Themes.Classic,
  blockStyles: {
    event_blocks: { colourPrimary: '#00ff88', colourSecondary: '#00cc6a', colourTertiary: '#00994f', hat: 'cap' },
    action_blocks: { colourPrimary: '#0066ff', colourSecondary: '#0052cc', colourTertiary: '#003d99' },
    condition_blocks: { colourPrimary: '#ff6600', colourSecondary: '#cc5200', colourTertiary: '#993d00' },
    value_blocks: { colourPrimary: '#cc00ff', colourSecondary: '#a300cc', colourTertiary: '#7a0099' },
  },
  categoryStyles: {
    event_category: { colour: '#00ff88' },
    action_category: { colour: '#0066ff' },
    condition_category: { colour: '#ff6600' },
    value_category: { colour: '#cc00ff' },
  },
  componentStyles: {
    workspaceBackgroundColour: '#0a0f1a',
    toolboxBackgroundColour: '#1a1f2e',
    flyoutBackgroundColour: '#151a28',
    scrollbarColour: '#2a3040',
    insertionMarkerColour: '#00ff88',
  },
  fontStyle: { family: 'monospace', weight: 'bold', size: 11 },
});

const TOOLBOX: Blockly.utils.toolbox.ToolboxDefinition = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'События',
      categorystyle: 'event_category',
      contents: [
        { kind: 'block', type: 'event_on_start' },
        { kind: 'block', type: 'event_every_frame' },
      ],
    },
    {
      kind: 'category',
      name: 'Действия',
      categorystyle: 'action_category',
      contents: [
        { kind: 'block', type: 'action_move' },
        { kind: 'block', type: 'action_rotate' },
        { kind: 'block', type: 'action_play_sound' },
        { kind: 'block', type: 'action_show_text' },
        { kind: 'block', type: 'action_create_object' },
        { kind: 'block', type: 'action_delete_object' },
        { kind: 'block', type: 'action_set_position' },
      ],
    },
    {
      kind: 'category',
      name: 'Условия',
      categorystyle: 'condition_category',
      contents: [
        { kind: 'block', type: 'condition_touch' },
        { kind: 'block', type: 'condition_key' },
      ],
    },
    {
      kind: 'category',
      name: 'Переменные',
      categorystyle: 'value_category',
      contents: [
        { kind: 'block', type: 'value_object_name' },
        { kind: 'block', type: 'value_number' },
        { kind: 'block', type: 'value_string' },
        { kind: 'block', type: 'value_get_position' },
      ],
    },
  ],
};

const GENERATORS: Record<string, (block: Blockly.Block) => string | (string | number)[]> = {
  event_on_start: (block) => {
    const stmts = javascriptGenerator.statementToCode(block, 'DO');
    return `// === При старте ===\nfunction onStart() {\n${stmts}}\n\nonStart();\n`;
  },
  event_every_frame: (block) => {
    const stmts = javascriptGenerator.statementToCode(block, 'DO');
    return `// === Каждый кадр ===\nfunction onFrame() {\n${stmts}}\n\nengine.onUpdate(onFrame);\n`;
  },
  action_move: (block) => {
    const obj = javascriptGenerator.valueToCode(block, 'OBJECT', 0) || '"player"';
    const x = javascriptGenerator.valueToCode(block, 'X', 0) || '0';
    const y = javascriptGenerator.valueToCode(block, 'Y', 0) || '0';
    const z = javascriptGenerator.valueToCode(block, 'Z', 0) || '0';
    return `game.move(${obj}, ${x}, ${y}, ${z});\n`;
  },
  action_rotate: (block) => {
    const obj = javascriptGenerator.valueToCode(block, 'OBJECT', 0) || '"player"';
    const x = javascriptGenerator.valueToCode(block, 'X', 0) || '0';
    const y = javascriptGenerator.valueToCode(block, 'Y', 0) || '0';
    const z = javascriptGenerator.valueToCode(block, 'Z', 0) || '0';
    return `game.rotate(${obj}, ${x}, ${y}, ${z});\n`;
  },
  condition_touch: (block) => {
    const obj = javascriptGenerator.valueToCode(block, 'OBJECT', 0) || '"wall"';
    const stmts = javascriptGenerator.statementToCode(block, 'DO');
    return `if (game.touches(${obj})) {\n${stmts}}\n`;
  },
  condition_key: (block) => {
    const key = block.getFieldValue('KEY') as string;
    const stmts = javascriptGenerator.statementToCode(block, 'DO');
    return `if (engine.isKeyPressed('${key}')) {\n${stmts}}\n`;
  },
  action_play_sound: (block) => {
    const name = block.getFieldValue('NAME') as string;
    return `game.playSound('${name}');\n`;
  },
  action_show_text: (block) => {
    const text = javascriptGenerator.valueToCode(block, 'TEXT', 0) || '"Hello"';
    return `game.showText(${text});\n`;
  },
  action_create_object: (block) => {
    const type = block.getFieldValue('TYPE') as string;
    return `game.createObject('${type}');\n`;
  },
  action_delete_object: (block) => {
    const obj = javascriptGenerator.valueToCode(block, 'OBJECT', 0) || '"object"';
    return `game.deleteObject(${obj});\n`;
  },
  action_set_position: (block) => {
    const obj = javascriptGenerator.valueToCode(block, 'OBJECT', 0) || '"player"';
    const x = javascriptGenerator.valueToCode(block, 'X', 0) || '0';
    const y = javascriptGenerator.valueToCode(block, 'Y', 0) || '0';
    return `game.setPosition(${obj}, ${x}, ${y});\n`;
  },
  value_get_position: (block) => {
    const obj = javascriptGenerator.valueToCode(block, 'OBJECT', 0) || '"player"';
    return [`game.getPosition(${obj})`, 0];
  },
  value_object_name: (block) => {
    const name = block.getFieldValue('NAME') as string;
    return [`'${name}'`, 0];
  },
  value_number: (block) => {
    const num = block.getFieldValue('NUM') as number;
    return [String(num), 0];
  },
  value_string: (block) => {
    const text = block.getFieldValue('TEXT') as string;
    return [`'${text}'`, 0];
  },
};

interface BlocklyWorkspaceProps {
  onCodeGenerated?: (code: string) => void;
}

export default function BlocklyWorkspace({ onCodeGenerated }: BlocklyWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const setGameCode = useEditorStore((s) => s.setGameCode);

  const generateCode = useCallback(() => {
    const ws = workspaceRef.current;
    if (!ws) return '';

    for (const [name, fn] of Object.entries(GENERATORS)) {
      (javascriptGenerator.forBlock as any)[name] = fn;
    }

    javascriptGenerator.forBlock['controls_if'] = (block) => {
      const condition = javascriptGenerator.valueToCode(block, 'IF0', 0) || 'true';
      const stmts = javascriptGenerator.statementToCode(block, 'DO0');
      return `if (${condition}) {\n${stmts}}\n`;
    };

    const code = javascriptGenerator.workspaceToCode(ws);
    return code;
  }, []);

  const saveCode = useCallback(() => {
    const code = generateCode();
    if (code) {
      setGameCode({ script: code, source: 'blockly' });
      onCodeGenerated?.(code);
    }
  }, [generateCode, setGameCode, onCodeGenerated]);

  useEffect(() => {
    if (!containerRef.current) return;

    const ws = Blockly.inject(containerRef.current, {
      toolbox: TOOLBOX,
      theme: THEME,
      renderer: 'zelos',
      grid: { spacing: 20, length: 3, colour: '#1a2030', snap: true },
      zoom: { controls: true, wheel: true, startScale: 1.0, maxScale: 3, minScale: 0.3, scaleSpeed: 1.2 },
      trashcan: true,
      move: { scrollbars: true, drag: true, wheel: true },
      sounds: false,
    });

    workspaceRef.current = ws;

    const eventOnStart = ws.newBlock('event_on_start');
    eventOnStart.initSvg();
    eventOnStart.render();
    eventOnStart.moveBy(20, 20);

    ws.addChangeListener(() => {
      saveCode();
    });

    return () => {
      ws.dispose();
      workspaceRef.current = null;
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full" />
  );
}
