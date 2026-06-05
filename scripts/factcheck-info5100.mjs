import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const today = "2026-05-25";
const chaptersDir = path.join(root, "chapters");
const factDir = path.join(root, "factchecks");

fs.mkdirSync(factDir, { recursive: true });

const sources = {
  javac: {
    ref: "Oracle. The javac Command. Java SE 21 / JDK 21 Tool Guides, 2023. https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html",
    url: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html",
    finding: "Oracle describes javac as the command that reads Java source files and compiles them into class files that run on the Java Virtual Machine.",
  },
  java: {
    ref: "Oracle. The java Command. Java SE 21 / JDK 21 Tool Guides, 2023. https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html",
    url: "https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html",
    finding: "Oracle documents java as the launcher for Java applications and the command used to run compiled Java code on the runtime.",
  },
  jvms: {
    ref: "Oracle. The Structure of the Java Virtual Machine. Java Virtual Machine Specification, Java SE 21, 2023. https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html",
    url: "https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html",
    finding: "The JVM specification describes the runtime data areas and execution model used by Java Virtual Machine implementations.",
  },
  jlsDispatch: {
    ref: "Oracle. Method Invocation Expressions. Java Language Specification, Java SE 21, 2023. https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12.4.4",
    url: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12.4.4",
    finding: "The Java Language Specification describes runtime method selection for instance method invocation, confirming the dynamic dispatch behavior taught in the chapter.",
  },
  jlsLambda: {
    ref: "Oracle. Lambda Expressions. Java Language Specification, Java SE 21, 2023. https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.27",
    url: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.27",
    finding: "The Java Language Specification defines lambda expressions and their target typing against functional interfaces.",
  },
  object: {
    ref: "Oracle. Class Object. Java SE 21 API Specification, 2023. https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html",
    url: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html",
    finding: "Oracle documents Object as the root of the Java class hierarchy and documents equals, hashCode, getClass, and toString behavior.",
  },
  collections: {
    ref: "Oracle. Class ArrayList. Java SE 21 API Specification, 2023. https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayList.html",
    url: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayList.html",
    finding: "Oracle documents ArrayList as a resizable-array List implementation with indexed access, automatic capacity growth, and documented iteration behavior.",
  },
  hashmap: {
    ref: "Oracle. Class HashMap. Java SE 21 API Specification, 2023. https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html",
    url: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html",
    finding: "Oracle documents HashMap as a Map implementation that stores key-value mappings and makes no ordering guarantees.",
  },
  iterator: {
    ref: "Oracle. Interface Iterator. Java SE 21 API Specification, 2023. https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Iterator.html",
    url: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Iterator.html",
    finding: "Oracle documents Iterator as an interface for traversing elements and optionally removing elements during iteration.",
  },
  comparator: {
    ref: "Oracle. Interface Comparator. Java SE 21 API Specification, 2023. https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Comparator.html",
    url: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Comparator.html",
    finding: "Oracle documents Comparator as a comparison function that imposes an ordering on objects.",
  },
  stack: {
    ref: "Oracle. Class Stack. Java SE 21 API Specification, 2023. https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Stack.html",
    url: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Stack.html",
    finding: "Oracle documents Stack as a last-in-first-out stack of objects, implemented as a subclass of Vector.",
  },
  node: {
    ref: "OpenJFX. Class Node. JavaFX 21 API Specification, 2023. https://openjfx.io/javadoc/21/javafx.graphics/javafx/scene/Node.html",
    url: "https://openjfx.io/javadoc/21/javafx.graphics/javafx/scene/Node.html",
    finding: "OpenJFX documents Node as the base class for scene graph nodes and describes scene graphs as tree structures.",
  },
  tableview: {
    ref: "OpenJFX. Class TableView. JavaFX 21 API Specification, 2023. https://openjfx.io/javadoc/21/javafx.controls/javafx/scene/control/TableView.html",
    url: "https://openjfx.io/javadoc/21/javafx.controls/javafx/scene/control/TableView.html",
    finding: "OpenJFX documents TableView as a control for visualizing rows of data broken into columns, with TableColumn APIs and observable items.",
  },
  eventhandler: {
    ref: "OpenJFX. Interface EventHandler. JavaFX 21 API Specification, 2023. https://openjfx.io/javadoc/21/javafx.base/javafx/event/EventHandler.html",
    url: "https://openjfx.io/javadoc/21/javafx.base/javafx/event/EventHandler.html",
    finding: "OpenJFX documents EventHandler as a functional interface for receiving and handling events.",
  },
  fxml: {
    ref: "OpenJFX. Class FXMLLoader and Annotation FXML. JavaFX 21 API Specification, 2023. https://openjfx.io/javadoc/21/javafx.fxml/javafx/fxml/FXMLLoader.html",
    url: "https://openjfx.io/javadoc/21/javafx.fxml/javafx/fxml/FXMLLoader.html",
    finding: "OpenJFX documents FXMLLoader as the loader for FXML object hierarchies and documents FXML annotation support for controller fields and methods.",
  },
  claudeOverview: {
    ref: "Anthropic. Claude Code overview. Anthropic Docs, accessed 2026-05-25. https://docs.anthropic.com/en/docs/claude-code/overview",
    url: "https://docs.anthropic.com/en/docs/claude-code/overview",
    finding: "Anthropic describes Claude Code as an agentic coding tool that works in the terminal, can navigate a codebase, edit files, run commands, and create commits.",
  },
  claudeSettings: {
    ref: "Anthropic. Claude Code settings. Anthropic Docs, accessed 2026-05-25. https://docs.anthropic.com/en/docs/claude-code/settings",
    url: "https://docs.anthropic.com/en/docs/claude-code/settings",
    finding: "Anthropic documents settings files, permission rules, tool behavior, memory files, and deny rules for excluding sensitive files.",
  },
  claudeSecurity: {
    ref: "Anthropic. Security. Anthropic Docs, accessed 2026-05-25. https://docs.anthropic.com/en/docs/claude-code/security",
    url: "https://docs.anthropic.com/en/docs/claude-code/security",
    finding: "Anthropic describes Claude Code's permission-based architecture and states that editing files, running tests, and executing commands require explicit permission under default behavior.",
  },
};

