import fs from "node:fs";
import path from "node:path";

const bookDir = path.resolve(path.join(import.meta.dirname, ".."));
const pantryDir = path.join(bookDir, "pantry");
const date = "2026-05-23";
const bookTitle = "Programming with Java: An Object-Oriented Practicum";

const shared = {
  java: [
    "Gosling, James, Joy, Bill, Steele, Guy, Bracha, Gilad, Buckley, Alex, and Smith, Daniel, The Java Language Specification, Java SE 21 Edition, Oracle, 2023. This is the authoritative language source for Java classes, objects, fields, methods, inheritance, lambdas, and exceptions. Use it to anchor factual claims about Java behavior rather than relying on tutorial simplifications.",
    "Oracle, Java SE 21 API Specification, 2023. The API docs are the correct source for standard library contracts such as `List`, `Map`, `Set`, `Comparator`, I/O classes, and exception behavior. The chapter drafter should cite API contracts when explaining what a library type promises.",
    "Horstmann, Cay S., Core Java, Volume I: Fundamentals, 12th ed., 2021. Horstmann provides professional-grade explanations of Java fundamentals that are still accessible to serious beginners. Use it to supplement primary specifications with pedagogically useful examples.",
  ],
  pedagogy: [
    "Robins, Anthony, Rountree, Janet, and Rountree, Nathan, \"Learning and Teaching Programming: A Review and Discussion,\" Computer Science Education, 2003. This review documents recurring novice difficulties with tracing, abstraction, syntax, and mental models. It supports the course's emphasis on prediction, tracing, and explanation before delegation.",
    "Sweller, John, \"Cognitive Load During Problem Solving: Effects on Learning,\" Cognitive Science, 1988. Cognitive load theory supports worked examples, staged scaffolding, and avoiding too many new representations at once. It is especially relevant for JavaFX and debugging modules.",
    "Collins, Allan, Brown, John Seely, and Newman, Susan, \"Cognitive Apprenticeship: Teaching the Crafts of Reading, Writing, and Mathematics,\" 1989. Cognitive apprenticeship supports making expert debugging, design, and verification moves visible before students perform them independently.",
    "Chi, Michelene T. H. and Wylie, Ruth, \"The ICAP Framework,\" Educational Psychologist, 2014. ICAP supports active and constructive learning through prediction, explanation, debugging, peer discussion, and defense rather than passive reading of code.",
  ],
  ai: [
    "Peng, Siddharth et al., \"The Impact of AI on Developer Productivity: Evidence from GitHub Copilot,\" arXiv, 2023. The study supports the claim that AI assistance can accelerate programming tasks, while leaving open whether learners can verify outputs safely. Use it to motivate disciplined AI use rather than AI replacement.",
    "Vaithilingam, Priyan et al., \"Expectation vs. Experience: Evaluating the Usability of Code Generation Tools Powered by Large Language Models,\" CHI Extended Abstracts, 2022. This paper is useful for the gap between plausible generated code and user understanding. It supports the course's requirement that students explain and verify AI-assisted work.",
    "Pearce, Hammond et al., \"Asleep at the Keyboard? Assessing the Security of GitHub Copilot's Code Contributions,\" IEEE Symposium on Security and Privacy Workshops, 2022. This gives empirical caution that generated code can look plausible while embedding risks. Use it where the book argues that AI output requires human auditing.",
  ],
};

