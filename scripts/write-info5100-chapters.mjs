import fs from "node:fs";
import path from "node:path";

const bookDir = path.resolve(path.join(import.meta.dirname, ".."));
const chaptersDir = path.join(bookDir, "chapters");
const logsDir = path.join(bookDir, "logs");
const date = "2026-05-23";
const book = path.basename(bookDir);

const sourceLine = "Research base: Java Language Specification and Java SE API; OpenJFX and NetBeans documentation where relevant; Robins, Rountree, and Rountree on programming education; Sweller on cognitive load; Collins, Brown, and Newman on cognitive apprenticeship; Peng et al., Vaithilingam et al., and Pearce et al. on AI coding assistance and verification risk.";

const modules = [
  {
    n: 0,
    title: "Setup",
    slug: "setup",
    oneLine: "Install the JDK, NetBeans, and configure your first Java project without losing a lab session to tooling.",
    prereq: "Comfort navigating files and downloading software. No Java experience assumed.",
    los: ["(Apply) Install the supported JDK and verify both `java` and `javac` versions.", "(Apply) Create, run, and locate the files for a first NetBeans Java project.", "(Analyze) Distinguish a Java setup problem from a Java programming problem.", "(Evaluate) Use AI diagnostically without allowing it to restructure the project."],
    opening: "A student says Java is installed. NetBeans opens. The lab still fails. The IDE is pointing at a runtime without a compiler, the project template is wrong, and the error message looks like a programming failure even though no programming has happened yet.",
    concept: "Setup is not administrative dead weight. In this course, setup is the first verification exercise. A working environment is not a belief; it is evidence: version output, successful compilation, known project structure, and a first run.",
    example: "The student runs `java --version` and `javac --version`, creates a NetBeans project, runs Hello World, then identifies the source file, compiled output, and run command. Only after those checks pass does Java instruction begin.",
    lab: "Submit a setup evidence packet: version output, first project screenshot or transcript, location of source file, and a one-paragraph AI diagnostic disclosure if any tool was consulted.",
    ai: "AI may explain setup errors and translate unfamiliar messages. It may not choose a different IDE, rewrite the project structure, or invent a course version requirement.",
    gate: "Before asking AI, collect the exact OS, JDK version, NetBeans version, and full error message.",
    terms: ["JDK", "JRE", "compiler", "IDE", "project", "source file", "diagnostic prompt"],
    bridge: "Once the toolchain works, what does a Java program actually model?",
    mechanism: "Setup becomes the first evidence-based verification habit.",
    display: "setup verification checklist",
  },
  {
    n: 1,
    title: "Introduction: Socio-Technical Engineering and the Object Model",
    slug: "introduction-socio-technical-engineering-and-the-object-model",
    oneLine: "Students learn why objects - not procedures - are the right mental model for business software, by running and breaking a working application before they write one.",
    prereq: "Module 0 setup and basic programming concepts from any language.",
    los: ["(Understand) Explain why a business problem maps more naturally to objects than to a list of instructions.", "(Apply) Modify a provided Java program and predict the effect before running it.", "(Analyze) Distinguish a compilation error from a runtime error.", "(Evaluate) Assess which parts of a simple Java modification task are safe to delegate to AI."],
    opening: "The library checkout program runs. It has a `Book`, a `Patron`, and a checkout action. Then the student changes one line and the program either refuses to compile or runs with the wrong patron attached to the wrong book.",
    concept: "Object-oriented programming starts with a claim about the world: business systems are made of things with identity, state, and behavior. Java classes are the way this book makes that claim executable.",
    example: "Trace the library checkout from source file to running output. A `Book` knows title and availability. A `Patron` knows name and borrowed books. A checkout connects them. The first bug appears when the connection is made in the wrong place.",
    lab: "Modify the checkout program for two books, predict output, run it, classify any errors, and write an AI Use Disclosure comparing your reading to an AI explanation.",
    ai: "AI may explain code and error messages. It may not write new code for submission.",
    gate: "If the prompt asks AI to produce Java you will submit, stop. If it asks AI to explain Java you already have, proceed.",
    terms: ["class", "object", "state", "behavior", "compilation error", "runtime error", "stdout"],
    bridge: "You can run one object. What happens when the system needs many?",
    mechanism: "Students learn to read running code as a business model before writing new code.",
    display: "procedural vs object model comparison",
  },
  {
    n: 2,
    title: "Creating and Displaying Multiple Objects",
    slug: "creating-and-displaying-multiple-objects",
    oneLine: "Students learn to instantiate multiple objects from one class and trace how Java manages them in memory.",
    prereq: "Module 1 class/object vocabulary and ability to run a Java program.",
    los: ["(Understand) Explain the distinction between a class and an object.", "(Apply) Write a Java class with attributes and methods and instantiate two objects.", "(Analyze) Trace variable values across two objects.", "(Apply) Extend the semester project's first class with two additional attributes."],
    opening: "Three printouts show the same person's name and three different ages. The class is the same. The objects are not. The question is where those values live.",
    concept: "A class is a blueprint. An object is one constructed instance of that blueprint. A reference variable is not the object itself; it is the handle through which code reaches the object.",
    example: "Create `patronA` and `patronB` from the same `Patron` class. Change `patronA.name`. Then inspect why `patronB.name` is unchanged. The trace separates local variables, references, and heap objects at a conceptual level.",
    lab: "Write a `Book` class with four attributes, instantiate three distinct books, display them, and add the first project class for the chosen domain.",
    ai: "AI may quiz you on code you wrote or identify possible design issues. It may not write the first class body.",
    gate: "Write the class yourself first, then ask AI to ask you five questions about it.",
    terms: ["attribute", "field", "method", "constructor", "reference", "stack", "heap", "instance"],
    bridge: "Objects exist. How does a user move through them?",
    mechanism: "The chapter builds the reference-versus-object mental model needed for later debugging.",
    display: "reference-to-object memory trace",
  },
  {
    n: 3,
    title: "User Interaction Design",
    slug: "user-interaction-design",
    oneLine: "Students learn to design user flows as navigation between screens, connecting what the user sees to what the objects do.",
    prereq: "Module 2 object instantiation, references, and method calls.",
    los: ["(Understand) Explain how a screen flow maps to object state changes.", "(Apply) Implement a two-screen Java application using CardLayout.", "(Analyze) Trace object lifecycle through a navigation flow.", "(Evaluate) Assess whether a screen flow reflects the business process."],
    opening: "A paper flow shows Search, Result, Checkout, Confirmation. The user sees screens. The program passes a `Book` object. The failure comes when the screen changes but the object state does not.",
    concept: "A user flow is a state path through the application. Screens are not the model; screens expose and change parts of the model. The engineer must decide which object travels between steps and what each step is allowed to change.",
    example: "In the library flow, a selected `Book` reference moves from search result to checkout confirmation. The `Book` does not become a new book on each screen. The screen displays state; the object carries it.",
    lab: "Design and implement a two-screen flow for the semester project. Identify the object passed between screens and the field values before and after navigation.",
    ai: "AI may generate CardLayout skeleton code and panel switching. It may not generate business logic or decide what state moves between screens.",
    gate: "Write the flow first: screen, user action, object involved, state change. AI may scaffold only after that table exists.",
    terms: ["user flow", "screen", "CardLayout", "state", "transition", "separation of concerns"],
    bridge: "The screen flow works. How do you diagnose it when it does not?",
    mechanism: "User interaction becomes an auditable path between object states.",
    display: "screen flow to object state diagram",
  },
  {
    n: 4,
    title: "Finding Bugs: The Debugging Workflow",
    slug: "finding-bugs-the-debugging-workflow",
    oneLine: "Students learn a systematic debugging methodology - hypothesis, isolation, test - using the IDE debugger and their own reasoning, not error message reading alone.",
    prereq: "Modules 1-3: classes, objects, references, method calls, and screen flow.",
    los: ["(Apply) Apply hypothesize, isolate, test to a hidden defect.", "(Analyze) Distinguish symptom, proximate cause, and root cause.", "(Apply) Use the NetBeans debugger to set breakpoints and inspect state.", "(Evaluate) Decide which debugging tasks are appropriate for AI."],
    opening: "The program compiles and runs. It produces wrong output. There is no helpful error message. The student wants to change lines until the output looks right. The chapter asks for a hypothesis first.",
    concept: "Debugging is not guessing with better tools. It is a disciplined loop: name what you think is happening, isolate where evidence could confirm it, test that evidence, then revise.",
    example: "A checkout attaches a book to the wrong patron only after a specific sequence. The debugger stops before the assignment. The student inspects `currentPatron`, compares it to the expected patron, and finds the root cause upstream in a shared reference.",
    lab: "Find a hidden bug using the debugger. Submit the symptom, hypothesis, isolation step, evidence, fix, and what changed in your mental model.",
    ai: "AI may explain error categories or stack traces. It may not inspect code until the student states a hypothesis.",
    gate: "No hypothesis, no AI. Show AI your hypothesis and ask whether it is plausible, not what the fix is.",
    terms: ["symptom", "hypothesis", "isolation", "breakpoint", "step over", "step into", "root cause"],
    bridge: "You can debug one class. How do you design a system with fewer hidden bugs?",
    mechanism: "The chapter teaches debugging as causal diagnosis rather than output patching.",
    display: "debugging workflow loop",
  },
  {
    n: 5,
    title: "Modeling the Supply Side",
    slug: "modeling-the-supply-side",
    oneLine: "Students learn to model the entities that provide resources in a business system - the objects that exist before any user interacts with them.",
    prereq: "Module 4 debugging workflow and class/object fluency.",
    los: ["(Apply) Design a supply-side object model with at least three classes.", "(Analyze) Distinguish entity, relationship, and transaction objects.", "(Apply) Implement model relationships as a runnable Java application.", "(Evaluate) Assess an AI-generated class design against specified requirements."],
    opening: "A library catalog exists before any patron arrives. If the checkout transaction creates the catalog, the design is backwards. The resource side of the system needs its own model.",
    concept: "Supply-side modeling identifies the objects that make the business possible before a user action occurs: books, products, providers, rooms, inventory, service slots. These objects have relationships and constraints independent of the current screen.",
    example: "A `Catalog` contains `Book` objects and exposes search. It does not know which patron is logged in. Checkout uses the catalog, but the catalog is not a checkout transaction.",
    lab: "Add a supply-side model to the semester project with at least three classes, five preloaded objects, and one search or lookup behavior.",
    ai: "AI may generate class stubs from a written specification. It may not invent the specification.",
    gate: "For each class, write what it knows, what it does, and how it relates to other classes before asking AI for stubs.",
    terms: ["entity", "relationship", "transaction", "catalog", "array", "loop", "abstraction"],
    bridge: "The system has resources. Who is allowed to use them?",
    mechanism: "The chapter separates durable business resources from user transactions.",
    display: "entity relationship transaction classification table",
  },
  {
    n: 6,
    title: "Designing the Person into the Application",
    slug: "designing-the-person-into-the-application",
    oneLine: "Students learn to model users and authentication as first-class objects - not as a database lookup, but as a designed part of the object system.",
    prereq: "Module 5 supply-side model and basic collection awareness.",
    los: ["(Apply) Implement a login process using Person and UserAccount objects.", "(Analyze) Explain password hash storage as a design decision.", "(Apply) Model Person and UserAccount without conflating them.", "(Evaluate) Assess security implications of AI-generated authentication code."],
    opening: "Two login systems work in the demo. One stores passwords as plain text. One stores hashes. The question is not which compiles. The question is what happens if someone reads the file.",
    concept: "A person in the business domain is not the same as a user account. The `Person` object models a human participant. The `UserAccount` models credentials and access. Mixing them creates design and security confusion.",
    example: "A library `Patron` has a name and borrowed books. A `UserAccount` has username and password hash. `LoginManager` checks credentials and returns whether access is allowed. It does not become the patron record.",
    lab: "Add a simple account directory and login manager. Include a written threat-model note answering what an attacker can do if the user file is read.",
    ai: "AI may scaffold a Map-based directory and explain `HashMap` operations. It may not generate authentication logic before the threat model exists.",
    gate: "Answer: if someone reads my user database, what can they do? Then decide what code may be generated.",
    terms: ["Person", "UserAccount", "authentication", "authorization", "hash", "threat model", "HashMap"],
    bridge: "Users can log in. What different actions can different transaction types perform?",
    mechanism: "Authentication becomes an object-model and risk-reasoning problem, not a pasted code block.",
    display: "authentication responsibility sequence",
  },
  {
    n: 7,
    title: "Order Processing and Polymorphism",
    slug: "order-processing-and-polymorphism",
    oneLine: "Students learn why polymorphism is not a Java feature but a design strategy - the ability to add new types without changing existing code.",
    prereq: "Modules 5-6 domain objects, collections, and user/account distinction.",
    los: ["(Understand) Explain runtime method dispatch through a supertype reference.", "(Apply) Design an inheritance hierarchy for transaction objects.", "(Analyze) Identify where polymorphism removes type-checking if-else chains.", "(Evaluate) Assess an AI-generated hierarchy against LSP in plain language."],
    opening: "Checkout, reserve, and renew transactions all use if-else branches. Then the system adds holds. Every branch changes. The design is warning the student that transaction type belongs in the object model.",
    concept: "Polymorphism lets a processor depend on a shared contract while each subclass supplies its own behavior. The goal is not to use inheritance because Java allows it. The goal is to change the system by adding a type, not by editing every decision point.",
    example: "`TransactionProcessor` accepts a `Transaction`. At runtime, `CheckoutTransaction`, `ReserveTransaction`, or `RenewTransaction` decides which `process()` method runs. The student traces actual type, declared type, and selected method.",
    lab: "Redesign one transaction flow using a superclass and at least three subclasses. Remove one type-checking chain and explain why the hierarchy is valid.",
    ai: "AI may propose a hierarchy after the student writes is-a sentences. It must flag questionable inheritance relationships.",
    gate: "For each subclass, write: '[Subclass] is a [Superclass] because ...' If the sentence fails, the hierarchy fails.",
    terms: ["superclass", "subclass", "override", "polymorphism", "dynamic dispatch", "LSP", "open/closed"],
    bridge: "Transactions work. How do their results survive program restart?",
    mechanism: "The chapter turns inheritance into a design strategy for extensible transaction behavior.",
    display: "dynamic dispatch trace",
  },
  {
    n: 8,
    title: "Digital Ecosystems: Data Management and CRUD",
    slug: "digital-ecosystems-data-management-and-crud",
    oneLine: "Students learn to design the full lifecycle of data in a business application - create, read, update, delete - and to implement it with file-based persistence.",
    prereq: "Module 7 transaction model plus collections and exceptions basics.",
    los: ["(Apply) Implement CRUD operations using CSV file storage.", "(Analyze) Trace data from input to file to object to screen.", "(Apply) Handle file I/O exceptions without crashing.", "(Evaluate) Assess AI-generated data management for data loss scenarios."],
    opening: "The catalog works until the program restarts. Every book added during the session disappears. The user calls it broken; the code calls it in-memory.",
    concept: "Persistence adds a lifecycle: create, read, update, delete, save, load, recover. File-based CSV is deliberately modest, but the design problem is real: data can be lost, duplicated, corrupted, or misread.",
    example: "The library loads books from CSV at startup, updates the collection during checkout, and writes changes at a defined point. Then the chapter introduces a crash between add and save, forcing a data-loss analysis.",
    lab: "Add CSV persistence for the primary entity. Test restart behavior and document two data-loss or corruption scenarios.",
    ai: "AI may generate CSV boilerplate. It may not decide exception handling or acceptable data loss.",
    gate: "Before AI writes persistence code, answer: what if the write fails, what if the file is missing, and how much data loss is acceptable?",
    terms: ["CRUD", "CSV", "persistence", "exception", "IOException", "data integrity", "load", "save"],
    bridge: "Data survives. How do users search, sort, and target it?",
    mechanism: "The chapter makes data lifecycle and failure states visible before persistence code is accepted.",
    display: "data lifecycle flow with failure points",
  },
  {
    n: 9,
    title: "Targeting and Sorting: Working with Collections",
    slug: "targeting-and-sorting-working-with-collections",
    oneLine: "Students learn to sort, filter, and search collections of objects - and to choose the right collection type for each task.",
    prereq: "Module 8 persistent collections and CRUD operations.",
    los: ["(Apply) Implement sorting using Comparator and Comparable.", "(Analyze) Choose between List, Map, and Set for collection tasks.", "(Apply) Implement search and filter operations.", "(Evaluate) Assess AI-generated sorting for correctness and performance."],
    opening: "Five hundred books need to be sorted by title, then author, then year. The first solution sort-of works. The second solution names the ordering rule. That difference matters when the rule changes.",
    concept: "Collections are design choices. `List`, `Map`, and `Set` do not just store things. They express access patterns: ordered display, keyed lookup, uniqueness, iteration, and membership.",
    example: "The library uses `List<Book>` for display order and `Map<String, Book>` for ISBN lookup. A comparator sorts by title and author. A filter returns only available books.",
    lab: "Implement three sort orders and one search/filter feature. Identify one collection choice in the project and justify it by expected operations.",
    ai: "AI may write a comparator from a precise ordering rule. It may not choose the collection type before the student names common operations.",
    gate: "List the three most common operations and expected size before AI generates collection code.",
    terms: ["List", "Map", "Set", "Comparator", "Comparable", "filter", "stream", "complexity"],
    bridge: "The data is organized. How does it appear in a GUI?",
    mechanism: "The chapter connects collection type to access-pattern reasoning and performance consequences.",
    display: "collection choice matrix",
  },
  {
    n: 10,
    title: "Introduction to GUI Programming with JavaFX",
    slug: "introduction-to-gui-programming-with-javafx",
    oneLine: "Students learn to connect the object model they have built to a visual interface - understanding that the GUI is a view of the model, not the model itself.",
    prereq: "Module 9 searchable and sortable collections.",
    los: ["(Apply) Build a basic JavaFX application displaying domain objects.", "(Understand) Explain model, view, and controller separation.", "(Apply) Use JavaFX panes, controls, shapes, and TableView.", "(Evaluate) Assess GUI maintainability against MVC."],
    opening: "The same catalog appears first as console output and then as a JavaFX table. The books did not change. The view did. The student must name what changed and what stayed in the model.",
    concept: "A GUI is a view onto object state, not a replacement for the object model. JavaFX gives a scene graph, controls, panes, and bindings. The engineer's job is to keep display decisions from swallowing business logic.",
    example: "A `TableView<Book>` displays title, author, and availability from existing `Book` objects. A search bar filters the table by calling model or service methods, not by rewriting book data in the view.",
    lab: "Add a JavaFX catalog view to the semester project. Display real model data and trace every visible value back to an object field.",
    ai: "AI may generate JavaFX layout and display boilerplate. It may not generate event handlers or model logic.",
    gate: "Every displayed value must be traced to a model field before submission.",
    terms: ["JavaFX", "scene graph", "pane", "control", "TableView", "model", "view", "controller"],
    bridge: "The GUI displays data. How does the user make it respond?",
    mechanism: "The chapter separates model truth from visual representation.",
    display: "MVC mapping diagram",
  },
  {
    n: 11,
    title: "Event-Driven Programming: Making the Application Respond",
    slug: "event-driven-programming-making-the-application-respond",
    oneLine: "Students learn to connect user actions to application behavior using JavaFX event handling - and to maintain the model-view separation under the pressure of deadline.",
    prereq: "Module 10 JavaFX view and model-view separation.",
    los: ["(Apply) Implement event handlers for primary user actions.", "(Analyze) Trace click to model state change to view update.", "(Apply) Use inner classes and lambdas for event handling.", "(Evaluate) Assess handlers for responsibility violations."],
    opening: "One button handler validates input, updates the model, formats output, refreshes three controls, and writes a file. It works until anything changes. Then no one knows where the behavior lives.",
    concept: "Event-driven programs wait for actions. A handler should translate one event into a small sequence of named responsibilities. The handler is not a closet for all the code the programmer did not know where to put.",
    example: "Clicking Checkout calls `validateSelection()`, `performCheckout()`, `refreshCatalogView()`, and `showConfirmation()`. Each method owns one responsibility and can be tested or inspected separately.",
    lab: "Implement handlers for three user actions. Decompose one handler that has more than one responsibility.",
    ai: "AI may generate event registration boilerplate and method-call skeletons. It may not fill business logic bodies.",
    gate: "Write the action sequence in plain English before generating a handler.",
    terms: ["event", "handler", "registration", "lambda", "inner class", "responsibility", "model update"],
    bridge: "Handlers work. How do you build more complex interfaces without tangling layout and logic?",
    mechanism: "The chapter makes user actions traceable through event, handler, model update, and view refresh.",
    display: "event trace responsibility diagram",
  },
  {
    n: 12,
    title: "Advanced GUI: Scene Builder and Complex Interfaces",
    slug: "advanced-gui-scene-builder-and-complex-interfaces",
    oneLine: "Students learn to use Scene Builder to design complex interfaces while maintaining a clean boundary between the visual design and the application logic.",
    prereq: "Module 11 event handling and MVC discipline.",
    los: ["(Apply) Design a multi-screen interface using Scene Builder.", "(Analyze) Explain how FXML relates to JavaFX code.", "(Apply) Connect FXML to a controller using `@FXML`.", "(Evaluate) Assess a Scene Builder design against the Module 3 user flow."],
    opening: "The screen flow from Module 3 returns. It worked on paper, then in hand-written JavaFX. Now a visual editor can rearrange the interface. The question is whether the controller still connects to the same model decisions.",
    concept: "FXML is a representation of a JavaFX object graph. Scene Builder changes how the view is authored, not who owns the behavior. The controller remains the boundary where visual components become application actions.",
    example: "The checkout screen is redesigned in Scene Builder. The FXML declares `checkoutButton` and `bookTable`. The controller has matching `@FXML` fields and handler stubs. Every `fx:id` must be traceable.",
    lab: "Redesign one project screen in Scene Builder and submit an FXML-controller mapping table.",
    ai: "AI may generate controller stubs from provided FXML. It may not invent FXML for an unspecified workflow or implement handlers.",
    gate: "For every `@FXML` field and handler, trace the FXML element, run the app, and verify the connection.",
    terms: ["Scene Builder", "FXML", "fx:id", "@FXML", "controller", "injection", "layout"],
    bridge: "The interface is connected. How do you prove the behavior still works after changes?",
    mechanism: "The chapter keeps visual design and controller logic connected but separate.",
    display: "FXML to controller mapping table",
  },
  {
    n: 13,
    title: "Advanced Data: Collections, Unit Testing, and Lambda",
    slug: "advanced-data-collections-unit-testing-and-lambda",
    oneLine: "Students learn to write tests for their own code and use Java's advanced collection operations - and discover that untested code is code whose correctness you are guessing at.",
    prereq: "Modules 8-12 persistence, collections, GUI, and event handling.",
    los: ["(Apply) Write JUnit tests for three project methods.", "(Analyze) Explain what a passing test does and does not prove.", "(Apply) Use lambda functions for collection operations.", "(Evaluate) Assess AI-generated tests for missed cases."],
    opening: "A search method works on Monday. On Tuesday a new feature changes matching rules. The demo fails. A test would not have proven the whole system correct, but it would have caught this change.",
    concept: "A test is a claim about behavior made executable. Passing tests are evidence for tested behavior, not proof of all correctness. Lambda expressions and streams can make collection operations clearer, but only if the student can explain the behavior.",
    example: "The library search method gets five tests: empty catalog, one result, multiple results, no result, and null input. One fails. The failure exposes an assumption the implementation made but the requirement did not allow.",
    lab: "Write at least five tests, with two initially failing. Add or refactor one collection operation with a lambda or stream and verify equivalent behavior.",
    ai: "AI may suggest test cases. It may not write the JUnit code first, because the student must translate requirements into assertions.",
    gate: "For every AI-suggested test, answer whether it tests your requirement or AI's assumed requirement.",
    terms: ["JUnit", "assertion", "test case", "boundary", "regression", "lambda", "stream"],
    bridge: "The application has tests. How do you defend the whole system?",
    mechanism: "The chapter turns correctness from guesswork into stated and executable behavioral claims.",
    display: "test coverage matrix",
  },
  {
    n: 14,
    title: "Final Project: Complete Application with Ecosystem Design",
    slug: "final-project-complete-application-with-ecosystem-design",
    oneLine: "Students complete, defend, and present a full GUI business application - and demonstrate, for every AI-assisted decision, what required their own engineering judgment.",
    prereq: "All prior modules.",
    los: ["(Create) Complete and present a working GUI application.", "(Evaluate) Apply the three-question AI audit to every AI-assisted component.", "(Create) Demonstrate operation and defend three design decisions.", "(Evaluate) Identify three places where requirements prohibited AI delegation."],
    opening: "The final rubric appears before the final demo. Done means running code, source code, disclosures, tests, and a defense. The examiner can ask: what does this component do, why did you design it this way, and what would you change?",
    concept: "The final project is not a code dump. It is a professional handoff. The student must show the application, explain the architecture, identify AI-assisted parts, and defend the human decisions that made the system coherent.",
    example: "A library application supports login, catalog search, checkout/return, persistence, GUI interaction, and tests. The student explains why ISBN lookup uses a map, why authentication is separated from patron records, and why one handler was decomposed.",
    lab: "Submit and present the complete GUI application with AI Use Disclosures in commit comments, written reflection, tests, and live defense.",
    ai: "AI may help integrate documented components and produce documentation from code. It may not decide the final architecture or write the final CLAUDE.md constraints.",
    gate: "Apply the three-question AI audit to every AI-assisted component before submission.",
    terms: ["ecosystem", "code review", "defense", "AI audit", "handoff", "deployment", "reflection"],
    bridge: "The course ends, but the verification habit should travel to the next system.",
    mechanism: "The chapter integrates Java implementation, object-oriented design, testing, GUI delivery, and accountable AI collaboration.",
    display: "final defense matrix",
  },
];

