# Chapter 1 — The Move That Changed Everything

*AlphaGo, the Geometry of What Humans Cannot See, and Why the Story Is Cleaner Than I First Told It*

**Author:** Nik Bear Brown

**TL;DR.** Move 37 was correct, exhilarating, and harmless. It was correct because Go has a win condition that arrives in hours. It was exhilarating because the move sat in a region of the solution space humans had not — or perhaps could not — navigate from scratch. It was harmless because Go has every safety property a designer could wish for: a cheap-to-specify objective, a sealed environment, fast-arriving ground truth, free self-play, and locally atomic moves. In the first draft of this chapter I called Move 37 the existence proof on which the rest of this book rests. A reader I trust pointed out that this is not quite right, and that the slippage matters. The honest framing is that Move 37 is the **clean case** — alien reasoning inside a domain with every backstop intact. The rest of the book is what happens to that same alien reasoning as the backstops come off, one at a time.

---

## A Stone on the Fifth Line

On March 10, 2016, in a hotel ballroom in Seoul, a computer placed a black stone on the fifth line of a Go board and the commentators stopped talking.

This was Game 2 of a five-game match between Lee Sedol, one of the strongest Go players of the previous decade, and [AlphaGo](https://www.nature.com/articles/nature16961), a program built by DeepMind. The move — later called Move 37 — came thirty-six stones into the game. A shoulder hit on the fifth line from the right edge.

The reaction matters because it came from people who understood Go. Michael Redmond, the English-language commentator and a 9-dan professional, paused. He talked around the move for a while because there was nothing obvious to say about it. Fan Hui, the European champion who had lost to an earlier version of AlphaGo six months prior, walked out of the commentary room, came back, and said something he has since repeated in interviews: that it was not a human move, but a beautiful one [verify exact phrasing].

By the end of the game, Move 37 was the reason AlphaGo won.

Here is the puzzle. Move 37 was not beyond human comprehension in the sense that the commentators couldn't follow the rest of the game after it was played. They could. They could see, eventually, why the fifth-line shoulder hit worked.

What no human has demonstrated since — including AlphaGo's creators — is the ability to find Move 37-class moves from scratch, in 2016 conditions, by reasoning forward from the position. Top professionals today, trained in a post-AlphaGo world, play moves of similar character with some regularity. Whether that's because they've reconstructed the underlying geometry or memorized a library of representative outputs is a question I'll come back to. Both readings are consistent with the post-2016 evolution of pro play. I want to flag that seam early because it determines how strong the chapter's central claim actually is.

The move was correct. It was also, in a specific sense I'll make precise, not produced by reasoning a human can perform.

That distinction is what people are pointing at when they use the term *alien intelligence*. The term gets thrown around loosely — applied to anything an AI does that seems surprising. My aim in this chapter is to make the term sharp enough to do real work, while being honest about the places where the framework still rests on positions I can't yet operationally distinguish. By the end, you should be able to pick up a claim about alien intelligence and decide whether it's substantive or marketing — and you should also be able to spot the seams in my own version, including the one I just admitted to.

---

## Learning Objectives

By the end of this chapter, you should be able to:

- **Distinguish** local explicability from global navigability using a concrete case from your own field, and explain why most popular AI commentary conflates them
- **Identify** which of five Go-specific safety properties (objective, environment, feedback, self-play, atomicity) are present in a given AI deployment, partial, or absent — and explain what each absence operationally means
- **Differentiate** representational opacity from computational opacity, and explain why a large portion of current oversight machinery addresses only the second
- **Apply** the six-question casebook rubric to an agentic system you encounter in practice
- **Critique** the framework itself — name the evidence that would falsify the central claim that representational opacity is a source of risk distinct from computational opacity

I framed these as capabilities, not topics. If, at the end of the chapter, you cannot do these things, I have not yet taught the chapter — the failure is mine, and the right response is to come back here and figure out which concept didn't land.

## Prerequisites

You should have a conceptual familiarity with what a neural network is — a function with adjustable parameters tuned to fit examples — and a working notion of what makes something an *agent* in the AI sense: a system that takes actions in an environment, not just one that produces outputs for a human to read. If either is shaky, Concepts 1 and 2 will give you what you need.

## Where This Chapter Sits

This chapter is the only one that does not analyze a deployment in trouble. Every chapter that follows takes a real agentic system, identifies which Go properties are missing in its deployment domain, and applies the casebook method to ask: what kind of risk is on the table here, and is the oversight on offer addressing it? This chapter sets up the vocabulary and the rubric. The rest of the book uses them.

---

## Concept 1: Why Go Broke Brute Force

To understand what AlphaGo did, look first at what it replaced.

In 1997, IBM's [Deep Blue beat Garry Kasparov](https://www.research.ibm.com/deepblue/) in chess. The architecture was understood at the time and is still understood now. Deep Blue searched. At each position, it generated legal moves, played them forward in its imagination, generated the opponent's responses, played those forward, and so on — building a tree of possible continuations. At the leaves of the tree, it applied an *evaluation function*: a hand-coded formula that assigned a score to a position based on things chess players already knew how to think about. Material — how many queens, rooks, pawns each side has. Pawn structure. King safety. Control of the center.

Then it used a decades-old algorithm called minimax, refined by alpha-beta pruning, to pick the move that led to the best position assuming both sides played their best responses.

This approach had two things going for it. First, chess is deep but narrow. On an average chess position, you have about 35 legal moves — what's called the *branching factor*. Second, the evaluation function for chess, worked out by generations of human grandmasters, is actually pretty good. Material advantage is a decent proxy for winning. So Deep Blue could search a few dozen moves ahead, evaluate the resulting positions with the hand-coded formula, and do better than any human alive.

**Worked example — why brute force scales well enough for chess.** Suppose you want to search to depth $d$ plies (half-moves). The number of positions is roughly $b^d$, where $b$ is the branching factor. For chess with $b \approx 35$:

- Depth 4: $35^4 \approx 1.5 \times 10^6$ — about 1.5 million positions
- Depth 8: $35^8 \approx 2.3 \times 10^{12}$ — about 2.3 trillion
- Depth 12: $35^{12} \approx 3.4 \times 10^{18}$

Specialized hardware in 1997 could evaluate roughly 200 million chess positions per second [verify], and alpha-beta pruning cuts the effective search tree by a large factor. Deep Blue searched to depths of 12 to 40 plies in certain lines. Brute force, but tractable brute force.

**Now look at Go.** Go is played on a 19×19 board. Each move places a stone on an empty intersection. Early in the game you have close to 361 legal moves — every intersection on the board. Even later, when the board fills and some points become illegal under suicide and ko rules, the branching factor averages around 250.

That's a problem. At depth 10:

- Chess tree: $35^{10} \approx 2.8 \times 10^{15}$
- Go tree: $250^{10} \approx 9.8 \times 10^{23}$

The Go tree at depth 10 is about 300 million times larger than the chess tree at depth 10. And depth 10 is nothing in Go — a typical game lasts around 250 moves.

The branching factor is only half the problem. The bigger issue is the evaluation function. In chess, you can ask: who's winning in this position? The answer is available from material and structural heuristics human grandmasters can describe. You can write them down.

In Go, you cannot. Nobody — no human player, no committee of 9-dans, no team of mathematicians — has ever written down a position-evaluation formula for Go that works. The heuristics exist in the heads of strong players as something closer to pattern recognition than to calculation. Ask a professional why one position is better than another and you'll get a mix of precise reasoning ("this group lacks eye-shape, so it can die under pressure") and something more like perception ("this wall feels thin").

So Go breaks brute-force search on both axes. The tree is too wide to enumerate, and the leaves are too hard to evaluate. Go wasn't unsolvable because we lacked computing power. Go was unsolvable for the chess playbook because the chess playbook needs a writable evaluation function, and nobody could write one for Go.

**The design choice hidden in this problem.** You could imagine throwing enough compute at Go to win by volume — build a bigger Deep Blue. Several groups tried. They got to roughly strong-amateur level and stalled. The ceiling was not hardware.

The alternative was to give up on writing the evaluation function by hand and instead *learn* it. That is the design choice AlphaGo made, and it is the move that matters for the rest of this chapter. The field decided the evaluation function was something a neural network should discover, not something a grandmaster should author.

Every time you see a modern AI system in a domain where the rules are hard to write down — vision, language, biology, chemistry — you are looking at a version of the same choice.

**Common misconception.** People sometimes describe Go as "harder than chess" in a way that suggests Go has more total game positions than chess. This is true but doesn't actually drive the difficulty for AI. What drives the difficulty is the inability to write a per-position evaluation. A game with a vastly larger state space but a writable evaluation function would have been easier to crack with brute force than Go was. The state-space size is a symptom; the missing evaluation function is the disease.

---

## Concept 2: How AlphaGo Actually Reasoned

AlphaGo is three things stacked together: a policy network, a value network, and Monte Carlo Tree Search. Each needs its own explanation.

**The policy network** is a neural network that takes a Go board as input and outputs a probability for every legal move. "If I were going to play here, move A has a 23% chance of being the right move, move B has 18%, move C has 11%," and so on across all ~250 legal options.

What is a neural network, at the level we need? It's a function with millions of adjustable numbers inside. You show it inputs paired with correct outputs — in AlphaGo's case, roughly 30 million moves from strong human games — and an optimization algorithm tunes the internal numbers until the function reproduces the examples as closely as possible. Then you hope (and test) that the function generalizes to cases it wasn't trained on.

The policy network is, in effect, a compressed answer to the question: *given what strong Go players do, what are the moves worth considering in this position?* It doesn't evaluate whether the moves are good. It only narrows the field.

This is already enough to fix half the Go problem. A branching factor of 250 is intractable; a branching factor of the top 5 moves suggested by the policy network is very tractable. The policy network does not solve Go. It converts Go from an enumeration problem into a focused-search problem.

**The value network** is the other neural network. It takes a position as input and outputs a single number between 0 and 1: the probability that black wins from this position, assuming reasonable play from both sides.

This is the evaluation function nobody could write. Instead of writing it, DeepMind trained it — on millions of positions from games AlphaGo had played against itself, each labeled with the eventual outcome.

The value network has, through exposure to millions of complete games, fit itself to the statistical regularities of which positions tend to win. It is not applying grandmaster heuristics. It is also not ignoring them — the positions it trained on were shaped by grandmaster-level play (via bootstrapping from the policy network). But the heuristics it extracted are not human-readable. They live in the weights of the network.

**Monte Carlo Tree Search** coordinates the two networks. The policy network tells you which moves are worth considering. The value network tells you how good a position is. MCTS searches forward through candidate continuations and decides which move to actually play.

MCTS is a fancy name for a simple idea. Pick a move the policy network likes. Play it. Pick a response the policy network likes from the resulting position. Play it. Keep going for a while — sometimes to the end of the game, sometimes just until you hit a position the value network can evaluate with confidence. Record what happened.

Do this thousands of times per move, exploring different lines. Keep track of which first moves have led to good outcomes most often. Pick the one with the best track record.

That's MCTS. It is a statistical approximation of the search Deep Blue did exhaustively, guided at every step by the policy network's sense of what's worth trying and the value network's sense of who's winning.

### Worked example: what happened at Move 37

Reconstruct the machinery at the moment of Move 37.

**State the problem.** AlphaGo's policy network sees the board after 36 stones. It must output a probability distribution over legal moves. MCTS will then search forward from candidate moves and pick one.

**What's given.** A board position, the policy network's weights, the value network's weights, and a fixed compute budget for MCTS.

**Walk through the reasoning.** The policy network assigns probabilities to every legal move. Most moves get nearly zero — they were obviously weak in training, and the network learned that strong players don't play there. A handful get meaningful probability.

The shoulder hit on the fifth line was one of the moves with non-trivial probability. Not the highest. According to DeepMind's post-match analysis, the policy network put it at roughly 1 in 10,000 [verify — Nature paper or AlphaGo documentary]. Low, but not negligible.

MCTS then did what MCTS does. For each candidate move — including the shoulder hit — it played out many possible futures, using the policy network to pick likely responses and the value network to evaluate positions along the way.

Here is where the machinery diverged from human reasoning. A human pro, shown the board, would have applied a heuristic immediately: the fifth line is too far from influence and too close to attack. That heuristic would have killed the shoulder hit before any serious thought. The machinery had no such heuristic. It had statistical regularities extracted from self-play, and in that data, moves of this shape led to positions the value network judged favorable more often than the human heuristic predicted.

MCTS aggregated rollouts. Over thousands of simulations, the shoulder hit accumulated a higher estimated win probability than any alternative. AlphaGo committed.

**Check the answer against intuition or a sanity bound.** AlphaGo won the game. The move's reputation has held up for a decade — top professionals still cite it as instructive. So the machinery's verdict survived the strongest test available: outcome.

**The general lesson.** When you cannot enumerate a space and you cannot evaluate its leaves with a written formula, you can do both approximately by learning the right priors from data — *if* the data captures the right structure. AlphaGo's data was self-play, which captured the structure of Go-as-a-game. The rest of the book is what happens when the available data does not capture the structure of the domain.

### Two common misconceptions worth clearing up

**"AlphaGo learned from human games."** Half right. The first version of the policy network was trained on human games. But before the Lee Sedol match, AlphaGo played millions of games against itself, each producing new training data. By match time, most of its strength came from self-play. AlphaGo's successor, [AlphaZero](https://www.nature.com/articles/nature24270) (2017), dropped human games entirely. It started with nothing but the rules of Go and played itself from scratch. In three days it exceeded the final AlphaGo's strength. This rules out any lingering suspicion that Move 37 was somehow extracted from a game the system had seen — the space AlphaZero navigated contained no human moves at all, and it contained moves like Move 37.

**"Nobody can reconstruct why AlphaGo played Move 37."** The careful version of this claim is harder than it looks. We know what the networks computed — the activations are inspectable. What's not available is a human-runnable procedure that takes the board and outputs the shoulder hit by reasoning. The negative claim ("non-reconstructible") is asymmetric in evidence: to prove reconstructible, one example suffices; to prove non-reconstructible, you'd have to rule out an unbounded space of approaches. So I'll state the careful version: no human has demonstrated the ability to find Move 37-class moves from scratch in 2016 conditions, and the post-2016 evolution of pro play is consistent with two readings — that humans have reconstructed the geometry, or that humans have absorbed representative outputs without reconstructing the geometry. The next concept is where this matters.

---

## Concept 3: Local Explicability and Global Navigability

This is the chapter's most important distinction. I'm pulling it out of the previous concept and giving it its own section because everything else hinges on it.

The commentators in Seoul could explain Move 37 *after the fact*. Given the next thirty stones, given the eventual outcome, they could narrate why the shoulder hit worked. Doesn't that mean the move was human-representable after all?

No. And the reason the answer is no is the most useful thing you can take from this chapter.

**Local explicability** is the ability to explain a single move in terms a human can follow once the move is in hand. **Global navigability** is the ability to find the move from scratch by thinking. These are different capacities, and conflating them is how most popular AI commentary goes wrong.

A human grandmaster can look at Move 37 and, given the game that followed, narrate a plausible justification. The same grandmaster, facing the same board *before* Move 37 was played, would not have found it. The position in the solution space that made the move correct is locally explicable — you can describe one point in it once someone hands you that point — but not globally navigable: you cannot reach that point on your own from the points nearby.

This distinction will appear in every case in this book. Every agentic system you analyze produces outputs that are locally explicable — someone can always tell you a story about why the agent did what it did — while being globally non-navigable, meaning no amount of reading the story teaches you to produce the next such output yourself.

### Why this matters: a sharp version

If only local explicability were available to AI systems, oversight would be easy. You'd read the system's reasoning, agree or disagree, and intervene where you disagreed. The reasoning would carry the audit.

If only global navigability were a problem, oversight would also be easy. Speed bumps would work — slow the system down, do the analysis yourself, override where needed. The bottleneck would be human time.

The hard case — and the one this book is about — is when local explicability is available *and looks correct*, but global navigability is not, and the global structure is what determined the output. The story you read about why the agent did what it did is true at every step and yet doesn't reveal what actually drove the decision, because what drove the decision was the geometry of a space the explanation doesn't traverse.

### The geometry seam I have to admit

Here is a critique of my own framing that I want to surface rather than bury.

The strong version of my claim is that the geometry of solution spaces in alien-reasoning cases is non-representable to humans *in principle*. The weak version is that it is structurally inaccessible to working cognition under realistic constraints — that no human has yet bothered or been able to traverse it because the cost of traversal is too high.

These claims sound similar. They aren't. Under the strong version, no amount of training gets a human to navigate the space; the geometry is genuinely outside the reach of human representation. Under the weak version, training plus enough exposure to representative outputs gets you there eventually; AlphaGo's contribution was to *accelerate* human exploration, not to produce something humans were structurally barred from.

The post-2016 evolution of Go is consistent with both readings. Top professionals now play AlphaGo-influenced moves with some confidence. They've absorbed something. The question is whether they've absorbed the geometry or memorized its outputs. If the first, the strong version was wrong; if the second, the strong version is operationally indistinguishable from the first, and that indistinguishability is a problem the framework should own rather than paper over.

I don't have a clean test for the difference. The honest position is that I'm using the strong version because it's the version that motivates the worry, and I owe you the operational test that would distinguish the two. The chapter doesn't have the test. Exercise 1.9 asks you to design one, and I mean it as an open question — not a homework problem with a key in the back.

In the meantime, here is the position I'm willing to defend without the operational test: *whether the geometry is non-representable in principle or merely inaccessible under realistic constraints, the practical question — can a domain expert evaluate the agent's output by reasoning about the geometry the agent used? — has the same answer in either case during the deployment window that matters.* If a sharper test arrives, this position can move. Until it does, this is what I'll defend.

### Why "alien" is the right word and what it doesn't mean

"Alien reasoning" is not a claim that the machine is conscious, has preferences, or is "really thinking." It is a claim about the geometry of the solution space the system navigates and whether that geometry is humanly representable in the operational sense above. You can make the claim without taking any position on whether there is experience behind the navigation. The question of consciousness is real, but it's a different question, and conflating the two is how this vocabulary loses its teeth.

---

## Concept 4: Go Is the Easy Case (the Reframe)

Now I want to make explicit what the chapter has been working toward.

Go is, structurally, the **easiest** domain in which non-reconstructible correct reasoning can exist. Five properties — which I'll list in a moment, grouped into three families — are all simultaneously present in Go and largely absent in the agentic deployments that fill the rest of this book. The presence of those properties is what makes Move 37 a fascinating puzzle rather than a catastrophe.

Earlier I wrote as if Move 37 itself were the existence proof for what could go wrong with agentic AI. That isn't right. Move 37 proves that **alien reasoning + validation = correct, exhilarating, harmless**. The worrying case for agents is **alien reasoning − validation = ?**. Those are different cases, and the second is not proved by the first. Move 37 is a beautiful demonstration in the *easiest* domain, used to motivate a worry about much harder ones. The motivation is real but the logic doesn't run from one to the other directly. Owning that gap is a precondition for the rest of the book being honest.

Move 37 is the **clean case** — alien reasoning under maximum safety conditions. The book's structure is: here is what alien reasoning looks like when every property below is intact (this chapter); the rest of the book removes one property at a time and traces what changes.

### The five properties, grouped into three families

The five properties cluster naturally into three families. I'll keep all five names because each catches a distinct piece of the design surface, but you should see the groupings — they tell you why the framework keeps coming back to a smaller number of underlying questions.

**Family 1 — Objective.**

**(1) The objective is cheap to specify.** "Win the game" is a function of board state at termination. Writing it down takes one line. There is no ambiguity about whether AlphaGo achieved its objective in Game 2; you count the score and the answer is what it is.

Compare to the objective of an agent helping a patient, representing a client, or running a line of scientific inquiry. "Help this patient" is not a function of any state you can write down. It decomposes into symptom relief, survival, quality of life, cost, autonomy, side effects, downstream dependencies — and decomposes differently for different patients. Any objective function you write is a lossy compression of what the human meant, and the agent will navigate the geometry of the compression, not the geometry of the intention. This is the specification problem, and in Go it does not exist.

**Family 2 — Action footprint.**

**(2) The environment is sealed.** Moves on a Go board do not have off-board consequences. A stone placed at D17 does not also change the weather, make someone lose their job, or commit a resource that cannot be recovered.

**(5) Moves are locally atomic.** A Go stone interacts with its neighbors through rules the game makes explicit: liberties, captures, ko. There are no hidden channels through which one stone affects another.

These two properties point at the same underlying design surface — *the agent's actions have bounded, declared consequences*. I keep them separate because (2) is about the environment's relationship to systems outside the game, and (5) is about interactions among the agent's own actions inside the game. An agent that emails one person and that email becomes context for another agent's decision violates (5) without yet violating (2); an agent that trades a stock in a thin market violates (2) without yet violating (5). But the family question they collectively answer is: **how big is the set of consequences the agent's action could produce that nobody has accounted for?**

**Family 3 — Feedback.**

**(3) Ground truth arrives.** Every Go game terminates. Within hours, you know who won. The feedback signal that makes AlphaGo trainable in the first place is available, on every iteration, with no ambiguity.

**(4) Self-play is free.** AlphaGo's strength came from millions of games against copies of itself. The cost per game was compute time. There were no patients harmed, no markets moved, no clients misrepresented.

These properties are causally entangled — self-play is free *because* ground truth arrives cheaply at the end of each game. In domains where (3) fails, (4) fails downstream of it. The family question is: **can the system explore the space safely and learn from the exploration on a useful timescale?**

### Where each property fails in real deployments

| Family | Property | Where it fails | Operational consequence |
|---|---|---|---|

(See structural notes — this is the kind of table that goes in a Datawrapper embed for the Substack version. For the markdown version, here it is in prose:)

**Property 1 fails** in medical decision-making, where "help the patient" doesn't decompose to a writable function; in legal strategy, where "represent the client" includes long-horizon and reputational considerations no objective captures cleanly; in scientific direction-setting, where "do good science" is judged decades downstream by communities the agent doesn't model.

**Property 2 fails** in any agent that sends emails, executes trades, files documents, or orders reagents. The action footprint extends into systems the agent does not observe and cannot reverse. A Move 37 on a Go board is an interesting shoulder hit. A Move 37 in a legal filing is a brief that has been entered into the record and now has to be defended, retracted, or lived with.

**Property 5 fails** wherever agent actions compound through undeclared channels. An email becomes context for another agent. A document gets cited by a system the original agent doesn't know about. A code change interacts with a deployment pipeline whose configuration the agent never read.

**Property 3 fails** in medicine (treatment outcomes manifest weeks to years out, often confounded with everything else in the patient's life), in law (legal strategy success is sometimes measurable, often not, and the horizon is long), and in research (the best evidence of a research direction's correctness is decades of downstream work).

**Property 4 fails** wherever (3) fails — self-play needs a feedback signal — and additionally where the adversary is genuinely external. You cannot self-play on patients. You cannot self-play on live markets without moving them. Every proxy you build (simulator, sandbox, synthetic dataset) adds a representational gap between the space the agent learned and the space it acts in, and the gap is exactly where the interesting failures hide.

### The sentence that holds the rest of the book together

Move 37 is the existence proof that correct, consequential, non-reconstructible reasoning is possible in a domain where every safety property is intact. **Agentic systems are where we test what happens when those properties come off.**

The book is organized around which property fails first. Chapters 2-4 take cases where Family 1 (objective) is the missing piece. Chapters 5-7 take cases where Family 2 (action footprint) is the issue. Chapters 8-9 take cases where Family 3 (feedback) is the central problem. The structure is not arbitrary — it tracks the family that does the most damage in each domain.

---

## Concept 5: Representational Opacity vs. Computational Opacity

The local-explicability/global-navigability distinction has a corollary I want to make explicit, because most current oversight machinery sits on the wrong side of it.

**Computational opacity** is when you don't know what operations the system performed. The internals are dark. Speed bumps help here — you slow the system down, ask it to show its work, inspect the chain of reasoning, audit the activations. If the operations were ones a human could perform, inspecting them is sufficient even if the system performed them faster than a human could.

**Representational opacity** is when the operations, even if shown, are not ones the human could navigate to from scratch — not because they're computationally heavy but because the space they navigate is one the human cannot represent. Here, inspecting the operations is locally explicable but globally non-navigable. The human reads the steps, agrees with each one, and yet could not have generated the sequence themselves and cannot, from the inspection, learn to.

Most current oversight is computational-opacity oversight: chain-of-thought review, interpretability dashboards, post-hoc explanations, human-in-the-loop pause points. This work is valuable. It addresses computational opacity, which is real and matters.

It does not address representational opacity. If the agent is composing a strategy whose geometry is not in the reviewer's head, slowing the review down does not help; the reviewer is still looking at a locally explicable local story while the global navigation happens somewhere they cannot inspect.

### The narrower critique I have to make

In an earlier draft I wrote that human-in-the-loop oversight "addresses the wrong opacity" in cases of representational opacity. A reader pointed out, correctly, that this is overstated. Most practical oversight isn't trying to reconstruct the agent's reasoning from scratch — it's trying to evaluate the agent's *output* against criteria the reviewer can hold even when the reasoning is opaque. A doctor reviewing an AI-suggested treatment doesn't need to navigate the model's internal geometry; they need to assess whether the suggested treatment is appropriate, given things they do hold (patient context, clinical guidelines, their own examination). The geometry being non-representable is fine if the *output* is evaluable.

That's true, and the previous draft of the chapter overclaimed. The narrower and more defensible position is this: **output-level evaluation works when the output is evaluable against criteria the human can hold. It breaks when the output looks fine but the geometry that produced it embedded correlations the evaluator would have rejected if visible.** Those cases exist. They're the ones this book worries about. But the worry should be stated as that narrower claim — not as a blanket dismissal of speed-bump oversight, which works fine in many cases.

### Placing this relative to vocabulary you may already hold

The terms representational and computational opacity are mine, and I should locate them relative to vocabulary you may have encountered.

[Mechanistic interpretability](https://transformer-circuits.pub/) tries to read the machine directly — to recover internal computations as human-readable structure. It is computational-opacity work in my vocabulary, and ambitious work in that direction is gradually pushing into representational territory at the level of small models on toy tasks.

The [inner-vs-outer alignment distinction](https://www.alignmentforum.org/posts/dnZ2tYn8aJSPxpSv6/inner-and-outer-alignment-decompose-one-hard-problem-into) (Hubinger et al.) is about whether the agent's pursued objective matches the specified objective. That's a different axis from mine: it asks about objectives, I'm asking about the search space.

The [specification gaming literature](https://www.deepmind.com/blog/specification-gaming-the-flip-side-of-ai-ingenuity) is about exploitation of objective gaps. Also a different axis: it assumes the geometry the agent uses is in service of an objective whose gaps are exploited. Representational opacity is about whether you can *see* the geometry, regardless of whether the objective is well-specified.

None of these existing names quite captures the distinction I'm after — whether the *space the agent is searching* is one a human can represent. That's why I'm introducing the new terms. If you're more comfortable in existing vocabulary, the rough mapping is: representational opacity is the kind of opacity mechanistic interpretability *does not yet know how to address*, even when the internals are technically inspectable. It's the next layer down.

### Common misconception worth flagging

The most frequent failure mode in case analyses I've read — including early drafts of my own — is treating representational opacity and computational opacity as the same problem with different names. A system whose chain of thought you can inspect in real time but whose retrieval geometry you cannot represent is computationally transparent and representationally opaque. A system that runs in a black box you cannot inspect but whose reasoning is fully human-representable if inspected is computationally opaque and representationally transparent. The interesting agentic systems in this book are mostly the first kind. Keep this distinction live as you read the cases.

---

## Concept 6: The Six-Question Casebook Rubric

Concepts 1 through 5 give you the vocabulary. This concept gives you the method.

Every case chapter walks through a specific agentic system using a six-question rubric. The rubric is not a template you fill in mechanically. It's a sequence designed to force the two distinctions from earlier — representational vs. computational opacity, and which Go properties the domain lacks — to surface in writing. If an analysis doesn't surface those distinctions, it's not yet a case analysis in the sense this book means.

**Question 1. What is the solution space, and what is its geometry?** Describe the set of outputs the system produces and the structure over them. For AlphaGo, the space is game trees and the geometry is position similarity learned from self-play. For an LLM-based legal agent, the space is filings and the geometry is some learned embedding over legal-document sequences conditioned on case context. Be specific. "All possible outputs" is not an answer; it is an evasion. If you cannot describe the geometry, you cannot argue about whether it is humanly representable, and that argument is the core of the analysis.

**Question 2. Which parts of the geometry are representable by a domain expert, and which are not?** This is the Move-37 question. A domain expert may be able to represent local similarities (two legal briefs that cite the same precedents are related) while being unable to represent the full geometry the agent uses (the embedding may also encode linguistic patterns that correlate with judicial mood, docket timing, opposing counsel's typical moves). The answer is almost never "all" or "none." It is a map of where human representation ends.

**Question 3. Which Go properties does this domain lack, and which family is the dominant problem?** Run all five properties. Identify which family — objective, action footprint, feedback — does the most damage in this case. Each "no" identifies a source of oversight that isn't available. Your analysis of the system's risks has to be commensurate with the missing backstops.

**Question 4. When the system produces a Move-37-like output, is the output locally explicable, and is the local explanation sufficient or insufficient?** Find a concrete example. Show what the agent did, show the plausible post-hoc story, and identify whether evaluating the output against human-held criteria would catch the kind of failure the geometry could produce. If yes, the speed-bump worry doesn't fully apply here. If no — if the output looks fine and the geometry is where the failure lives — this is the case the book exists to study.

**Question 5. What oversight mechanisms address representational opacity, as distinct from mechanisms that only address computational opacity?** Most proposed oversight is speed-bump oversight: slow the system, have a human check the output, add an interpretability layer. This addresses computational opacity. Ask separately: what would have to be true for the relevant geometry to be representable by the reviewer? Often the honest answer is *case selection* — restrict deployment to regions where the geometry is dominated by representable patterns, and treat the boundary as itself the object of oversight. Sometimes the honest answer is that no current mechanism achieves it. That answer is acceptable. Pretending otherwise is not.

**Question 6. What would change your analysis?** Name the evidence that would flip your conclusions. A strong case analysis is falsifiable. It says: if the system produced these specific outputs, I would revise my claim that its geometry is non-representable; if the deployment showed these specific side effects, I would revise my claim that the action footprint is adequately bounded. Without this question, an analysis is a posture, not an argument.

### What a good answer looks like

Specific, bounded, and falsifiable. "The geometry is non-representable" is not an answer; "the geometry is non-representable in the specific region where the agent is selecting between treatment options whose long-term outcomes are separated by less than the trial evidence can discriminate" is an answer. "This agent needs oversight" is not an answer; "this agent's representational opacity cannot be addressed by chain-of-thought review, because the relevant geometry is in the retrieval embedding, not the generation step; the relevant mechanism is either retrieval audit against an independently constructed geometry or deployment restriction to cases where the geometry is locally representable" is an answer.

The first set is marketing. The second set is analysis.

---

## Integration: A Worked Application — The Coding Agent

Apply the rubric to a system you already know structurally: a large language model deployed as an autonomous coding agent, allowed to read a codebase, plan changes, execute commands, and submit pull requests.

**Q1 — solution space and geometry.** The output space is code diffs conditioned on a task description and a repository state. The geometry is a learned embedding in the model's representation space, where "similar" diffs are those the model has learned to produce under similar contexts. The geometry includes patterns absorbed from training data about what kinds of changes typically resolve what kinds of issues, including patterns that don't correspond to any explicit design principle a human engineer holds.

**Q2 — representable vs. not.** An experienced engineer can represent parts of the local geometry — two diffs modifying the same function in similar ways are related. Parts they cannot represent include: cross-file correlations the model absorbed (patterns of change that co-occur across files for reasons the engineer did not identify), and conditioning on task phrasing (small changes in how the task is described move the model through different parts of the embedding in ways the engineer cannot predict without running the system).

**Q3 — which Go properties are missing, and which family dominates.** Objective specification is ambiguous: "fix this bug" is not a complete objective — the fix may introduce regressions, change behavior in edge cases, fail on conditions tests don't cover. Environment is not sealed: a merged PR affects downstream systems and other engineers. Ground truth is partial: tests pass or fail, but tests are a weak oracle for correctness, and bugs can take months to manifest. Self-play is partially available (the agent can run tests on its own outputs) but only on the portion of the objective tests cover. Moves are not locally atomic: a change in one file compounds with existing patterns in ways not visible from the diff. **The dominant family is action footprint** — the agent's PRs become inputs to systems and people who didn't review the geometry that produced them.

**Q4 — locally explicable output.** A coding agent produces diffs with accompanying explanations. The explanations are locally explicable: "I changed this function to handle the null case." The engineer reads it and it checks out. Whether the engineer, facing the same bug, would have produced the same diff — or a diff with the same long-term consequences — is a global-navigability question the explanation doesn't answer. The local explanation is *insufficient* in the cases that matter: the diff that looks fine but embeds a correlation the engineer would have rejected if visible (a quietly-loosened error handler, a coupling between modules the engineer doesn't see).

**Q5 — oversight that addresses representational opacity.** In an earlier draft I wrote that I didn't have a clean answer here. I do now, and the answer is *case selection*. You restrict the agent's deployment to regions of the codebase where the geometry the agent uses is dominated by patterns a senior engineer can hold: refactors with strong test coverage, boilerplate generation, mechanical updates across known-good patterns. The reviewer doesn't navigate the agent's geometry; they verify the agent is operating *inside the region where their own geometry is sufficient*. That's a different oversight architecture from chain-of-thought review or PR-level inspection — it's deployment-restriction oversight, and it's underdeveloped in current practice. The hard part is that the boundary between "agent's geometry is dominated by representable patterns" and "agent's geometry includes non-representable correlations" is itself a representational question, which gestures at why this is hard.

**Q6 — what would change the analysis.** If deployment data showed merged-PR long-term defect rates statistically indistinguishable from human PRs across comparable complexity over a sufficient horizon, I'd revise my concern about global navigability. The geometry would be producing outcomes matching human outcomes, suggesting the representational gap doesn't matter at the outcome level. Absence of such data is itself a finding — it's the data we'd need and don't have.

That's what an analysis looks like at sketch length. A real chapter expands each answer. The structure is the point: six questions, each forcing one of the two distinctions to surface, with explicit falsifiability at the end.

---

## Chapter Summary

Three capabilities you can now exercise.

You can use the working definition of alien reasoning as a diagnostic rather than a slogan. When you encounter a claim that an AI is "thinking in ways humans can't understand," you can translate that claim into a question about solution-space geometry and check whether the evidence supports the strong reading (geometry non-representable in principle) or the weak reading (geometry inaccessible under realistic constraints). You know the difference between representational and computational opacity, and you know that most field discourse conflates them.

You can name what Go gave us that agentic deployments do not. The five properties — cheap objective, sealed environment, arriving ground truth, free self-play, atomic moves — cluster into three families: objective, action footprint, feedback. Move 37 is the clean case where all are intact. Every chapter that follows takes a case where one family fails, and the family that fails tells you what kind of analysis the case needs.

You can apply the six-question rubric. Solution space and geometry. Human representability. Which Go properties are missing and which family dominates. Locally explicable vs. globally navigable, and whether the local explanation is sufficient. Oversight that addresses the right opacity, including case selection as a frequently-underused option. What would change your analysis. These are the moves of the method.

**The one idea that matters most.** Alien reasoning + validation = exhilarating and harmless. Alien reasoning − validation = the question this book exists to ask. Move 37 is the clean case. The rest of the book is what happens as the backstops come off.

**The common mistake to watch for.** Treating "the agent's output is surprising" or "the agent is faster than humans" as evidence of alien reasoning. Neither counts. The evidence is about the geometry of the space the agent is navigating and whether that geometry is one a human can hold — and even more specifically, whether the local explanation of the output is sufficient to catch the kind of failure the geometry could produce.

**The Feynman test, applied here.** If you cannot explain to a colleague the difference between local explicability and global navigability using a concrete example from your own domain, you have not yet internalized this chapter. That's the teachable marker.

---

## Connections Forward

The book is organized by which family of Go properties fails most acutely.

**Chapters 2-4: Objective fails.** Medical-decision agents, research-direction agents, agents embedded in open-ended creative work. The specification gap does the most damage here, and the rubric's Q2 (what geometry is representable) tends to produce the starkest maps.

**Chapters 5-7: Action footprint fails.** Trading agents, legal-filing agents, infrastructure-management agents. Here Q5 — what oversight addresses representational opacity — becomes acute, because the action footprint extends into systems nobody fully inventories. Case selection often turns out to be the only honest answer.

**Chapters 8-9: Feedback fails.** Scientific-research agents and long-horizon strategic planners. The hardest cases. Some don't resolve — the honest finding in several is that the field currently lacks the mechanisms the analysis implies are needed.

**The final chapter** picks up the seam I flagged in Concept 3 — what happens when human experts, over time, develop heuristics that track what the agent does. Does the reasoning stop being alien? I think the frontier moves rather than disappears, but I haven't formalized this. Treat the book as an attempt; treat any case that resists the framework as a useful stress test rather than an exception to excuse.

---

## What Would Change My Mind on the Whole Framework

A domain where agentic deployments consistently produce outputs whose consequences match those of human expert reasoning, where the geometry the agents use is demonstrably non-representable to those experts, and where no adverse effects attributable to the representational gap manifest over a sufficiently long deployment horizon. That combination would suggest representational opacity is not, by itself, a source of risk — that geometry can be non-representable and outcomes still align. I haven't seen this case yet. The absence is load-bearing for this book. If you find it, the framework is wrong, and I want to know.

**Still puzzling.** I'm not fully satisfied with the sharpness of the boundary between representational opacity that creates risk and representational opacity that doesn't. A calculator is computationally opaque and representationally transparent and nobody is worried. AlphaGo is representationally opaque and, in Go specifically, nobody was harmed. The boundary I want — between representational opacity that's a real source of risk and representational opacity that isn't — is not cleanly marked by any of the five Go properties individually. I think it's their conjunction that does the work, but I haven't formalized it. If the rest of the book is doing its job, by Chapter 9 the conjunction will have a sharper shape than I can give it now.

---

## Exercises

Each exercise states a problem, names the learning objective it tests, and indicates rough difficulty. Solutions are not provided inline — work them first, then compare with colleagues reading the same book.

### Warm-up (direct application of one concept)

**Exercise 1.1.** *[Tests: distinguishing the working definition from its alternatives]* A colleague claims that a transformer model that solves Olympiad geometry problems at human-expert level is "reasoning in alien ways." Using the working definition from Concept 3, identify what evidence would be required to support this claim and what evidence would only support a weaker claim about performance or speed. Be specific about which capability — local explicability, global navigability, or representational opacity — is being claimed and which is being demonstrated. Write one paragraph. **Difficulty: 1/5.**

**Exercise 1.2.** *[Tests: the five properties, grouped]* For each of the three families (objective, action footprint, feedback), give one real agentic deployment where the dominant problem is in that family. Name the system, name the family, and describe in one sentence how the dominance manifests operationally. **Difficulty: 1/5.**

**Exercise 1.3.** *[Tests: local explicability vs. global navigability]* Take an LLM's chain-of-thought output on a reasoning problem you know well. Describe one specific case where the chain is locally explicable (you can follow each step) but the system's ability to produce the chain is not globally navigable by you (you could not, from scratch, generate the same chain on a novel problem of the same type). **Difficulty: 2/5.**

### Application (translation to a slightly different problem)

**Exercise 1.4.** *[Tests: the six-question rubric, applied]* Pick an agentic system you use or study directly. Apply all six questions from Concept 6. Aim for roughly 200 words per question. When done, identify which question was hardest and explain why. The difficulty of the answer is itself a finding. **Difficulty: 3/5.**

**Exercise 1.5.** *[Tests: computational vs. representational opacity, with the narrower critique]* Name one proposed oversight mechanism currently popular in literature or industry. Classify it as primarily addressing computational opacity, primarily addressing representational opacity, or addressing output-level evaluability against human-held criteria. Identify at least one failure mode it does not address. **Difficulty: 3/5.**

**Exercise 1.6.** *[Tests: properties mapping]* For a domain of your choice (radiology, legal discovery, algorithmic trading, scientific literature review), produce a table mapping each of the five properties to "present," "partially present," or "absent." For each entry other than "present," write one sentence on the operational consequence and identify which family the absence sits in. **Difficulty: 2/5.**

### Synthesis (combining concepts)

**Exercise 1.7.** *[Tests: integration of Concepts 3 and 4]* Construct an argument — one with which you can imagine disagreeing — that a specific agentic system in a high-stakes domain is *safer* than its human alternative despite producing outputs whose geometry is not humanly representable. Then construct the counterargument. Which is stronger, and what evidence would settle the question? **Difficulty: 4/5.**

**Exercise 1.8.** *[Tests: case selection as oversight]* For the coding-agent example in the Integration section, propose a concrete deployment-restriction policy that would put the agent in regions where the engineer's geometry is sufficient. Identify the boundary between "safe deployment region" and "unsafe region" and propose how that boundary would itself be monitored. **Difficulty: 4/5.**

### Challenge (open-ended, beyond the chapter's boundary)

**Exercise 1.9.** *[Tests: the framework's most important seam]* The chapter admits a seam: the strong claim ("geometry is non-representable in principle") and the weak claim ("geometry is structurally inaccessible under realistic constraints") are operationally hard to distinguish, and the post-2016 evolution of Go pro play is consistent with both readings. Propose an operational definition of "alien reasoning has become human-representable" and a test that could distinguish it from "human experts have memorized representative outputs without representing the geometry." A serious answer is publishable. **Difficulty: 5/5.**

**Exercise 1.10.** *[Tests: designing the case analysis itself]* The six-question rubric is a proposal, not a canonized method. Identify one question you would add and one you would remove. Defend both choices in terms of what a case analysis is for. If you conclude the rubric is right as stated, defend that conclusion against the alternative of a shorter or longer rubric. **Difficulty: 5/5.**

---

*Primary sources: Silver et al., "Mastering the game of Go with deep neural networks and tree search," [Nature 2016](https://www.nature.com/articles/nature16961); Silver et al., "Mastering the game of Go without human knowledge," [Nature 2017](https://www.nature.com/articles/nature24270); Jumper et al., "Highly accurate protein structure prediction with AlphaFold," [Nature 2021](https://www.nature.com/articles/s41586-021-03819-2); Stokes et al., "A Deep Learning Approach to Antibiotic Discovery," [Cell 2020](https://www.cell.com/cell/fulltext/S0092-8674(20)30102-1); Liu et al., "Deep-learning-guided discovery of an antibiotic targeting Acinetobacter baumannii," [Nature Chemical Biology 2023](https://www.nature.com/articles/s41589-023-01349-8).*

**Tags:** `casebook-method`, `agentic-systems`, `alien-reasoning`, `solution-space-geometry`, `representational-opacity`, `local-explicability`, `move-37`<code>local-explicability</code>, <code>move-37</code></p>