const modules = [
  {
    n: 0,
    title: "Setup",
    slug: "setup",
    oneLine: "Install the JDK, NetBeans, and configure your first Java project without losing a lab session to tooling.",
    core: "tooling setup, version verification, NetBeans project creation, first run, and diagnostic-only AI constraints",
    sources: [
      "Oracle, JDK Installation Guide and Java SE Downloads documentation, current release. This is the source of record for installing the supported JDK and verifying `java --version`. The chapter should treat installer screenshots as high-aging-risk and verify them before each offering.",
      "Apache NetBeans, NetBeans User Guide and installation documentation, current release. NetBeans setup is the practical bottleneck for the course; cite the project docs for project creation and Java platform configuration.",
      "OpenJDK, JEP 223: New Version-String Scheme, 2014. This helps explain Java version strings and why students must report exact versions when debugging setup problems.",
      ...shared.pedagogy.slice(1, 3),
    ],
    cases: [
      "Documented setup friction in introductory programming courses: tool installation and IDE configuration consume early lab time and can derail learning before concepts begin. Use this as the rationale for Module 0 being a setup appendix rather than an informal preface.",
      "Illustrative course lab case: one student has the JRE but not the JDK; NetBeans opens but cannot compile. The insight is that 'Java is installed' is too vague; the verification step must include compiler availability and IDE platform selection.",
      "Illustrative AI case: a student asks AI to fix a NetBeans error and receives instructions for IntelliJ or Maven. This shows why Module 0 constrains AI to diagnosis and requires local version evidence.",
    ],
    examples: [
      "Run `java --version` and `javac --version`, screenshot or paste both, and compare to course-required versions.",
      "Create a NetBeans Java project, run Hello World, then identify which file contains `main` and which tool compiled it.",
      "Ask AI to explain a setup error without letting it rewrite project structure.",
    ],
    wayback: ["James Gosling", "Bill Joy", "Grace Hopper"],
    display: "A setup verification checklist should show operating system, JDK version, compiler version, NetBeans version, project template, first run result, and diagnostic-only AI rule.",
    risk: "High: installer UI, JDK versions, NetBeans menus, and screenshots age before each offering.",
  },
  {
    n: 1,
    title: "Introduction: Socio-Technical Engineering and the Object Model",
    slug: "introduction-socio-technical-engineering-and-the-object-model",
    oneLine: "Students learn why objects — not procedures — are the right mental model for business software, by running and breaking a working application before they write one.",
    core: "object model, business entities, compilation versus runtime behavior, socio-technical requirements, and first AI verification boundary",
    sources: [
      "Booch, Grady, Object-Oriented Analysis and Design with Applications, 2nd ed., 1994. Booch provides a durable foundation for treating objects as modeling units with identity, state, and behavior. Use it to frame why business software maps well to objects.",
      "Rumbaugh, James et al., Object-Oriented Modeling and Design, 1991. This source supports the idea that OO modeling is analysis and design, not merely Java syntax. It helps connect library books, patrons, and checkouts to conceptual models.",
      ...shared.java.slice(0, 2),
      ...shared.ai.slice(0, 2),
    ],
    cases: [
      "Illustrative course lab: a library checkout program runs but prints the wrong patron for a book. The case is suitable because it distinguishes running code from correct behavior before vocabulary is introduced.",
      "Real pedagogical pattern: prediction-before-run activities in programming education reveal misconceptions about state and control flow. Use this to support asking students to predict output before execution.",
      "AI explanation comparison: students ask AI to explain provided code and compare it to their own reading. This case exposes plausible but incomplete explanations rather than treating AI as an answer key.",
    ],
    examples: [
      "Library domain: `Book`, `Patron`, and `CheckoutTransaction` as objects rather than rows or procedures.",
      "Inventory domain: `Product`, `Supplier`, and `StockMovement` as parallel entities.",
      "Scheduling domain: `Patient`, `Provider`, and `Appointment` as parallel entities.",
    ],
    wayback: ["Ole-Johan Dahl", "Kristen Nygaard", "Grady Booch"],
    display: "A comparison table should map procedural representation versus object representation for the same library checkout task: data location, behavior location, failure mode, and AI-safe delegation.",
    risk: "Low for OO principles; medium for AI tool examples.",
  },
  {
    n: 2,
    title: "Creating and Displaying Multiple Objects",
    slug: "creating-and-displaying-multiple-objects",
    oneLine: "Students learn to instantiate multiple objects from one class and trace how Java manages them in memory.",
    core: "class/object distinction, constructors, references, fields, stack/heap mental model, multiple instances, and object tracing",
    sources: [
      ...shared.java,
      "Sorva, Juha, \"Visual Program Simulation in Introductory Programming Education,\" PhD dissertation, Aalto University, 2012. Sorva's work supports visualization and tracing of object state and references for novices. It is directly relevant to stack/heap mental models without going into JVM implementation internals.",
      ...shared.pedagogy.slice(0, 2),
    ],
    cases: [
      "Illustrative course lab: three `Person` objects print the same name but different ages; students must locate where the values live. This exposes the reference-versus-object distinction.",
      "Library example: two patrons check out different books using the same `Patron` class. The insight is that a class is a blueprint and each object has separate state.",
      "Common novice bug: modifying one variable and expecting another object to change, or copying references accidentally. This is well documented in programming education literature on mental models.",
    ],
    examples: [
      "Instantiate three `Book` objects with different ISBNs and trace fields after each constructor call.",
      "Modify `patronA.name` and explain why `patronB.name` does not change.",
      "Use AI only to quiz the student on their own class after they have written it.",
    ],
    wayback: ["Adele Goldberg", "Alan Kay", "Jean E. Sammet"],
    display: "A memory-trace diagram should show reference variables separately from heap objects, with arrows, field values, and one method call changing only one instance.",
    risk: "Low for Java concepts; medium for visual simplification because stack/heap diagrams can overclaim implementation detail.",
  },
  {
    n: 3,
    title: "User Interaction Design",
    slug: "user-interaction-design",
    oneLine: "Students learn to design user flows as navigation between screens, connecting what the user sees to what the objects do.",
    core: "screen navigation, CardLayout, object state across screens, references, user-flow diagrams, and separation of concerns",
    sources: [
      "Norman, Donald A., The Design of Everyday Things, revised ed., 2013. Norman supports teaching user actions, feedback, and conceptual models before GUI code. This is useful for connecting screens to user goals.",
      "Shneiderman, Ben et al., Designing the User Interface, 6th ed., 2016. This provides a human-computer interaction base for screen flows, feedback, and task-centered design.",
      ...shared.java.slice(0, 2),
      ...shared.pedagogy,
    ],
    cases: [
      "Illustrative course lab: Search → Result → Checkout → Confirmation for library checkout, with a `Book` object passed between screens. This case ties visual flow to object lifecycle.",
      "Common UI state bug: one screen displays stale object data because the student copied values rather than passing a reference or refreshing from the model.",
      "AI scaffold case: AI generates CardLayout skeleton while the student owns business behavior. This illustrates the module's structure-versus-behavior boundary.",
    ],
    examples: [
      "Library flow: a selected `Book` reference moves from search result to checkout confirmation.",
      "Inventory flow: a selected `Product` moves from list to adjustment screen.",
      "Scheduling flow: a selected `AppointmentSlot` moves from calendar to booking confirmation.",
    ],
    wayback: ["Douglas Engelbart", "Ben Shneiderman", "Adele Goldberg"],
    display: "A screen-flow diagram should show screens, user actions, object references passed, object fields populated, and where state is stored after each transition.",
    risk: "Medium: CardLayout examples are stable but UI teaching may shift toward JavaFX later in the course.",
  },
  {
    n: 4,
    title: "Finding Bugs: The Debugging Workflow",
    slug: "finding-bugs-the-debugging-workflow",
    oneLine: "Students learn a systematic debugging methodology — hypothesis, isolation, test — using the IDE debugger and their own reasoning, not error message reading alone.",
    core: "debugging workflow, symptom/proximate/root cause, breakpoints, stepping, object inspection, and AI debugging phase gate",
    sources: [
      "Zeller, Andreas, Why Programs Fail: A Guide to Systematic Debugging, 2nd ed., 2009. Zeller provides a rigorous and teachable framing of debugging as systematic hypothesis testing. It is directly relevant to symptom, cause, isolation, and experiment.",
      "Eisenstadt, Marc, \"My Hairiest Bug War Stories,\" Communications of the ACM, 1997. This source documents the messy reality of debugging and why expert strategies matter beyond reading error messages.",
      ...shared.pedagogy,
      ...shared.ai,
    ],
    cases: [
      "Illustrative course lab: library checkout assigns a book to the wrong patron after a particular operation sequence. Students must form a hypothesis before seeing the fix.",
      "Documented educational failure mode: novices often patch symptoms or follow error messages without forming a causal model. Programming education research supports structured tracing and explanation.",
      "AI debugging case: a generated fix changes a return value and hides the symptom while leaving the design defect. This is illustrative but strongly aligned with AI usability findings.",
    ],
    examples: [
      "Use NetBeans breakpoints to inspect `book.currentPatron` before and after checkout.",
      "Write a bug hypothesis in plain English before asking AI whether it is plausible.",
      "Classify evidence as symptom, proximate cause, or root cause.",
    ],
    wayback: ["Grace Hopper", "Edsger W. Dijkstra", "Andreas Zeller"],
    display: "A debugging workflow diagram should show symptom → hypothesis → isolation → test → fix or revise hypothesis, with AI allowed only after the hypothesis is stated.",
    risk: "Low for methodology; medium for NetBeans debugger UI steps.",
  },
  {
    n: 5,
    title: "Modeling the Supply Side",
    slug: "modeling-the-supply-side",
    oneLine: "Students learn to model the entities that provide resources in a business system — the objects that exist before any user interacts with them.",
    core: "supply-side object modeling, entity/relationship/transaction distinction, arrays, loops, catalogs, and AI-generated class-stub review",
    sources: [
      "Fowler, Martin, Analysis Patterns: Reusable Object Models, 1997. Fowler is useful for distinguishing recurring domain modeling structures, especially entities and transactions. Use it to keep supply-side modeling from becoming a list of fields.",
      "Evans, Eric, Domain-Driven Design, 2003. Evans supports the idea that object models encode domain language and boundaries. The chapter should use this lightly and accessibly for graduate beginners.",
      ...shared.java,
      ...shared.ai.slice(0, 2),
    ],
    cases: [
      "Illustrative course lab: a library catalog exists before a patron arrives; confusing catalog state with checkout state creates the wrong design.",
      "Inventory variant: products and suppliers exist before a sale; treating the user transaction as the source of product truth causes duplication.",
      "AI design-review case: AI suggests extra manager/controller classes before students can justify them. The student must identify unnecessary objects.",
    ],
    examples: [
      "Library: `Catalog` contains `Book` objects and offers search methods.",
      "Inventory: `Inventory` contains `Product` objects and tracks current quantity.",
      "Scheduling: `ProviderDirectory` contains `Provider` objects and available service types.",
    ],
    wayback: ["Peter Chen", "Martin Fowler", "David Parnas"],
    display: "A model-classification table should separate entity objects, relationship objects, transaction objects, and unnecessary classes for library, inventory, and scheduling domains.",
    risk: "Low for modeling principles; medium for AI class-design examples.",
  },
  {
    n: 6,
    title: "Designing the Person into the Application",
    slug: "designing-the-person-into-the-application",
    oneLine: "Students learn to model users and authentication as first-class objects — not as a database lookup, but as a designed part of the object system.",
    core: "Person versus UserAccount, authentication sequence, password hashing concept, Map-based directories, threat-model-lite thinking, and AI security gates",
    sources: [
      "Saltzer, Jerome H. and Schroeder, Michael D., \"The Protection of Information in Computer Systems,\" Proceedings of the IEEE, 1975. This is foundational for security design principles such as least privilege and fail-safe defaults. Use it to show authentication is a design concern, not a code snippet.",
      "NIST SP 800-63B, Digital Identity Guidelines: Authentication and Lifecycle Management, current edition. This is the source of record for modern authentication guidance. Use only high-level, beginner-appropriate points and verify edition details before publication.",
      ...shared.java.slice(0, 2),
      ...shared.ai,
    ],
    cases: [
      "Illustrative course lab: two login systems, one storing plaintext passwords and one storing hashes. Students reason from 'if someone reads the file, what can they do?'",
      "Common generated-code risk: AI produces plaintext password storage unless the prompt specifies otherwise. This is appropriate for the module because it links omitted requirements to unsafe code.",
      "Real-world pattern: credential leaks demonstrate why stored password representation matters; use a generic verified breach example only if the drafter adds citations.",
    ],
    examples: [
      "Library: distinguish `Person`, `Patron`, and `UserAccount` responsibilities.",
      "Inventory: distinguish employee identity from permission to change stock.",
      "Scheduling: distinguish patient demographic information from login credentials.",
    ],
    wayback: ["Jerome H. Saltzer", "Michael D. Schroeder", "Butler Lampson"],
    display: "An authentication sequence diagram should show username input, account lookup, hash comparison, success/failure result, and which object owns each responsibility.",
    risk: "High for security recommendations and NIST guidance; verify before each offering.",
  },
  {
    n: 7,
    title: "Order Processing and Polymorphism",
    slug: "order-processing-and-polymorphism",
    oneLine: "Students learn why polymorphism is not a Java feature but a design strategy — the ability to add new types without changing existing code.",
    core: "inheritance, overriding, dynamic dispatch, polymorphism, open/closed principle, LSP-lite, and AI hierarchy review",
    sources: [
      "Liskov, Barbara and Wing, Jeannette, \"A Behavioral Notion of Subtyping,\" ACM Transactions on Programming Languages and Systems, 1994. This is the foundational source for behavioral subtyping. Use an informal version to teach why subclasses must preserve expectations.",
      "Meyer, Bertrand, Object-Oriented Software Construction, 2nd ed., 1997. Meyer supports design by contract and open/closed thinking. It is useful for explaining polymorphism as a design discipline.",
      ...shared.java,
      "Bloch, Joshua, Effective Java, 3rd ed., 2018. Bloch provides practical Java guidance on inheritance and class design. Use it to temper simplistic 'inheritance is always good' examples.",
    ],
    cases: [
      "Illustrative course lab: `Checkout`, `Reserve`, and `Renew` transactions replace an if-else chain with polymorphic dispatch.",
      "Classic Square/Rectangle teaching case: useful for showing that ordinary language 'is-a' can fail behaviorally. Label as teaching case, not production postmortem.",
      "AI hierarchy case: generated superclass/subclass structure looks tidy but violates the parent contract. Students must write the is-a sentence before code.",
    ],
    examples: [
      "Library: `TransactionProcessor` accepts any `Transaction` and calls overridden `process()`.",
      "Inventory: `StockIncrease`, `StockDecrease`, and `StockTransfer` share transaction behavior.",
      "Scheduling: `InitialVisit`, `FollowUp`, and `Cancellation` share appointment-event behavior.",
    ],
    wayback: ["Barbara Liskov", "Ole-Johan Dahl", "Kristen Nygaard"],
    display: "A dispatch trace should show supertype reference, actual object type, method call, method selected at runtime, and what would change if using if-else.",
    risk: "Low for concepts; high pedagogical risk because dynamic dispatch is counterintuitive.",
  },
  {
    n: 8,
    title: "Digital Ecosystems: Data Management and CRUD",
    slug: "digital-ecosystems-data-management-and-crud",
    oneLine: "Students learn to design the full lifecycle of data in a business application — create, read, update, delete — and to implement it with file-based persistence.",
    core: "CRUD lifecycle, CSV persistence, file I/O, exceptions, data integrity, memory-to-disk flow, and AI data-loss audit",
    sources: [
      "Date, C. J., An Introduction to Database Systems, 8th ed., 2003. Although databases are out of scope, Date provides stable vocabulary for data integrity and persistence. Use lightly to explain why stored data has lifecycle obligations.",
      ...shared.java,
      "Oracle, Java Tutorials and API documentation for `java.io`, `java.nio.file`, and exception handling. These are the primary Java sources for file operations and failure modes. Verify APIs against the course's Java version.",
      ...shared.ai,
    ],
    cases: [
      "Illustrative course lab: a library catalog exists only in memory and disappears on restart. The case motivates persistence before implementation.",
      "Data loss scenario: program crashes after adding a record but before saving. This is ideal for showing why CRUD design includes failure states.",
      "AI-generated CRUD case: code reads and writes CSV but swallows `IOException` or overwrites data on partial failure. Students audit data-loss risk.",
    ],
    examples: [
      "Library: load books from CSV at startup, add/update/remove, save on exit.",
      "Inventory: update product counts and preserve stock movements.",
      "Scheduling: persist appointments and avoid duplicate booking after restart.",
    ],
    wayback: ["C. J. Date", "Edgar F. Codd", "Grace Hopper"],
    display: "A data-lifecycle flow should show user input → object in memory → collection → CSV write → CSV read → object reconstruction → screen display, with exception points.",
    risk: "Medium: file APIs are stable, but teaching CSV as persistence must not imply production database adequacy.",
  },
  {
    n: 9,
    title: "Targeting and Sorting: Working with Collections",
    slug: "targeting-and-sorting-working-with-collections",
    oneLine: "Students learn to sort, filter, and search collections of objects — and to choose the right collection type for each task.",
    core: "List, Map, Set, Comparator, Comparable, filtering, search, streams intro, access patterns, and AI collection-choice audit",
    sources: [
      "Naftalin, Maurice and Wadler, Philip, Java Generics and Collections, 2006. This is a strong practical source for Java collections, generics, and collection contracts. Use it for collection choice and type-safe examples.",
      "Cormen, Leiserson, Rivest, and Stein, Introduction to Algorithms, 4th ed., 2022. CLRS supports search, sort, and complexity reasoning. Use only the portions needed for access pattern and performance intuition.",
      ...shared.java,
      "Bloch, Joshua, Effective Java, 3rd ed., 2018. Bloch helps explain collection APIs, generics, and API design tradeoffs in Java practice.",
    ],
    cases: [
      "Illustrative course lab: 500 books sorted by title, author, and year; students compare naive and comparator-based approaches.",
      "Collection mismatch case: using `List` for frequent ISBN lookup works at small scale but reveals the wrong access pattern.",
      "AI-generated search case: code uses linear search without asking expected size. The student must decide if O(n) is acceptable.",
    ],
    examples: [
      "Library: `List<Book>` for display order, `Map<String, Book>` for ISBN lookup.",
      "Inventory: `Set<String>` for unique SKUs and `Map<String, Product>` for lookup.",
      "Scheduling: sort appointment slots by time and filter by provider.",
    ],
    wayback: ["Donald Knuth", "Robert Tarjan", "Philip Wadler"],
    display: "A collection-choice matrix should show operation profile, expected size, required invariant, candidate collection, complexity implication, and AI prompt clause.",
    risk: "Low for core concepts; medium for stream syntax version and style guidance.",
  },
  {
    n: 10,
    title: "Introduction to GUI Programming with JavaFX",
    slug: "introduction-to-gui-programming-with-javafx",
    oneLine: "Students learn to connect the object model they have built to a visual interface — understanding that the GUI is a view of the model, not the model itself.",
    core: "JavaFX scene graph, panes, controls, TableView, property binding, model-view-controller separation, and AI GUI boilerplate audit",
    sources: [
      "OpenJFX Documentation, JavaFX controls, layout, properties, and TableView guides, current version. OpenJFX is the living source for JavaFX after its decoupling from the JDK. Verify version and setup instructions before each offering.",
      "Oracle, JavaFX 8 documentation and tutorials, especially scene graph and property binding. Some official materials remain useful conceptually, but version details may age.",
      "Krasner, Glenn E. and Pope, Stephen T., \"A Cookbook for Using the Model-View-Controller User Interface Paradigm in Smalltalk-80,\" Journal of Object-Oriented Programming, 1988. This is a foundational MVC source that supports separating model, view, and controller.",
      ...shared.pedagogy.slice(0, 2),
    ],
    cases: [
      "Illustrative course lab: the same `Book` objects displayed as console output and as a JavaFX TableView. Students identify what changed and what stayed model-level.",
      "GUI leakage case: AI puts search logic and persistence directly in the view code. Students refactor to preserve model-view separation.",
      "Setup friction case: JavaFX module/path configuration fails even when Java itself works. This reinforces Module 0 setup verification.",
    ],
    examples: [
      "Library: TableView of `Book` objects with title, author, availability columns.",
      "Inventory: TableView of products with stock status highlighting.",
      "Scheduling: TableView or ListView of appointment slots filtered by date.",
    ],
    wayback: ["Adele Goldberg", "Trygve Reenskaug", "Ben Shneiderman"],
    display: "A model-view-controller diagram should map domain object fields to TableView columns, controller methods, and forbidden model logic in view code.",
    risk: "High: JavaFX setup, module configuration, Scene Builder compatibility, and examples require review before each offering.",
  },
  {
    n: 11,
    title: "Event-Driven Programming: Making the Application Respond",
    slug: "event-driven-programming-making-the-application-respond",
    oneLine: "Students learn to connect user actions to application behavior using JavaFX event handling — and to maintain the model-view separation under the pressure of deadline.",
    core: "event loop, event handlers, registration, lambdas, inner classes, responsibility decomposition, and click-to-model-to-view tracing",
    sources: [
      "OpenJFX Documentation, JavaFX event handling and input events, current version. This is the primary source for event sources, handlers, filters, and JavaFX event classes.",
      "Gamma, Helm, Johnson, and Vlissides, Design Patterns, 1994. Use only for observer/event-dispatch lineage and responsibility separation; formal patterns are out of scope.",
      "Harel, David, \"Statecharts: A Visual Formalism for Complex Systems,\" Science of Computer Programming, 1987. Statecharts support representing event-driven behavior as states and transitions when handler code becomes hard to reason about.",
      ...shared.java.slice(0, 2),
    ],
    cases: [
      "Illustrative course lab: one button handler validates input, mutates model, formats output, updates view, and writes a file. Students count responsibilities and decompose.",
      "Duplicate event case: a button can be clicked twice before model state updates, producing duplicate transactions. Students add guard conditions.",
      "AI handler case: AI generates a complete handler body that mixes UI and business logic. Students convert it to separate method calls.",
    ],
    examples: [
      "Library: checkout button calls validate selection, perform checkout, refresh table, show confirmation.",
      "Inventory: restock button validates quantity, updates product, records movement, refreshes view.",
      "Scheduling: book appointment button validates slot, updates appointment, refreshes calendar.",
    ],
    wayback: ["David Harel", "Douglas Engelbart", "Adele Goldberg"],
    display: "An event trace should show user action → event object → handler → model update → view refresh, with responsibility count for each method.",
    risk: "Medium-high: JavaFX event APIs are stable but examples are setup-sensitive.",
  },
  {
    n: 12,
    title: "Advanced GUI: Scene Builder and Complex Interfaces",
    slug: "advanced-gui-scene-builder-and-complex-interfaces",
    oneLine: "Students learn to use Scene Builder to design complex interfaces while maintaining a clean boundary between the visual design and the application logic.",
    core: "Scene Builder, FXML, @FXML controller injection, visual layout, controller wiring, and AI-generated FXML/controller stub audit",
    sources: [
      "OpenJFX Documentation, FXML introduction and controller documentation, current version. This is the source of record for FXML syntax, `fx:id`, `onAction`, and controller binding.",
      "Oracle, \"Introduction to FXML,\" JavaFX documentation. This provides a clear conceptual explanation of FXML as an XML-based object graph representation.",
      "Scene Builder official documentation and release notes, current version. Use for tool-specific steps and compatibility; verify before each offering.",
      ...shared.pedagogy.slice(1, 4),
    ],
    cases: [
      "Illustrative course lab: the Module 3 screen flow is redesigned in Scene Builder while the controller responsibilities remain unchanged.",
      "FXML mismatch case: an `fx:id` appears in FXML but no `@FXML` field exists, or an `onAction` points to a missing handler. Students trace every connection.",
      "AI FXML case: AI generates plausible FXML that does not match the student's controller or model names. The audit focuses on wiring, not appearance.",
    ],
    examples: [
      "Library: redesign checkout interface in Scene Builder and connect existing controller stubs.",
      "Inventory: multi-pane stock adjustment screen with distinct controller methods.",
      "Scheduling: calendar/date selection screen with FXML fields traced to controller state.",
    ],
    wayback: ["Adele Goldberg", "Trygve Reenskaug", "Douglas Engelbart"],
    display: "A FXML-controller mapping table should list FXML element, `fx:id`, controller field, handler method, model object touched, and verification step.",
    risk: "High: Scene Builder UI, FXML conventions, and JavaFX compatibility require review before each course run.",
  },
  {
    n: 13,
    title: "Advanced Data: Collections, Unit Testing, and Lambda",
    slug: "advanced-data-collections-unit-testing-and-lambda",
    oneLine: "Students learn to write tests for their own code and use Java's advanced collection operations — and discover that untested code is code whose correctness you are guessing at.",
    core: "JUnit, assertions, test cases, test limitations, lambdas, streams, method references, and AI-generated test coverage audit",
    sources: [
      "JUnit 5 User Guide, current version. This is the primary source for annotations, assertions, lifecycle, and test structure. Verify examples against the course's build setup.",
      "Beck, Kent, Test-Driven Development: By Example, 2002. Beck provides the pedagogical framing for test-first thinking, even if the course uses a lighter version. Use to explain why tests clarify behavior before implementation.",
      "Freeman, Steve and Pryce, Nat, Growing Object-Oriented Software, Guided by Tests, 2009. This source connects testing to object design and feedback. Use sparingly for beginner-friendly design implications.",
      ...shared.java,
      ...shared.ai,
    ],
    cases: [
      "Illustrative course lab: a search method works until a new feature changes matching rules; a regression test would have caught it.",
      "AI test case gap: AI generates normal-path tests but misses empty catalog, null input, duplicate records, or boundary cases. Students add the missing cases.",
      "Lambda refactor case: a loop-based filter is rewritten as a stream pipeline; students verify same behavior before accepting the refactor.",
    ],
    examples: [
      "Library: test search with empty catalog, one result, multiple results, no result, and null input.",
      "Inventory: test restock and stock decrease boundaries.",
      "Scheduling: test duplicate appointment prevention and date filtering.",
    ],
    wayback: ["Kent Beck", "Michael Feathers", "Frances E. Allen"],
    display: "A test coverage matrix should map method behavior to normal, boundary, error, null, and regression cases, with columns for AI-suggested and student-added tests.",
    risk: "Medium-high: JUnit versions and IDE integration details must be checked before each offering.",
  },
  {
    n: 14,
    title: "Final Project: Complete Application with Ecosystem Design",
    slug: "final-project-complete-application-with-ecosystem-design",
    oneLine: "Students complete, defend, and present a full GUI business application — and demonstrate, for every AI-assisted decision, what required their own engineering judgment.",
    core: "final GUI application, ecosystem design, code review, AI Use Disclosure synthesis, design defense, deployment awareness, and professional handoff",
    sources: [
      "Schön, Donald A., The Reflective Practitioner, 1983. Schön supports the final defense as professional reflection-in-action rather than a recitation of features. It gives a research basis for asking students to defend decisions under questioning.",
      "Fagan, Michael E., \"Design and Code Inspections to Reduce Errors in Program Development,\" IBM Systems Journal, 1976. Fagan supports structured review and inspection as professional practice. Use it for code review and final audit discipline.",
      "Bass, Len, Clements, Paul, and Kazman, Rick, Software Architecture in Practice, 4th ed., 2021. This supports tradeoff reasoning and architecture decisions in the final defense. Use beginner-level concepts: quality attributes, alternatives, and consequences.",
      ...shared.ai,
      ...shared.pedagogy.slice(2, 4),
    ],
    cases: [
      "Course-internal final demo: a running GUI application with source, AI disclosures, and examiner questions. This is the principal case once the course has run; until then it remains a designed assessment case.",
      "Professional code review: documented inspection practices show that software quality depends on reviewable decisions, not just working code.",
      "AI-assisted integration case: code generated for one component conflicts with earlier design decisions. The student must show what was verified, changed, or rejected.",
    ],
    examples: [
      "Library: final GUI supports catalog search, patron login, checkout/return, persistence, tests, and disclosure.",
      "Inventory: final GUI supports product search, stock movement, user roles, persistence, tests, and disclosure.",
      "Scheduling: final GUI supports provider schedule, appointment booking, persistence, tests, and disclosure.",
    ],
    wayback: ["Margaret Hamilton", "Watts Humphrey", "Donald Schön"],
    display: "A final defense matrix should list component, AI assistance used, human verification, evidence, design decision, rejected alternative, and examiner question.",
    risk: "Medium: final project requirements stable, but AI disclosure expectations and platform details age.",
  },
];