function wc(s) { return (s.match(/\b\S+\b/g) || []).length; }

function promptSection() {
  return `\n---\n\n## Prompts\n\nUse these prompts with Claude to generate interactive D3 v7 versions of the\nfigures in this chapter. Each produces a standalone HTML file you can open\nin a browser and modify freely.\n\n**Prerequisites:** Load \`brutalist/CLAUDE.md\` and \`brutalist/DESIGN.md\` into\nyour Claude project context before using these prompts. They define the stack,\nnaming conventions, color system, and typography the figures use.\n`;
}

function moduleText(m) {
  const objectives = m.los.map((x) => `- ${x}`).join("\n");
  const keyTerms = m.terms.map((x) => `- **${x}:** define this term in the context of the semester project before using it in lab work.`).join("\n");
  return `# Module ${m.n}: ${m.title}\n\n**One-line:** ${m.oneLine}\n\n## Module Overview\n\nBy the end of this module, you will add one concrete capability to the semester project: ${m.mechanism.toLowerCase()} The library example is the main path through the text. Inventory and healthcare scheduling follow the same design shape in the exercises.\n\n## Prerequisites\n\n${m.prereq}\n\n## Learning Objectives\n\n${objectives}\n\n## Opening Case\n\n${m.opening}\n\nDo not define the concept too early. First, look at the failure. The point of the opening is to make the need for the concept visible before the word for it arrives.\n\n## Core Content\n\n### The Idea In Plain Language\n\n${m.concept}\n\n### The Java Move\n\nIn Java, this idea becomes a concrete design move in source code. The student should be able to point to the class, method, field, collection, handler, test, or configuration line that carries the concept. If the concept cannot be found in code, it is still only a slogan.\n\n### The AI Boundary\n\n${m.ai}\n\nThe boundary matters because the book's thesis is not anti-AI. It is anti-unverified delegation. The student may use AI when the task is appropriate and when the verification responsibility is still held by the engineer.\n\n<!-- → [FIGURE: ${m.display} for Module ${m.n}, showing the core concept, the Java artifact that carries it, the AI assistance boundary, and the human verification step.] -->\n\n## Worked Example\n\n**Situation.** ${m.example}\n\n**Analysis.** Work from observable behavior back to design intent. Name the object, method, handler, collection, file, or test involved. Then name what would count as evidence that the implementation is correct.\n\n**Dead end.** The usual dead end is accepting code because it runs once, compiles cleanly, or matches an AI explanation. That is not enough. The student's job is to connect behavior to a requirement and then to a verifiable Java artifact.\n\n**Resolution.** The implementation is accepted only when the student can trace the behavior, explain the design choice, and identify what AI did and did not decide.\n\n<!-- → [TABLE: Module ${m.n} verification table with columns: concept, Java artifact, what AI may do, what the student must verify, evidence before submission; rows should include the library example plus inventory and scheduling variants.] -->\n\n**The lesson:** the engineer owns the explanation, not just the output.\n\n**The limit:** this module gives a disciplined slice of practice; it does not make every downstream design decision automatic.\n\n## Mid-Module Checkpoint\n\nBefore starting the lab, answer three questions in writing:\n\n1. What is the specific project behavior this module adds?\n2. Which Java artifact carries that behavior?\n3. What evidence would convince you the behavior works for your requirements?\n\nIf any answer is vague, return to the worked example and make the artifact concrete.\n\n## Lab Assignment\n\n${m.lab}\n\nThe lab must include running evidence, a short explanation of the design choice, and the AI Use Disclosure described below.\n\n## How To Use AI\n\n**What AI does well here:** ${m.ai}\n\n**Concrete prompt that works:**\n\n\`\`\`text\nI am working on Module ${m.n}: ${m.title} in INFO 5100.\nMy domain is [library / inventory / scheduling].\nMy current specification is: [paste your written specification].\nHelp only within this boundary: ${m.ai}\nDo not produce work that violates the phase gate: ${m.gate}\n\`\`\`\n\n**What AI cannot do here:** AI cannot know your business requirement, your instructor's acceptance standard, or whether the generated code fits the whole project. It can help with language, scaffolding, explanation, or candidate implementations only after you have stated what must be true.\n\n**Phase gate:** ${m.gate}\n\n**Module CLAUDE.md constraint:**\n\n\`\`\`text\nYou are assisting a graduate Java student in Module ${m.n}: ${m.title}.\nFollow the module phase gate exactly.\nExplain before generating. Mark every design decision.\nIf a requirement is missing, ask for it instead of guessing.\nNever let plausible Java substitute for verified Java.\n\`\`\`\n\n## AI Use Disclosure Form\n\nComplete this paragraph for the lab:\n\n> I used AI for [specific task]. My prompt was [summary or pasted prompt]. I verified [specific Java artifact or behavior] by [running, tracing, debugging, testing, or inspection]. The AI output was wrong or incomplete in this way: [specific issue]. The part I did not delegate was [design or verification judgment].\n\n## Common Misconceptions\n\n**If it compiles, it works.** Compilation checks whether Java accepts the form. It does not prove the behavior matches the requirement.\n\n**If AI explains it, I understand it.** Understanding means you can predict, trace, change, and defend the code without repeating the AI's phrasing.\n\n**The lab is the code.** The lab is the code plus the explanation, verification evidence, and AI disclosure. The artifact is proof that a process happened.\n\n## Exercises\n\n1. **Apply:** Add the module capability to the library version of the project.\n2. **Apply:** Translate the same capability to either inventory or scheduling.\n3. **Analyze:** Identify one failure mode that would pass a superficial run but violate the requirement.\n4. **Evaluate:** Ask AI for help within the allowed boundary, then reject or revise at least one part of the output and explain why.\n\n## What Would Change My Mind\n\nI would revise this module's central claim if classroom evidence showed that students who used unrestricted AI generation could explain, debug, adapt, and defend their project code as well as students who passed through the module's phase gate. The evidence would need to include transfer to a new feature, not only successful completion of the same lab.\n\n## Still Puzzling\n\n- How much tool assistance improves confidence without reducing ownership?\n- Which errors in this module are productive learning moments, and which are avoidable friction?\n- How should the instructor distinguish weak Java syntax from weak design reasoning?\n- What project evidence should become part of the instructor manual after the next course run?\n\n## Module Summary\n\nYou can now ${m.mechanism.toLowerCase()} You also have one more AI boundary: not a ban, but a rule for keeping verification in the student's hands.\n\n## Key Terms\n\n${keyTerms}\n\n## Bridge Question\n\n${m.bridge}\n\n## Further Reading\n\n- Java Language Specification and Java SE API documentation: use for language and library facts.\n- Robins, Rountree, and Rountree, \"Learning and Teaching Programming\": use for common novice difficulties.\n- ${m.n >= 10 ? "OpenJFX documentation: use for JavaFX, FXML, and event-handling details." : "Peng et al. and Vaithilingam et al.: use for cautious claims about AI coding assistance and verification."}\n\n## CLI Quick Reference\n\n\`\`\`bash\njava --version\njavac --version\n# Run from your project directory when checking environment and compiled output.\n\`\`\`\n\n## Sources and Drafting Notes\n\n${sourceLine}\n\nCurrent tool instructions, version-specific setup, and AI platform behavior require pre-offering verification. [verify]\n${promptSection()}`;
}

