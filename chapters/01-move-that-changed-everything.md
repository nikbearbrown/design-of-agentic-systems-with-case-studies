# Chapter 1 — The Move That Changed Everything

*AlphaGo, the Geometry of What Humans Cannot See, and Why the Story Is Cleaner Than I First Told It*

**Author:** Nik Bear Brown

---

On March 10, 2016, in a hotel ballroom in Seoul, a computer placed a black stone on the fifth line of a Go board, and the commentators stopped talking.

I want to spend this chapter on that one moment. Not because strange things happen in computing — strange things happen in computing all the time — but because this particular moment was strange in a particular way, and the particular way matters enormously for everything that comes after it.

The match was AlphaGo against Lee Sedol, one of the strongest Go players of his generation. The move came thirty-six stones into Game 2 of the second game. A shoulder hit on the fifth line from the right edge. Michael Redmond, a 9-dan professional commentating in English, paused; he talked around the move because there was nothing obvious to say about it. Fan Hui — who had lost to an earlier version of AlphaGo six months before — left the room, came back, and said something he has repeated since: that it was not a human move, but a beautiful one.

By the end of the game, that move was the reason AlphaGo won.

Now here is the puzzle I want you to hold in your head while we work through this chapter. The move was not incomprehensible. The commentators could explain it, eventually, given the next thirty stones and the eventual outcome. They could see why the fifth-line shoulder hit worked. What no human has done since — including the people who built AlphaGo — is reach for moves of that character from scratch, by reasoning forward from the position. Top professionals today, trained in a post-AlphaGo world, sometimes play moves of similar shape with some confidence. Whether that's because they have rebuilt the underlying geometry in their heads or because they have memorized representative outputs, I genuinely don't know. I'll come back to that. I want to flag it now because it is the seam running through everything I'm about to say.

The move was correct. The move was also, in a specific sense I'll have to make precise, not a move produced by reasoning a human can perform.

That distinction is what people are pointing at when they use the term *alien intelligence*. The term gets used loosely. My job in this chapter is to make it sharp enough to do real work — sharp enough that you can pick up a claim about alien intelligence somewhere out in the world and decide whether the person making it has thought about it carefully or is just feeling a vibe.

## What AlphaGo replaced

To see what AlphaGo did, look first at what it didn't do.

In 1997, IBM's Deep Blue beat Garry Kasparov in chess. The architecture was understood at the time, and is still understood now. Deep Blue searched. From any position, it generated the legal moves, played each one forward in its imagination, generated the opponent's responses, played those forward, and built a tree of possible continuations. At the leaves of the tree it ran an *evaluation function* — a hand-coded formula that scored a position using things chess players had been thinking about for centuries. Material: how many queens, rooks, pawns each side has. Pawn structure. King safety. Center control. Then minimax, refined by alpha-beta pruning, picked the move that led to the best position assuming both sides played their best replies.

This worked because chess is deep but narrow. From a typical position you have about thirty-five legal moves — what's called the *branching factor* — and the evaluation function, worked out by generations of grandmasters, is actually pretty good. Material advantage really is a decent proxy for winning. Deep Blue could search a few dozen ply ahead, score the leaves, and outplay any human alive.

<!-- → [INFOGRAPHIC: side-by-side comparison of chess vs. Go on the two failure axes — branching factor (35 vs. 250) and evaluation function (writable vs. not writable); the visual should make the "two problems, not one" structure of the Go challenge immediately legible] -->

Now look at Go. Go is played on a 19×19 board; each move places a stone on an empty intersection. Early in the game you have close to 361 legal moves — every intersection. Even later, the branching factor averages around 250.

That alone is not the problem. The bigger problem is that nobody, in the history of the game, has ever written down a position-evaluation formula for Go that works. The heuristics live in the heads of strong players as something closer to perception than to calculation. Ask a professional why one position is better than another and you will get a mix of precise reasoning ("this group lacks eye-shape, so it can die under pressure") and something more like seeing ("this wall feels thin").

So Go broke the chess playbook on both axes. The tree was too wide to enumerate, and the leaves were too hard to score. Go was not unsolvable for lack of computing power. Go was unsolvable for the chess approach because the chess approach needs an evaluation function you can write down, and nobody could write one for Go.

The design choice hidden in this problem is the move I want you to see clearly, because it appears everywhere now. You can either keep trying to write the evaluation function by hand and run faster computers at it — several groups did this, they got to strong-amateur level, and they stalled — or you can give up on writing it and *learn it from data*. Every modern AI system in a domain where the rules are hard to put into words — vision, language, biology, chemistry — is some descendant of that decision.

## How AlphaGo actually reasoned

AlphaGo is three things stacked together. A policy network, a value network, and Monte Carlo Tree Search. I want to walk through each, because the machinery matters for what comes next.

