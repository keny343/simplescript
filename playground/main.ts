import { run, tokenize, parse } from '@ss/index.ts';
import { SimpleScriptError } from '@ss/errors.ts';

const SAMPLES: Record<string, string> = {
  hello: `let x = 10;
let y = x + 20;
print(y);
`,
  factorial: `// Control flow
let n = 5;
let fact = 1;
while (n > 0) {
  fact = fact * n;
  n = n - 1;
}
print(fact);

if (fact == 120) {
  print("factorial ok");
} else {
  print("factorial failed");
}
`,
  functions: `fun add(a, b) {
  return a + b;
}

fun greet(name) {
  print("Hello, " + name);
}

let sum = add(10, 32);
print(sum);
greet("SimpleScript");
`,
  logic: `let a = true;
let b = false;

if (a and not b) {
  print("logic ok");
}

print(1 < 2);
print("hi" + " " + "there");
`,
};

function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Elemento em falta: #${id}`);
  return el;
}

const sourceEl = $('source') as HTMLTextAreaElement;
const sampleEl = $('sample') as HTMLSelectElement;
const runBtn = $('run') as HTMLButtonElement;
const outputEl = $('output') as HTMLPreElement;
const tokensEl = $('tokens') as HTMLPreElement;
const astEl = $('ast') as HTMLPreElement;

function loadSample(name: string) {
  sourceEl.value = SAMPLES[name] ?? SAMPLES.hello;
}

function showTab(name: string) {
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('active', (tab as HTMLElement).dataset.tab === name);
  });
  document.querySelectorAll('.view').forEach((view) => {
    const el = view as HTMLElement;
    const on = el.id === name;
    el.hidden = !on;
    el.classList.toggle('active', on);
  });
}

function execute() {
  const source = sourceEl.value;
  outputEl.classList.remove('ok', 'err');
  tokensEl.textContent = '';
  astEl.textContent = '';

  try {
    const tokens = tokenize(source);
    const { ast } = parse(source);
    const result = run(source);

    tokensEl.textContent = JSON.stringify(tokens, null, 2);
    astEl.textContent = JSON.stringify(ast, null, 2);

    outputEl.textContent = result.output.length
      ? result.output.join('\n')
      : '(sem output — usa print(...))';
    outputEl.classList.add('ok');
    showTab('output');
  } catch (err) {
    const message =
      err instanceof SimpleScriptError
        ? err.message
        : err instanceof Error
          ? err.message
          : String(err);
    outputEl.textContent = message;
    outputEl.classList.add('err');
    showTab('output');
  }
}

sampleEl.addEventListener('change', () => {
  loadSample(sampleEl.value);
  execute();
});

runBtn.addEventListener('click', (e) => {
  e.preventDefault();
  execute();
});

sourceEl.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    execute();
  }
});

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    const name = (tab as HTMLElement).dataset.tab;
    if (name) showTab(name);
  });
});

loadSample('hello');
execute();