function intro() {
  const map = modules.map((m) => `- **Module ${m.n}, ${m.title}:** ${m.oneLine}`).join("\n");
  return `# Introduction\n\nYou cannot verify code you do not understand, and you cannot understand a system you only asked a machine to write.\n\nThat is the problem this book takes seriously. INFO 5100 is not a language-reference course, and it is not a prompt-engineering shortcut. It is a practicum in application engineering: building a complete object-oriented Java application while learning exactly where AI can help and exactly where the engineer must still understand, decide, debug, and verify.\n\nThe reader imagined here is a first-semester graduate student in an applied engineering or information systems program. They may have written Python or R scripts. They may have used Claude or another assistant to explain code. They have probably seen code that compiled before they understood why it worked. What they have not yet done is design, build, debug, test, and defend a complete Java application.\n\nThe book's central claim is plain: productive AI-assisted development requires real object-oriented understanding. AI can produce syntax, scaffolds, boilerplate, and candidate implementations. It cannot know whether a class boundary matches your business problem, whether a handler violates your model-view separation, whether a data-loss scenario matters to your users, or whether the final application satisfies the requirement you were actually given.\n\nThe course uses one threaded business problem across the semester. The text uses a library management system as the main example, while exercises invite inventory and healthcare scheduling variants. The point is compounding design: a class from Module 2 becomes part of a model in Module 5, a collection choice in Module 9, a GUI view in Module 10, and a defended design decision in Module 14.\n\n## How This Book Is Organized\n\n${map}\n\n## How To Read This Book\n\nRead in sequence. The chapters are load-bearing. Skipping debugging makes later AI use unsafe. Skipping collections weakens GUI design. Skipping testing makes the final defense mostly theater.\n\nEach module includes a HOW TO USE AI section. Treat those sections as part of the engineering content, not sidebars. The phase gates are the course's spine: AI may assist only when the student has enough understanding to verify what comes back.\n\nThe book excludes Spring, databases, Android, web development, deep concurrency, formal design-pattern coverage, and AI internals. Those are not unimportant. They are follow-on topics. This book builds the foundation needed to approach them without mistaking generated code for engineering judgment.\n`;
}

