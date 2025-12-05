# 🧩 Negentropic Coupling Framework (NCF)

**Formal Theory of Adaptive Information Flow and Coherence-Bound Transport**

---

## Overview

The **Negentropic Coupling Framework (NCF)** is a formal, computable model describing how distributed systems self-stabilize by regulating their information flow using measurable entropy, coherence, and negentropy metrics.

It defines:

- **Nodes** as agents carrying internal states  
- **Edges** as message channels with measurable information dynamics  
- **Coupling** as an adaptive operator that evolves with system order

NCF powers **SigilNet**, **QWormhole**, and related architectures — turning *entropy math* into an actionable control law for distributed AI and real-time mesh networks.

---

## Core Equations

| Concept | Symbolic Form | Description |
|----------|----------------|-------------|
| Shannon Entropy | `H = -∑ p log₂ p` | Information uncertainty |
| Negentropic Index | `N = 1 - H/Hₘₐₓ` | Order/coherence measure |
| Entropy Velocity | `v = ΔH / Δt` | Rate of informational change |
| Coupling Law | `x(t+1) = F(x) + G(N,C,v)x` | Adaptive system dynamics |
| Conservation Law | `‖Uₜ x(t)‖ = ‖x(t)‖` | Global coherence invariant |

---

## Features

✅ **Mathematically grounded** — normalized, bounded, and computable  
✅ **Runtime-mappable** — directly corresponds to SigilNet's FlowController + Policy layer  
✅ **Simulation-ready** — Wolfram & Python models included  
✅ **Novel** — defines a new negentropic control law linking information theory and network transport  

---

## Installation

### Python Dependencies

```bash
pip install -r requirements.txt
```

### Wolfram Language

Requires Wolfram Language/Mathematica (version 12.0 or later).

---

## Quick Start (Wolfram)

```wolfram
<< models/NCF_simulation.wl
RunSimulation[10, "macro"]
PlotNegentropyEvolution[]
```

## Quick Start (Python)

```python
from models.NCF_simulation import run_simulation
run_simulation(steps=10, mode="macro")
```

Alternatively, explore the interactive Jupyter notebook:

```bash
cd examples
jupyter notebook run_simulation.ipynb
```

---

## Citation

> gsknnft (2025).  
> **The Negentropic Coupling Framework (NCF) v1.0.**  
> SigilNet Research Series.  
> https://github.com/gsknnft/NegatropicCouplingTheory

---

## License

Released under the MIT License.

---