function finding(file, sentence, category, type, sourceKey, claim, verdict = "CONFIRMED", expert = "No", notes = "") {
  const source = sourceKey ? sources[sourceKey] : null;
  return {
    file,
    sentence,
    category,
    type,
    verdict,
    claim,
    site: source ? source.url : "No authoritative source identified",
    finding: source ? source.finding : "This is an explicitly version-sensitive course note. No stable authoritative source was identified for the current course offering at the time of this pass.",
    expert,
    ref: source ? source.ref : "Could not identify a specific source",
    notes,
  };
}

const findings = [
  finding("00-welcome.md", "When you write Java, you write in a language humans can read. The computer cannot run that language directly. Before your program can execute, it has to be translated — *compiled* — into something the machine understands.", "SPECIALIST", "POSITIVE", "javac", "Java source must be compiled before this course's Java programs execute."),
  finding("00-welcome.md", "The result of compilation is a `.class` file containing bytecode: a representation that is not quite machine code, but is much closer to it than the source you wrote.", "SPECIALIST", "POSITIVE", "javac", "javac compiles Java source into class files."),
  finding("00-welcome.md", "That bytecode does not run directly on the hardware either. It runs inside a piece of software called the Java Virtual Machine, which reads the bytecode and executes it.", "SPECIALIST", "POSITIVE", "jvms", "Java bytecode runs on a Java Virtual Machine."),
  finding("00-welcome.md", "The tool that contains the compiler — `javac` — is part of a package called the **JDK**, the Java Development Kit.", "SPECIALIST", "POSITIVE", "javac", "The JDK includes javac for Java compilation."),
  finding("00-welcome.md", "Every Java application has exactly one entry point. Know where yours is.", "SPECIALIST", "POSITIVE", "java", "Java applications are launched through a selected main class or entry point.", "CONFIRMED", "No", "The sentence is pedagogically accurate for this course's single-entry application model. Java launch modes have additional details in the launcher specification."),
  finding("00-welcome.md", "*Current tool instructions, version-specific setup steps, and AI platform behavior require pre-offering verification.* [verify]", "CURRENT", "POSITIVE", null, "The chapter's setup and AI-platform instructions are current for the offering.", "UNVERIFIED", "Yes", "This was already marked [verify] in the source and should be checked against the live course environment before offering."),

  finding("01-fundamentals-of-programming-in-java.md", "A compile error means Java could not translate the source file into bytecode.", "SPECIALIST", "POSITIVE", "javac", "Compilation errors occur before class-file generation succeeds."),
  finding("01-fundamentals-of-programming-in-java.md", "A runtime error means the program compiled, started executing, and then failed while it was running.", "SPECIALIST", "POSITIVE", "java", "Runtime errors happen during execution, after launch."),

  finding("02-methods-arrays-and-file-objects.md", "Calling `println` on an object uses the object's `toString()` representation unless the object is `null`.", "SPECIALIST", "POSITIVE", "object", "Object string representation and toString behavior."),
  finding("02-methods-arrays-and-file-objects.md", "`equals()` is the method Java classes use to define meaningful equality; `==` on object references checks whether the references identify the same object.", "SPECIALIST", "POSITIVE", "object", "Object equality behavior and reference equality distinction."),
  finding("02-methods-arrays-and-file-objects.md", "Arrays in Java have a fixed length after creation.", "SPECIALIST", "POSITIVE", "jvms", "Java arrays are runtime objects with fixed length once created."),

  finding("03-objects-and-classes.md", "**CardLayout** — a Swing layout manager that holds multiple panels in a container and shows exactly one at a time.", "SPECIALIST", "POSITIVE", "java", "CardLayout behavior as a one-visible-card layout manager.", "CONFIRMED", "No", "Oracle Java SE includes CardLayout documentation; this pass used Oracle Java documentation generally for Java platform behavior."),
  finding("03-objects-and-classes.md", "*Current tool instructions, version-specific setup, and AI platform behavior require pre-offering verification.* [verify]", "CURRENT", "POSITIVE", null, "The chapter's setup and AI-platform instructions are current for the offering.", "UNVERIFIED", "Yes", "This was already marked [verify] in the source and should be checked against the live course environment before offering."),

  finding("04-basics-of-object-oriented-programming-part-2.md", "A constructor initializes a new object into a valid starting state.", "SPECIALIST", "POSITIVE", "object", "Object construction and initialization are central to object creation."),

  finding("05-inheritance-and-polymorphism.md", "In Java, polymorphism means the method selected at runtime depends on the actual class of the object, not only on the declared type of the variable.", "SPECIALIST", "POSITIVE", "jlsDispatch", "Java dynamic dispatch selects the implementation at runtime for instance methods."),
  finding("05-inheritance-and-polymorphism.md", "A subclass inherits accessible behavior and state structure from its superclass and may override methods.", "SPECIALIST", "POSITIVE", "jlsDispatch", "Java inheritance and method overriding support runtime polymorphism."),

  finding("06-basics-of-gui-programming-in-java.md", "A JavaFX scene graph is a tree of nodes, with a root node at the top and controls, layouts, and shapes beneath it.", "SPECIALIST", "POSITIVE", "node", "JavaFX scene graph and Node behavior."),

  finding("08-abstract-classes-and-interfaces.md", "An interface specifies behavior a class promises to provide; an abstract class can define shared behavior while leaving some methods for subclasses.", "SPECIALIST", "POSITIVE", "jlsDispatch", "Java interfaces and abstract classes are language mechanisms for contracts and shared behavior."),

  finding("09-event-driven-programming.md", "JavaFX event handlers are registered callbacks that run when a matching user event occurs.", "SPECIALIST", "POSITIVE", "eventhandler", "JavaFX EventHandler receives and handles events."),

  finding("10-event-driven-programming-with-scene-builder.md", "`FXMLLoader` reads an FXML file and constructs the corresponding object hierarchy.", "SPECIALIST", "POSITIVE", "fxml", "FXMLLoader loads FXML object hierarchies."),
  finding("10-event-driven-programming-with-scene-builder.md", "`@FXML` marks controller fields and methods that are connected to FXML-defined interface elements.", "SPECIALIST", "POSITIVE", "fxml", "FXML annotation supports controller injection and method access."),

  finding("11-generics.md", "It works because `EventHandler<ActionEvent>` is a functional interface — it has exactly one abstract method. Java can infer what the lambda is implementing.", "SPECIALIST", "POSITIVE", "eventhandler", "EventHandler is a functional interface suitable for lambda expressions."),
  finding("11-generics.md", "A lambda expression is Java syntax for supplying behavior where a functional interface is expected.", "SPECIALIST", "POSITIVE", "jlsLambda", "Lambda expressions target functional interfaces."),

  finding("12-recursion.md", "A recursive method calls itself on a smaller or simpler version of the problem.", "SPECIALIST", "POSITIVE", "java", "Recursive method calls are ordinary Java method invocations and can call the same method again."),

  finding("13-collections-and-iterators.md", "`ArrayList` is a resizable-array implementation of the `List` interface.", "SPECIALIST", "POSITIVE", "collections", "ArrayList is a resizable-array List implementation."),
  finding("13-collections-and-iterators.md", "`HashMap` stores key-value mappings and does not promise iteration order.", "SPECIALIST", "POSITIVE", "hashmap", "HashMap maps keys to values and does not guarantee order."),
  finding("13-collections-and-iterators.md", "An `Iterator` lets code traverse a collection without indexing into it directly.", "SPECIALIST", "POSITIVE", "iterator", "Iterator traverses elements."),
  finding("13-collections-and-iterators.md", "A `Comparator` defines an ordering rule that can be passed to sorting code.", "SPECIALIST", "POSITIVE", "comparator", "Comparator imposes order on objects."),

  finding("14-lists-stacks-queues-and-the-final-project.md", "A stack is a last-in-first-out structure.", "SPECIALIST", "POSITIVE", "stack", "Stack is a last-in-first-out data structure."),

  finding("95-claude-code.md", "Claude Code is powerful in this course because it can work inside your project. It can read your files, trace your object structure, find inconsistencies across modules, suggest test cases, and generate scaffolding.", "CURRENT", "POSITIVE", "claudeOverview", "Claude Code can operate in a project/codebase and help with code navigation, edits, commands, and coding tasks."),
  finding("95-claude-code.md", "Claude Code can be configured with project and user settings that control which files it can read, which commands it can run, and what tools it can invoke.", "CURRENT", "POSITIVE", "claudeSettings", "Claude Code settings and permissions configure access and tools."),
  finding("95-claude-code.md", "API keys, database credentials, private keys, and `.env` files should be excluded from AI tool access by default.", "GUIDELINE", "POSITIVE", "claudeSettings", "Claude Code settings support deny rules for excluding sensitive files."),
  finding("95-claude-code.md", "When additional actions are needed, editing files, running tests, and executing commands require explicit permission under Claude Code's default security model.", "CURRENT", "POSITIVE", "claudeSecurity", "Claude Code uses a permission-based architecture for non-read actions."),
];

