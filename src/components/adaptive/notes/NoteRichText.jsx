import React, { useEffect, useMemo, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import '@/components/adaptive/notes/note-rich-text.css';

const formats = ['header', 'bold', 'italic', 'underline', 'list'];
const tools = [['header', 'Heading style'], ['bold', 'Bold'], ['italic', 'Italic'], ['underline', 'Underline'], ['list[value="ordered"]', 'Numbered list'], ['list[value="bullet"]', 'Bulleted list'], ['list[value="check"]', 'Checklist'], ['clean', 'Clear formatting']];
const modules = {
  toolbar: [[{ header: [1, 2, 3, false] }], ['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }], ['clean']],
  keyboard: { bindings: { toggleChecklist: { key: 'Enter', shortKey: true, format: ['list'], handler(range, context) {
    const list = context.format.list;
    if (list !== 'checked' && list !== 'unchecked') return true;
    this.quill.formatLine(range.index, 1, 'list', list === 'checked' ? 'unchecked' : 'checked', 'user');
    return false;
  } } } },
};

export default function NoteRichText({ body, format, onChange, onBlur }) {
  const editor = useRef(null);
  const value = useMemo(() => {
    if (format === 'rich') {
      try {
        const ops = JSON.parse(body);
        if (Array.isArray(ops) && ops.length && ops.every(op => typeof op?.insert === 'string')) return { ops: ops.map(({ insert, attributes }) => {
          const safe = Object.fromEntries(['bold', 'italic', 'underline'].filter(key => attributes?.[key] === true).map(key => [key, true]));
          if ([1, 2, 3].includes(attributes?.header)) safe.header = attributes.header;
          if (['ordered', 'bullet', 'checked', 'unchecked'].includes(attributes?.list)) safe.list = attributes.list;
          return Object.keys(safe).length ? { insert, attributes: safe } : { insert };
        }) };
      } catch { /* Show unreadable content as plain text rather than discarding it. */ }
    }
    return { ops: [{ insert: body.endsWith('\n') ? body : `${body}\n` }] };
  }, [body, format]);
  useEffect(() => {
    const quill = editor.current.getEditor();
    quill.root.setAttribute('aria-label', 'Note text');
    quill.root.setAttribute('role', 'textbox');
    quill.root.setAttribute('aria-multiline', 'true');
    const toolbar = quill.getModule('toolbar').container;
    toolbar.setAttribute('role', 'group');
    toolbar.setAttribute('aria-label', 'Note formatting');
    tools.forEach(([selector, label]) => toolbar.querySelectorAll(`.ql-${selector}`).forEach(control => { control.setAttribute('aria-label', label); control.title = label; }));
  }, []);
  return <div className="note-rich-text mt-4"><ReactQuill ref={editor} theme="snow" value={value} formats={formats} modules={modules} placeholder="Start writing your note…" onBlur={onBlur}
    onChange={(_html, _delta, source, view) => { if (source === 'user') onChange({ body: JSON.stringify(view.getContents().ops), body_format: 'rich' }); }} />
    <p className="mt-2 text-xs text-muted-foreground">Use Checklist in the toolbar, then click a box or press Ctrl/⌘ + Enter on its line to tick it off.</p>
  </div>;
}