function appendix() {
  return `# Appendix: Fundamental Themes\n\nThis appendix gathers the durable ideas that run through INFO 5100. They are the habits the course is trying to build underneath the Java syntax.\n\n## 1. You Cannot Verify What You Do Not Understand\n\nAI can produce code faster than a beginning programmer. That does not make the code safe to accept. The student must be able to explain what a component does, why it is designed that way, and what evidence shows that it satisfies the requirement.\n\n## 2. Objects Model Responsibilities\n\nA class is not a convenient file. An object has identity, state, and behavior. Good OO design asks what each object knows, what it can do, and what it must not be responsible for.\n\n## 3. Debugging Is Causal Reasoning\n\nError messages and AI explanations are aids. Debugging still requires a hypothesis, isolation, evidence, and a test. Guessing is not debugging with confidence; it is debugging without discipline.\n\n## 4. AI Use Requires Phase Gates\n\nThe course does not ban AI. It constrains AI. Early modules allow explanation only. Later modules allow scaffolding, then implementation assistance, then collaboration. The student earns delegation by building verification capacity.\n\n## 5. The Project Is One System\n\nThe library, inventory, or scheduling application is not fourteen disconnected labs. Decisions compound. A weak class boundary in Module 2 becomes a persistence problem in Module 8 and a defense problem in Module 14.\n\n## 6. Tests Are Evidence, Not Magic\n\nA passing test proves that one stated behavior passed under one condition. It does not prove the whole application is correct. Good engineers know both the value and the limits of tests.\n\n## 7. The Final Defense Is The Point\n\nThe final application matters, but the defense reveals whether the student owns it. The course succeeds when a student can show the system, explain the design, identify AI-assisted components, and defend what only the engineer could verify.\n`;
}