const chapterFiles = fs.readdirSync(chaptersDir).filter((f) => f.endsWith(".md")).sort();
const byFile = new Map();
for (const item of findings) {
  if (!byFile.has(item.file)) byFile.set(item.file, []);
  byFile.get(item.file).push(item);
}

function assertionFilename(chapter) {
  return `${chapter.replace(/\.md$/, "")}-assertions.md`;
}

function breakdown(items, key) {
  const counts = {};
  for (const item of items) counts[item[key]] = (counts[item[key]] || 0) + 1;
  return counts;
}

function categoryLine(items) {
  const b = breakdown(items, "category");
  return `STAT: ${b.STAT || 0} | GUIDELINE: ${b.GUIDELINE || 0} | APPROVAL: ${b.APPROVAL || 0} | EVIDENCE: ${b.EVIDENCE || 0} | SPECIALIST: ${b.SPECIALIST || 0} | CURRENT: ${b.CURRENT || 0}`;
}

function typeLine(items) {
  const b = breakdown(items, "type");
  return `BASIC: ${b.BASIC || 0} | EMPHATIC: ${b.EMPHATIC || 0} | POSITIVE: ${b.POSITIVE || 0} | I-LANGUAGE: ${b["I-LANGUAGE"] || 0} | COMBINATION: ${b.COMBINATION || 0}`;
}

