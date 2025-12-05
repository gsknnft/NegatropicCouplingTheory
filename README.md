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
✅ **Visual console** — Real-time Electron-based visualization with secure context isolation  
✅ **Novel** — defines a new negentropic control law linking information theory and network transport

### 🖥️ Negentropic Console

The **Electron Console** provides real-time visualization of NCF dynamics:

- **Live negentropy & entropy graphs** showing mesh evolution
- **Force-directed coupling map** with color-coded policy states
- **Interactive controls** for simulation parameters
- **Auto-demo mode** for presentations
- **Secure architecture** with context isolation and sandboxing

Launch with `npm run dev:console` in the `console/` directory. See [CONSOLE.md](CONSOLE.md) for details.  

---

## Installation

### Python Dependencies

```bash
pip install -r requirements.txt
```

### Wolfram Language

Requires Wolfram Language/Mathematica (version 12.0 or later).

---

## Quick Start (Electron Console)

Launch the interactive visualization console:

```bash
cd console
npm install
npm run dev:console
```

Runs at `http://localhost:5173` in a secure Electron shell.

See [CONSOLE.md](CONSOLE.md) for detailed usage.

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
