// ===========================================================================
// Java Code Visualizer & Stepper - script.js
// Complete client-side Java Lexer, Parser, Interpreter, Tracer & Visualizer
// ===========================================================================

const isBrowser = typeof document !== "undefined";
const notesText = isBrowser ? document.querySelector("#notesText") : null;
const syntaxCode = isBrowser ? document.querySelector("#syntaxHighlight code") : null;
const traceCode = isBrowser ? document.querySelector("#traceCode") : null;
const editorLineNumbers = isBrowser ? document.querySelector("#editorLineNumbers") : null;
const scratchEditor = isBrowser ? document.querySelector(".scratch-editor") : null;
const editorTabsContainer = isBrowser ? document.querySelector("#editorTabs") : null;
const addTabButton = isBrowser ? document.querySelector("#addTabButton") : null;
const resetButton = isBrowser ? document.querySelector("#resetButton") : null;

const runButton = isBrowser ? document.querySelector("#runScratchButton") : null;
const visualizeButton = isBrowser ? document.querySelector("#visualizeScratchButton") : null;
const exitTutorButton = isBrowser ? document.querySelector("#exitTutorButton") : null;

const tutorPanel = isBrowser ? document.querySelector("#tutorPanel") : null;
const idlePanel = isBrowser ? document.querySelector("#idlePanel") : null;
const tutorStepCount = isBrowser ? document.querySelector("#tutorStepCount") : null;
const tutorLineLabel = isBrowser ? document.querySelector("#tutorLineLabel") : null;
const tutorStatus = isBrowser ? document.querySelector("#tutorStatus") : null;
const tutorSlider = isBrowser ? document.querySelector("#tutorStepSlider") : null;
const tutorPrev = isBrowser ? document.querySelector("#tutorPrevButton") : null;
const tutorNext = isBrowser ? document.querySelector("#tutorNextButton") : null;
const tutorNextIter = isBrowser ? document.querySelector("#tutorNextIterationButton") : null;
const tutorFirst = isBrowser ? document.querySelector("#tutorFirstButton") : null;
const tutorLast = isBrowser ? document.querySelector("#tutorLastButton") : null;
const tutorFrames = isBrowser ? document.querySelector("#tutorFrames") : null;
const tutorHeap = isBrowser ? document.querySelector("#tutorHeap") : null;
const tutorMemoryLayout = isBrowser ? document.querySelector("#tutorMemoryLayout") : null;
const tutorListView = isBrowser ? document.querySelector("#tutorListView") : null;
const tutorListLegend = isBrowser ? document.querySelector("#tutorListLegend") : null;
const tutorListCanvas = isBrowser ? document.querySelector("#tutorListCanvas") : null;
const tutorMemoryViewButton = isBrowser ? document.querySelector("#tutorMemoryViewButton") : null;
const tutorListViewButton = isBrowser ? document.querySelector("#tutorListViewButton") : null;

const consoleHeading = isBrowser ? document.querySelector("#consoleHeading") : null;
const scratchConsole = isBrowser ? document.querySelector("#scratchConsole") : null;
const stdinText = isBrowser ? document.querySelector("#stdinText") : null;
const clearScratchConsole = isBrowser ? document.querySelector("#clearScratchConsole") : null;

const INITIAL_CODE_TAB_1 = `public class Main {
    public static void main(String[] args) {
        String student = "Bob";
        System.out.println(student);

        String[] students = {"Bob", "Alice", "Norb"};
        for (String s : students) {
            System.out.println(s);
        }

        System.out.println("Finished!");
    }
}`;

let tabs = [];
let activeTabId = null;
let tabCounter = 0;