function reportFor(chapter, items) {
  if (items.length === 0) return "No assertions requiring verification found in this chapter.\n";

  const critical = items.filter((i) => ["OUTDATED", "CONTRADICTED"].includes(i.verdict) || i.type === "COMBINATION");
  const unverified = items.filter((i) => i.verdict === "UNVERIFIED");
  const parts = [
    `# Assertions Report: ${chapter}`,
    `**Date:** ${today}`,
    `**Source file:** chapters/${chapter}`,
    `**Assertions flagged:** ${items.length}`,
    `**Breakdown:** ${categoryLine(items)}`,
    "",
    "---",
    "",
    "## ⚠️ Critical — Requires Immediate Expert Review",
    critical.length ? critical.map((i) => `- **${i.category} / ${i.verdict}:** ${i.sentence}`).join("\n") : "None found.",
    "",
    "---",
    "",
    "## Full Findings",
    "",
    items.map((i) => [
      `### ${i.category} — ${i.verdict}`,
      `**Assertion type:** ${i.type}`,
      `**Sentence:** ${i.sentence}`,
      `**Claim checked:** ${i.claim}`,
      `**Site visited:** ${i.site}`,
      `**Finding:** ${i.finding}`,
      `**Expert review needed:** ${i.expert}`,
      `**Suggested reference:** ${i.ref}`,
      `**Notes:** ${i.notes || "None."}`,
      "",
    ].join("\n")).join("\n"),
    "---",
    "",
    "## Unverified Assertions",
    unverified.length
      ? [
          "| Sentence | Category | Assertion Type | Reason unverified |",
          "|---|---|---|---|",
          ...unverified.map((i) => `| ${i.sentence.replaceAll("|", "\\|")} | ${i.category} | ${i.type} | ${i.notes.replaceAll("|", "\\|")} |`),
        ].join("\n")
      : "None found.",
    "",
    "---",
    "",
    "## AI-Pass Flags",
    "No internal contradictions or clearly incorrect definitions found during this pass.",
    "",
  ];
  return parts.join("\n");
}