<!-- → [DIAGRAM: three-component architecture of AlphaGo — policy network (input: board → output: move probabilities), value network (input: board → output: win probability 0–1), and MCTS (uses both to guide search); show data flow between the three, with a callout indicating that MCTS is what "ties them together" at decision time] -->

The policy network is a neural network — that is, a function with millions of adjustable numbers inside, tuned by an optimization algorithm to reproduce examples it has been shown — that takes a Go board as input and outputs a probability for every legal move. *If I were going to play here, move A has a 23% chance of being the right move, move B has 18%, move C has 11%.* It does not score moves as good or bad. It only narrows the field.

That alone is enough to fix half of the Go problem. A branching factor of 250 is intractable. A branching factor of "the top five moves the policy network suggests" is very tractable. The policy network does not solve Go; it converts Go from an enumeration problem into a focused-search problem.

The value network is the other neural network. It takes a position as input and outputs a single number between 0 and 1: the probability that black wins from this position assuming reasonable play from both sides. This is the evaluation function nobody could write. AlphaGo did not write it either. Instead it trained the value network on millions of positions from games AlphaGo had played against itself, each labeled with the eventual outcome.

The value network has, through exposure to millions of complete games, fit itself to the statistical regularities of which positions tend to win. It is not applying grandmaster heuristics. It is also not ignoring them — the positions it trained on were shaped by grandmaster-level play, since the policy network it played against was bootstrapped from human games. But the heuristics it extracted are not human-readable. They live in the weights of the network.

Monte Carlo Tree Search is the part that ties them together. It is a fancy name for a simple idea. Pick a move the policy network likes. Play it. Pick a response the policy network likes from the resulting position. Play it. Keep going for a while — sometimes to the end of the game, sometimes just until you reach a position the value network can score with confidence. Record what happened. Do this thousands of times per move, exploring different lines, and pick the move whose lines have led to the best outcomes most often.

Now reconstruct what happened at Move 37. The policy network sees the board after thirty-six stones. It puts most of its probability on the moves a strong human would consider — and it puts a small amount, around one in ten thousand by DeepMind's later estimate, on the fifth-line shoulder hit. A human grandmaster would have killed that move before any serious thought; the fifth line is too far from influence and too close to attack, and the heuristic against it is firm. The policy network had no such heuristic. It had statistical regularities extracted from self-play, and in that data, moves of this shape led to positions the value network judged favorable more often than the human heuristic predicted.

So MCTS searched from the shoulder hit, and the searches kept coming back with high estimated win probabilities. AlphaGo committed.

I want to flag two things before moving on, because they are the two places people most often misread this story.

The first is that AlphaGo's strength came mostly from self-play, not from human games. The early policy network was trained on human games. But before the Lee Sedol match, AlphaGo played millions of games against itself, each producing new data. Its successor, AlphaZero, dropped human games entirely — started with nothing but the rules of Go and played itself from scratch — and in three days it exceeded the final AlphaGo. So whatever Move 37 was, it was not extracted from a game the system had seen. The space AlphaZero navigated contained no human moves at all, and it contained moves like Move 37.

The second is that "nobody can reconstruct AlphaGo's reasoning" is harder to say carefully than it looks. We know what the network computed; the activations are there, they are inspectable. What is not available is a *human-runnable procedure* that takes the board and outputs the shoulder hit by reasoning. The proof of "non-reconstructible" is asymmetric — to prove reconstructible, one example suffices; to prove non-reconstructible, you would have to rule out an unbounded space of approaches. So the careful version is this: no human has demonstrated the ability to find Move 37-class moves from scratch in 2016 conditions, and the post-2016 evolution of professional play is consistent with two readings, and I cannot yet tell them apart.

That ambiguity is where I want to take you next. It is the most important idea in this chapter.

## What humans can explain and what humans can find

The commentators in Seoul could explain Move 37 *after the fact*. Given the next thirty stones, given the eventual outcome, they could narrate why the shoulder hit worked. Doesn't that mean the move was within human reasoning after all?

No. And the reason is the most useful thing you can take from this chapter, so I am going to slow down on it.

*Local explicability* is the ability to explain a single move in terms a human can follow once the move is in hand. *Global navigability* is the ability to find the move from scratch by thinking. These are different capacities, and most of what goes wrong in popular AI commentary comes from conflating them.

<!-- → [TABLE: two-column contrast of local explicability vs. global navigability — rows covering: definition, what it requires from the human, what AlphaGo demonstrated on each axis, and the practical implication for oversight; student should see that these are orthogonal properties, not points on a single axis] -->

A human grandmaster can look at Move 37 and, given the game that followed, narrate a justification. The same grandmaster, facing the same board *before* Move 37 was played, would not have found it. The position in the solution space that made the move correct is locally explicable — you can describe one point in it once someone hands you that point — but not globally navigable: you cannot reach that point on your own from the points nearby.