// ---------------------------------------------------------------------------
// HTML & Syntax Highlighting
// ---------------------------------------------------------------------------

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function highlightJava(source) {
  const escaped = escapeHtml(source);
  // Match comments, strings, chars, keywords, builtins, and numbers
  const pattern = /(\/\/[^\r\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|\b(public|private|protected|class|interface|extends|implements|static|final|abstract|void|int|double|float|boolean|char|byte|short|long|String|Integer|Double|Boolean|Character|List|ArrayList|Map|HashMap|Set|HashSet|Queue|Deque|ArrayDeque|LinkedList|Stack|StringBuilder|new|if|else|for|while|do|return|break|continue|this|null|true|false|instanceof|switch|case|default|try|catch|finally|throw|throws|import|package|yield)\b|\b(System|out|println|print|printf|format|Math|Arrays|Collections|Scanner|Random)\b|(\b\d+(?:\.\d+)?[fFdDlL]?\b)/gm;

  return escaped.replace(pattern, (match, comment, string, keyword, builtin, number) => {
    if (comment) return `<span class="syntax-comment">${comment}</span>`;
    if (string) return `<span class="syntax-string">${string}</span>`;
    if (keyword) return `<span class="syntax-keyword">${keyword}</span>`;
    if (builtin) return `<span class="syntax-builtin">${builtin}</span>`;
    if (number) return `<span class="syntax-number">${number}</span>`;
    return match;
  });
}

function updateSyntaxHighlight() {
  syntaxCode.innerHTML = `${highlightJava(notesText.value)}\n`;
  updateLineNumbers();
}

function updateLineNumbers() {
  const lineCount = notesText.value.split("\n").length;
  if (editorLineNumbers.childElementCount !== lineCount) {
    editorLineNumbers.innerHTML = Array.from({ length: lineCount }, (_, i) => `<span>${i + 1}</span>`).join("");
  }
  editorLineNumbers.scrollTop = notesText.scrollTop;
}

function syncEditorScroll() {
  const highlight = document.querySelector("#syntaxHighlight");
  highlight.scrollTop = notesText.scrollTop;
  highlight.scrollLeft = notesText.scrollLeft;
  editorLineNumbers.scrollTop = notesText.scrollTop;
}

// ---------------------------------------------------------------------------
// Java Lexer & Tokenizer
// ---------------------------------------------------------------------------

const JAVA_KEYWORDS = new Set([
  "abstract", "boolean", "break", "byte", "case", "catch", "char", "class",
  "continue", "default", "do", "double", "else", "extends", "final", "finally",
  "float", "for", "if", "implements", "import", "instanceof", "int", "interface",
  "long", "new", "package", "private", "protected", "public", "return", "short",
  "static", "super", "switch", "this", "throw", "throws", "try", "void", "while", "yield",
  "true", "false", "null"
]);

function tokenizeJava(source) {
  const tokens = [];
  let pos = 0;
  let line = 1;
  let col = 1;

  while (pos < source.length) {
    const ch = source[pos];

    if (ch === "\n") {
      line++;
      col = 1;
      pos++;
      continue;
    }
    if (/\s/.test(ch)) {
      pos++;
      col++;
      continue;
    }

    // Line comment
    if (ch === "/" && source[pos + 1] === "/") {
      while (pos < source.length && source[pos] !== "\n") {
        pos++;
      }
      continue;
    }

    // Block comment
    if (ch === "/" && source[pos + 1] === "*") {
      pos += 2;
      col += 2;
      while (pos < source.length && !(source[pos] === "*" && source[pos + 1] === "/")) {
        if (source[pos] === "\n") {
          line++;
          col = 1;
        } else {
          col++;
        }
        pos++;
      }
      if (pos < source.length) {
        pos += 2;
        col += 2;
      }
      continue;
    }

    // String literal
    if (ch === '"') {
      const startLine = line;
      const startCol = col;
      pos++;
      col++;
      let strVal = "";
      while (pos < source.length && source[pos] !== '"') {
        if (source[pos] === "\\") {
          pos++;
          col++;
          const esc = source[pos++];
          col++;
          if (esc === "n") strVal += "\n";
          else if (esc === "t") strVal += "\t";
          else if (esc === "r") strVal += "\r";
          else if (esc === '"') strVal += '"';
          else if (esc === "\\") strVal += "\\";
          else strVal += esc;
        } else {
          if (source[pos] === "\n") {
            line++;
            col = 1;
          } else {
            col++;
          }
          strVal += source[pos++];
        }
      }
      if (pos < source.length && source[pos] === '"') {
        pos++;
        col++;
      }
      tokens.push({ type: "STRING", value: strVal, line: startLine, col: startCol });
      continue;
    }

    // Character literal
    if (ch === "'") {
      const startLine = line;
      const startCol = col;
      pos++;
      col++;
      let charVal = "";
      if (source[pos] === "\\") {
        pos++;
        col++;
        const esc = source[pos++];
        col++;
        if (esc === "n") charVal = "\n";
        else if (esc === "t") charVal = "\t";
        else if (esc === "'") charVal = "'";
        else if (esc === "\\") charVal = "\\";
        else charVal = esc;
      } else if (pos < source.length && source[pos] !== "'") {
        charVal = source[pos++];
        col++;
      }
      if (pos < source.length && source[pos] === "'") {
        pos++;
        col++;
      }
      tokens.push({ type: "CHAR", value: charVal, line: startLine, col: startCol });
      continue;
    }

    // Numbers
    if (/\d/.test(ch) || (ch === "." && /\d/.test(source[pos + 1] || ""))) {
      const startLine = line;
      const startCol = col;
      let numStr = "";
      while (pos < source.length && /[\d.a-fA-FxX]/.test(source[pos])) {
        numStr += source[pos++];
        col++;
      }
      if (pos < source.length && /[fFdDlL]/.test(source[pos])) {
        numStr += source[pos++];
        col++;
      }
      const cleanNum = numStr.replace(/[fFdDlL]/g, "");
      const numVal = cleanNum.includes(".") ? parseFloat(cleanNum) : parseInt(cleanNum, 10);
      tokens.push({ type: "NUMBER", value: isNaN(numVal) ? 0 : numVal, line: startLine, col: startCol });
      continue;
    }

    // Identifiers & Keywords
    if (/[a-zA-Z_$]/.test(ch)) {
      const startLine = line;
      const startCol = col;
      let id = "";
      while (pos < source.length && /[a-zA-Z0-9_$]/.test(source[pos])) {
        id += source[pos++];
        col++;
      }
      if (JAVA_KEYWORDS.has(id)) {
        tokens.push({ type: "KEYWORD", value: id, line: startLine, col: startCol });
      } else {
        tokens.push({ type: "IDENTIFIER", value: id, line: startLine, col: startCol });
      }
      continue;
    }

    // Multi-char operators
    const twoChars = source.slice(pos, pos + 2);
    if (["==", "!=", "<=", ">=", "&&", "||", "++", "--", "+=", "-=", "*=", "/=", "%=", "->"].includes(twoChars)) {
      tokens.push({ type: "OPERATOR", value: twoChars, line, col });
      pos += 2;
      col += 2;
      continue;
    }

    // Single-char operators and punctuation
    const punc = ";,(){}[]?:.+-*/%<>=!|&^";
    if (punc.includes(ch)) {
      tokens.push({ type: "PUNCTUATION", value: ch, line, col });
      pos++;
      col++;
      continue;
    }

    // Skip unrecognised characters
    pos++;
    col++;
  }

  tokens.push({ type: "EOF", value: "EOF", line, col });
  return tokens;
}

// ---------------------------------------------------------------------------
// Java Parser (Recursive Descent)
// ---------------------------------------------------------------------------

class JavaParser {
  constructor(tokens) {
    this.tokens = tokens;
    this.curr = 0;
  }

  peek() {
    return this.tokens[this.curr];
  }

  previous() {
    return this.tokens[this.curr - 1];
  }

  isAtEnd() {
    return this.peek().type === "EOF";
  }

  check(type, val = null) {
    if (this.isAtEnd()) return false;
    const token = this.peek();
    if (token.type !== type) return false;
    if (val !== null && token.value !== val) return false;
    return true;
  }

  match(type, val = null) {
    if (this.check(type, val)) {
      this.curr++;
      return true;
    }
    return false;
  }

  consume(type, val = null, message = "") {
    if (this.check(type, val)) {
      return this.tokens[this.curr++];
    }
    const token = this.peek();
    throw new Error(`Parse error at line ${token.line}: ${message || `Expected ${val || type}, got '${token.value}'`}`);
  }

  parseProgram() {
    const classes = [];
    const looseStatements = [];

    while (!this.isAtEnd()) {
      if (this.match("KEYWORD", "package") || this.match("KEYWORD", "import")) {
        while (!this.isAtEnd() && !this.check("PUNCTUATION", ";")) {
          this.curr++;
        }
        this.match("PUNCTUATION", ";");
        continue;
      }

      if (this.isClassStart()) {
        classes.push(this.parseClassDeclaration());
      } else {
        looseStatements.push(this.parseStatement());
      }
    }

    // If loose statements were provided outside any class, wrap them in a synthetic Main.main method
    if (looseStatements.length > 0) {
      let mainClass = classes.find((c) => c.name === "Main");
      if (!mainClass) {
        mainClass = {
          name: "Main",
          fields: [],
          constructors: [],
          methods: []
        };
        classes.push(mainClass);
      }
      let mainMethod = mainClass.methods.find((m) => m.name === "main");
      if (!mainMethod) {
        mainMethod = {
          name: "main",
          params: ["args"],
          isStatic: true,
          body: looseStatements
        };
        mainClass.methods.push(mainMethod);
      } else {
        mainMethod.body.push(...looseStatements);
      }
    }

    return { classes };
  }

  isClassStart() {
    let look = this.curr;
    while (look < this.tokens.length) {
      const tok = this.tokens[look];
      if (tok.type === "KEYWORD" && ["public", "private", "protected", "static", "final", "abstract"].includes(tok.value)) {
        look++;
        continue;
      }
      if (tok.type === "KEYWORD" && tok.value === "class") {
        return true;
      }
      break;
    }
    return false;
  }

  parseClassDeclaration() {
    while (this.match("KEYWORD", "public") || this.match("KEYWORD", "private") ||
           this.match("KEYWORD", "protected") || this.match("KEYWORD", "static") ||
           this.match("KEYWORD", "final") || this.match("KEYWORD", "abstract")) {}

    this.consume("KEYWORD", "class", "Expected 'class'");
    const nameToken = this.consume("IDENTIFIER", null, "Expected class name");
    const className = nameToken.value;

    if (this.match("KEYWORD", "extends") || this.match("KEYWORD", "implements")) {
      while (!this.check("PUNCTUATION", "{") && !this.isAtEnd()) {
        this.curr++;
      }
    }

    this.consume("PUNCTUATION", "{", "Expected '{' after class declaration");

    const fields = [];
    const constructors = [];
    const methods = [];

    while (!this.check("PUNCTUATION", "}") && !this.isAtEnd()) {
      let isStatic = false;
      while (this.match("KEYWORD", "public") || this.match("KEYWORD", "private") ||
             this.match("KEYWORD", "protected") || this.match("KEYWORD", "final")) {}

      if (this.match("KEYWORD", "static")) {
        isStatic = true;
      }

      // Constructor: ClassName(...)
      if (this.check("IDENTIFIER", className) && this.tokens[this.curr + 1]?.value === "(") {
        this.curr++; // consume class name
        const params = this.parseParameterList();
        const body = this.parseBlock();
        constructors.push({ params, body });
        continue;
      }

      // Field or Method: Type identifier ...
      const typeNode = this.parseType();
      const memberNameToken = this.consume("IDENTIFIER", null, "Expected member name");
      const memberName = memberNameToken.value;

      if (this.check("PUNCTUATION", "(")) {
        // Method
        const params = this.parseParameterList();
        let body = [];
        if (this.check("PUNCTUATION", "{")) {
          body = this.parseBlock();
        } else {
          this.consume("PUNCTUATION", ";", "Expected ';' or method body");
        }
        methods.push({
          name: memberName,
          returnType: typeNode,
          params,
          isStatic,
          body
        });
      } else {
        // Field declaration
        let initExpr = null;
        if (this.match("PUNCTUATION", "=")) {
          initExpr = this.parseExpression();
        }
        this.consume("PUNCTUATION", ";", "Expected ';' after field declaration");
        fields.push({
          name: memberName,
          type: typeNode,
          isStatic,
          init: initExpr
        });
      }
    }

    this.consume("PUNCTUATION", "}", "Expected '}' at end of class");
    return { name: className, fields, constructors, methods };
  }

  parseType() {
    let baseName = "";
    if (this.check("KEYWORD")) {
      baseName = this.peek().value;
      this.curr++;
    } else if (this.check("IDENTIFIER")) {
      baseName = this.peek().value;
      this.curr++;
    } else {
      baseName = "void";
    }

    while (this.check("PUNCTUATION", ".") && this.tokens[this.curr + 1]?.type === "IDENTIFIER") {
      this.curr++;
      baseName += `.${this.tokens[this.curr].value}`;
      this.curr++;
    }

    // Generic parameters e.g. <Integer> or <K, V>
    if (this.match("PUNCTUATION", "<")) {
      let depth = 1;
      while (depth > 0 && !this.isAtEnd()) {
        if (this.check("PUNCTUATION", "<")) depth++;
        else if (this.check("PUNCTUATION", ">")) depth--;
        this.curr++;
      }
    }

    // Array brackets e.g. int[], String[][]
    let dimensions = 0;
    while (this.check("PUNCTUATION", "[") && this.tokens[this.curr + 1]?.value === "]") {
      this.curr += 2;
      dimensions++;
    }

    return { base: baseName, dimensions };
  }

  parseParameterList() {
    this.consume("PUNCTUATION", "(", "Expected '('");
    const params = [];
    if (!this.check("PUNCTUATION", ")")) {
      do {
        this.parseType();
        const idTok = this.consume("IDENTIFIER", null, "Expected parameter name");
        params.push(idTok.value);
      } while (this.match("PUNCTUATION", ","));
    }
    this.consume("PUNCTUATION", ")", "Expected ')'");
    return params;
  }

  parseBlock() {
    this.consume("PUNCTUATION", "{", "Expected '{'");
    const statements = [];
    while (!this.check("PUNCTUATION", "}") && !this.isAtEnd()) {
      statements.push(this.parseStatement());
    }
    this.consume("PUNCTUATION", "}", "Expected '}'");
    return statements;
  }

  parseStatement() {
    const token = this.peek();
    const line = token.line;

    if (this.check("PUNCTUATION", "{")) {
      const blockStmts = this.parseBlock();
      return { type: "BlockStatement", body: blockStmts, line };
    }

    if (this.match("KEYWORD", "if")) {
      this.consume("PUNCTUATION", "(", "Expected '(' after 'if'");
      const test = this.parseExpression();
      this.consume("PUNCTUATION", ")", "Expected ')' after if condition");
      const consequent = this.parseStatement();
      let alternate = null;
      if (this.match("KEYWORD", "else")) {
        alternate = this.parseStatement();
      }
      return { type: "IfStatement", test, consequent, alternate, line };
    }

    if (this.match("KEYWORD", "while")) {
      this.consume("PUNCTUATION", "(", "Expected '(' after 'while'");
      const test = this.parseExpression();
      this.consume("PUNCTUATION", ")", "Expected ')' after while condition");
      const body = this.parseStatement();
      return { type: "WhileStatement", test, body, line };
    }

    if (this.match("KEYWORD", "do")) {
      const body = this.parseStatement();
      this.consume("KEYWORD", "while", "Expected 'while' after do block");
      this.consume("PUNCTUATION", "(", "Expected '('");
      const test = this.parseExpression();
      this.consume("PUNCTUATION", ")", "Expected ')'");
      this.consume("PUNCTUATION", ";", "Expected ';' after do-while");
      return { type: "DoWhileStatement", body, test, line };
    }

    if (this.match("KEYWORD", "for")) {
      this.consume("PUNCTUATION", "(", "Expected '(' after 'for'");

      // Detect enhanced for-each: for (Type x : iterable)
      const isForEach = this.isEnhancedFor();
      if (isForEach) {
        this.parseType();
        const varTok = this.consume("IDENTIFIER", null, "Expected loop variable in for-each");
        this.consume("PUNCTUATION", ":", "Expected ':' in for-each loop");
        const iterable = this.parseExpression();
        this.consume("PUNCTUATION", ")", "Expected ')'");
        const body = this.parseStatement();
        return { type: "ForEachStatement", varName: varTok.value, iterable, body, line };
      }

      // Standard 3-part for loop
      let init = null;
      if (!this.check("PUNCTUATION", ";")) {
        if (this.isTypeAhead()) {
          init = this.parseVariableDeclarationStatement(false);
          this.consume("PUNCTUATION", ";", "Expected ';' after for init");
        } else {
          init = this.parseExpression();
          this.consume("PUNCTUATION", ";", "Expected ';' after for init");
        }
      } else {
        this.consume("PUNCTUATION", ";");
      }

      let test = null;
      if (!this.check("PUNCTUATION", ";")) {
        test = this.parseExpression();
      }
      this.consume("PUNCTUATION", ";", "Expected ';' after for condition");

      let update = null;
      if (!this.check("PUNCTUATION", ")")) {
        update = this.parseExpression();
      }
      this.consume("PUNCTUATION", ")", "Expected ')' after for clauses");

      const body = this.parseStatement();
      return { type: "ForStatement", init, test, update, body, line };
    }

    if (this.match("KEYWORD", "return")) {
      let argument = null;
      if (!this.check("PUNCTUATION", ";")) {
        argument = this.parseExpression();
      }
      this.consume("PUNCTUATION", ";", "Expected ';' after return");
      return { type: "ReturnStatement", argument, line };
    }

    if (this.match("KEYWORD", "break")) {
      this.consume("PUNCTUATION", ";", "Expected ';' after break");
      return { type: "BreakStatement", line };
    }

    if (this.match("KEYWORD", "continue")) {
      this.consume("PUNCTUATION", ";", "Expected ';' after continue");
      return { type: "ContinueStatement", line };
    }

    if (this.check("KEYWORD", "switch")) {
      return this.parseSwitch();
    }

    if (this.match("KEYWORD", "yield")) {
      const argument = this.check("PUNCTUATION", ";") ? null : this.parseExpression();
      this.consume("PUNCTUATION", ";", "Expected ';' after yield");
      return { type: "YieldStatement", argument, line };
    }

    if (this.match("PUNCTUATION", ";")) {
      return { type: "EmptyStatement", line };
    }

    // Variable declaration vs Expression statement
    if (this.isTypeAhead()) {
      return this.parseVariableDeclarationStatement(true);
    }

    const expr = this.parseExpression();
    this.consume("PUNCTUATION", ";", "Expected ';' after statement");
    return { type: "ExpressionStatement", expression: expr, line };
  }

  parseSwitch() {
    const line = this.peek().line;
    this.consume("KEYWORD", "switch", "Expected 'switch'");
    this.consume("PUNCTUATION", "(", "Expected '(' after 'switch'");
    const discriminant = this.parseExpression();
    this.consume("PUNCTUATION", ")", "Expected ')' after switch expression");
    this.consume("PUNCTUATION", "{", "Expected '{' to start switch");

    const cases = [];
    let style = null;
    while (!this.check("PUNCTUATION", "}") && !this.isAtEnd()) {
      const caseLine = this.peek().line;
      const labels = [];
      let isDefault = false;

      if (this.match("KEYWORD", "case")) {
        labels.push(this.parseExpression());
        while (this.match("PUNCTUATION", ",")) {
          labels.push(this.parseExpression());
        }
      } else if (this.match("KEYWORD", "default")) {
        isDefault = true;
      } else {
        const tok = this.peek();
        throw new Error(`Parse error at line ${tok.line}: Expected 'case' or 'default', got '${tok.value}'`);
      }

      let arrow = false;
      let body;
      if (this.match("OPERATOR", "->")) {
        if (style === "colon") {
          throw new Error(`Parse error at line ${caseLine}: Cannot mix ':' and '->' in one switch`);
        }
        style = "arrow";
        arrow = true;
        if (this.check("PUNCTUATION", "{")) {
          body = { kind: "block", statements: this.parseBlock() };
        } else if (this.isSwitchStatementArm()) {
          body = { kind: "statement", statement: this.parseStatement() };
        } else {
          const expression = this.parseExpression();
          this.consume("PUNCTUATION", ";", "Expected ';' after switch arm");
          body = { kind: "expression", expression };
        }
      } else {
        if (style === "arrow") {
          throw new Error(`Parse error at line ${caseLine}: Cannot mix ':' and '->' in one switch`);
        }
        style = "colon";
        this.consume("PUNCTUATION", ":", "Expected ':' or '->' after case label");
        const statements = [];
        while (!this.check("KEYWORD", "case") && !this.check("KEYWORD", "default") && !this.check("PUNCTUATION", "}") && !this.isAtEnd()) {
          statements.push(this.parseStatement());
        }
        body = { kind: "block", statements };
      }

      cases.push({ line: caseLine, labels, isDefault, arrow, body });
    }

    this.consume("PUNCTUATION", "}", "Expected '}' to end switch");
    return { type: "SwitchStatement", discriminant, cases, line };
  }

  isSwitchStatementArm() {
    if (this.check("PUNCTUATION", "{")) return true;
    if (this.isTypeAhead()) return true;
    if (!this.check("KEYWORD")) return false;
    return ["if", "while", "do", "for", "return", "break", "continue", "switch", "throw", "try", "yield"].includes(this.peek().value);
  }

  isEnhancedFor() {
    let look = this.curr;
    let parenDepth = 0;
    while (look < this.tokens.length) {
      const tok = this.tokens[look];
      if (tok.value === "(") parenDepth++;
      else if (tok.value === ")") {
        if (parenDepth === 0) break;
        parenDepth--;
      } else if (tok.value === ":" && parenDepth === 0) {
        return true;
      } else if (tok.value === ";" && parenDepth === 0) {
        return false;
      }
      look++;
    }
    return false;
  }

  isTypeAhead() {
    const tok = this.peek();
    const PRIMITIVES = ["int", "double", "float", "boolean", "char", "byte", "short", "long", "void"];
    if (tok.type === "KEYWORD" && PRIMITIVES.includes(tok.value)) {
      return true;
    }
    if (tok.type === "IDENTIFIER") {
      let look = this.curr + 1;
      while (this.tokens[look]?.value === "." && this.tokens[look + 1]?.type === "IDENTIFIER") {
        look += 2;
      }
      // Skip generics: e.g. List<Map<String, Integer>>
      if (this.tokens[look]?.value === "<") {
        let depth = 0;
        while (look < this.tokens.length) {
          if (this.tokens[look]?.value === "<") depth++;
          else if (this.tokens[look]?.value === ">") {
            depth--;
            if (depth === 0) {
              look++;
              break;
            }
          }
          look++;
        }
      }
      // Skip array brackets: e.g. String[][]
      while (this.tokens[look]?.value === "[" && this.tokens[look + 1]?.value === "]") {
        look += 2;
      }
      // After type + generics + brackets, there must be a variable name (IDENTIFIER)
      if (this.tokens[look]?.type === "IDENTIFIER") {
        return true;
      }
    }
    return false;
  }

  parseVariableDeclarationStatement(requireSemicolon = true) {
    const line = this.peek().line;
    const typeNode = this.parseType();
    const declarations = [];

    do {
      const idTok = this.consume("IDENTIFIER", null, "Expected variable name");
      let init = null;
      if (this.match("PUNCTUATION", "=")) {
        if (this.check("PUNCTUATION", "{")) {
          init = this.parseArrayInitializer();
        } else {
          init = this.parseExpression();
        }
      }
      declarations.push({ name: idTok.value, init });
    } while (this.match("PUNCTUATION", ","));

    if (requireSemicolon) {
      this.consume("PUNCTUATION", ";", "Expected ';' after variable declaration");
    }
    return { type: "VariableDeclaration", varType: typeNode, declarations, line };
  }

  parseArrayInitializer() {
    const line = this.peek().line;
    this.consume("PUNCTUATION", "{");
    const elements = [];
    if (!this.check("PUNCTUATION", "}")) {
      do {
        if (this.check("PUNCTUATION", "}")) break;
        if (this.check("PUNCTUATION", "{")) {
          elements.push(this.parseArrayInitializer());
        } else {
          elements.push(this.parseExpression());
        }
      } while (this.match("PUNCTUATION", ","));
    }
    this.consume("PUNCTUATION", "}");
    return { type: "ArrayInitializer", elements, line };
  }

  parseExpression() {
    return this.parseAssignment();
  }

  parseAssignment() {
    const expr = this.parseTernary();

    const ASSIGN_OPS = ["=", "+=", "-=", "*=", "/=", "%="];
    if ((this.check("OPERATOR") || this.check("PUNCTUATION")) && ASSIGN_OPS.includes(this.peek().value)) {
      const op = this.peek().value;
      const line = this.peek().line;
      this.curr++;
      const right = this.parseAssignment();
      return { type: "AssignmentExpression", operator: op, left: expr, right, line };
    }
    return expr;
  }

  parseTernary() {
    let expr = this.parseLogicalOr();
    if (this.match("PUNCTUATION", "?")) {
      const line = this.previous().line;
      const consequent = this.parseExpression();
      this.consume("PUNCTUATION", ":", "Expected ':' in ternary");
      const alternate = this.parseExpression();
      return { type: "ConditionalExpression", test: expr, consequent, alternate, line };
    }
    return expr;
  }

  parseLogicalOr() {
    let expr = this.parseLogicalAnd();
    while (this.match("OPERATOR", "||")) {
      const line = this.previous().line;
      const right = this.parseLogicalAnd();
      expr = { type: "BinaryExpression", operator: "||", left: expr, right, line };
    }
    return expr;
  }

  parseLogicalAnd() {
    let expr = this.parseEquality();
    while (this.match("OPERATOR", "&&")) {
      const line = this.previous().line;
      const right = this.parseEquality();
      expr = { type: "BinaryExpression", operator: "&&", left: expr, right, line };
    }
    return expr;
  }

  parseEquality() {
    let expr = this.parseRelational();
    while (this.check("OPERATOR", "==") || this.check("OPERATOR", "!=")) {
      const op = this.peek().value;
      const line = this.peek().line;
      this.curr++;
      const right = this.parseRelational();
      expr = { type: "BinaryExpression", operator: op, left: expr, right, line };
    }
    return expr;
  }

  parseRelational() {
    let expr = this.parseAdditive();
    while (
      this.check("OPERATOR", "<=") || this.check("OPERATOR", ">=") ||
      this.check("PUNCTUATION", "<") || this.check("PUNCTUATION", ">")
    ) {
      const op = this.peek().value;
      const line = this.peek().line;
      this.curr++;
      const right = this.parseAdditive();
      expr = { type: "BinaryExpression", operator: op, left: expr, right, line };
    }
    return expr;
  }

  parseAdditive() {
    let expr = this.parseMultiplicative();
    while (this.check("PUNCTUATION", "+") || this.check("PUNCTUATION", "-")) {
      const op = this.peek().value;
      const line = this.peek().line;
      this.curr++;
      const right = this.parseMultiplicative();
      expr = { type: "BinaryExpression", operator: op, left: expr, right, line };
    }
    return expr;
  }

  parseMultiplicative() {
    let expr = this.parseUnary();
    while (this.check("PUNCTUATION", "*") || this.check("PUNCTUATION", "/") || this.check("PUNCTUATION", "%")) {
      const op = this.peek().value;
      const line = this.peek().line;
      this.curr++;
      const right = this.parseUnary();
      expr = { type: "BinaryExpression", operator: op, left: expr, right, line };
    }
    return expr;
  }

  parseUnary() {
    if (this.check("OPERATOR", "++") || this.check("OPERATOR", "--") ||
        this.check("PUNCTUATION", "!") || this.check("PUNCTUATION", "-") ||
        this.check("PUNCTUATION", "+")) {
      const op = this.peek().value;
      const line = this.peek().line;
      this.curr++;
      const argument = this.parseUnary();
      return { type: "UnaryExpression", operator: op, prefix: true, argument, line };
    }
    return this.parsePostfix();
  }

  parsePostfix() {
    let expr = this.parseCallMember();
    if (this.check("OPERATOR", "++") || this.check("OPERATOR", "--")) {
      const op = this.peek().value;
      const line = this.peek().line;
      this.curr++;
      return { type: "UnaryExpression", operator: op, prefix: false, argument: expr, line };
    }
    return expr;
  }

  parseCallMember() {
    let expr = this.parsePrimary();

    while (true) {
      if (this.match("PUNCTUATION", ".")) {
        const idTok = this.consume("IDENTIFIER", null, "Expected property or method name after '.'");
        if (this.check("PUNCTUATION", "(")) {
          // Method call
          const args = this.parseArguments();
          expr = { type: "CallExpression", callee: expr, method: idTok.value, arguments: args, line: idTok.line };
        } else {
          // Field access
          expr = { type: "MemberExpression", object: expr, property: idTok.value, line: idTok.line };
        }
      } else if (this.match("PUNCTUATION", "[")) {
        const index = this.parseExpression();
        this.consume("PUNCTUATION", "]", "Expected ']'");
        expr = { type: "IndexExpression", object: expr, index, line: expr.line };
      } else if (this.check("PUNCTUATION", "(") && expr.type === "Identifier") {
        const args = this.parseArguments();
        expr = { type: "CallExpression", callee: null, method: expr.name, arguments: args, line: expr.line };
      } else {
        break;
      }
    }

    return expr;
  }

  parseArguments() {
    this.consume("PUNCTUATION", "(");
    const args = [];
    if (!this.check("PUNCTUATION", ")")) {
      do {
        args.push(this.parseExpression());
      } while (this.match("PUNCTUATION", ","));
    }
    this.consume("PUNCTUATION", ")");
    return args;
  }

  parsePrimary() {
    const token = this.peek();
    const line = token.line;

    if (this.match("KEYWORD", "true")) return { type: "Literal", value: true, line };
    if (this.match("KEYWORD", "false")) return { type: "Literal", value: false, line };
    if (this.match("KEYWORD", "null")) return { type: "Literal", value: null, line };

    if (this.match("NUMBER")) return { type: "Literal", value: this.previous().value, line };
    if (this.match("STRING")) return { type: "Literal", value: this.previous().value, line };
    if (this.match("CHAR")) return { type: "Literal", value: this.previous().value, line };

    if (this.match("KEYWORD", "this")) return { type: "ThisExpression", line };
    if (this.check("KEYWORD", "switch")) return this.parseSwitch();
    if (this.match("IDENTIFIER")) return { type: "Identifier", name: this.previous().value, line };

    // new ...
    if (this.match("KEYWORD", "new")) {
      const typeNode = this.parseType();

      // Array instantiation e.g. new int[5] or new int[]{1, 2}
      if (this.check("PUNCTUATION", "[")) {
        this.consume("PUNCTUATION", "[");
        let sizeExpr = null;
        if (!this.check("PUNCTUATION", "]")) {
          sizeExpr = this.parseExpression();
        }
        this.consume("PUNCTUATION", "]");

        // Check for 2nd dimension e.g. new int[3][3]
        let size2Expr = null;
        if (this.check("PUNCTUATION", "[")) {
          this.consume("PUNCTUATION", "[");
          if (!this.check("PUNCTUATION", "]")) size2Expr = this.parseExpression();
          this.consume("PUNCTUATION", "]");
        }

        let init = null;
        if (this.check("PUNCTUATION", "{")) {
          init = this.parseArrayInitializer();
        }

        return {
          type: "NewArrayExpression",
          elemType: typeNode.base,
          size: sizeExpr,
          size2: size2Expr,
          init,
          line
        };
      }

      // Object instantiation e.g. new Solution(), new ArrayList<>()
      const args = this.parseArguments();
      return {
        type: "NewObjectExpression",
        className: typeNode.base,
        arguments: args,
        line
      };
    }

    if (this.match("PUNCTUATION", "(")) {
      // Handle casts e.g. (int) 3.14 or parenthesized expression
      const expr = this.parseExpression();
      this.consume("PUNCTUATION", ")", "Expected ')'");
      return expr;
    }

    throw new Error(`Unexpected token at line ${line}: '${token.value}'`);
  }
}

// ---------------------------------------------------------------------------
// Java Interpreter & State Tracer
// ---------------------------------------------------------------------------

class BreakSignal {}
class ContinueSignal {}
class ReturnSignal {
  constructor(value) {
    this.value = value;
  }
}
class YieldSignal {
  constructor(value) {
    this.value = value;
  }
}

const JAVA_RANDOM_MULTIPLIER = 0x5DEECE66Dn;
const JAVA_RANDOM_ADDEND = 0xBn;
const JAVA_RANDOM_MASK = (1n << 48n) - 1n;
const BUILTIN_CLASSES = [
  "System", "Math", "Arrays", "Collections", "Integer", "Long", "Double",
  "Boolean", "Character", "String", "Random", "Scanner"
];

function javaRandomScramble(seed) {
  return (BigInt(Math.trunc(Number(seed))) ^ JAVA_RANDOM_MULTIPLIER) & JAVA_RANDOM_MASK;
}

class JavaInterpreter {
  constructor(ast, stdin = "") {
    this.ast = ast;
    this.stdin = String(stdin ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    this.classes = new Map();
    for (const cls of ast.classes) {
      this.classes.set(cls.name, cls);
    }

    this.heap = {};
    this.nextHeapId = 1;
    this.callStack = [];
    this.stdout = "";
    this.steps = [];
    this.maxSteps = 800;
    this.loopHeaderLines = new Set();
    this.findLoopHeaders(ast);
  }

  allocateId() {
    return String(this.nextHeapId++);
  }

  findLoopHeaders(node) {
    if (!node || typeof node !== "object") return;
    if (node.type === "ForStatement" || node.type === "ForEachStatement" ||
        node.type === "WhileStatement" || node.type === "DoWhileStatement") {
      if (node.line) this.loopHeaderLines.add(node.line);
    }
    for (const key of Object.keys(node)) {
      if (Array.isArray(node[key])) {
        for (const item of node[key]) this.findLoopHeaders(item);
      } else if (typeof node[key] === "object") {
        this.findLoopHeaders(node[key]);
      }
    }
  }

  encodeValue(val, depth = 0) {
    if (depth > 5) return { kind: "primitive", type: "Object", value: "..." };
    if (val === null || val === undefined) return { kind: "primitive", type: "null", value: "null" };
    if (typeof val === "boolean") return { kind: "primitive", type: "boolean", value: val ? "true" : "false" };
    if (typeof val === "number") return { kind: "primitive", type: Number.isInteger(val) ? "int" : "double", value: String(val) };
    if (typeof val === "string") return { kind: "primitive", type: "String", value: JSON.stringify(val) };

    if (typeof val === "object" && val.__ref) {
      return { kind: "ref", id: val.__ref };
    }
    return { kind: "primitive", type: "Object", value: String(val) };
  }

  captureSnapshot(line, isLoopHeader = false, event = "line", error = null) {
    const frames = this.callStack.map((frame) => {
      const locals = {};
      for (const [k, v] of Object.entries(frame.locals)) {
        if (k.startsWith("__")) continue;
        locals[k] = this.encodeValue(v);
      }
      return {
        name: frame.name,
        locals
      };
    });

    const heapCopy = {};
    for (const [id, obj] of Object.entries(this.heap)) {
      if (obj.entries) {
        heapCopy[id] = {
          id,
          type: obj.type,
          entries: obj.entries.map(([k, v]) => [this.encodeValue(k, 1), this.encodeValue(v, 1)])
        };
      } else if (obj.elements) {
        heapCopy[id] = {
          id,
          type: obj.type,
          elements: obj.elements.map((el) => this.encodeValue(el, 1))
        };
      } else if (obj.attrs) {
        const attrs = {};
        for (const [k, v] of Object.entries(obj.attrs)) {
          if (!k.startsWith("__")) attrs[k] = this.encodeValue(v, 1);
        }
        heapCopy[id] = {
          id,
          type: obj.type,
          attrs
        };
      } else if (typeof obj.text === "string") {
        heapCopy[id] = {
          id,
          type: obj.type,
          attrs: { text: this.encodeValue(obj.text, 1) }
        };
      }
    }

    this.steps.push({
      line: line || null,
      event,
      stdout: this.stdout,
      is_loop_header: isLoopHeader,
      frames,
      heap: heapCopy,
      error
    });
  }

  checkStepLimit() {
    if (this.steps.length >= this.maxSteps) {
      throw new Error(`Stopped after reaching ${this.maxSteps} execution steps to prevent browser freeze.`);
    }
  }

  recordStep(line, isLoopHeader = false) {
    this.checkStepLimit();
    this.captureSnapshot(line, isLoopHeader, "line", null);
  }

  run() {
    // Find entrypoint: class Main with main method, or first class with main method
    let entryClass = this.classes.get("Main");
    if (!entryClass) {
      for (const cls of this.classes.values()) {
        if (cls.methods.some((m) => m.name === "main")) {
          entryClass = cls;
          break;
        }
      }
    }
    if (!entryClass && this.classes.size > 0) {
      entryClass = this.classes.values().next().value;
    }

    if (!entryClass) {
      throw new Error("No classes or statements found to execute.");
    }

    const mainMethod = entryClass.methods.find((m) => m.name === "main") || entryClass.methods[0];
    if (!mainMethod) {
      throw new Error(`No methods found in class ${entryClass.name}.`);
    }

    // Call entrypoint
    try {
      const argsObj = this.createArray("String[]", []);
      this.callMethod(entryClass, mainMethod, null, [argsObj]);
      this.captureSnapshot(null, false, "finished", null);
    } catch (err) {
      if (err instanceof ReturnSignal) {
        this.captureSnapshot(null, false, "finished", null);
      } else {
        const errLine = this.callStack.length ? this.callStack[this.callStack.length - 1].currentLine : null;
        let message = err?.message;
        if (err instanceof BreakSignal) message = "break outside of a loop or switch";
        else if (err instanceof ContinueSignal) message = "continue outside of a loop";
        else if (err instanceof YieldSignal) message = "yield is only valid inside a switch";
        this.captureSnapshot(errLine || 1, false, "exception", message || String(err));
      }
    }

    return {
      steps: this.steps,
      loop_headers: Array.from(this.loopHeaderLines),
      truncated: this.steps.length >= this.maxSteps
    };
  }

  callMethod(cls, method, thisObj, args) {
    const frameName = `${cls ? cls.name + "." : ""}${method.name}(${method.params.join(", ")})`;
    const locals = {};

    if (thisObj) {
      locals["this"] = thisObj;
    }

    for (let i = 0; i < method.params.length; i++) {
      locals[method.params[i]] = args[i] !== undefined ? args[i] : null;
    }

    const frame = {
      name: frameName,
      locals,
      thisObj,
      cls,
      currentLine: null
    };

    this.callStack.push(frame);

    try {
      for (const stmt of method.body) {
        this.executeStatement(stmt);
      }
    } catch (sig) {
      if (sig instanceof ReturnSignal) {
        this.callStack.pop();
        return sig.value;
      }
      throw sig;
    }

    this.callStack.pop();
    return null;
  }

  currentFrame() {
    return this.callStack[this.callStack.length - 1];
  }

  getVariable(name) {
    const frame = this.currentFrame();
    if (frame && name in frame.locals) {
      return frame.locals[name];
    }
    if (frame && frame.thisObj) {
      const obj = this.heap[frame.thisObj.__ref];
      if (obj && obj.attrs && name in obj.attrs) {
        return obj.attrs[name];
      }
    }
    return undefined;
  }

  setVariable(name, value) {
    const frame = this.currentFrame();
    if (frame && name in frame.locals) {
      frame.locals[name] = value;
      return;
    }
    if (frame && frame.thisObj) {
      const obj = this.heap[frame.thisObj.__ref];
      if (obj && obj.attrs && name in obj.attrs) {
        obj.attrs[name] = value;
        return;
      }
    }
    if (frame) {
      frame.locals[name] = value;
    }
  }

  executeStatement(stmt) {
    if (!stmt) return;
    const frame = this.currentFrame();
    if (frame && stmt.line) frame.currentLine = stmt.line;

    switch (stmt.type) {
      case "BlockStatement": {
        for (const s of stmt.body) {
          this.executeStatement(s);
        }
        break;
      }

      case "VariableDeclaration": {
        this.recordStep(stmt.line, false);
        for (const decl of stmt.declarations) {
          let val = null;
          if (decl.init) {
            val = this.evaluateExpression(decl.init);
          } else {
            // Default primitives
            if (["int", "double", "float", "byte", "short", "long"].includes(stmt.varType.base)) val = 0;
            else if (stmt.varType.base === "boolean") val = false;
            else val = null;
          }
          this.setVariable(decl.name, val);
        }
        break;
      }

      case "ExpressionStatement": {
        this.recordStep(stmt.line, false);
        this.evaluateExpression(stmt.expression);
        break;
      }

      case "IfStatement": {
        this.recordStep(stmt.line, false);
        const cond = Boolean(this.evaluateExpression(stmt.test));
        if (cond) {
          this.executeStatement(stmt.consequent);
        } else if (stmt.alternate) {
          this.executeStatement(stmt.alternate);
        }
        break;
      }

      case "WhileStatement": {
        while (true) {
          this.recordStep(stmt.line, true);
          const cond = Boolean(this.evaluateExpression(stmt.test));
          if (!cond) break;
          try {
            this.executeStatement(stmt.body);
          } catch (sig) {
            if (sig instanceof BreakSignal) break;
            if (sig instanceof ContinueSignal) continue;
            throw sig;
          }
        }
        break;
      }

      case "DoWhileStatement": {
        do {
          try {
            this.executeStatement(stmt.body);
          } catch (sig) {
            if (sig instanceof BreakSignal) break;
            if (sig instanceof ContinueSignal) { /* proceed to test */ }
            else throw sig;
          }
          this.recordStep(stmt.line, true);
        } while (Boolean(this.evaluateExpression(stmt.test)));
        break;
      }

      case "ForStatement": {
        if (stmt.init) {
          if (stmt.init.type === "VariableDeclaration") {
            this.executeStatement(stmt.init);
          } else {
            this.recordStep(stmt.init.line || stmt.line, false);
            this.evaluateExpression(stmt.init);
          }
        }
        while (true) {
          this.recordStep(stmt.line, true);
          if (stmt.test) {
            const cond = Boolean(this.evaluateExpression(stmt.test));
            if (!cond) break;
          }
          try {
            this.executeStatement(stmt.body);
          } catch (sig) {
            if (sig instanceof BreakSignal) break;
            if (sig instanceof ContinueSignal) { /* proceed to update */ }
            else throw sig;
          }
          if (stmt.update) {
            this.evaluateExpression(stmt.update);
          }
        }
        break;
      }

      case "ForEachStatement": {
        const iterVal = this.evaluateExpression(stmt.iterable);
        let items = [];
        if (iterVal && iterVal.__ref && this.heap[iterVal.__ref]) {
          const obj = this.heap[iterVal.__ref];
          if (obj.elements) items = obj.elements;
          else if (obj.entries) items = obj.entries.map(([k]) => k);
        }

        for (const item of items) {
          this.recordStep(stmt.line, true);
          this.setVariable(stmt.varName, item);
          try {
            this.executeStatement(stmt.body);
          } catch (sig) {
            if (sig instanceof BreakSignal) break;
            if (sig instanceof ContinueSignal) continue;
            throw sig;
          }
        }
        break;
      }

      case "ReturnStatement": {
        this.recordStep(stmt.line, false);
        const val = stmt.argument ? this.evaluateExpression(stmt.argument) : null;
        throw new ReturnSignal(val);
      }

      case "BreakStatement": {
        this.recordStep(stmt.line, false);
        throw new BreakSignal();
      }

      case "ContinueStatement": {
        this.recordStep(stmt.line, false);
        throw new ContinueSignal();
      }

      case "YieldStatement": {
        this.recordStep(stmt.line, false);
        throw new YieldSignal(stmt.argument ? this.evaluateExpression(stmt.argument) : null);
      }

      case "EmptyStatement":
        break;

      case "SwitchStatement":
        this.executeSwitch(stmt, true);
        break;

      default:
        break;
    }
  }

  executeSwitch(stmt, recordHeader) {
    if (recordHeader) this.recordStep(stmt.line, false);
    const disc = this.evaluateExpression(stmt.discriminant);
    if (disc === null || disc === undefined) {
      throw new Error("NullPointerException");
    }

    let matched = -1;
    let defaultIndex = -1;
    for (let i = 0; i < stmt.cases.length; i++) {
      const arm = stmt.cases[i];
      if (arm.isDefault) defaultIndex = i;
      for (const labelExpr of arm.labels) {
        if (this.valuesEqualForSwitch(disc, this.evaluateExpression(labelExpr))) {
          matched = i;
          break;
        }
      }
      if (matched !== -1) break;
    }

    const start = matched !== -1 ? matched : defaultIndex;
    if (start === -1) return null;

    try {
      if (stmt.cases[start].arrow) {
        return this.executeSwitchArm(stmt.cases[start]);
      }
      for (let i = start; i < stmt.cases.length; i++) {
        this.executeSwitchArm(stmt.cases[i]);
      }
      return null;
    } catch (sig) {
      if (sig instanceof BreakSignal) return null;
      if (sig instanceof YieldSignal) return sig.value;
      throw sig;
    }
  }

  executeSwitchArm(arm) {
    const bodyLine = arm.body.kind === "expression"
      ? arm.body.expression?.line
      : arm.body.kind === "statement"
        ? arm.body.statement?.line
        : arm.body.statements[0]?.line;
    if (arm.line && arm.line !== bodyLine) this.recordStep(arm.line, false);

    if (arm.body.kind === "expression") return this.evaluateExpression(arm.body.expression);
    if (arm.body.kind === "statement") {
      this.executeStatement(arm.body.statement);
      return null;
    }
    for (const statement of arm.body.statements) this.executeStatement(statement);
    return null;
  }

  valuesEqualForSwitch(disc, label) {
    if (typeof disc === "number" && typeof label === "string" && label.length === 1) {
      return disc === label.charCodeAt(0);
    }
    if (typeof label === "number" && typeof disc === "string" && disc.length === 1) {
      return label === disc.charCodeAt(0);
    }
    if (typeof disc === "number" && typeof label === "number") return disc === label;
    if (typeof disc === "string" && typeof label === "string") return disc === label;
    return disc === label;
  }

  evaluateExpression(expr) {
    if (!expr) return null;

    switch (expr.type) {
      case "Literal":
        return expr.value;

      case "SwitchStatement":
        return this.executeSwitch(expr, false);

      case "Identifier": {
        // Builtin packages/classes
        if (BUILTIN_CLASSES.includes(expr.name)) {
          return { __builtinClass: expr.name };
        }
        const val = this.getVariable(expr.name);
        if (val !== undefined) return val;
        if (this.classes.has(expr.name)) {
          return { __classRef: expr.name };
        }
        return null;
      }

      case "ThisExpression": {
        const frame = this.currentFrame();
        return frame ? frame.thisObj : null;
      }

      case "ArrayInitializer": {
        const elements = expr.elements.map((el) => this.evaluateExpression(el));
        let type = "int[]";
        if (elements.length > 0) {
          if (typeof elements[0] === "string") type = "String[]";
          else if (typeof elements[0] === "boolean") type = "boolean[]";
          else if (typeof elements[0] === "number") type = Number.isInteger(elements[0]) ? "int[]" : "double[]";
          else if (elements[0] && elements[0].__ref) {
            const refObj = this.heap[elements[0].__ref];
            type = refObj ? `${refObj.type}[]` : "Object[]";
          }
        }
        return this.createArray(type, elements);
      }

      case "NewArrayExpression": {
        let size = expr.size ? Number(this.evaluateExpression(expr.size)) : 0;
        let elements = [];
        if (expr.init) {
          return this.evaluateExpression(expr.init);
        } else if (expr.size2) {
          // 2D Array
          const size2 = Number(this.evaluateExpression(expr.size2));
          for (let r = 0; r < size; r++) {
            const inner = this.createArray(`${expr.elemType}[]`, new Array(size2).fill(0));
            elements.push(inner);
          }
        } else {
          elements = new Array(Math.max(0, size)).fill(0);
        }
        return this.createArray(`${expr.elemType}[]`, elements);
      }

      case "NewObjectExpression": {
        const className = this.unqualifiedName(expr.className);
        const args = expr.arguments.map((arg) => this.evaluateExpression(arg));

        // Built-in collection types
        if (className === "ArrayList" || className === "List" || className === "LinkedList") {
          return this.createArrayList(args);
        }
        if (className === "HashMap" || className === "Map" || className === "TreeMap") {
          return this.createHashMap();
        }
        if (className === "HashSet" || className === "Set" || className === "TreeSet") {
          return this.createHashSet();
        }
        if (className === "ArrayDeque" || className === "Deque" || className === "Queue" || className === "Stack") {
          return this.createArrayDeque();
        }
        if (className === "StringBuilder") {
          return this.createStringBuilder(args[0] || "");
        }
        if (className === "String") {
          return this.newJavaString(args);
        }
        if (className === "Random") {
          return args.length === 0 ? this.createRandom(0, false) : this.createRandom(args[0], true);
        }
        if (className === "Scanner") {
          return this.createScanner(this.scannerSource(args[0]));
        }

        // Custom classes
        const cls = this.classes.get(className);
        const objId = this.allocateId();
        const objAttrs = {};

        // Default fields
        if (cls) {
          for (const f of cls.fields) {
            if (!f.isStatic) {
              objAttrs[f.name] = f.init ? this.evaluateExpression(f.init) : null;
            }
          }
        }

        this.heap[objId] = { id: objId, type: className, attrs: objAttrs };
        const objRef = { __ref: objId };

        // Run constructor if defined
        if (cls && cls.constructors.length > 0) {
          const ctor = cls.constructors[0];
          const frameName = `${className}(${ctor.params.join(", ")})`;
          const ctorLocals = { this: objRef };
          for (let i = 0; i < ctor.params.length; i++) {
            ctorLocals[ctor.params[i]] = args[i] !== undefined ? args[i] : null;
          }
          this.callStack.push({ name: frameName, locals: ctorLocals, thisObj: objRef, currentLine: expr.line });
          try {
            for (const s of ctor.body) this.executeStatement(s);
          } finally {
            this.callStack.pop();
          }
        }

        return objRef;
      }

      case "AssignmentExpression": {
        const rightVal = this.evaluateExpression(expr.right);
        let finalVal = rightVal;

        if (expr.operator !== "=") {
          const currentVal = this.evaluateExpression(expr.left);
          const op = expr.operator.slice(0, -1);
          finalVal = this.applyBinaryOperator(op, currentVal, rightVal);
        }

        if (expr.left.type === "Identifier") {
          this.setVariable(expr.left.name, finalVal);
        } else if (expr.left.type === "IndexExpression") {
          const target = this.evaluateExpression(expr.left.object);
          const idx = this.evaluateExpression(expr.left.index);
          if (target && target.__ref && this.heap[target.__ref]) {
            const heapObj = this.heap[target.__ref];
            if (heapObj.elements) heapObj.elements[Number(idx)] = finalVal;
          }
        } else if (expr.left.type === "MemberExpression") {
          const target = this.evaluateExpression(expr.left.object);
          if (target && target.__ref && this.heap[target.__ref]) {
            const heapObj = this.heap[target.__ref];
            if (heapObj.attrs) heapObj.attrs[expr.left.property] = finalVal;
          }
        }
        return finalVal;
      }

      case "UnaryExpression": {
        const argVal = this.evaluateExpression(expr.argument);
        if (expr.operator === "!") return !argVal;
        if (expr.operator === "-") return -argVal;
        if (expr.operator === "+") return +argVal;

        if (expr.operator === "++" || expr.operator === "--") {
          const delta = expr.operator === "++" ? 1 : -1;
          const newVal = Number(argVal) + delta;

          if (expr.argument.type === "Identifier") {
            this.setVariable(expr.argument.name, newVal);
          } else if (expr.argument.type === "IndexExpression") {
            const target = this.evaluateExpression(expr.argument.object);
            const idx = this.evaluateExpression(expr.argument.index);
            if (target && target.__ref && this.heap[target.__ref]) {
              this.heap[target.__ref].elements[Number(idx)] = newVal;
            }
          }
          return expr.prefix ? newVal : argVal;
        }
        return argVal;
      }

      case "BinaryExpression": {
        const leftVal = this.evaluateExpression(expr.left);
        // Short-circuit logical operators
        if (expr.operator === "&&") {
          return Boolean(leftVal) ? Boolean(this.evaluateExpression(expr.right)) : false;
        }
        if (expr.operator === "||") {
          return Boolean(leftVal) ? true : Boolean(this.evaluateExpression(expr.right));
        }
        const rightVal = this.evaluateExpression(expr.right);
        return this.applyBinaryOperator(expr.operator, leftVal, rightVal);
      }

      case "ConditionalExpression": {
        const test = this.evaluateExpression(expr.test);
        return test ? this.evaluateExpression(expr.consequent) : this.evaluateExpression(expr.alternate);
      }

      case "MemberExpression": {
        const resolved = this.resolveStaticChain(expr);
        if (resolved) return resolved;
        const objVal = this.evaluateExpression(expr.object);
        if (objVal && objVal.__builtinClass) {
          if (objVal.__builtinClass === "System" && expr.property === "out") {
            return { __systemOut: true };
          }
          if (objVal.__builtinClass === "System" && expr.property === "in") {
            return { __systemIn: true };
          }
          if (objVal.__builtinClass === "Math") {
            return Math[expr.property] !== undefined ? Math[expr.property] : null;
          }
          if (objVal.__builtinClass === "Integer") {
            if (expr.property === "MAX_VALUE") return 2147483647;
            if (expr.property === "MIN_VALUE") return -2147483648;
          }
          if (objVal.__builtinClass === "Double") {
            if (expr.property === "MAX_VALUE") return Number.MAX_VALUE;
            if (expr.property === "MIN_VALUE") return Number.MIN_VALUE;
            if (expr.property === "NaN") return NaN;
            if (expr.property === "POSITIVE_INFINITY") return Infinity;
            if (expr.property === "NEGATIVE_INFINITY") return -Infinity;
          }
          if (objVal.__builtinClass === "Boolean") {
            if (expr.property === "TRUE") return true;
            if (expr.property === "FALSE") return false;
          }
        }

        if (objVal && objVal.__ref && this.heap[objVal.__ref]) {
          const heapObj = this.heap[objVal.__ref];
          if (expr.property === "length" && heapObj.elements) {
            return heapObj.elements.length;
          }
          if (heapObj.attrs && expr.property in heapObj.attrs) {
            return heapObj.attrs[expr.property];
          }
        }
        return null;
      }

      case "IndexExpression": {
        const target = this.evaluateExpression(expr.object);
        const idx = this.evaluateExpression(expr.index);
        if (target && target.__ref && this.heap[target.__ref]) {
          const heapObj = this.heap[target.__ref];
          if (heapObj.elements) {
            const i = Number(idx);
            if (i < 0 || i >= heapObj.elements.length) {
              throw new Error(`ArrayIndexOutOfBoundsException: Index ${i} out of bounds for length ${heapObj.elements.length}`);
            }
            return heapObj.elements[i];
          }
          if (heapObj.entries) {
            const found = heapObj.entries.find(([k]) => k === idx);
            return found ? found[1] : null;
          }
        }
        return null;
      }

      case "CallExpression": {
        const args = expr.arguments.map((arg) => this.evaluateExpression(arg));

        // System.out.println / print / printf
        if (expr.callee && expr.callee.type === "MemberExpression") {
          const baseObj = this.evaluateExpression(expr.callee);
          if (baseObj && baseObj.__systemOut) {
            const formatted = args.map((a) => this.stringifyValue(a)).join(" ");
            if (expr.method === "println") {
              this.stdout += formatted + "\n";
            } else if (expr.method === "printf" || expr.method === "format") {
              this.stdout += this.formatJavaString(this.stringifyValue(args[0] ?? ""), args.slice(1));
            } else if (expr.method === "print") {
              this.stdout += formatted;
            }
            return null;
          }
        }

        // Method called on an object: obj.method(...)
        if (expr.callee) {
          const target = this.evaluateExpression(expr.callee);

          // Builtin Math methods
          if (target && target.__builtinClass === "Math") {
            if (typeof Math[expr.method] === "function") {
              return Math[expr.method](...args);
            }
          }

          // Builtin Arrays methods
          if (target && target.__builtinClass === "Arrays") {
            if (expr.method === "toString") {
              const arrObj = args[0] && args[0].__ref ? this.heap[args[0].__ref] : null;
              return arrObj && arrObj.elements ? `[${arrObj.elements.map((e) => this.stringifyValue(e)).join(", ")}]` : "[]";
            }
            if (expr.method === "sort") {
              const arrObj = args[0] && args[0].__ref ? this.heap[args[0].__ref] : null;
              if (arrObj && arrObj.elements) arrObj.elements.sort((a, b) => (a > b ? 1 : -1));
              return null;
            }
            if (expr.method === "fill") {
              const arrObj = args[0] && args[0].__ref ? this.heap[args[0].__ref] : null;
              if (arrObj && arrObj.elements) arrObj.elements.fill(args[1]);
              return null;
            }
          }

          // Builtin Integer / Long / Double / Boolean / Character / String methods
          if (target && target.__builtinClass === "Integer") {
            return this.evalIntegerMethod(expr.method, args);
          }
          if (target && target.__builtinClass === "Long") {
            return this.evalLongMethod(expr.method, args);
          }
          if (target && target.__builtinClass === "Double") {
            return this.evalDoubleMethod(expr.method, args);
          }
          if (target && target.__builtinClass === "Boolean") {
            return this.evalBooleanMethod(expr.method, args);
          }
          if (target && target.__builtinClass === "Character") {
            return this.evalCharacterMethod(expr.method, args);
          }
          if (target && target.__builtinClass === "String") {
            return this.evalStringStaticMethod(expr.method, args);
          }

          // String instance methods
          if (typeof target === "string") {
            return this.evalStringMethod(target, expr.method, args);
          }

          // Heap object methods (ArrayList, HashMap, HashSet, Deque, Custom classes)
          if (target && target.__ref && this.heap[target.__ref]) {
            const heapObj = this.heap[target.__ref];

            // ArrayList / List
            if (heapObj.type === "ArrayList" || heapObj.type === "List") {
              if (expr.method === "add") {
                if (args.length === 1) heapObj.elements.push(args[0]);
                else heapObj.elements.splice(Number(args[0]), 0, args[1]);
                return true;
              }
              if (expr.method === "get") return heapObj.elements[Number(args[0])];
              if (expr.method === "set") {
                const old = heapObj.elements[Number(args[0])];
                heapObj.elements[Number(args[0])] = args[1];
                return old;
              }
              if (expr.method === "remove") return heapObj.elements.splice(Number(args[0]), 1)[0];
              if (expr.method === "size") return heapObj.elements.length;
              if (expr.method === "isEmpty") return heapObj.elements.length === 0;
              if (expr.method === "contains") return heapObj.elements.includes(args[0]);
              if (expr.method === "clear") {
                heapObj.elements = [];
                return null;
              }
            }

            // HashMap / Map
            if (heapObj.type === "HashMap" || heapObj.type === "Map" || heapObj.type === "TreeMap") {
              if (expr.method === "put") {
                const existing = heapObj.entries.find(([k]) => k === args[0]);
                if (existing) {
                  const old = existing[1];
                  existing[1] = args[1];
                  return old;
                }
                heapObj.entries.push([args[0], args[1]]);
                return null;
              }
              if (expr.method === "get") {
                const found = heapObj.entries.find(([k]) => k === args[0]);
                return found ? found[1] : null;
              }
              if (expr.method === "getOrDefault") {
                const found = heapObj.entries.find(([k]) => k === args[0]);
                return found ? found[1] : args[1];
              }
              if (expr.method === "containsKey") {
                return heapObj.entries.some(([k]) => k === args[0]);
              }
              if (expr.method === "remove") {
                const idx = heapObj.entries.findIndex(([k]) => k === args[0]);
                if (idx !== -1) return heapObj.entries.splice(idx, 1)[0][1];
                return null;
              }
              if (expr.method === "size") return heapObj.entries.length;
              if (expr.method === "isEmpty") return heapObj.entries.length === 0;
              if (expr.method === "keySet") {
                return this.createArray("Object[]", heapObj.entries.map(([k]) => k));
              }
              if (expr.method === "values") {
                return this.createArray("Object[]", heapObj.entries.map(([, v]) => v));
              }
              if (expr.method === "clear") {
                heapObj.entries = [];
                return null;
              }
            }

            // HashSet / Set
            if (heapObj.type === "HashSet" || heapObj.type === "Set") {
              if (expr.method === "add") {
                if (!heapObj.elements.includes(args[0])) {
                  heapObj.elements.push(args[0]);
                  return true;
                }
                return false;
              }
              if (expr.method === "contains") return heapObj.elements.includes(args[0]);
              if (expr.method === "remove") {
                const idx = heapObj.elements.indexOf(args[0]);
                if (idx !== -1) {
                  heapObj.elements.splice(idx, 1);
                  return true;
                }
                return false;
              }
              if (expr.method === "size") return heapObj.elements.length;
              if (expr.method === "isEmpty") return heapObj.elements.length === 0;
            }

            // Deque / Queue / Stack
            if (heapObj.type === "ArrayDeque" || heapObj.type === "Queue" || heapObj.type === "Stack") {
              if (expr.method === "add" || expr.method === "addLast" || expr.method === "offer") {
                heapObj.elements.push(args[0]);
                return true;
              }
              if (expr.method === "addFirst" || expr.method === "push") {
                heapObj.elements.unshift(args[0]);
                return null;
              }
              if (expr.method === "poll" || expr.method === "removeFirst") {
                return heapObj.elements.shift() || null;
              }
              if (expr.method === "pop" || expr.method === "removeLast") {
                return heapObj.elements.pop() || null;
              }
              if (expr.method === "peek") return heapObj.elements[0] || null;
              if (expr.method === "size") return heapObj.elements.length;
              if (expr.method === "isEmpty") return heapObj.elements.length === 0;
            }

            // StringBuilder
            if (heapObj.type === "StringBuilder") {
              return this.evalStringBuilderMethod(target, heapObj, expr.method, args);
            }

            if (heapObj.type === "Random") {
              return this.evalRandomMethod(heapObj, expr.method, args);
            }

            if (heapObj.type === "Scanner") {
              return this.evalScannerMethod(heapObj, expr.method, args);
            }

            // Custom instance method
            const cls = this.classes.get(heapObj.type);
            if (cls) {
              const m = cls.methods.find((method) => method.name === expr.method);
              if (m) {
                return this.callMethod(cls, m, target, args);
              }
            }
          }

          // Static method call on class name: ClassName.method(...)
          if (target && target.__classRef) {
            const cls = this.classes.get(target.__classRef);
            if (cls) {
              const m = cls.methods.find((method) => method.name === expr.method);
              if (m) {
                return this.callMethod(cls, m, null, args);
              }
            }
          }
        }

        // Direct method call in current class / static context
        const frame = this.currentFrame();
        let targetClass = frame?.cls || null;
        if (!targetClass && frame && frame.thisObj) {
          const heapObj = this.heap[frame.thisObj.__ref];
          targetClass = this.classes.get(heapObj.type);
        }

        if (targetClass) {
          const m = targetClass.methods.find((method) => method.name === expr.method);
          if (m) {
            return this.callMethod(targetClass, m, m.isStatic ? null : frame?.thisObj, args);
          }
        }

        // Fallback: search all classes
        for (const cls of this.classes.values()) {
          const m = cls.methods.find((method) => method.name === expr.method);
          if (m) {
            return this.callMethod(cls, m, m.isStatic ? null : frame?.thisObj, args);
          }
        }

        throw new Error(`Cannot find method: ${expr.method}`);
      }

      default:
        return null;
    }
  }

  staticNameChain(expr) {
    const parts = [];
    let node = expr;
    while (node && node.type === "MemberExpression") {
      parts.push(node.property);
      node = node.object;
    }
    if (!node || node.type !== "Identifier") return null;
    parts.push(node.name);
    return parts.reverse().join(".");
  }

  resolveStaticChain(expr) {
    const chain = this.staticNameChain(expr);
    if (!chain || !chain.includes(".")) return null;
    const root = chain.slice(0, chain.indexOf("."));
    if (this.getVariable(root) !== undefined) return null;
    const simple = this.unqualifiedName(chain);
    if (BUILTIN_CLASSES.includes(simple)) return { __builtinClass: simple };
    if (this.classes.has(simple)) return { __classRef: simple };
    return null;
  }

  unqualifiedName(name) {
    const text = String(name ?? "");
    const dot = text.lastIndexOf(".");
    return dot === -1 ? text : text.slice(dot + 1);
  }

  newJavaString(args) {
    if (args.length === 0) return "";
    if (args[0] === null || args[0] === undefined) throw new Error("NullPointerException");
    if (typeof args[0] === "string") return args[0];
    if (args[0] && args[0].__ref && this.heap[args[0].__ref]?.elements) {
      return this.heap[args[0].__ref].elements.map((ch) => String(ch ?? "")).join("");
    }
    if (args[0] && args[0].__ref && this.heap[args[0].__ref]?.text !== undefined) {
      return String(this.heap[args[0].__ref].text);
    }
    return this.stringifyValue(args[0]);
  }

  scannerSource(arg) {
    if (arg && arg.__systemIn) return this.stdin || "";
    if (typeof arg === "string") return arg;
    if (arg && arg.__ref && this.heap[arg.__ref]?.text !== undefined) return String(this.heap[arg.__ref].text);
    throw new Error("Scanner source must be a String or System.in");
  }

  formatJavaString(format, args) {
    const fmt = String(format ?? "");
    let out = "";
    let argi = 0;
    let i = 0;
    while (i < fmt.length) {
      if (fmt[i] !== "%") {
        out += fmt[i++];
        continue;
      }
      if (i + 1 >= fmt.length) {
        out += "%";
        break;
      }
      i++;
      if (fmt[i] === "%") { out += "%"; i++; continue; }
      if (fmt[i] === "n") { out += "\n"; i++; continue; }
      while (i < fmt.length && "-+ 0,#(".includes(fmt[i])) i++;
      while (i < fmt.length && fmt[i] >= "0" && fmt[i] <= "9") i++;
      let precision = null;
      if (fmt[i] === ".") {
        i++;
        let digits = "";
        while (i < fmt.length && fmt[i] >= "0" && fmt[i] <= "9") digits += fmt[i++];
        precision = digits === "" ? 0 : Number(digits);
      }
      const conv = fmt[i++] || "";
      const arg = args[argi++];
      if (conv === "s") out += arg === null || arg === undefined ? "null" : this.stringifyValue(arg);
      else if (conv === "d" || conv === "i") {
        const n = Math.trunc(Number(arg));
        out += Number.isNaN(n) ? "NaN" : String(n);
      }
      else if (conv === "f") {
        const n = Number(arg);
        out += Number.isNaN(n) ? "NaN" : n.toFixed(precision === null ? 6 : precision);
      } else if (conv === "c") {
        out += typeof arg === "number" ? String.fromCharCode(arg) : String(arg ?? "").slice(0, 1);
      } else if (conv === "b") {
        if (typeof arg === "boolean") out += arg ? "true" : "false";
        else out += arg === null || arg === undefined ? "false" : "true";
      } else out += `%${conv}`;
    }
    return out;
  }

  parseJavaInteger(raw, radix = 10) {
    const text = String(raw ?? "").trim();
    const base = Number(radix);
    const body = text.replace(/^[-+]/, "");
    const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz".slice(0, base);
    const digitsOk = body.length > 0 && [...body.toLowerCase()].every((ch) => alphabet.includes(ch));
    if (!(base >= 2 && base <= 36) || !digitsOk) {
      throw new Error(`NumberFormatException: For input string: "${raw}"`);
    }
    const n = parseInt(text, base);
    if (Number.isNaN(n)) throw new Error(`NumberFormatException: For input string: "${raw}"`);
    return n;
  }

  evalIntegerMethod(name, args) {
    if (name === "parseInt") return this.parseJavaInteger(args[0], args.length > 1 ? args[1] : 10);
    if (name === "valueOf") {
      if (typeof args[0] === "number") return Math.trunc(args[0]);
      return this.parseJavaInteger(args[0], args.length > 1 ? args[1] : 10);
    }
    if (name === "toString") return String(args[0]);
    throw new Error(`Cannot find method: Integer.${name}`);
  }

  evalLongMethod(name, args) {
    if (name === "parseLong") return this.parseJavaInteger(args[0], args.length > 1 ? args[1] : 10);
    if (name === "valueOf") {
      if (typeof args[0] === "number") return Math.trunc(args[0]);
      return this.parseJavaInteger(args[0], args.length > 1 ? args[1] : 10);
    }
    if (name === "toString") return String(args[0]);
    throw new Error(`Cannot find method: Long.${name}`);
  }

  evalDoubleMethod(name, args) {
    if (name === "parseDouble" || name === "valueOf") {
      if (name === "valueOf" && typeof args[0] === "number") return Number(args[0]);
      const text = String(args[0] ?? "").trim();
      const n = Number(text);
      if (Number.isNaN(n) && text !== "NaN") throw new Error(`NumberFormatException: For input string: "${args[0]}"`);
      return n;
    }
    if (name === "isNaN") return Number.isNaN(Number(args[0]));
    if (name === "isInfinite") {
      const n = Number(args[0]);
      return !Number.isFinite(n) && !Number.isNaN(n);
    }
    if (name === "toString") return String(args[0]);
    throw new Error(`Cannot find method: Double.${name}`);
  }

  evalBooleanMethod(name, args) {
    if (name === "parseBoolean" || name === "valueOf") {
      if (typeof args[0] === "boolean") return args[0];
      return String(args[0] ?? "").trim().toLowerCase() === "true";
    }
    if (name === "toString") return String(args[0]);
    throw new Error(`Cannot find method: Boolean.${name}`);
  }

  javaChar(value) {
    if (typeof value === "number") return String.fromCharCode(value);
    if (typeof value === "string") return value.slice(0, 1);
    if (value === null || value === undefined) return "";
    return String(value).slice(0, 1);
  }

  evalCharacterMethod(name, args) {
    const ch = this.javaChar(args[0]);
    if (name === "isDigit") return /^\p{Nd}$/u.test(ch);
    if (name === "isLetter") return /^\p{L}$/u.test(ch);
    if (name === "isLetterOrDigit") return /^[\p{L}\p{Nd}]$/u.test(ch);
    if (name === "isWhitespace" || name === "isSpaceChar") return ch.length > 0 && /\s/u.test(ch);
    if (name === "isUpperCase") return ch.length > 0 && ch !== ch.toLowerCase() && ch === ch.toUpperCase();
    if (name === "isLowerCase") return ch.length > 0 && ch !== ch.toUpperCase() && ch === ch.toLowerCase();
    if (name === "toUpperCase") return ch.toUpperCase();
    if (name === "toLowerCase") return ch.toLowerCase();
    throw new Error(`Cannot find method: Character.${name}`);
  }

  evalStringStaticMethod(name, args) {
    if (name === "valueOf") {
      if (args[0] && args[0].__ref && this.heap[args[0].__ref]?.elements && /char/i.test(this.heap[args[0].__ref].type || "")) {
        return this.heap[args[0].__ref].elements.join("");
      }
      return args[0] === null || args[0] === undefined ? "null" : this.stringifyValue(args[0]);
    }
    if (name === "format") return this.formatJavaString(args[0], args.slice(1));
    if (name === "join") {
      if (args[0] === null || args[0] === undefined) throw new Error("NullPointerException");
      const delim = String(args[0]);
      const parts = args.length === 2 && args[1] && args[1].__ref && this.heap[args[1].__ref]?.elements
        ? this.heap[args[1].__ref].elements
        : args.slice(1);
      return parts.map((part) => part === null || part === undefined ? "null" : this.stringifyValue(part)).join(delim);
    }
    throw new Error(`Cannot find method: String.${name}`);
  }

  compareJavaStrings(left, right) {
    const n = Math.min(left.length, right.length);
    for (let i = 0; i < n; i++) {
      const diff = left.charCodeAt(i) - right.charCodeAt(i);
      if (diff !== 0) return diff;
    }
    return left.length - right.length;
  }

  javaSubstring(text, begin, end = text.length) {
    const start = Number(begin);
    const stop = Number(end);
    if (!Number.isInteger(start) || !Number.isInteger(stop) || start < 0 || stop > text.length || start > stop) {
      throw new Error(`StringIndexOutOfBoundsException: begin ${begin}, end ${end}, length ${text.length}`);
    }
    return text.slice(start, stop);
  }

  literalReplace(text, find, repl) {
    if (find === "") return repl + text.split("").join(repl) + repl;
    return text.split(find).join(repl);
  }

  evalStringMethod(text, name, args) {
    const missing = () => { throw new Error(`Cannot find method: String.${name}`); };
    switch (name) {
      case "length": return text.length;
      case "isEmpty": return text.length === 0;
      case "isBlank": return text.trim().length === 0;
      case "charAt": {
        const i = Number(args[0]);
        if (!Number.isInteger(i) || i < 0 || i >= text.length) {
          throw new Error(`StringIndexOutOfBoundsException: String index out of range: ${args[0]}`);
        }
        return text.charAt(i);
      }
      case "substring":
        return this.javaSubstring(text, args[0], args.length > 1 ? args[1] : text.length);
      case "equals":
        return typeof args[0] === "string" && text === args[0];
      case "equalsIgnoreCase":
        return typeof args[0] === "string" && text.toLowerCase() === args[0].toLowerCase();
      case "contains":
        if (typeof args[0] !== "string") throw new Error("NullPointerException");
        return text.includes(args[0]);
      case "startsWith":
        if (typeof args[0] !== "string") throw new Error("NullPointerException");
        return args.length > 1 ? text.startsWith(args[0], Number(args[1])) : text.startsWith(args[0]);
      case "endsWith":
        if (typeof args[0] !== "string") throw new Error("NullPointerException");
        return text.endsWith(args[0]);
      case "indexOf":
      case "lastIndexOf": {
        const from = args.length > 1 ? Number(args[1]) : (name === "lastIndexOf" ? text.length : 0);
        const needle = typeof args[0] === "number" ? String.fromCharCode(args[0]) : String(args[0] ?? "");
        return name === "indexOf" ? text.indexOf(needle, from) : text.lastIndexOf(needle, from);
      }
      case "toLowerCase": return text.toLowerCase();
      case "toUpperCase": return text.toUpperCase();
      case "trim": return text.trim();
      case "strip": return text.trim();
      case "stripLeading": return text.trimStart();
      case "stripTrailing": return text.trimEnd();
      case "toCharArray": return this.createArray("char[]", text.split(""));
      case "split": {
        let pattern;
        try {
          pattern = new RegExp(String(args[0]));
        } catch (err) {
          throw new Error(`PatternSyntaxException: ${args[0]}`);
        }
        const limit = args.length > 1 ? Number(args[1]) : 0;
        const parts = limit > 0 ? text.split(pattern, limit) : text.split(pattern);
        if (!(limit > 0)) {
          while (parts.length > 1 && parts[parts.length - 1] === "") parts.pop();
        }
        return this.createArray("String[]", parts);
      }
      case "replace":
        return this.literalReplace(text, String(args[0] ?? ""), String(args[1] ?? ""));
      case "replaceAll":
        try {
          return text.replace(new RegExp(String(args[0]), "g"), String(args[1] ?? ""));
        } catch (err) {
          throw new Error(`PatternSyntaxException: ${args[0]}`);
        }
      case "replaceFirst":
        try {
          return text.replace(new RegExp(String(args[0])), String(args[1] ?? ""));
        } catch (err) {
          throw new Error(`PatternSyntaxException: ${args[0]}`);
        }
      case "concat":
        if (args[0] === null || args[0] === undefined) throw new Error("NullPointerException");
        return text + String(args[0]);
      case "compareTo":
        if (typeof args[0] !== "string") throw new Error("NullPointerException");
        return this.compareJavaStrings(text, args[0]);
      case "compareToIgnoreCase":
        if (typeof args[0] !== "string") throw new Error("NullPointerException");
        return this.compareJavaStrings(text.toLowerCase(), args[0].toLowerCase());
      case "repeat": {
        const count = Number(args[0]);
        if (!Number.isInteger(count) || count < 0) throw new Error("IllegalArgumentException");
        return text.repeat(count);
      }
      case "matches":
        try {
          return new RegExp(`^(?:${args[0]})$`).test(text);
        } catch (err) {
          throw new Error(`PatternSyntaxException: ${args[0]}`);
        }
      case "toString":
      case "intern":
        return text;
      default:
        missing();
    }
  }

  evalStringBuilderMethod(target, heapObj, name, args) {
    if (name === "append") {
      heapObj.text += args[0] === null || args[0] === undefined ? "null" : this.stringifyValue(args[0]);
      return target;
    }
    if (name === "toString") return heapObj.text;
    if (name === "length") return heapObj.text.length;
    if (name === "reverse") {
      heapObj.text = heapObj.text.split("").reverse().join("");
      return target;
    }
    if (name === "charAt") return this.evalStringMethod(heapObj.text, "charAt", args);
    if (name === "substring") return this.javaSubstring(heapObj.text, args[0], args.length > 1 ? args[1] : heapObj.text.length);
    if (name === "delete") {
      const start = Number(args[0]);
      const end = Number(args[1]);
      heapObj.text = heapObj.text.slice(0, start) + heapObj.text.slice(end);
      return target;
    }
    if (name === "insert") {
      const offset = Number(args[0]);
      const extra = args[1] === null || args[1] === undefined ? "null" : this.stringifyValue(args[1]);
      heapObj.text = heapObj.text.slice(0, offset) + extra + heapObj.text.slice(offset);
      return target;
    }
    throw new Error(`Cannot find method: StringBuilder.${name}`);
  }

  randomNextBits(obj, bits) {
    obj.rngSeed = (obj.rngSeed * JAVA_RANDOM_MULTIPLIER + JAVA_RANDOM_ADDEND) & JAVA_RANDOM_MASK;
    return Number(obj.rngSeed >> BigInt(48 - bits));
  }

  randomNextIntBounded(obj, bound) {
    bound = Math.trunc(Number(bound));
    if (!(bound > 0)) throw new Error("IllegalArgumentException: bound must be positive");
    if ((bound & -bound) === bound) {
      return Number((BigInt(bound) * BigInt(this.randomNextBits(obj, 31))) >> 31n);
    }
    let bits;
    let val;
    do {
      bits = this.randomNextBits(obj, 31);
      val = bits % bound;
    } while ((((bits - val) + (bound - 1)) | 0) < 0);
    return val;
  }

  noteRandom(obj, value) {
    obj.attrs.calls += 1;
    obj.attrs.last = value;
    return value;
  }

  evalRandomMethod(obj, name, args) {
    if (name === "setSeed") {
      const userSeed = Math.trunc(Number(args[0]));
      obj.rngSeed = javaRandomScramble(userSeed);
      obj.attrs.seed = userSeed;
      obj.attrs.calls = 0;
      obj.attrs.last = null;
      return null;
    }
    if (name === "nextInt") {
      let value;
      if (args.length >= 2) {
        const origin = Math.trunc(Number(args[0]));
        const bound = Math.trunc(Number(args[1]));
        const span = bound - origin;
        if (!(span > 0)) throw new Error("IllegalArgumentException: bound must be greater than origin");
        value = this.randomNextIntBounded(obj, span) + origin;
      } else if (args.length === 1) {
        value = this.randomNextIntBounded(obj, args[0]);
      } else {
        value = this.randomNextBits(obj, 32) | 0;
      }
      return this.noteRandom(obj, value);
    }
    if (name === "nextLong") {
      const hi = BigInt(this.randomNextBits(obj, 32) | 0);
      const lo = BigInt(this.randomNextBits(obj, 32) >>> 0);
      return this.noteRandom(obj, Number((hi << 32n) + lo));
    }
    if (name === "nextDouble") {
      const high = BigInt(this.randomNextBits(obj, 26));
      const low = BigInt(this.randomNextBits(obj, 27));
      return this.noteRandom(obj, Number((high << 27n) + low) / Number(1n << 53n));
    }
    if (name === "nextFloat") {
      return this.noteRandom(obj, this.randomNextBits(obj, 24) / 16777216);
    }
    if (name === "nextBoolean") {
      return this.noteRandom(obj, this.randomNextBits(obj, 1) !== 0);
    }
    throw new Error(`Cannot find method: Random.${name}`);
  }

  syncScanner(obj) {
    obj.attrs.remaining = obj.text.slice(obj.pos);
    obj.attrs.closed = obj.closed;
  }

  requireOpenScanner(obj) {
    if (obj.closed) throw new Error("IllegalStateException: Scanner closed");
  }

  scannerSkipSpace(obj) {
    while (obj.pos < obj.text.length && /\s/u.test(obj.text[obj.pos])) obj.pos++;
  }

  scannerPeekToken(obj) {
    const saved = obj.pos;
    this.scannerSkipSpace(obj);
    if (obj.pos >= obj.text.length) {
      obj.pos = saved;
      return null;
    }
    let end = obj.pos;
    while (end < obj.text.length && !/\s/u.test(obj.text[end])) end++;
    const token = obj.text.slice(obj.pos, end);
    obj.pos = saved;
    return token;
  }

  scannerNextToken(obj) {
    this.requireOpenScanner(obj);
    this.scannerSkipSpace(obj);
    if (obj.pos >= obj.text.length) throw new Error("NoSuchElementException");
    let end = obj.pos;
    while (end < obj.text.length && !/\s/u.test(obj.text[end])) end++;
    const token = obj.text.slice(obj.pos, end);
    obj.pos = end;
    this.syncScanner(obj);
    return token;
  }

  scannerNextLine(obj) {
    this.requireOpenScanner(obj);
    if (obj.pos >= obj.text.length) throw new Error("NoSuchElementException");
    let end = obj.pos;
    while (end < obj.text.length && obj.text[end] !== "\n") end++;
    const line = obj.text.slice(obj.pos, end);
    obj.pos = end < obj.text.length ? end + 1 : end;
    this.syncScanner(obj);
    return line;
  }

  scannerTokenIsInt(token) {
    return /^[+-]?\d+$/.test(token);
  }

  scannerTokenIsDouble(token) {
    return /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(token) || /^(?:[+-]?Infinity|NaN)$/.test(token);
  }

  scannerTokenIsBoolean(token) {
    return /^true$/i.test(token) || /^false$/i.test(token);
  }

  evalScannerMethod(obj, name, args) {
    if (name === "close") {
      obj.closed = true;
      this.syncScanner(obj);
      return null;
    }
    if (name === "hasNext") {
      this.requireOpenScanner(obj);
      return this.scannerPeekToken(obj) !== null;
    }
    if (name === "hasNextLine") {
      this.requireOpenScanner(obj);
      return obj.pos < obj.text.length;
    }
    if (name === "hasNextInt") {
      this.requireOpenScanner(obj);
      const token = this.scannerPeekToken(obj);
      return token !== null && this.scannerTokenIsInt(token);
    }
    if (name === "hasNextDouble" || name === "hasNextFloat") {
      this.requireOpenScanner(obj);
      const token = this.scannerPeekToken(obj);
      return token !== null && this.scannerTokenIsDouble(token);
    }
    if (name === "hasNextBoolean") {
      this.requireOpenScanner(obj);
      const token = this.scannerPeekToken(obj);
      return token !== null && this.scannerTokenIsBoolean(token);
    }
    if (name === "next") return this.scannerNextToken(obj);
    if (name === "nextLine") return this.scannerNextLine(obj);
    if (name === "nextInt") {
      const token = this.scannerNextToken(obj);
      if (!this.scannerTokenIsInt(token)) throw new Error(`InputMismatchException: '${token}'`);
      return parseInt(token, 10);
    }
    if (name === "nextLong") {
      const token = this.scannerNextToken(obj);
      if (!this.scannerTokenIsInt(token)) throw new Error(`InputMismatchException: '${token}'`);
      return Number(token);
    }
    if (name === "nextDouble" || name === "nextFloat") {
      const token = this.scannerNextToken(obj);
      if (!this.scannerTokenIsDouble(token)) throw new Error(`InputMismatchException: '${token}'`);
      return Number(token);
    }
    if (name === "nextBoolean") {
      const token = this.scannerNextToken(obj);
      if (!this.scannerTokenIsBoolean(token)) throw new Error(`InputMismatchException: '${token}'`);
      return /^true$/i.test(token);
    }
    throw new Error(`Cannot find method: Scanner.${name}`);
  }

  applyBinaryOperator(op, left, right) {
    if (op === "+") {
      if (typeof left === "string" || typeof right === "string") {
        return this.stringifyValue(left) + this.stringifyValue(right);
      }
      return Number(left) + Number(right);
    }
    if (op === "-") return Number(left) - Number(right);
    if (op === "*") return Number(left) * Number(right);
    if (op === "/") {
      if (Number(right) === 0) throw new Error("ArithmeticException: / by zero");
      const res = Number(left) / Number(right);
      return Number.isInteger(left) && Number.isInteger(right) ? Math.trunc(res) : res;
    }
    if (op === "%") return Number(left) % Number(right);
    if (op === "==") {
      if (left && left.__ref && right && right.__ref) return left.__ref === right.__ref;
      return left === right;
    }
    if (op === "!=") {
      if (left && left.__ref && right && right.__ref) return left.__ref !== right.__ref;
      return left !== right;
    }
    if (op === "<") return Number(left) < Number(right);
    if (op === "<=") return Number(left) <= Number(right);
    if (op === ">") return Number(left) > Number(right);
    if (op === ">=") return Number(left) >= Number(right);
    if (op === "&") return Number(left) & Number(right);
    if (op === "|") return Number(left) | Number(right);
    if (op === "^") return Number(left) ^ Number(right);
    return null;
  }

  stringifyValue(val) {
    if (val === null || val === undefined) return "null";
    if (val && val.__ref && this.heap[val.__ref]) {
      const obj = this.heap[val.__ref];
      if (obj.elements) return `[${obj.elements.map((e) => this.stringifyValue(e)).join(", ")}]`;
      if (obj.entries) return `{${obj.entries.map(([k, v]) => `${this.stringifyValue(k)}=${this.stringifyValue(v)}`).join(", ")}}`;
      if (obj.text !== undefined) return obj.text;
      return `${obj.type}@${obj.id}`;
    }
    return String(val);
  }

  createArray(type, elements) {
    const id = this.allocateId();
    this.heap[id] = { id, type, elements };
    return { __ref: id };
  }

  createArrayList(initial = []) {
    const id = this.allocateId();
    this.heap[id] = { id, type: "ArrayList", elements: [...initial] };
    return { __ref: id };
  }

  createHashMap() {
    const id = this.allocateId();
    this.heap[id] = { id, type: "HashMap", entries: [] };
    return { __ref: id };
  }

  createHashSet() {
    const id = this.allocateId();
    this.heap[id] = { id, type: "HashSet", elements: [] };
    return { __ref: id };
  }

  createArrayDeque() {
    const id = this.allocateId();
    this.heap[id] = { id, type: "ArrayDeque", elements: [] };
    return { __ref: id };
  }

  createStringBuilder(initial = "") {
    const id = this.allocateId();
    this.heap[id] = { id, type: "StringBuilder", text: String(initial) };
    return { __ref: id };
  }

  createRandom(seed, hasSeed) {
    const id = this.allocateId();
    const userSeed = hasSeed
      ? Math.trunc(Number(seed))
      : (Math.floor(Math.random() * 0x100000000) >>> 0);
    this.heap[id] = {
      id,
      type: "Random",
      rngSeed: javaRandomScramble(userSeed),
      attrs: { seed: userSeed, calls: 0, last: null }
    };
    return { __ref: id };
  }

  createScanner(source) {
    const id = this.allocateId();
    const obj = {
      id,
      type: "Scanner",
      text: String(source ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n"),
      pos: 0,
      closed: false,
      attrs: {}
    };
    this.syncScanner(obj);
    this.heap[id] = obj;
    return { __ref: id };
  }
}

// ---------------------------------------------------------------------------
// Memory Visualizer View Helpers (Names, Frames, Objects)
// ---------------------------------------------------------------------------

function childLabels(object, parentLabel) {
  if (object.elements) {
    return object.elements.map((value, index) => [`${parentLabel}[${index}]`, value]);
  }
  if (object.entries) {
    return object.entries.map(([key, value]) => {
      const keyText = key?.kind === "primitive" ? key.value : "...";
      return [`${parentLabel}[${keyText}]`, value];
    });
  }
  if (object.attrs) {
    return Object.entries(object.attrs).map(([name, value]) => [`${parentLabel}.${name}`, value]);
  }
  return [];
}

function buildHeapLabels(frames, heap) {
  const names = new Map();
  (frames || []).forEach((frame) => {
    Object.entries(frame.locals || {}).forEach(([name, value]) => {
      if (value?.kind !== "ref") return;
      if (!names.has(value.id)) names.set(value.id, []);
      const bound = names.get(value.id);
      if (!bound.includes(name)) bound.push(name);
    });
  });

  const labels = new Map();
  names.forEach((bound, id) => labels.set(id, bound.join(" = ")));

  const pending = [...labels.keys()];
  while (pending.length) {
    const id = pending.shift();
    const object = heap?.[id];
    if (!object) continue;
    childLabels(object, labels.get(id)).forEach(([label, value]) => {
      if (value?.kind !== "ref" || labels.has(value.id)) return;
      labels.set(value.id, label);
      pending.push(value.id);
    });
  }

  return { labels, names };
}

function labelForRef(id, heap, labels) {
  const label = labels?.get(id);
  if (label) return label;
  const type = heap?.[id]?.type || "Object";
  return `${type} #${id.slice(-4)}`;
}

function renderEncodedInline(encoded, heap, labels) {
  if (!encoded) return `<span class="heap-value">?</span>`;
  if (encoded.kind === "ref") {
    return `<span class="heap-value is-ref">→ ${escapeHtml(labelForRef(encoded.id, heap, labels))}</span>`;
  }
  return `<span class="heap-value">${escapeHtml(encoded.value)}</span>`;
}

function renderFrameValue(name, encoded, heap, labels, names) {
  if (!encoded) return "";
  if (encoded.kind !== "ref") {
    return `<span class="frame-var-value">${escapeHtml(encoded.value)}</span>`;
  }
  const type = heap?.[encoded.id]?.type || "Object";
  const bound = names?.get(encoded.id) || [];
  const text = bound.includes(name) ? type : `${labelForRef(encoded.id, heap, labels)} (${type})`;
  return `<span class="frame-var-value is-ref">→ ${escapeHtml(text)}</span>`;
}

function renderTutorFrames(frames, heap, labels, names) {
  if (!frames?.length) {
    tutorFrames.innerHTML = `<p class="tutor-empty">No active frames.</p>`;
    return;
  }
  tutorFrames.innerHTML = frames.map((frame, index) => {
    const active = index === frames.length - 1 ? " active-frame" : "";
    const vars = Object.entries(frame.locals);
    const body = vars.length
      ? vars.map(([name, value]) =>
          `<div class="frame-var"><span class="frame-var-name">${escapeHtml(name)}</span><span class="frame-var-eq">=</span>${renderFrameValue(name, value, heap, labels, names)}</div>`
        ).join("")
      : `<p class="tutor-empty">Empty</p>`;
    return `<article class="frame-card${active}"><div class="frame-title">${escapeHtml(frame.name)}</div><div class="frame-vars">${body}</div></article>`;
  }).join("");
}

function renderTutorHeap(heap, labels) {
  const objects = Object.values(heap || {});
  if (!objects.length) {
    tutorHeap.innerHTML = `<p class="tutor-empty">Primitives live in frames. Arrays, Collections, and Objects appear here.</p>`;
    return;
  }
  tutorHeap.innerHTML = objects.map((object) => {
    let body = "";
    if (object.entries) {
      body = object.entries.map(([key, value]) =>
        `<div class="heap-dict-row">${renderEncodedInline(key, heap, labels)}<span class="heap-dict-arrow">→</span>${renderEncodedInline(value, heap, labels)}</div>`
      ).join("");
    } else if (object.elements) {
      body = object.elements.map((value, index) =>
        `<div class="heap-row"><span class="heap-index">${index}</span>${renderEncodedInline(value, heap, labels)}</div>`
      ).join("");
    } else if (object.attrs) {
      body = Object.entries(object.attrs).map(([name, value]) =>
        `<div class="heap-dict-row"><span class="heap-dict-key">${escapeHtml(name)}</span><span class="heap-dict-arrow">=</span>${renderEncodedInline(value, heap, labels)}</div>`
      ).join("");
    }
    if (!body) body = `<p class="tutor-empty">Empty</p>`;
    const label = labelForRef(object.id, heap, labels);
    return `<article class="heap-object"><div class="heap-object-title"><span class="heap-object-name">${escapeHtml(label)}</span><span class="heap-object-type">${escapeHtml(object.type)}</span></div><div class="heap-object-body">${body}</div></article>`;
  }).join("");
}

// ---------------------------------------------------------------------------
// Linked List View
// ---------------------------------------------------------------------------

const LIST_VALUE_KEYS = ["val", "value", "data", "key", "item", "name"];
const LIST_POINTER_ATTR_PATTERN = /^(head|tail|first|last|front|rear|top)$/i;
const POINTER_KIND_RANK = { active: 0, outer: 1, attr: 2 };

function isListNode(id, heap) {
  const object = heap?.[id];
  return Boolean(object?.attrs && "next" in object.attrs);
}

function listNextId(id, heap) {
  const next = heap[id].attrs.next;
  return next?.kind === "ref" && isListNode(next.id, heap) ? next.id : null;
}

function listNodeValue(object) {
  const preferred = LIST_VALUE_KEYS.map((key) => object.attrs[key]).find((value) => value?.kind === "primitive");
  const fallback = Object.entries(object.attrs)
    .filter(([name]) => name !== "next" && name !== "prev")
    .map(([, value]) => value)
    .find((value) => value?.kind === "primitive" && value.type !== "null");
  const encoded = preferred || fallback;
  if (!encoded) return object.type;
  let text = encoded.value;
  if (text.length >= 2 && text.startsWith('"') && text.endsWith('"')) text = text.slice(1, -1);
  return text.length > 8 ? `${text.slice(0, 7)}…` : text;
}

// The interpreter never frees objects, so anything not reachable from a frame counts as garbage collected.
function findReachableIds(frames, heap) {
  const reachable = new Set();
  const pending = [];
  (frames || []).forEach((frame) => {
    Object.values(frame.locals || {}).forEach((value) => value?.kind === "ref" && pending.push(value.id));
  });
  while (pending.length) {
    const id = pending.pop();
    if (reachable.has(id) || !heap?.[id]) continue;
    reachable.add(id);
    childLabels(heap[id], "").forEach(([, value]) => value?.kind === "ref" && pending.push(value.id));
  }
  return reachable;
}

function frameNameForObject(id, frames, heap, labels) {
  for (let index = frames.length - 1; index >= 0; index--) {
    const match = Object.entries(frames[index].locals || {}).find(([, value]) => value?.kind === "ref" && value.id === id);
    if (match) return match[0];
  }
  return labelForRef(id, heap, labels);
}

function collectListPointers(frames, heap, labels, reachable) {
  const pointers = new Map();
  const add = (id, name, kind) => {
    if (!pointers.has(id)) pointers.set(id, []);
    const list = pointers.get(id);
    if (!list.some((pointer) => pointer.name === name)) list.push({ name, kind });
  };

  (frames || []).forEach((frame, index) => {
    const kind = index === frames.length - 1 ? "active" : "outer";
    Object.entries(frame.locals || {}).forEach(([name, value]) => {
      if (value?.kind === "ref" && isListNode(value.id, heap)) add(value.id, name, kind);
    });
  });

  reachable.forEach((id) => {
    const object = heap[id];
    if (isListNode(id, heap)) return;
    const owner = frameNameForObject(id, frames, heap, labels);
    childLabels(object, owner).forEach(([label, value]) => {
      if (value?.kind === "ref" && isListNode(value.id, heap)) add(value.id, label, "attr");
    });
  });

  pointers.forEach((list) => list.sort((a, b) => POINTER_KIND_RANK[a.kind] - POINTER_KIND_RANK[b.kind]));
  return pointers;
}

function buildListChains(nodeIds, heap) {
  const incoming = new Set();
  nodeIds.forEach((id) => {
    const next = listNextId(id, heap);
    if (next) incoming.add(next);
  });

  const placed = new Set();
  const chains = [];
  const walk = (start) => {
    const ids = [];
    const inChain = new Set();
    let tail = { kind: "null" };
    let id = start;
    while (id) {
      if (inChain.has(id)) {
        tail = { kind: "cycle", id };
        break;
      }
      if (placed.has(id)) {
        tail = { kind: "join", id };
        break;
      }
      ids.push(id);
      inChain.add(id);
      placed.add(id);
      id = listNextId(id, heap);
    }
    chains.push({ ids, tail });
  };

  nodeIds.filter((id) => !incoming.has(id)).forEach(walk);
  nodeIds.forEach((id) => !placed.has(id) && walk(id));
  return chains;
}

function buildLinkedListModel(frames, heap, labels) {
  const reachable = findReachableIds(frames, heap);
  const allNodeIds = Object.keys(heap || {}).filter((id) => isListNode(id, heap));
  const nodeIds = allNodeIds.filter((id) => reachable.has(id));
  const pointers = collectListPointers(frames, heap, labels, reachable);
  const chains = buildListChains(nodeIds, heap);
  const hasPointer = (chain) => chain.ids.some((id) => pointers.has(id));
  chains.sort((a, b) => Number(hasPointer(b)) - Number(hasPointer(a)));
  return { chains, pointers, garbageCount: allNodeIds.length - nodeIds.length, reachable };
}

function pointerState(list) {
  if (!list?.length) return "";
  return list[0].kind;
}

function renderListLegend(frames, heap, labels, model) {
  const activeFrame = frames?.[frames.length - 1];
  const nullChips = Object.entries(activeFrame?.locals || {})
    .filter(([, value]) => value?.kind === "primitive" && value.type === "null")
    .map(([name]) => `<span class="tree-chip none"><strong>${escapeHtml(name)}</strong> → null</span>`);

  const ownerChips = [];
  model.reachable.forEach((id) => {
    const object = heap[id];
    if (!object.attrs || isListNode(id, heap)) return;
    const entries = Object.entries(object.attrs);
    const pointsAtNodes = entries.some(([name, value]) =>
      (value?.kind === "ref" && isListNode(value.id, heap)) ||
      (LIST_POINTER_ATTR_PATTERN.test(name) && value?.type === "null"));
    if (!pointsAtNodes) return;
    const owner = frameNameForObject(id, frames, heap, labels);
    const fields = entries.map(([name, value]) => {
      const shown = value?.kind === "ref"
        ? isListNode(value.id, heap) ? listNodeValue(heap[value.id]) : labelForRef(value.id, heap, labels)
        : value?.value;
      return `${escapeHtml(name)}: ${escapeHtml(shown ?? "?")}`;
    }).join(", ");
    ownerChips.push(`<span class="tree-chip owner"><strong>${escapeHtml(owner)}</strong> ${escapeHtml(object.type)} { ${fields} }</span>`);
  });

  const frameName = activeFrame ? escapeHtml(activeFrame.name) : "—";
  const extraChips = [...ownerChips, ...nullChips];
  tutorListLegend.innerHTML = `
    <div class="tree-legend-row">
      <span class="tree-key"><span class="tree-swatch active"></span>Variable in ${frameName}</span>
      <span class="tree-key"><span class="tree-swatch outer"></span>Variable in an outer frame</span>
      <span class="tree-key"><span class="tree-swatch attr"></span>Object field</span>
    </div>
    ${extraChips.length ? `<div class="tree-legend-row">${extraChips.join("")}</div>` : ""}
  `;
}

function renderListSlot(id, heap, labels, pointers) {
  const nodePointers = pointers.get(id) || [];
  const state = pointerState(nodePointers);
  const pills = nodePointers.map((pointer) =>
    `<span class="list-pointer ${pointer.kind}">${escapeHtml(pointer.name)}</span>`
  ).join("");
  const object = heap[id];
  const tooltip = `${labelForRef(id, heap, labels)} (${object.type})\n` +
    Object.entries(object.attrs).map(([name, value]) =>
      `${name} = ${value?.kind === "ref" ? labelForRef(value.id, heap, labels) : value?.value}`
    ).join("\n");
  return `
    <div class="list-slot">
      <div class="list-pointers">
        ${pills}
        ${nodePointers.length ? `<span class="list-pointer-arrow ${state}">↓</span>` : ""}
      </div>
      <div class="list-node ${state}" title="${escapeHtml(tooltip)}">
        <span class="list-node-val">${escapeHtml(listNodeValue(object))}</span>
        <span class="list-node-next">next</span>
      </div>
    </div>`;
}

function renderListLink(fromId, toId, heap) {
  const prev = toId ? heap[toId]?.attrs?.prev : null;
  const doubly = prev?.kind === "ref" && prev.id === fromId;
  return `<span class="list-link${doubly ? " doubly" : ""}" title="${doubly ? "next / prev" : "next"}">${doubly ? "⇄" : "→"}</span>`;
}

function renderListTail(tail, heap) {
  if (tail.kind === "null") {
    return `<div class="list-slot"><div class="list-pointers"></div><div class="list-null">null</div></div>`;
  }
  const value = escapeHtml(listNodeValue(heap[tail.id]));
  const text = tail.kind === "cycle" ? `↺ back to ${value}` : `↪ joins ${value}`;
  return `<div class="list-slot"><div class="list-pointers"></div><div class="list-null list-ref">${text}</div></div>`;
}

function renderTutorList(frames, heap, labels) {
  const model = buildLinkedListModel(frames, heap, labels);
  renderListLegend(frames, heap, labels, model);

  if (!model.chains.length) {
    tutorListCanvas.innerHTML = `<p class="tutor-empty">No linked list nodes in memory at this step. A node is any class instance with a <code>next</code> field.</p>`;
    return;
  }

  const rows = model.chains.map((chain) => {
    const parts = [];
    chain.ids.forEach((id, index) => {
      parts.push(renderListSlot(id, heap, labels, model.pointers));
      const nextId = chain.ids[index + 1] || (chain.tail.kind === "null" ? null : chain.tail.id);
      parts.push(renderListLink(id, nextId, heap));
    });
    parts.push(renderListTail(chain.tail, heap));
    const count = chain.ids.length;
    return `
      <div class="list-chain">
        <div class="list-chain-meta">${count} node${count === 1 ? "" : "s"}</div>
        <div class="list-track">${parts.join("")}</div>
      </div>`;
  }).join("");

  const garbage = model.garbageCount
    ? `<p class="list-garbage">${model.garbageCount} unreachable node${model.garbageCount === 1 ? "" : "s"} hidden (nothing points to ${model.garbageCount === 1 ? "it" : "them"}, so Java would garbage collect ${model.garbageCount === 1 ? "it" : "them"}).</p>`
    : "";
  tutorListCanvas.innerHTML = rows + garbage;

  const focus = tutorListCanvas.querySelector(".list-node.active");
  if (focus) focus.scrollIntoView({ block: "nearest", inline: "nearest" });
}

function applyTutorView(tab) {
  const showList = tab?.tutorView === "list";
  tutorListView.hidden = !showList;
  tutorMemoryLayout.hidden = showList;
  tutorMemoryViewButton.classList.toggle("active", !showList);
  tutorListViewButton.classList.toggle("active", showList);
  tutorMemoryViewButton.setAttribute("aria-selected", String(!showList));
  tutorListViewButton.setAttribute("aria-selected", String(showList));
}

function setTutorView(view) {
  const tab = getActiveTab();
  if (!tab) return;
  tab.tutorView = view;
  applyTutorView(tab);
  if (tab.tutorActive) showTutorStep(tab.tutorStepIndex);
}

function renderTraceCode(code, activeLine) {
  const lines = (code || "").split("\n");
  traceCode.innerHTML = lines.map((line, index) => {
    const lineNumber = index + 1;
    const active = lineNumber === activeLine ? " active" : "";
    const content = line.length ? highlightJava(line) : " ";
    return `<li class="${active.trim()}" data-line="${lineNumber}">${content}</li>`;
  }).join("");
  const activeItem = traceCode.querySelector("li.active");
  if (activeItem) {
    activeItem.scrollIntoView({ block: "nearest" });
  }
}

// ---------------------------------------------------------------------------
// Multi-Tab & File Management
// ---------------------------------------------------------------------------

function getActiveTab() {
  return tabs.find((t) => t.id === activeTabId) || null;
}

function createTab(initialCode = null) {
  tabCounter++;
  const num = tabCounter;
  const newTab = {
    id: `tab-${num}`,
    number: num,
    title: `Tab ${num}`,
    code: initialCode !== null ? initialCode : "",
    consoleOutput: "Run or Visualize to see output...",
    stdin: "",
    tutorActive: false,
    tutorSteps: [],
    tutorStepIndex: 0,
    tutorStatus: "",
    tutorView: "memory"
  };
  tabs.push(newTab);
  switchTab(newTab.id);
  return newTab;
}

function switchTab(targetTabId) {
  const currentTab = getActiveTab();
  if (currentTab && currentTab.id !== targetTabId) {
    if (!currentTab.tutorActive) {
      currentTab.code = notesText.value;
      currentTab.consoleOutput = scratchConsole.textContent;
    }
    if (stdinText) currentTab.stdin = stdinText.value;
  }

  activeTabId = targetTabId;
  const tab = getActiveTab();
  if (!tab) return;

  renderTabsUI();
  syncTabToUI(tab);
}

function closeTab(targetTabId) {
  if (tabs.length <= 1) return;
  const index = tabs.findIndex((t) => t.id === targetTabId);
  if (index === -1) return;

  let nextActiveId = activeTabId;
  if (targetTabId === activeTabId) {
    const nextTab = index > 0 ? tabs[index - 1] : tabs[index + 1];
    nextActiveId = nextTab.id;
  }

  tabs = tabs.filter((t) => t.id !== targetTabId);

  if (targetTabId === activeTabId) {
    switchTab(nextActiveId);
  } else {
    renderTabsUI();
  }
}

function renderTabsUI() {
  const showClose = tabs.length > 1;
  editorTabsContainer.innerHTML = tabs.map((tab) => {
    const isActive = tab.id === activeTabId;
    return `
      <button
        class="editor-tab${isActive ? " active" : ""}"
        type="button"
        role="tab"
        aria-selected="${isActive}"
        data-tab-id="${tab.id}"
        title="File ${tab.number}"
      >
        <span class="tab-title">${escapeHtml(tab.title)}</span>
        ${
          showClose
            ? `<span class="tab-close" data-close-tab-id="${tab.id}" title="Close ${escapeHtml(tab.title)}" aria-label="Close ${escapeHtml(tab.title)}">×</span>`
            : ""
        }
      </button>
    `;
  }).join("");
}

function syncTabToUI(tab) {
  consoleHeading.textContent = `Console — ${tab.title}`;
  if (stdinText) stdinText.value = tab.stdin || "";
  applyTutorView(tab);

  if (tab.tutorActive) {
    scratchEditor.classList.add("tracing");
    traceCode.hidden = false;
    tutorPanel.hidden = false;
    idlePanel.hidden = true;
    exitTutorButton.hidden = false;
    runButton.hidden = true;
    visualizeButton.hidden = true;
    showTutorStep(tab.tutorStepIndex);
  } else {
    scratchEditor.classList.remove("tracing");
    traceCode.hidden = true;
    tutorPanel.hidden = true;
    idlePanel.hidden = false;
    exitTutorButton.hidden = true;
    runButton.hidden = false;
    visualizeButton.hidden = false;
    notesText.value = tab.code;
    updateSyntaxHighlight();
    scratchConsole.textContent = tab.consoleOutput || "Run or Visualize to see output...";
  }
}

function exitTutorMode(clearConsole = true) {
  const tab = getActiveTab();
  if (!tab) return;
  tab.tutorActive = false;
  tab.tutorSteps = [];
  tab.tutorStepIndex = 0;
  tab.tutorStatus = "";
  if (clearConsole) {
    tab.consoleOutput = "Run or Visualize to see output...";
  }
  syncTabToUI(tab);
}

// ---------------------------------------------------------------------------
// Stepper Controls
// ---------------------------------------------------------------------------

function findNextLoopIterationIndex(tab) {
  if (!tab || !tab.tutorSteps?.length) return -1;
  const current = tab.tutorSteps[tab.tutorStepIndex];
  let targetHeader = null;
  if (current?.is_loop_header) {
    targetHeader = current.line;
  } else {
    for (let index = tab.tutorStepIndex; index >= 0; index--) {
      if (tab.tutorSteps[index].is_loop_header) {
        targetHeader = tab.tutorSteps[index].line;
        break;
      }
    }
  }

  if (targetHeader != null) {
    for (let index = tab.tutorStepIndex + 1; index < tab.tutorSteps.length; index++) {
      if (tab.tutorSteps[index].is_loop_header && tab.tutorSteps[index].line === targetHeader) {
        return index;
      }
    }
  }

  for (let index = tab.tutorStepIndex + 1; index < tab.tutorSteps.length; index++) {
    if (tab.tutorSteps[index].is_loop_header) return index;
  }
  return -1;
}

function updateTutorControls(tab) {
  if (!tab || !tab.tutorSteps.length) return;
  const lastIndex = Math.max(tab.tutorSteps.length - 1, 0);
  tutorPrev.disabled = tab.tutorStepIndex <= 0;
  tutorNext.disabled = tab.tutorStepIndex >= lastIndex;
  tutorSlider.max = String(lastIndex);
  tutorSlider.value = String(tab.tutorStepIndex);

  const nextIter = findNextLoopIterationIndex(tab);
  tutorNextIter.disabled = nextIter < 0;
  tutorNextIter.dataset.target = String(nextIter);
}

function showTutorStep(index) {
  const tab = getActiveTab();
  if (!tab || !tab.tutorSteps.length) return;

  tab.tutorStepIndex = Math.max(0, Math.min(index, tab.tutorSteps.length - 1));
  const step = tab.tutorSteps[tab.tutorStepIndex];
  const isFinished = step.event === "finished";
  const isError = step.event === "exception";

  tutorStepCount.textContent = `Step ${tab.tutorStepIndex + 1} of ${tab.tutorSteps.length}`;
  tutorLineLabel.textContent = isFinished
    ? "Program finished"
    : `About to run line ${step.line}`;

  renderTraceCode(tab.code, isFinished ? null : step.line);
  const { labels, names } = buildHeapLabels(step.frames, step.heap);
  if (tab.tutorView === "list") {
    renderTutorList(step.frames, step.heap, labels);
  } else {
    renderTutorFrames(step.frames, step.heap, labels, names);
    renderTutorHeap(step.heap, labels);
  }

  const stepOutput = step.stdout?.trim()
    ? step.stdout.replace(/\n$/, "")
    : isFinished && !step.error
      ? "Program finished with no output."
      : "";
  scratchConsole.textContent = stepOutput;
  tab.consoleOutput = stepOutput;

  if (isError && step.error) {
    tutorStatus.textContent = step.error;
    const combined = step.stdout?.trim() ? `${step.stdout.replace(/\n$/, "")}\n${step.error}` : step.error;
    scratchConsole.textContent = combined;
    tab.consoleOutput = combined;
  } else if (isFinished) {
    tutorStatus.textContent = "Done. Use Previous to review earlier steps.";
  } else if (step.is_loop_header) {
    tutorStatus.textContent = "Loop header — Next loop iteration jumps to the next time this loop runs.";
  } else {
    tutorStatus.textContent = "Highlighted line is about to execute.";
  }

  updateTutorControls(tab);
}

// ---------------------------------------------------------------------------
// Run & Visualize Execution
// ---------------------------------------------------------------------------

function executeJavaCode(source, stdin = "") {
  const tokens = tokenizeJava(source);
  const parser = new JavaParser(tokens);
  const ast = parser.parseProgram();
  const interpreter = new JavaInterpreter(ast, stdin);
  return interpreter.run();
}

function runScratchCode() {
  const tab = getActiveTab();
  if (!tab) return;
  tab.code = notesText.value;

  runButton.disabled = true;
  visualizeButton.disabled = true;

  try {
    exitTutorMode(false);
    tab.stdin = stdinText ? stdinText.value : (tab.stdin || "");
    const result = executeJavaCode(tab.code, tab.stdin);
    const lastStep = result.steps[result.steps.length - 1];
    let outputText = "";

    if (lastStep?.event === "exception" && lastStep.error) {
      outputText = (lastStep.stdout ? lastStep.stdout + "\n" : "") + `Exception: ${lastStep.error}`;
    } else {
      outputText = lastStep?.stdout?.trim()
        ? lastStep.stdout.replace(/\n$/, "")
        : "Program finished with no output.";
    }

    scratchConsole.textContent = outputText;
    tab.consoleOutput = outputText;
  } catch (error) {
    const errorMsg = `Error: ${error.message}`;
    scratchConsole.textContent = errorMsg;
    tab.consoleOutput = errorMsg;
  } finally {
    runButton.disabled = false;
    visualizeButton.disabled = false;
  }
}

function visualizeScratchCode() {
  const tab = getActiveTab();
  if (!tab) return;
  tab.code = notesText.value;

  visualizeButton.disabled = true;
  runButton.disabled = true;

  try {
    tab.stdin = stdinText ? stdinText.value : (tab.stdin || "");
    const data = executeJavaCode(tab.code, tab.stdin);
    tab.tutorSteps = data.steps || [];
    if (!tab.tutorSteps.length) {
      throw new Error("No execution steps were produced.");
    }
    tab.tutorActive = true;
    tab.tutorStepIndex = 0;
    syncTabToUI(tab);
    if (data.truncated) {
      tutorStatus.textContent = `Stopped after ${tab.tutorSteps.length} steps to keep the browser responsive.`;
    }
  } catch (error) {
    exitTutorMode(false);
    const errorMsg = `Error: ${error.message}`;
    scratchConsole.textContent = errorMsg;
    tab.consoleOutput = errorMsg;
  } finally {
    visualizeButton.disabled = false;
    runButton.disabled = false;
  }
}

// ---------------------------------------------------------------------------
// Event Listeners & Initialization
// ---------------------------------------------------------------------------

if (isBrowser) {
  editorTabsContainer.addEventListener("click", (event) => {
    const closeBtn = event.target.closest("[data-close-tab-id]");
    if (closeBtn) {
      event.stopPropagation();
      closeTab(closeBtn.dataset.closeTabId);
      return;
    }
    const tabBtn = event.target.closest("[data-tab-id]");
    if (tabBtn) {
      switchTab(tabBtn.dataset.tabId);
    }
  });

  addTabButton.addEventListener("click", () => {
    createTab("");
    notesText.focus();
  });

  resetButton.addEventListener("click", () => {
    const tab = getActiveTab();
    if (!tab) return;
    if (tab.tutorActive) {
      exitTutorMode(false);
    }
    tab.code = tab.number === 1 ? INITIAL_CODE_TAB_1 : "";
    tab.consoleOutput = "Run or Visualize to see output...";
    tab.stdin = "";
    notesText.value = tab.code;
    if (stdinText) stdinText.value = "";
    updateSyntaxHighlight();
    scratchConsole.textContent = tab.consoleOutput;
    notesText.focus();
  });

  notesText.addEventListener("input", () => {
    const tab = getActiveTab();
    if (tab) {
      tab.code = notesText.value;
    }
    updateSyntaxHighlight();
  });

  notesText.addEventListener("scroll", syncEditorScroll);

  if (stdinText) {
    stdinText.addEventListener("input", () => {
      const tab = getActiveTab();
      if (tab) tab.stdin = stdinText.value;
    });
  }

  notesText.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    event.preventDefault();

    const start = notesText.selectionStart;
    const end = notesText.selectionEnd;
    const indentation = "    ";
    notesText.setRangeText(indentation, start, end, "end");
    const tab = getActiveTab();
    if (tab) {
      tab.code = notesText.value;
    }
    updateSyntaxHighlight();
  });

  runButton.addEventListener("click", runScratchCode);
  visualizeButton.addEventListener("click", visualizeScratchCode);
  exitTutorButton.addEventListener("click", () => exitTutorMode(true));
  tutorMemoryViewButton.addEventListener("click", () => setTutorView("memory"));
  tutorListViewButton.addEventListener("click", () => setTutorView("list"));

  tutorPrev.addEventListener("click", () => {
    const tab = getActiveTab();
    if (tab) showTutorStep(tab.tutorStepIndex - 1);
  });

  tutorNext.addEventListener("click", () => {
    const tab = getActiveTab();
    if (tab) showTutorStep(tab.tutorStepIndex + 1);
  });

  tutorFirst.addEventListener("click", () => {
    showTutorStep(0);
  });

  tutorLast.addEventListener("click", () => {
    const tab = getActiveTab();
    if (tab) showTutorStep(tab.tutorSteps.length - 1);
  });

  tutorNextIter.addEventListener("click", () => {
    const target = Number(tutorNextIter.dataset.target);
    if (target >= 0) showTutorStep(target);
  });

  tutorSlider.addEventListener("input", () => {
    showTutorStep(Number(tutorSlider.value));
  });

  clearScratchConsole.addEventListener("click", () => {
    const tab = getActiveTab();
    if (tab) {
      tab.consoleOutput = "";
    }
    scratchConsole.textContent = "";
  });

  // Initialize App
  createTab(INITIAL_CODE_TAB_1);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    tokenizeJava,
    JavaParser,
    JavaInterpreter,
    executeJavaCode,
    highlightJava,
    buildHeapLabels
  };
}