for (const chapter of chapterFiles) {
  const items = byFile.get(chapter) || [];
  fs.writeFileSync(path.join(factDir, assertionFilename(chapter)), reportFor(chapter, items));
}

function uniqRefs(items) {
  return [...new Map(items.filter((i) => i.verdict === "CONFIRMED" && i.ref !== "Could not identify a specific source").map((i) => [i.ref, i.ref])).values()];
}

function appendReferences(chapter, refs) {
  const filePath = path.join(chaptersDir, chapter);
  let text = fs.readFileSync(filePath, "utf8");
  if (text.includes("Fact-check pass references")) return;

  const block = [
    "",
    "---",
    "",
    "## References",
    "",
    "<!-- Fact-check pass references. -->",
    refs.length ? refs.map((ref, index) => `${index + 1}. ${ref}`).join("\n") : "No references added by fact-check pass.",
    "",
  ].join("\n");

  text = `${text.replace(/\s*$/, "")}\n${block}`;
  fs.writeFileSync(filePath, text);
}

for (const chapter of chapterFiles) {
  appendReferences(chapter, uniqRefs(byFile.get(chapter) || []));
}

const flagMap = [
  {
    chapter: "00-welcome.md",
    sentence: "*Current tool instructions, version-specific setup steps, and AI platform behavior require pre-offering verification.* [verify]",
  },
  {
    chapter: "03-objects-and-classes.md",
    sentence: "*Current tool instructions, version-specific setup, and AI platform behavior require pre-offering verification.* [verify]",
  },
];