function list(items) {
  return items.map((x) => `- ${x}`).join("\n");
}

function wayback(names, core) {
  return names.map((name) => {
    return `- **${name}** — Connection: use this figure to connect ${core} to the deeper lineage of programming languages, software design, computing practice, or professional judgment. Selection criteria: Wikipedia-accessible; final portrait pass should verify date/eligibility and avoid repeating figures across chapters. Example prompt: "Imagine ${name} reviewing a student's INFO 5100 project for ${core}. Ask what evidence proves the student understood the design rather than merely accepted generated code."`;
  }).join("\n");
}

function stateOfField(m) {
  return `### What is settled
The settled instructional core is that introductory application engineering students need executable mental models, not just syntax exposure. Java's type system, class model, object references, collections, exceptions, GUI APIs, and testing tools are documented in official specifications and API references, while programming-education research shows that students learn these concepts more reliably when they predict, trace, test, and explain code. For this chapter, the author can confidently treat ${m.core} as a design-and-verification problem, not only an implementation topic.

### What is disputed
The disputed issues are how early to introduce AI assistance, how much code generation to allow, whether object-oriented design remains the right first paradigm for applied graduate students, and how formal the verification layer should be. The book's position is that AI can be introduced, but only behind explicit phase gates: students must understand enough to inspect, explain, and reject output. Drafters should avoid claiming that AI is either harmless or categorically inappropriate; the point is disciplined delegation.

### What has changed recently (last 5 years)
AI coding assistants have changed the meaning of beginner programming assignments: students can obtain plausible code before they understand it. Java platform content is comparatively stable, but JavaFX setup, IDE workflows, JUnit integration, and AI-tool interfaces are high-aging-risk. Current-source claims about Claude, Copilot, NetBeans, Scene Builder, JavaFX packaging, or academic integrity policy should be rechecked before each offering.`;
}