This will appear in every case of this kind. Every system of this character produces outputs that are locally explicable — someone can always tell you a story about why the system did what it did — while being globally non-navigable, meaning no amount of reading the story teaches you to produce the next such output yourself.

If only local explicability were on offer, oversight would be easy. You read the system's reasoning, agree or disagree, and intervene where you disagree. The reasoning would carry the audit. If only global navigability were a problem, oversight would also be easy. You slow the system down, do the analysis yourself, override where needed; the bottleneck would be human time. The hard case — and it is the case I think we are heading into — is when local explicability is available *and looks correct*, but the global structure is what determined the output. The story you read about why the system did what it did is true at every step, and yet doesn't reveal what actually drove the decision, because what drove the decision was the geometry of a space the explanation doesn't traverse.

I have to be honest about a seam in this argument. There are a strong version and a weak version of what I just said, and I cannot yet operationally tell them apart.

The strong version: the geometry of solution spaces in cases like this is non-representable to humans *in principle*. No amount of training gets a human to navigate it. The weak version: the geometry is structurally inaccessible *under realistic constraints* — no human has yet bothered or been able to traverse it because the cost of traversal is too high, but with enough time and exposure, a sufficiently dedicated expert could. Under the strong version, AlphaGo did something humans were structurally barred from. Under the weak version, AlphaGo accelerated human exploration of a space humans could in principle reach.

The post-2016 evolution of Go is consistent with both readings. Top pros now play AlphaGo-influenced moves with some confidence. They have absorbed something. Whether they have absorbed the geometry or memorized its outputs, I do not know how to test. The sharp version of the question — what evidence would distinguish "expert has reconstructed the geometry" from "expert has memorized representative outputs" — is open. I am writing this chapter using the strong version because it is the version that motivates the worry, and I owe you that I do not yet have the test that would distinguish the two.

What I will defend without the test is this: whether the geometry is non-representable in principle or merely inaccessible under realistic constraints, the practical question — *can a domain expert evaluate the system's output by reasoning about the geometry the system used* — has the same answer in either case during the deployment window that matters. If a sharper test arrives, this position can move. Until it does, this is what I am willing to defend.

One other thing. "Alien" is not a claim that the machine is conscious, has preferences, or is "really thinking." It is a claim about the geometry of the solution space and whether that geometry is humanly representable in the operational sense above. You can make the claim without taking any position on whether there is experience behind the navigation. The question of consciousness is real, but it is a different question, and conflating the two is how this vocabulary loses its teeth.

## Why Move 37 was harmless

Now I want to make explicit what this chapter has been working toward, because in an earlier draft I got it slightly wrong, and the slippage matters.

I had written that Move 37 was the existence proof on which the rest of this book rests. A reader I trust pointed out that this isn't right. Move 37 proves that *alien reasoning combined with full validation produces correct, exhilarating, harmless outcomes*. The worry about agentic systems in messier domains is *alien reasoning without full validation*. Those are different cases. The second is not proved by the first. Move 37 is a beautiful demonstration in the easiest possible domain, used to motivate a concern about much harder ones. The motivation is real. The logic does not run from one case to the other directly, and owning that gap is a precondition for the rest of the book being honest.

Go is, structurally, the *easiest* domain in which non-reconstructible correct reasoning can exist. Five properties were all simultaneously true of Go and are largely absent in the agentic deployments that fill the rest of the book.

The objective was cheap to specify. *Win the game* is a function of board state at termination; you write it down in one line, and there is no ambiguity about whether it was achieved. The environment was sealed: a stone placed at D17 did not also change the weather, make someone lose their job, or commit a resource that could not be recovered. Moves were locally atomic — a Go stone interacts with its neighbors through rules the game makes explicit, with no hidden channels through which one stone affects another. Ground truth arrived: every game terminates within hours and you know who won. And self-play was free: AlphaGo's strength came from millions of games against copies of itself, with no patients harmed, no markets moved, no clients misrepresented.