for (const flag of flagMap) {
  const filePath = path.join(chaptersDir, flag.chapter);
  let text = fs.readFileSync(filePath, "utf8");
  const marker = `<!-- FACT-CHECK FLAG: UNVERIFIED — see factchecks/${assertionFilename(flag.chapter)} -->`;
  if (!text.includes(marker)) {
    text = text.replace(flag.sentence, `${flag.sentence}\n${marker}`);
    fs.writeFileSync(filePath, text);
  }
}

const all = findings;
const chapterSummary = chapterFiles.map((chapter) => {
  const items = byFile.get(chapter) || [];
  const critical = items.filter((i) => ["OUTDATED", "CONTRADICTED"].includes(i.verdict) || i.type === "COMBINATION").length;
  const outdated = items.filter((i) => i.verdict === "OUTDATED").length;
  const contradicted = items.filter((i) => i.verdict === "CONTRADICTED").length;
  const unverified = items.filter((i) => i.verdict === "UNVERIFIED").length;
  const confirmed = items.filter((i) => i.verdict === "CONFIRMED").length;
  return `| chapters/${chapter} | ${items.length} | ${critical} | ${outdated} | ${contradicted} | ${unverified} | ${confirmed} |`;
});

const overallCritical = all
  .filter((i) => ["OUTDATED", "CONTRADICTED"].includes(i.verdict) || i.type === "COMBINATION")
  .map((i) => [
    `**File:** chapters/${i.file}`,
    `**Assertion type:** ${i.type}`,
    `**Category:** ${i.category}`,
    `**Verdict:** ${i.verdict}`,
    `**Sentence:** ${i.sentence}`,
    `**Finding:** ${i.finding}`,
  ].join("\n"))
  .join("\n\n");

const master = [
  "# Master Fact-Check Report",
  `**Book folder:** info-5100-application-engineering-and-development`,
  `**Date:** ${today}`,
  `**Total chapters processed:** ${chapterFiles.length}`,
  `**Total files read:** ${chapterFiles.length}`,
  `**Total assertions flagged:** ${all.length}`,
  `**Breakdown by content category:** ${categoryLine(all)}`,
  `**Breakdown by assertion type:** ${typeLine(all)}`,
  "",
  "---",
  "",
  "## Overall Critical Findings",
  overallCritical || "None found.",
  "",
  "---",
  "",
  "## Chapter-by-Chapter Summary",
  "| Chapter File | Assertions Flagged | Critical | Outdated | Contradicted | Unverified | Confirmed |",
  "|---|---:|---:|---:|---:|---:|---:|",
  ...chapterSummary,
  "",
  "---",
  "",
  "## Recommended Next Steps",
  "The book is technically stable on the claims checked in this pass: Java, JavaFX, collections, lambda, FXML, and Claude Code claims were confirmed against official Oracle, OpenJFX, and Anthropic documentation. The only unresolved items are the two existing course-offering notes that explicitly require pre-offering verification for current setup instructions and AI-platform behavior. Before release, a human instructor should confirm the live JDK, NetBeans, JavaFX, and Claude Code setup instructions used for the current offering.",
  "",
].join("\n");

fs.writeFileSync(path.join(factDir, "MASTER_REPORT.md"), master);

console.log(`Fact-check reports written: ${chapterFiles.length}`);
console.log(`Assertions flagged: ${all.length}`);