function thesis(m) {
  return `This chapter serves the book's central thesis by making ${m.core} part of the student's own verification capacity. The book argues that productive AI-assisted development requires genuine object-oriented understanding because the student cannot safely delegate what they cannot identify, design, or verify.

In the threaded project, this chapter contributes one concrete layer to that capacity. The learner must supply the business meaning, object boundary, failure expectation, user workflow, or verification criterion. AI can help explain, scaffold, or implement only after that human layer exists.

The research literature supports the thesis in a calibrated way. AI coding-assistant studies support the usefulness of generated code and productivity assistance, but usability and security studies show that generated code still requires human review. Programming-education research supports worked examples, tracing, prediction, testing, and reflection as the route from copied code to understanding.`;
}

function pedagogy(m) {
  return `The target reader knows basic programming ideas from Python, R, or a prior scripting context, but does not yet have Java, OO design, debugging discipline, or a reliable way to supervise AI-generated code. Prior knowledge required for this chapter should be stated as capabilities from earlier modules, not as generic "knows programming."

Common misconceptions include "if it compiles, it works," "AI writes better code than I can," "debugging means reading error messages," and "OO is just Java syntax." The strongest delivery sequence is: run or inspect a concrete artifact, predict behavior, introduce vocabulary, work a library example, transfer to inventory/scheduling variants, then ask for an AI Use Disclosure that names what the student verified.

Known teaching failure modes are syntax-first lectures without running examples, letting AI produce complete answers before students can inspect them, and treating the threaded project as a set of disconnected labs. Students who understand the concept can explain the behavior of their own program and identify what evidence would falsify their design. Students who merely memorize can reproduce definitions but cannot debug, adapt, or reject plausible generated code.`;
}