<!-- → [TABLE: the five safety properties of Go — rows: cheap objective specification, sealed environment, locally atomic actions, ground truth arrives, self-play is free; columns: the Go case (what made it true) and the agentic deployment case (what makes it false); student should see this as the structural argument for why Move 37 doesn't license confidence in harder domains] -->

Cluster these and three families fall out. The objective: cheap to specify. The action footprint: bounded and declared. The feedback: arrives, cheaply, on a useful timescale. Every one of those families fails in the deployments I am going to walk through later. *Help the patient* is not a function you can write down. *Send the email* has consequences in systems the agent doesn't observe. *Was the legal strategy correct* is judged years downstream by communities the agent doesn't model.

So this is the sentence I want to sit underneath everything in the rest of the book: *Move 37 is the existence proof that correct, consequential, non-reconstructible reasoning is possible in a domain where every safety property is intact. Agentic systems are where we test what happens when those properties come off.*

The book is organized by which family fails first.

I am not going to pretend I have the framework fully buttoned. The boundary I most want — between representational opacity that creates risk and representational opacity that doesn't — is not cleanly marked by any of the five properties on its own. A calculator is opaque in its computation and humans aren't worried; AlphaGo is opaque in its representations and, in Go specifically, no one was harmed. I think it is the conjunction of the five properties failing together that does the work, but I haven't formalized it. If the rest of the book is doing its job, the conjunction will have a sharper shape by the end than I can give it now. If you reach the final chapter and the shape isn't sharper, the book has failed at its central job, and I would rather you tell me than nod along.

I want to leave you with the same puzzle I started with, in a slightly different form.

A computer placed a stone on the fifth line and a room full of grandmasters stopped talking. The move was correct. The move was, in a specific sense, not a move a grandmaster could have found by thinking. The room could explain the move once they had it, and could not have produced it on their own. AlphaGo committed it inside a domain where every safety property was intact: the objective was clean, the board was sealed, the verdict arrived within hours.

Take any of those properties away and ask yourself what you have left.

That is the question this book is about.

---

## Exercises

### Warm-up

**1.** AlphaGo uses three components working together. In your own words, describe what each one does and why no single component could have solved Go alone. Which component fixed the evaluation problem, and which fixed the branching problem?
*(Tests: understanding of the policy network / value network / MCTS architecture)*

**2.** The chapter distinguishes *local explicability* from *global navigability*. Define both terms as precisely as you can without looking back at the text. Then give one example — from any domain, not Go — where a result could be locally explicable without being globally navigable.
*(Tests: retention and transfer of the chapter's central conceptual distinction)*

**3.** Name the five safety properties that made Go a domain where non-reconstructible reasoning was harmless. For each one, state in a single sentence why it held in Go.
*(Tests: recall of the five-property framework)*

---

### Application

**4.** Deep Blue's evaluation function was hand-written by grandmasters; AlphaGo's value network was learned from self-play. Explain the practical consequence of this difference for a domain like medical diagnosis — where the "evaluation function" would need to assess whether a treatment plan is likely to succeed. What does the Go lesson imply about what you can and cannot write down?
*(Tests: applying the evaluation-function design choice to a novel domain)*

**5.** Consider a chess engine evaluating a position at depth 30 (searching 30 moves ahead). Is the engine's output locally explicable? Is it globally navigable by a human grandmaster? Are these the same question? Defend your answers using the definitions from this chapter.
*(Tests: applying local explicability / global navigability to a near-domain case with a non-obvious answer)*

**6.** AlphaZero started with only the rules of Go and played itself from scratch, producing moves like Move 37 within three days — with zero exposure to human games. A common response to this fact is: "So it just found patterns humans hadn't noticed yet." Evaluate that claim. What would "finding a pattern" mean in this context, and does the explanation hold up?
*(Tests: critical interrogation of a plausible but under-examined popular interpretation)*

**7.** The chapter argues that Move 37 is not the existence proof for the book's central worry — only the motivating case. Reconstruct this argument in three to five sentences. What would the actual existence proof require that Move 37 cannot supply?
*(Tests: comprehension of the chapter's self-critical move and its logical structure)*

---

### Synthesis

**8.** The chapter presents a "strong version" and a "weak version" of the claim that AlphaGo's solution geometry is non-representable to humans — and admits it cannot yet tell them apart operationally. Explain why this distinction matters for the practical question of oversight. Would a different answer to the strong/weak question change anything about how a professional knowledge worker should approach AI outputs today?
*(Tests: connecting the chapter's epistemic honesty to the book's practical concern; anticipates later chapters on the Loop)*

**9.** The chapter ends by organizing the book around which of three families of safety properties fails first: the objective, the action footprint, or the feedback loop. Choose a real AI deployment you are familiar with — a coding assistant, a content moderation system, a loan-approval model — and identify which family fails most severely in that deployment. What are the oversight implications?
*(Tests: applying the three-family framework to a real case; bridges to the book's agentic chapters)*

---

### Challenge

**10.** The chapter defines "alien intelligence" strictly as a claim about the geometry of solution spaces and whether that geometry is humanly representable in the operational sense — explicitly not a claim about consciousness. Stress-test this definition. Construct a case where a system's output is globally navigable by humans and yet we might still want to call it "alien." Then construct a case where a system's output is globally non-navigable and yet we might not. Does the chapter's definition do the work the book needs it to do, or is it drawing the boundary in the wrong place?
*(Tests: stress-testing the chapter's central definition against edge cases it does not address; requires the student to reason about the definition's purpose, not just its content)*