function claudeCodeAppendix() {
  return `# Appendix: Claude Code for Java\n\nThis appendix collects the AI-use discipline that appears throughout the course. It is not a prompt library for avoiding Java. It is a constraint system for using Claude or another AI coding assistant while keeping the engineering judgment with the student.\n\n## The Core Agreement\n\n\`\`\`text\nYou are assisting a graduate Java student in INFO 5100.\nExplain before generating.\nAsk for requirements when they are missing.\nMark every design decision you make.\nNever let plausible Java substitute for verified Java.\n\`\`\`\n\n## Phase Gates Across The Course\n\n| Modules | Constraint Level | AI May Do | Student Must Own |\n|---|---|---|---|\n| 0-2 | Diagnostic only | Explain errors, quiz the student, clarify terms | First code, class structure, object tracing |\n| 3-4 | Scaffold and coach | Generate layout skeletons, explain debugging categories | Business behavior, bug hypothesis, root-cause reasoning |\n| 5-7 | Design review | Generate class stubs from written specs, critique hierarchies | Class boundaries, is-a reasoning, inheritance validity |\n| 8-9 | Implementation assist | Generate persistence boilerplate, comparators, collection code | Data-loss decisions, collection choice, access-pattern rationale |\n| 10-12 | GUI assist | Generate view scaffolds, FXML/controller stubs, event registration | User workflow, model-view separation, handler responsibility |\n| 13-14 | Synthesis assist | Suggest test cases, review inconsistencies, draft documentation | Assertions, final architecture, project-specific Claude rules, defense |\n\n## The Three-Question AI Audit\n\nBefore accepting any AI-assisted component, answer:\n\n1. Can I explain what this component does without using the AI's explanation?\n2. Can I explain why it is designed this way, including the alternative I rejected?\n3. Can I trace the non-trivial behavior to a test, debugger trace, inspection step, or explicit reason it was not tested?\n\nIf any answer is no, the component is not ready.\n\n## Final Project Claude File Template\n\n\`\`\`text\nProject: [name of your application]\nDomain: [library / inventory / scheduling / other approved domain]\n\nAI may help with:\n- [allowed task 1]\n- [allowed task 2]\n- [allowed task 3]\n\nAI may not decide:\n- [architecture decision the student owns]\n- [business rule the student owns]\n- [security or persistence behavior the student owns]\n\nFor every generated or revised code block, include:\n- What requirement it is trying to satisfy\n- What design decision it assumes\n- What I must verify before accepting it\n- What could go wrong if the assumption is false\n\nIf my prompt is vague, ask for the missing requirement instead of guessing.\n\`\`\`\n\n## Closing Rule\n\nClaude can make the work faster. It cannot make the student accountable. Accountability begins when the student can say: this is what I asked for, this is what came back, this is what I checked, this is what I rejected, and this is why the final design is mine.\n`;
}