function content(m) {
  const nn = String(m.n).padStart(2, "0");
  return `# Research: Chapter ${nn} — ${m.title}
## ${bookTitle}

**Chapter one-line:** ${m.oneLine}
**Research date:** ${date}

---

## 1. Primary Sources

### Foundational papers and texts
${list(m.sources)}

### Key empirical cases
${list(m.cases)}

---

## 2. The Core Concept — State of the Field

${stateOfField(m)}

---

## 3. Application Domain Examples

${list(m.examples)}

---

## 4. The Book's Thesis Connection

${thesis(m)}

---

## 5. The AI Wayback Machine — Candidate Figures

${wayback(m.wayback, m.core)}

Diversity note: computing history candidates skew U.S./Western European and male if the drafter uses only canonical language-design figures. Across the full book, preserve substantive candidates such as Grace Hopper, Adele Goldberg, Jean E. Sammet, Frances E. Allen, Margaret Hamilton, and Barbara Liskov where appropriate, and balance them against domain-specific figures for security, testing, UI, and software process.

---

## 6. Pedagogical Delivery Research

${pedagogy(m)}

---

## 7. Representation and Display Research

${m.display}

---

## 8. Open Questions and Research Gaps

- Aging risk: ${m.risk}
- Verify current JDK, NetBeans, JavaFX, Scene Builder, JUnit, and AI-tool instructions before each offering.
- Replace illustrative course-lab cases with documented student artifacts after the course has run, with permission and anonymization.
- Confirm whether the EDGE/Coursera gradebook, AI Use Disclosure form, and CLAUDE.md format match the final course deployment.
- Avoid overclaiming: compilation, passing tests, and AI fluency are evidence, but none alone proves the application satisfies requirements.

---

## 9. Sourcing Notes

Use official Java, OpenJFX, NetBeans, Scene Builder, and JUnit documentation for tool and API claims. Use Java books and OO design texts for durable conceptual explanation. Use AI coding-assistant research only for claims about observed assistance, usability, or risk; do not cite vendor marketing as evidence. Many sources are books or standards and may require library access for page-level citations.`;
}

fs.mkdirSync(pantryDir, { recursive: true });
for (const m of modules) {
  const nn = String(m.n).padStart(2, "0");
  const file = path.join(pantryDir, `research-ch-${nn}-${m.slug}.md`);
  fs.writeFileSync(file, content(m), "utf8");
  console.log(`wrote ${path.relative(bookDir, file)}`);
}

console.log(JSON.stringify({
  written: modules.length,
  strongestCoverage: ["04 debugging", "07 polymorphism", "09 collections", "13 testing", "14 final defense"],
  weakestCoverage: ["00 setup", "12 Scene Builder"],
  highestPriorityGap: "Instructor manual and current tool-version verification before non-author adoption.",
}, null, 2));
