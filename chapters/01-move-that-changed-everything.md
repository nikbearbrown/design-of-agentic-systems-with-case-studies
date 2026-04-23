# Chapter 1 — The Move That Changed Everything

*AlphaGo and the Limits of Human Reasoning*

**Author:** Nik Bear Brown

**TL;DR.** Move 37 was correct, and it was also — in a specific sense this chapter makes precise — not humanly findable. That distinction, the geometry of solution spaces humans cannot represent, is what "alien reasoning" actually means. It's also the existence proof this book is built on: if a system can produce correct, consequential moves its creators cannot reconstruct, then agentic systems — deployed in medicine, law, and science, where the backstops that made Go safe are missing — are where that existence proof starts having victims.

---

## A Stone on the Fifth Line

On March 10, 2016, in a hotel ballroom in Seoul, a computer placed a black stone on the fifth line of a Go board and the commentators stopped talking.

This was Game 2 of a five-game match between Lee Sedol, one of the strongest Go players of the previous decade, and [AlphaGo](https://www.nature.com/articles/nature16961), a program built by DeepMind. The move — later called Move 37 — came thirty-six stones into the game. A shoulder hit on the right side. Fifth line from the edge.

The reaction matters because it came from people who understood Go. Michael Redmond, the English-language commentator and a 9-dan professional, paused. He talked around the move for a while because there was nothing obvious to say about it. Fan Hui, the European champion who had lost to an earlier version of AlphaGo six months prior, walked out of the commentary room, then came back and said something he has since repeated in interviews: [it is not a human move, but it is a beautiful move](https://www.wired.com/2016/03/two-moves-alphago-lee-sedol-redefined-future/) [verify exact phrasing].

By the end of the game, Move 37 was the reason AlphaGo won.

Here is the puzzle. Move 37 was not beyond human comprehension in the sense that the commentators couldn't understand the board after AlphaGo played it. They could. They followed the rest of the game. They could see, eventually, why the fifth-line shoulder hit worked.

What they could not do — and what nobody has done since, including AlphaGo's creators — is reconstruct *why* AlphaGo played it. Not at a mechanical level (we know what the neural networks computed), but at a level that would let a human stand over a similar board position and think through to the same answer.

The move was correct. It was also, in a specific sense I'll make precise, not humanly findable.

That distinction is what people are pointing at when they use the term *alien intelligence*. The term gets thrown around loosely — applied to anything an AI does that seems surprising. My aim in this chapter is to make the term sharp enough to do real work. By the end, you should be able to pick up a claim about alien intelligence and decide whether it's substantive or marketing.

---

## Why We Start With AlphaGo

You might reasonably ask what a 2016 board-game match is doing at the front of a book about agentic AI. I'll answer directly.

This book studies agents — systems that take actions in the world, with consequences that can't always be undone. Medical-triage agents. Legal-research agents reading discovery. Trading systems executing orders. Autonomous coding assistants submitting pull requests to production codebases. The field is shipping these things at a pace that does not wait for our understanding of them.

Move 37 is the existence proof I need at the start of this book. It proves three things, cleanly, in a domain where nothing broader was at stake:

1. An AI system can produce a correct answer that its own creators cannot reconstruct.
2. "Correct" here isn't a figure of speech. The move won the game. The stakes were real in the narrow sense — a $1 million match — even if not in the broader sense that nobody was harmed.
3. The reason the move was correct turns out to involve a structure — a geometry, in the technical sense I'll define — that humans genuinely cannot represent in working cognition, not just haven't gotten around to writing down.

If those three things are possible in Go, they're possible in any domain where the solution space is large enough and the similarity structure is non-obvious. That's every domain agentic AI is being deployed in right now.

So the logic of this book runs like this. The existence proof is Chapter 1. The method for analyzing what happens when that existence proof meets domains lacking Go's backstops is Chapters 2 through 9. Move 37 is not a curiosity. It's the foundation on which everything downstream depends.

One more thing before we dig into machinery. Go is the *easiest* domain in which alien reasoning can exist. Five specific properties of Go — which I'll spell out in Concept 4 — make Move 37 a fascinating puzzle rather than a catastrophe. Agentic deployments lack at least one of those properties, usually several. Knowing which ones are missing in a given case is how you know what kind of analysis to run, and what kind of risk is actually on the table.

That's why AlphaGo opens an agentic AI book. Now let's look at what it actually did.

---

## Concept 1: Why Go Broke Brute Force

To understand what AlphaGo did, first look at what it replaced.

In 1997, IBM's [Deep Blue beat Garry Kasparov](https://www.research.ibm.com/deepblue/) in chess. The architecture was understood at the time and is still understood now. Deep Blue searched. At each position, it generated legal moves, played them forward in its imagination, generated the opponent's legal responses, played those forward, and so on — building a tree of possible continuations. At the leaves of the tree, it applied an *evaluation function*: a hand-coded formula that assigned a score to a position based on things chess players already knew how to think about. Material (how many queens, rooks, pawns each side has). Pawn structure. King safety. Control of the center.

Then it used a decades-old algorithm called minimax, refined by alpha-beta pruning, to pick the move that led to the best position assuming both sides played their best responses.

This approach had two things going for it. First, chess is deep but narrow. On an average chess position, you have about 35 legal moves. This number is called the *branching factor*. Second, the evaluation function for chess — worked out by generations of human grandmasters — is actually pretty good. Material advantage is a decent proxy for winning. So Deep Blue could search a few dozen moves ahead, evaluate the resulting positions with the hand-coded formula, and do better than any human who had ever lived.

**Worked example — why brute force scales well enough for chess.** Suppose you want to search to depth $d$ plies (half-moves). The number of positions is roughly $b^d$, where $b$ is the branching factor. For chess with $b \approx 35$:

- Depth 4: $35^4 \approx 1.5 \times 10^6$ — about 1.5 million positions
- Depth 8: $35^8 \approx 2.3 \times 10^{12}$ — about 2.3 trillion
- Depth 12: $35^{12} \approx 3.4 \times 10^{18}$

Specialized hardware in 1997 could evaluate about 200 million chess positions per second [verify], and alpha-beta pruning cuts the effective search tree by a huge factor. Deep Blue searched to depths of 12 to 40 plies in certain lines. It was brute force, but the brute force was tractable.

**Now look at Go.** Go is played on a 19×19 board. Each move places a stone on an empty intersection. Early in the game, you have close to 361 legal moves — every intersection on the board. Even later, when the board fills up and some points become illegal (suicide rules, ko rules), the branching factor averages around 250.

That's a problem. At depth 10:

- Chess tree: $35^{10} \approx 2.8 \times 10^{15}$
- Go tree: $250^{10} \approx 9.8 \times 10^{23}$

The Go tree at depth 10 is about 300 million times larger than the chess tree at depth 10. And depth 10 is nothing in Go — a typical game lasts around 250 moves.

But the branching factor is only half the problem. The bigger issue is the evaluation function. In chess, you can ask: who's winning in this position? The answer is available from material and structural heuristics human grandmasters can describe. You can write them down.

In Go, you cannot. Nobody — no human player, no committee of 9-dans, no team of mathematicians — has ever written down a position-evaluation formula for Go that works. The heuristics exist in the heads of strong players as something closer to pattern recognition than to calculation. Ask a professional to explain why one position is better than another and you will get a mix of precise reasoning ("this group lacks eye-shape, so it can die under pressure") and something more like perception ("this wall feels thin").

So Go breaks brute-force search on both axes. The tree is too wide to enumerate, and the leaves are too hard to evaluate. Go wasn't unsolvable because we lacked computing power. Go was unsolvable for the chess playbook because the chess playbook needs a writable evaluation function, and nobody could write one for Go.

**The design choice hidden in this problem.** You could imagine throwing enough compute at Go to just win by volume — build a bigger Deep Blue. Several groups tried. They got to roughly strong-amateur level and stalled. The ceiling was not hardware.

The alternative was to give up on writing the evaluation function by hand and instead *learn* it. That is the design choice AlphaGo made, and it is the move that matters for the rest of this chapter. The field decided the evaluation function was something a neural network should discover, not something a grandmaster should author.

Every time you see a modern AI system in a domain where the rules are hard to write down — vision, language, biology, chemistry — you are looking at a version of the same choice.

---

## Concept 2: How AlphaGo Actually Reasoned

AlphaGo is three things stacked together: a policy network, a value network, and Monte Carlo Tree Search. Each needs its own explanation.

**The policy network** is a neural network that takes a Go board as input and outputs a probability for every legal move. "If I were going to play here, move A has a 23% chance of being the right move, move B has 18%, move C has 11%," and so on across all ~250 legal options.

What is a neural network? At the level we need, it's a function with millions of adjustable numbers inside it. You show it examples of inputs paired with correct outputs — in AlphaGo's case, roughly 30 million moves from strong human games — and an optimization algorithm tunes the internal numbers until the function reproduces the examples as closely as possible. Then you hope (and test) that the function generalizes to new cases it wasn't trained on.

The policy network is, in effect, a compressed answer to the question: *given what strong Go players do, what are the moves worth considering in this position?* It doesn't evaluate whether the moves are good. It only narrows the field.

This is already enough to fix half the Go problem. A branching factor of 250 is intractable; a branching factor of the top 5 moves suggested by the policy network is very tractable. The policy network does not solve Go. It converts Go from an enumeration problem into a focused-search problem.

**The value network** is the other neural network. It takes a board position as input and outputs a single number between 0 and 1: the probability that black wins from this position, assuming reasonable play from both sides.

This is the evaluation function that nobody could write. Instead of writing it, DeepMind trained it — on millions of positions from games AlphaGo had played against itself, each labeled with the eventual outcome of the game.

The value network has, through exposure to millions of complete games, fit itself to the statistical regularities of what positions tend to win. It is not applying grandmaster heuristics. It is also not ignoring them — the positions it trained on were shaped by grandmaster-level play (via bootstrapping from the policy network). But the heuristics it extracted are not human-readable. They live in the weights of the network.

**Monte Carlo Tree Search** coordinates the two networks. The policy network tells you which moves are worth considering. The value network tells you how good a position is. MCTS searches forward through candidate continuations and decides which move to actually play.

MCTS is a fancy name for a simple idea. Pick a move the policy network likes. Play it. Pick a response the policy network likes from the resulting position. Play it. Keep going for a while — sometimes to the end of the game, sometimes just until you hit a position the value network can evaluate with confidence. Record what happened.

Do this thousands of times per move, exploring different lines. Keep track of which first moves have led to good outcomes most often. Pick the one with the best track record.

That's MCTS. It is a statistical approximation of the search Deep Blue did exhaustively, guided at every step by the policy network's sense of what's worth trying and the value network's sense of who's winning.

### Worked example: what happened at Move 37

Reconstruct the machinery at the moment of Move 37.

AlphaGo's policy network saw the board after 36 stones had been placed. It assigned probabilities to every legal move. Most moves got nearly zero — they were obviously weak, and the network had learned that strong players don't play there. A handful got meaningful probability.

The shoulder hit on the fifth line was one of the moves with non-trivial probability. Not the highest. [According to DeepMind's post-match analysis, the policy network put it at roughly 1 in 10,000](https://www.nature.com/articles/nature16961) [verify specific citation — DeepMind blog or AlphaGo documentary]. Low, but not negligible.

MCTS then did what MCTS does. It sampled continuations. For each candidate move — including the shoulder hit — it played out many possible futures, using the policy network to pick likely responses and the value network to evaluate positions along the way.

Here is where the machinery diverged from human reasoning. A human pro, shown the board, would have immediately applied a heuristic: the fifth line is too far from influence and too close to being attackable. That heuristic would have killed the shoulder hit before any serious thought. The machinery didn't have that heuristic. It had statistical regularities extracted from self-play, and in the self-play data, moves of this shape led to positions the value network judged favorable more often than the human heuristic predicted.

MCTS aggregated these rollouts. Over thousands of simulations, the shoulder hit accumulated a higher estimated win probability than any alternative. AlphaGo committed.

The commentators' reaction — bewilderment — was the right reaction. Their heuristics said no. The machinery said yes. The machinery was working with a statistical structure in the space of Go positions that humans had not identified, and in hindsight, probably could not identify explicitly even now.

**A common misconception worth clearing up.** A lot of popular writing about AlphaGo says it "learned from human games." This is half right. The first version of the policy network was trained on human games. But before the match with Lee Sedol, AlphaGo played millions of games against itself, each one producing new training data. By the time it faced Lee Sedol, most of its strength came from self-play, not from imitating humans.

AlphaGo's successor, [AlphaZero](https://www.nature.com/articles/nature24270) (2017), dropped human games entirely. It started with nothing but the rules of Go and played itself from scratch. In three days it exceeded the final AlphaGo's strength. This removes any lingering suspicion that Move 37 was somehow extracted from a human game the system had seen. The space AlphaZero was navigating contained no human moves at all, and the space contained moves like Move 37.

---

## Concept 3: Alien Reasoning as a Claim About Geometry

The word "alien" gets used for almost anything AI does that feels unexpected. This is not useful. A system that recommends a song you wouldn't have picked yourself is not alien — it's just fit to data you didn't have. A system that solves a Rubik's cube faster than you can is not alien — it's fast. We need a sharper test.

Work through the bad definitions first to see what the good one has to handle.

**Attempt 1: "AI that thinks better than humans."** Not useful. A calculator thinks better than humans about long multiplication. Nobody calls a calculator alien. "Better" is a comparison of quality on a dimension both parties share. It is not a claim that the dimensions themselves are unshared.

**Attempt 2: "AI that produces outputs humans couldn't produce."** Closer. But consider a program that factors 200-digit primes in a week. No human can do this in a lifetime. It is not alien. The reason is that we know exactly what it is doing and why the answer is correct. We just can't do the arithmetic fast enough. The reasoning is fully human-representable; the execution is not.

**Attempt 3 — the working definition.** A system is performing *alien reasoning* when two conditions both hold:

1. It produces outputs by navigating a solution space humans cannot represent in working cognition.
2. The geometry of that solution space is what makes the output non-reconstructible — not the speed of traversal, not the volume of data processed, but the shape of the space itself.

Two terms to unpack. A *solution space* is the set of all possible outputs to a class of question, together with some structure that says which outputs are related to which. For chess moves, the solution space is the tree of game continuations. For protein structures, it's the set of 3D conformations a chain of amino acids can take. For a language model's next-token prediction, it's a very high-dimensional embedding of sequences.

*Geometry* is the additional structure on top of the set: what is close to what, what is far, which paths from A to B exist. Chess positions that differ by one piece are close to each other. Protein conformations that differ by a small rotation of a bond are close. Two sentences with the same meaning but different words are close in an LLM's embedding space.

The working definition says a system is doing alien reasoning when the solution-space geometry it uses is not one humans can hold in mind. Not that we can't understand the outputs after they're produced — we usually can. But that we can't, from inside our own cognition, navigate that geometry to generate them.

### The subtle puzzle: local explicability vs. global navigability

Here is the thing Move 37 almost tricks you into missing. The commentators *could* explain the move after the fact. Given the next thirty moves, they could see why the shoulder hit worked. Doesn't that mean the reasoning is human-representable after all?

No. And the reason is important.

*Local explicability* is the ability to explain a single move in terms a human can follow once the move is in hand. *Global navigability* is the ability to find the move from scratch by thinking. These are different capacities, and conflating them is how most popular AI commentary goes wrong.

A human grandmaster can look at Move 37 and, given the game that followed, narrate a plausible justification. The same grandmaster, facing the same board before Move 37 was played, would not have found it. The geometry that made the move correct is locally explicable — you can describe one point in it once someone else hands you that point — but not globally navigable — you cannot reach that point on your own from the other points nearby.

This distinction is going to appear in every case in this book. Every agentic system you analyze will produce outputs that are locally explicable — someone can always tell you a story about why the agent did what it did — while being globally non-navigable, meaning no amount of reading the story teaches you to produce the next such output yourself. This is what *representational opacity* means in practice, and it is not the same thing as computational opacity. A system can be computationally opaque (you don't know what operations it performed) while being representationally transparent (the operations, if shown to you, would be ones you could do). A system can also be the reverse, and that is the interesting case. The interesting case is everywhere in this book.

**Why Move 37 passes the test.** Go has a solution space (game trees) with a geometry (which positions are similar to which). Humans can represent the local geometry — a grandmaster can tell you which moves are "big" and which are "slack" — but the global geometry, especially around unusual positions like the one AlphaGo faced in Move 37, is not representable. AlphaGo's networks had absorbed a version of that geometry through self-play. When it looked at the board, it was seeing similarity relations among positions that humans did not see. Move 37 works because the move's place in that geometry is good, even though its place in human Go aesthetics is strange.

**A second common misconception.** "Alien reasoning" is not a claim that the machine is conscious, or that it has preferences, or that it is "really thinking." It is a claim about the geometry of the solution space it navigates. You can make the claim without taking any position on whether there is experience behind the navigation. The question of consciousness is real, but it is a different question, and conflating the two is how this vocabulary loses its teeth.

---

## The Phenomenon Beyond Go

Move 37 is the cleanest case because Go has precisely known rules and a clear win condition. But the same phenomenon — a system navigating a solution space whose geometry is not humanly representable — appears wherever the space is large enough and the rules of similarity are non-intuitive.

**AlphaFold 2 and protein folding.** Proteins are chains of amino acids that fold into 3D shapes, and the shape determines the function. Getting the shape right from the sequence is the protein folding problem. It had resisted direct attack for roughly fifty years before [DeepMind's AlphaFold 2](https://www.nature.com/articles/s41586-021-03819-2) released its results at the CASP14 competition in late 2020.

The scale of the solution space makes Go look small. A 300-amino-acid protein has, in principle, a combinatorial explosion of possible foldings — Levinthal's paradox points out that if proteins sampled conformations randomly, folding would take longer than the age of the universe, yet they fold in milliseconds. Proteins fold fast because the geometry of the space matters more than its size. Some conformations are energetically favorable; most are not. The real problem is learning the geometry.

AlphaFold 2 uses attention mechanisms over multiple sequence alignments (groups of related proteins from different species) to extract co-evolutionary constraints: pairs of positions in the sequence that tend to mutate together, which is evidence they are physically close in the folded structure. It then uses those constraints, plus learned priors over protein geometry, to predict the structure directly.

In CASP14, AlphaFold 2 achieved a median [global distance test score around 92 out of 100](https://predictioncenter.org/casp14/) [verify], with median positional error roughly 1.6 angstroms — about the width of a single atom. The previous state of the art from human-designed methods sat in the 40s and 50s for comparable problems [verify precise comparison].

Apply the working definition. Solution space: 3D conformations. Geometry: determined by physics and statistical constraints from evolution. Humans can represent tiny pieces (we know hydrogen bonding, we know hydrophobic cores), but the full geometry over all protein families — co-evolutionary patterns across millions of sequences — is not representable. The test passes.

**Halicin and antibiotic discovery.** Finding new antibiotics has stalled for decades. The reason is partly economic but also partly epistemic: medicinal chemists search for new molecules by modifying molecules they already understand. This produces a bias — call it *scaffold bias* — toward molecules that look like the ones already in use. Over time, pathogens adapt to that narrow region of chemical space, and we stop finding new effective drugs.

In 2020, a group at MIT trained a graph neural network on a set of roughly 2,500 molecules labeled for their ability to inhibit bacterial growth. Then they used the trained network to screen a library of [about 107 million molecules](https://www.cell.com/cell/fulltext/S0092-8674(20)30102-1) [verify library size and stage] — mostly ones that no human had ever considered as antibiotic candidates — and flag the most promising ones. The top-ranked candidate was a molecule called halicin. It had been investigated years earlier as a potential diabetes drug and abandoned.

Halicin worked. In lab tests it killed multidrug-resistant pathogens including *Acinetobacter baumannii* and strains of tuberculosis. Its mechanism of action — disrupting the proton-motive force across bacterial membranes — was different from any antibiotic currently in use, which is part of why bacterial resistance is harder to evolve against it.

A [follow-up study in 2023](https://www.nature.com/articles/s41589-023-01349-8) [verify] used similar methods to find abaucin, an antibiotic specifically active against *A. baumannii*.

Apply the definition. Solution space: all small molecules. Geometry: a learned embedding in the graph neural network's internal representation, capturing features relevant to antibacterial activity. Humans can represent parts of this — we know certain functional groups matter — but not the full geometry the network extracted from training. The system found a point in the space (halicin) that humans had already looked at and discarded, because their representation of the geometry placed it far from known antibiotics. The network's representation placed it close. The test passes here too.

**The common structure.** Three domains — games, biology, chemistry — same phenomenon. Each has a solution space too large for enumeration, a geometry humans cannot represent in full, and a learning procedure that fits to the geometry statistically. Each has an interesting design choice visible in hindsight: stop trying to write down the rules, and use learning to approximate the geometry directly.

Note what these three cases have in common beyond the geometry point. None of them is an agent. AlphaGo plays Go in a sealed ballroom match. AlphaFold produces structure predictions you read off a screen. The halicin pipeline flags molecules that human chemists then decide whether to test. The system outputs, the humans act. The alien reasoning does its work inside a loop where a human stands between the output and the world.

That loop is what Chapters 2 through 9 are about. Specifically, what happens to that loop when you remove the human.

---

## Concept 4: Go Is the Easy Case

If you stop the chapter at Concept 3 and the examples that follow it, you have a clean framework for thinking about Move 37 and its cousins. You do not yet have a framework for thinking about agents. The gap between those two things is the whole point of this book, and I want to name it precisely.

Go has five properties that make it the *easiest* domain in which non-reconstructible correct reasoning can exist. Every agentic deployment in this book lacks at least one of them, usually several. The five properties are what give Go its backstops, and the backstops are what make Move 37 merely fascinating rather than terrifying.

**Property 1 — the objective is cheap to specify.** "Win the game" is a function of board state at termination. Writing it down takes one line. There is no ambiguity about whether AlphaGo achieved its objective in Game 2; you count the stones and the score is what it is.

Compare to the objective of an agent helping a patient, representing a client, or running a line of scientific inquiry. "Help this patient" is not a function of any state you can write down. It decomposes into symptom relief, survival, quality of life, cost, autonomy, side effects, downstream dependencies, and it decomposes differently for different patients. Any objective function you write is a lossy compression of what the human meant, and the agent will navigate the geometry of the compression, not the geometry of the intention. This is the specification problem, and in Go it does not exist.

**Property 2 — the environment is sealed.** Moves on a Go board do not have off-board consequences. A stone placed at D17 does not also change the weather, make someone lose their job, or commit a resource that cannot be recovered. The entire causal footprint of the agent's actions is contained within the board state.

For an agent that sends emails, executes trades, files documents, or orders reagents, this is not remotely true. The action footprint extends into systems the agent does not observe and cannot reverse. A Move 37 on a Go board is an interesting shoulder hit. A Move 37 in a legal filing is a brief that has been entered into the record and now has to be defended, retracted, or lived with.

**Property 3 — ground truth arrives.** Every Go game terminates. Within hours, you know who won. The feedback signal that makes AlphaGo trainable in the first place is available, on every iteration, with no ambiguity.

Now consider medicine. A treatment decision made today may have its outcome manifested in weeks, years, or never — and when the outcome does manifest, attributing it to the original decision requires disentangling it from every other event in the intervening period. Consider law. A legal strategy's success is sometimes measurable (verdict), often not (did it shape precedent, did it deter the next filing, did it serve the client's deeper interest), and the horizon is long enough that by the time ground truth arrives the agent that made the decision has been retired or retrained. Consider scientific research. The best evidence of whether a research direction was correct is often decades of downstream work. Go has a feedback signal. Most agentic domains have something between delayed, partial, confounded, and absent.

**Property 4 — self-play is free.** AlphaGo's strength came from millions of games against copies of itself. The cost per game was compute time. There were no patients harmed, no markets moved, no clients misrepresented. Self-play let the system explore the geometry at no cost, and the geometry it eventually navigated in the Lee Sedol match was the geometry it had drawn from that exploration.

For agentic systems deployed in consequential domains, this loop is not available on the actual problem. You cannot self-play on patients. You cannot self-play on live markets without moving them. You cannot self-play on legal strategies because the adversary is not a copy of yourself. Every proxy you build — simulator, sandbox, synthetic dataset — adds a representational gap between the space the agent learned and the space it acts in, and the gap is exactly where the interesting failures hide.

**Property 5 — moves are locally atomic.** A Go stone interacts with its neighbors through rules the game makes explicit: liberties, captures, ko. There are no hidden channels through which one stone affects another.

An agent's action, by contrast, often compounds with other actions through channels neither the agent nor its designers fully enumerated. An email sent to one person becomes context for that person's next decision, which becomes input to another agent, which cites a document the first agent produced, and the loop closes in a way nobody mapped. Agentic systems exist in environments where actions have both declared effects and undeclared interactions, and the undeclared interactions are where compounding risk lives.

Each of these five properties, in isolation, removes a source of oversight. Together, they are why Move 37 is a fascinating puzzle rather than a catastrophe. The commentators were bewildered, but the game ended, the score was counted, no one was hurt, and the next game started clean. None of those guarantees hold for agentic deployments, and the shape of the risk depends on *which* of the five properties is missing in a given case.

**The sentence that holds this book together.** Move 37 is the existence proof that correct, consequential, non-reconstructible reasoning is possible in a domain humans thought they understood. Agentic systems are where the existence proof starts having victims.

I'll be blunt about what I think this means for the field. Most current writing on agentic safety argues for *speed bumps* — human-in-the-loop review, chain-of-thought inspection, interpretability dashboards. Some of that work is valuable. Some of it is aimed at the wrong opacity. A speed bump addresses computational opacity (you make the human check the agent's work before it acts). It does not address representational opacity (the human cannot check what they cannot represent). If the agent is composing a strategy whose geometry is not in the reviewer's head, slowing the review down does not help; the reviewer is still looking at a locally explicable local story while the global navigation happens somewhere they cannot inspect. This is the distinction your casebook analyses have to respect, because the field has not consistently made it.

---

## Concept 5: The Casebook Method

Concepts 1 through 4 give you the vocabulary. This concept gives you the method.

Every case chapter in this book walks through a specific agentic system using a six-question rubric. The rubric is not a template you fill in mechanically. It is a sequence of questions designed to force the two distinctions from the earlier concepts — representational versus computational opacity, and which Go properties the domain lacks — to surface in writing. If an analysis does not surface those distinctions, it is not yet a case analysis in the sense this book means.

**The six questions, in order.**

**Question 1. What is the solution space, and what is its geometry?** Describe the set of outputs the system produces and the structure over them. For AlphaGo, the space is game trees and the geometry is position similarity learned from self-play. For an LLM-based legal agent, the space is filings and the geometry is some learned embedding over legal-document sequences conditioned on case context. Be specific. "All possible outputs" is not an answer; it is an evasion. If you cannot describe the geometry, you cannot argue about whether it is humanly representable, and that argument is the core of the analysis.

**Question 2. Which parts of the geometry are representable by a domain expert, and which are not?** This is the Move-37 question. A domain expert may be able to represent local similarities (two legal briefs that cite the same precedents are related) while being unable to represent the full geometry the agent uses (the embedding also encodes linguistic patterns that correlate with judicial mood, docket timing, opposing counsel's typical moves, and so on). The answer to this question is almost never "all" or "none." It is a map of where human representation ends.

**Question 3. Which of the five Go properties does this domain lack?** Go through them. Is the objective cheap to specify? Is the environment sealed? Does ground truth arrive? Is self-play free? Are moves locally atomic? Each "no" identifies a source of oversight that is not available to you here. Your analysis of the system's risks has to be commensurate with the missing backstops. A medical-decision agent that lacks all five properties is not a minor variation on AlphaGo; it is a different category of artifact.

**Question 4. When the system produces a Move-37-like output, is the output locally explicable?** Find a concrete example. Show what the agent did, show the plausible post-hoc story, and show the gap between that story and the global navigability question. If the system has been deployed long enough to produce real outputs, use real ones. If not, reason about what kind of output it is structurally capable of producing. Do not settle for "the agent might do something surprising." Surprising is cheap. The question is whether the geometry being navigated is representable.

**Question 5. What oversight mechanisms address the representational opacity, as distinct from mechanisms that only address computational opacity?** Most proposed oversight is speed-bump oversight: slow the system down, have a human check the output, add an interpretability layer. This addresses computational opacity. Ask separately: what would have to be true for a human to *represent the geometry the agent is using*? This is usually a much harder ask, and in many domains the honest answer is that no current mechanism achieves it. That honest answer is an acceptable result of the analysis. Pretending otherwise is not.

**Question 6. What would change your analysis?** Name the evidence that would flip your conclusions. A strong case analysis is falsifiable. It says: if the system produced these specific outputs, I would revise my claim that its geometry is non-representable; if the deployment showed these specific side effects, I would revise my claim that the environment is adequately sealed. Without this question, an analysis is a posture, not an argument.

**What a good answer looks like.** A good answer is specific, bounded, and falsifiable. "The geometry is non-representable" is not an answer; "the geometry is non-representable in the specific region where the agent is selecting between treatment options whose long-term outcomes are separated by more than the trial evidence can discriminate" is an answer. "This agent needs oversight" is not an answer; "this agent's representational opacity cannot be addressed by chain-of-thought review, because the relevant geometry is in the retrieval embedding, not the generation step; the relevant mechanism would be either a retrieval audit against an independently constructed geometry or a deployment restriction to cases where the geometry is locally representable" is an answer. The first set is marketing. The second set is analysis.

**A common mistake to watch for.** The most frequent failure mode in case analyses I've read — including early drafts of my own — is treating representational opacity and computational opacity as the same problem with different names. They are not. A system whose chain of thought you can inspect in real time but whose retrieval geometry you cannot represent is computationally transparent and representationally opaque. A system that runs in a black box you cannot inspect but whose reasoning is fully human-representable if inspected is computationally opaque and representationally transparent. The interesting agentic systems in this book are mostly the first kind. Keep that in mind as you read the cases.

---

## Integration: A Worked Application

Apply the rubric to a system you already know structurally: a large language model deployed as an autonomous coding agent, allowed to read a codebase, plan changes, execute commands, and submit pull requests.

**Question 1 — solution space and geometry.** The output space is code diffs conditioned on a task description and a repository state. The geometry is a learned embedding in the model's representation space, where "similar" diffs are the ones the model has learned to produce under similar contexts. The geometry includes patterns the model has absorbed from training data about what kinds of changes typically resolve what kinds of issues, including patterns that do not correspond to any explicit design principle a human engineer holds.

**Question 2 — representable versus not.** An experienced engineer can represent parts of the local geometry — two diffs that modify the same function in similar ways are related. Parts they cannot represent include the cross-file correlations the model has absorbed (patterns of change that tend to co-occur across files for reasons the engineer did not identify), and the conditioning on task phrasing (small changes in how the task is described move the model through different parts of the embedding, in ways the engineer cannot predict without running the system).

**Question 3 — which Go properties are missing.** Objective specification is ambiguous ("fix this bug" is not a complete objective — the fix may introduce regressions, may change behavior in edge cases, may fail on conditions not covered by tests). Environment is not sealed — the agent's PR, if merged, affects downstream systems and other engineers. Ground truth is partial — tests pass or fail, but tests are a weak oracle for correctness, and bugs can take months to manifest. Self-play is partially available (the agent can run tests against its own outputs) but only on the portion of the objective that tests cover. Moves are not locally atomic — a change in one file can compound with existing patterns in ways not visible from the diff alone. Four of the five Go properties are substantially compromised. This is a very different category of artifact from AlphaGo.

**Question 4 — locally explicable output.** A coding agent produces diffs with accompanying explanations. The explanations are locally explicable: the agent says "I changed this function to handle the null case," and the engineer reads it and it checks out. Whether the engineer, facing the same bug, would have produced the same diff — or a diff with the same long-term consequences — is a global-navigability question the explanation does not answer. The gap is exactly the Move-37 gap, now in a domain where the output gets merged into production.

**Question 5 — oversight that addresses representational opacity.** Code review is computational-opacity oversight: the reviewer reads the diff before it merges. This addresses whether the diff does what it says. It does not address whether the diff is being generated from a geometry the reviewer can represent. Representational oversight would require something else — perhaps restricting the agent to cases where a known-good geometry exists (well-specified refactors, test-covered features), perhaps running an independent model with a different training lineage and checking agreement, perhaps deployment restrictions by code region. I don't have a clean answer here. The honest finding is that the field does not yet have mature mechanisms for the representational side in this domain.

**Question 6 — what would change the analysis.** If deployment data showed that coding agents' merged PRs had long-term defect rates statistically indistinguishable from human PRs across comparable complexity, I would revise my concern about global navigability — the geometry would be producing outputs whose consequences match human outputs, which would suggest the representational gap is not mattering at the outcome level. Absence of such data is itself a finding.

That is what an analysis looks like at sketch length. A real chapter would expand each answer. The structure is the point: six questions, each forcing one of the two distinctions to surface.

---

## Chapter Summary

Three capabilities you can now exercise.

You can use the working definition of alien reasoning as a diagnostic rather than a slogan. When you encounter a claim that an AI system is "thinking in ways humans can't understand," you can translate that claim into a question about solution-space geometry and check whether the evidence supports the stronger or the weaker reading. You know the difference between representational and computational opacity, and you know that most field discourse conflates them.

You can name what Go gave us that agentic deployments do not. The five properties — cheap objective, sealed environment, arriving ground truth, free self-play, atomic moves — are what make Move 37 fascinating rather than harmful. Every case in this book lacks at least one of them, usually several, and the missing property tells you what kind of analysis the case needs.

You can apply the six-question rubric. Solution space and geometry. Human representability. Which Go properties are missing. Locally-explicable-versus-globally-navigable. Oversight that addresses the right opacity. What would change your analysis. These are the moves of the method. Every chapter is a case study using them.

The one idea that matters most: **alien reasoning is a claim about the geometry of a solution space, not about speed or scale or surprise — and Move 37 is the existence proof that such reasoning can be correct, consequential, and non-reconstructible in human terms, which means the agentic systems the rest of this book studies are not hypothetical risks; they are where the existence proof starts having victims.**

**The common mistake to watch for:** treating "the agent's output is surprising" or "the agent is faster than humans" as evidence of alien reasoning. Neither counts. The evidence is about the geometry of the space the agent is navigating and whether that geometry is one humans can hold.

**The Feynman test, applied here:** if you cannot explain to a colleague the difference between computational and representational opacity using a concrete example from your own domain, you have not yet internalized this chapter. That is the teachable marker I use on myself when I'm checking whether the framework has landed.

---

## Connections Forward

Every subsequent chapter is a case. The book is organized by which Go property the case most clearly lacks.

Chapters 2 through 4 cover cases where **the objective is not cheaply specifiable**: medical-decision agents, research-direction agents, and agents embedded in open-ended creative work. These are the cases where the specification gap does the most damage, and where the rubric's second question (what geometry is representable) tends to produce the starkest maps.

Chapters 5 through 7 cover cases where **the environment is not sealed**: trading agents, legal-filing agents, and infrastructure-management agents. Here the fifth question — what oversight addresses representational opacity — becomes acute, because the action footprint extends into systems nobody fully inventories.

Chapters 8 and 9 cover cases where **ground truth does not cleanly arrive**: scientific-research agents and long-horizon strategic planners. These are the hardest cases in the book, and I'll flag upfront that some of the analyses do not resolve — the honest finding in several of them is that the field currently lacks the mechanisms to do the oversight the analysis implies is needed.

A closing note. I've kept the Go material compressed in Concepts 1 and 2 because you probably know most of it. I want to flag one place where I think my own framing is still incomplete, because it will appear in every case. The working definition says alien reasoning involves navigating a geometry humans cannot represent. I'm not fully satisfied with how this handles the case where the geometry *becomes* representable after enough examples — where, over time, human experts develop heuristics that track what the agent is doing. Does the reasoning stop being alien? I think yes, but only locally, and I think the next frontier of alienness opens up somewhere else. That's a thread I'll pick up in the final chapter. For now, treat it as a known seam in the framework rather than a resolved question.

The existence proof is done. The cases are what we do with it.

---

## Exercises

Each exercise states a problem, names the learning objective it tests, and indicates rough difficulty. Solutions are not provided inline — work them first, then compare notes with colleagues reading the same book.

### Warm-up (direct application of one concept)

**Exercise 1.1.** *[Tests: distinguishing the working definition from its alternatives]* A colleague claims that a transformer model that solves Olympiad geometry problems at human expert level is "reasoning in alien ways." Using the working definition from Concept 3, identify what evidence would be required to support this claim and what evidence would only support a weaker claim about performance or speed. Write one paragraph. **Difficulty: 1/5.**

**Exercise 1.2.** *[Tests: the five Go properties]* For each of the five properties, give one real agentic deployment (not a hypothetical) where the property is clearly absent. Name the system, name the property, and describe in one sentence how the absence manifests operationally. **Difficulty: 1/5.**

**Exercise 1.3.** *[Tests: local explicability vs. global navigability]* Take an LLM's chain-of-thought output on a reasoning problem you know well. Describe one specific case where the chain is locally explicable (you can follow each step) but the system's ability to produce the chain is not globally navigable by you (you could not, from scratch, generate the same chain on a novel problem of the same type). **Difficulty: 2/5.**

### Application (translation to a slightly different problem)

**Exercise 1.4.** *[Tests: the six-question rubric, applied]* Pick an agentic system you use or study directly. Apply all six questions from Concept 5. Aim for roughly 200 words per question. When you are done, identify which of the six questions was hardest to answer and explain why. The difficulty of the answer is a finding. **Difficulty: 3/5.**

**Exercise 1.5.** *[Tests: computational vs. representational opacity]* Name one proposed oversight mechanism for agentic systems that is currently popular in the literature or in industry discourse. Classify it as primarily addressing computational opacity or primarily addressing representational opacity. If both, describe the portion of each. Identify at least one failure mode the mechanism does not address. **Difficulty: 3/5.**

**Exercise 1.6.** *[Tests: which Go properties apply]* For a domain of your choice (pick one: radiology, legal discovery, algorithmic trading, scientific literature review), produce a table mapping each of the five Go properties to "present," "partially present," or "absent" in that domain. For each entry other than "present," write one sentence on the operational consequence. **Difficulty: 2/5.**

### Synthesis (combining concepts)

**Exercise 1.7.** *[Tests: integration of Concepts 3 and 4]* Construct an argument — with which you can imagine disagreeing with yourself — that a specific agentic system in a high-stakes domain is *safer* than its human alternative despite producing outputs whose geometry is not humanly representable. Then construct the counterargument. Which argument is stronger, and what evidence would settle it? **Difficulty: 4/5.**

**Exercise 1.8.** *[Tests: full casebook method applied to an edge case]* Identify an agentic system that appears to satisfy all five Go properties (or all but one). What kind of oversight is available in that case, and does the availability of oversight change the analysis of whether alien reasoning is occurring? Use the working definition carefully — the presence of backstops does not resolve the representational question. **Difficulty: 4/5.**

### Challenge (open-ended, beyond the chapter's boundary)

**Exercise 1.9.** *[Tests: the framework's limits]* The chapter flags an unresolved question: what happens to alien reasoning when, over time, human experts develop heuristics that track what the agent does? Propose an operational definition of what "alien reasoning has become human-representable" would look like, and a test that could distinguish it from "human experts have memorized outputs without representing the geometry." **Difficulty: 5/5.**

**Exercise 1.10.** *[Tests: designing the case analysis itself]* The six-question rubric is a proposal, not a canonized method. Identify one question you would add to the rubric and one you would remove. Defend both choices in terms of what a case analysis is for. If you conclude the rubric is right as stated, defend that conclusion against the alternative of a shorter or longer rubric. **Difficulty: 5/5.**

---

**What would change my mind on the whole framework:** a domain where agentic deployments consistently produce outputs whose consequences match those of human expert reasoning, where the geometry the agents use is demonstrably non-representable to those experts, and where no adverse effects attributable to the representational gap manifest over a sufficiently long deployment. That combination would suggest representational opacity is not, by itself, a source of risk — that the geometry can be non-representable and outcomes still align. I haven't seen this case yet. The absence of the case is load-bearing for this book. If you find it, the framework is wrong, and I want to know.

**Still puzzling:** I am not fully satisfied with the sharpness of the boundary between cases where representational opacity matters and cases where it doesn't. A calculator is computationally opaque and representationally transparent and nobody is worried. A chess engine running alpha-beta on a hand-written evaluation function is both kinds of transparent and nobody is worried either. AlphaGo is representationally opaque and, in Go specifically, nobody was harmed. The boundary I want — between representational opacity that is a real source of risk and representational opacity that isn't — is not cleanly marked by any of the five Go properties individually. I think it's their conjunction that does the work, but I haven't formalized this. Treat the book as an attempt, and treat any case that resists the framework as a useful stress test rather than an exception to excuse.

---

**Tags:** `casebook-method`, `agentic-systems`, `alien-reasoning`, `solution-space-geometry`, `representational-opacity`, `move-37`

---

*Primary sources: Silver et al., "Mastering the game of Go with deep neural networks and tree search," [Nature 2016](https://www.nature.com/articles/nature16961); Silver et al., "Mastering the game of Go without human knowledge," [Nature 2017](https://www.nature.com/articles/nature24270); Jumper et al., "Highly accurate protein structure prediction with AlphaFold," [Nature 2021](https://www.nature.com/articles/s41586-021-03819-2); Stokes et al., "A Deep Learning Approach to Antibiotic Discovery," [Cell 2020](https://www.cell.com/cell/fulltext/S0092-8674(20)30102-1); Liu et al., "Deep-learning-guided discovery of an antibiotic targeting Acinetobacter baumannii," [Nature Chemical Biology 2023](https://www.nature.com/articles/s41589-023-01349-8).*