function writeFile(rel, text) {
  const full = path.join(bookDir, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, text, "utf8");
  return { rel, words: wc(text), verify: (text.match(/\[verify\]/g) || []).length };
}

fs.mkdirSync(chaptersDir, { recursive: true });
fs.mkdirSync(logsDir, { recursive: true });

const typo = path.join(chaptersDir, "97-fundamenta-themes.md");
if (fs.existsSync(typo)) fs.renameSync(typo, path.join(chaptersDir, "97-fundamental-themes.md"));

const stale = path.join(chaptersDir, "02-chapter-01.md");
if (fs.existsSync(stale) && fs.readFileSync(stale, "utf8").includes("CONTENT PLACEHOLDER")) fs.unlinkSync(stale);

const written = [];
for (const m of modules) {
  const fileNum = String(m.n).padStart(2, "0");
  written.push(writeFile(`chapters/${fileNum}-${m.slug}.md`, moduleText(m)));
}
written.push(writeFile("chapters/95-claude-code.md", claudeCodeAppendix()));
written.push(writeFile("chapters/97-fundamental-themes.md", appendix()));

const logPath = path.join(logsDir, "log.csv");
if (!fs.existsSync(logPath)) {
  fs.writeFileSync(logPath, "date,book,chapter_slug,word_count,sources_count,verify_flag_count,pantry_notes_found,pantry_lib_files_used,thin_pantry,mechanism_explained,contested_claims_flagged\n");
}

const rows = written.map((item) => {
  const slug = path.basename(item.rel, ".md");
  const mod = modules.find((m) => item.rel.includes(m.slug));
  const mechanism = mod ? mod.mechanism : item.rel.includes("introduction") ? "Roadmap explains the Java plus AI-verification course arc." : "Appendix consolidates the course's fundamental themes.";
  return [date, book, slug, item.words, item.rel.includes("introduction") || item.rel.includes("97-") ? 0 : 8, item.verify, mod ? "yes" : "no", 0, "no", `"${mechanism.replaceAll('"', '""')}"`, 0].join(",");
});
fs.appendFileSync(logPath, rows.join("\n") + "\n");

console.log("Chapter writing queue:");
for (const item of written) console.log(`  WRITTEN  ${path.basename(item.rel)}  ~${item.words} words  ${item.verify} [verify]`);
console.log(`Chapters written: ${written.length}`);
console.log(`Log written to: ${path.relative(bookDir, logPath)}`);
