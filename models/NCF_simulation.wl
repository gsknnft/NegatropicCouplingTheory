(* ::Package:: *)
(* Negentropic Coupling Framework - Simulation Module *)
(* Author: gsknnft (SigilNet Core Research) *)
(* Version: 1.0 *)

BeginPackage["NCFSimulation`"]

(* Public function declarations *)
EntropyField::usage = "EntropyField[edge, t] computes Shannon entropy for edge at time t"
NegentropicIndex::usage = "NegentropicIndex[edge, t] computes the negentropic index (1 - H/Hmax)"
EntropyVelocity::usage = "EntropyVelocity[edge, t] computes rate of entropy change"
Coherence::usage = "Coherence[edge, t] measures bidirectional coherence"
Policy::usage = "Policy[edge, t] determines transport policy based on negentropy"
CouplingOperator::usage = "CouplingOperator[N, C, v] computes adaptive coupling matrix G"
Evolve::usage = "Evolve[x, t] evolves system state using NCF dynamics"
RunSimulation::usage = "RunSimulation[steps, mode] runs NCF simulation for given steps and mode"
PlotNegentropyEvolution::usage = "PlotNegentropyEvolution[] plots negentropy over time"
InitializeMesh::usage = "InitializeMesh[nodes, edges] initializes mesh structure"

Begin["`Private`"]

(* Global simulation state *)
meshState = <||>;
historyLog = {};

(* Initialize mesh with random probability distributions *)
InitializeMesh[nNodes_, nEdges_] := Module[{edges, allPairs, probs},
  allPairs = Select[Tuples[Range[nNodes], 2], #[[1]] != #[[2]] &];
  edges = RandomSample[allPairs, Min[nEdges, Length[allPairs]]];
  probs = Table[
    Normalize[RandomReal[{0.1, 1}, 10], Total],
    {Length[edges]}
  ];
  
  meshState = <|
    "nodes" -> nNodes,
    "edges" -> edges,
    "probabilities" -> AssociationThread[edges -> probs],
    "history" -> {{}, {}},
    "time" -> 0
  |>;
  
  historyLog = {};
  meshState
]

(* Compute Shannon entropy for an edge *)
EntropyField[edge_, t_] := Module[{p},
  p = meshState["probabilities"][edge];
  If[p === Missing["KeyAbsent", edge], 
    0,
    -Total[Select[p, # > 0 &] * Log2[Select[p, # > 0 &]]]
  ]
]

(* Maximum entropy for normalization *)
Hmax[edge_] := Module[{p},
  p = meshState["probabilities"][edge];
  If[p === Missing["KeyAbsent", edge], 1, Log2[Length[p]]]
]

(* Negentropic Index: N = 1 - H/Hmax *)
NegentropicIndex[edge_, t_] := Module[{h, hmax},
  h = EntropyField[edge, t];
  hmax = Hmax[edge];
  If[hmax == 0, 0, 1 - h/hmax]
]

(* Entropy Velocity: rate of change *)
EntropyVelocity[edge_, t_] := Module[{hist, dt = 1},
  hist = meshState["history"];
  If[Length[hist[[1]]] < 2, 
    0,
    (hist[[1]][[-1]] - hist[[1]][[-2]])/dt
  ]
]

(* Coherence measure between forward and reverse edges *)
Coherence[edge_, t_] := Module[{e1, e2, k1, k2},
  e1 = edge;
  e2 = Reverse[edge];
  k1 = If[EntropyField[e1, t] == 0, 0, EntropyField[e1, t]/Hmax[e1]];
  k2 = If[EntropyField[e2, t] == 0, 0, EntropyField[e2, t]/Hmax[e2]];
  1 - Abs[k1 - k2]
]

(* Transport policy based on negentropy *)
Policy[edge_, t_] := Module[{n},
  n = NegentropicIndex[edge, t];
  Which[
    n > 0.8, "macro",
    n < 0.3, "defensive",
    True, "balanced"
  ]
]

(* Coupling operator G(N,C,v) *)
CouplingOperator[n_, c_, v_] := Module[{gain},
  gain = n * c * (1 - Abs[v]);
  gain * IdentityMatrix[Length[meshState["edges"]]]
]

(* Update probability distributions (simple diffusion model) *)
UpdateDistributions[] := Module[{edges, probs, newProbs},
  edges = meshState["edges"];
  probs = meshState["probabilities"];
  
  newProbs = Table[
    Normalize[
      probs[edge] * 0.9 + RandomReal[{0, 0.1}, Length[probs[edge]]],
      Total
    ],
    {edge, edges}
  ];
  
  meshState["probabilities"] = AssociationThread[edges -> newProbs];
]

(* System evolution step *)
Evolve[t_] := Module[{edges, nVals, cVals, vVals, avgN, avgC, avgV},
  edges = meshState["edges"];
  
  (* Compute metrics *)
  nVals = Table[NegentropicIndex[e, t], {e, edges}];
  cVals = Table[Coherence[e, t], {e, edges}];
  vVals = Table[EntropyVelocity[e, t], {e, edges}];
  
  avgN = Mean[nVals];
  avgC = Mean[cVals];
  avgV = Mean[vVals];
  
  (* Update distributions *)
  UpdateDistributions[];
  
  (* Log state *)
  AppendTo[historyLog, <|
    "time" -> t,
    "negentropy" -> avgN,
    "coherence" -> avgC,
    "velocity" -> avgV
  |>];
  
  meshState["time"] = t + 1;
  
  {avgN, avgC, avgV}
]

(* Run simulation *)
RunSimulation[steps_Integer, mode_String: "macro"] := Module[{results},
  Print["Initializing NCF simulation..."];
  InitializeMesh[5, 10];
  
  Print["Running ", steps, " simulation steps in '", mode, "' mode..."];
  results = Table[Evolve[t], {t, 0, steps - 1}];
  
  Print["Simulation complete!"];
  Print["Final mesh negentropy: ", Last[results][[1]]];
  Print["Final coherence: ", Last[results][[2]]];
  
  results
]

(* Plot negentropy evolution *)
PlotNegentropyEvolution[] := Module[{data},
  If[Length[historyLog] == 0,
    Print["No simulation data available. Run RunSimulation[] first."];
    Return[$Failed]
  ];
  
  data = Table[{h["time"], h["negentropy"]}, {h, historyLog}];
  
  ListLinePlot[data,
    PlotLabel -> "Negentropic Evolution Over Time",
    AxisLabel -> {"Time Step", "Mesh Negentropy"},
    PlotStyle -> {Thick, Blue},
    GridLines -> Automatic,
    ImageSize -> Large
  ]
]

End[]
EndPackage[]

(* Example usage when loaded *)
Print["NCF Simulation Module loaded. Use RunSimulation[steps, mode] to begin."];
Print["Example: RunSimulation[10, \"macro\"]"];
