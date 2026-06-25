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
  action_play_sound: {
    init: function (this: Blockly.Block) {
      this.appendDummyInput().appendField('Воспроизвести звук').appendField(new Blockly.FieldDropdown([['Звук 1', 's1'], ['Звук 2', 's2']]), 'SOUND');
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
  action_play_sound: (block) => {
    const sound = block.getFieldValue('SOUND');
    return `game.playSound('${sound}');\n`;
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
  value_number: (block) => {
    const num = block.getFieldValue('NUM') as number;
    return [String(num), 0];
  },
  value_string: (block) => {
    const text = block.getFieldValue('TEXT') as string;
    return [`'${text}'`, 0];
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
      ],
    },
    {
      kind: 'category', name: 'Действия', categorystyle: 'action_category',
      contents: [
        { kind: 'block', type: 'action_move' },
        { kind: 'block', type: 'action_move_to' },
        { kind: 'block', type: 'action_rotate' },
        { kind: 'block', type: 'action_play_sound' },
        { kind: 'block', type: 'action_show_text' },
        { kind: 'block', type: 'action_create_object' },
        { kind: 'block', type: 'action_delete_object' },
      ],
    },
    {
      kind: 'category', name: 'Значения', categorystyle: 'value_category',
      contents: [
        { kind: 'block', type: 'value_number' },
        { kind: 'block', type: 'value_string' },
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
  },
  categoryStyles: {
    event_category: { colour: '#39ff14' },
    action_category: { colour: '#00f0ff' },
    value_category: { colour: '#bf00ff' },
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
