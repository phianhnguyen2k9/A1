const fs = require('fs');
const ts = require('typescript');
const text = fs.readFileSync('src/App.tsx','utf8');
const sf = ts.createSourceFile('App.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
for (const e of sf.parseDiagnostics) {
  const pos = sf.getLineAndCharacterOfPosition(e.start);
  console.log('line', pos.line + 1, 'col', pos.character + 1, 'code', e.code, 'msg', ts.flattenDiagnosticMessageText(e.messageText, '\n'));
}
