# Diagrams

This directory contains visual representations of NCF concepts and dynamics.

## Recommended Diagrams

### 1. `ncf_dynamics.svg`
Visual illustration of:
- Node/edge coupling dynamics
- Information flow patterns
- Negentropy gradients
- Policy state transitions

### 2. `coherence_field.png`
Visualization of:
- Global coherence functional Φ(x)
- Mesh-level negentropy distribution
- Temporal evolution of order

## Creating Diagrams

You can generate these using:
- **Matplotlib/Python**: See `models/NCF_simulation.py` for plotting functions
- **Wolfram Language**: Use `PlotNegentropyEvolution[]` and related functions
- **Manual tools**: Draw.io, Inkscape, or similar vector graphics tools

## Example Python Code

```python
from models.NCF_simulation import run_simulation, plot_negentropy_evolution
import matplotlib.pyplot as plt

# Run simulation
sim = NCFSimulation(n_nodes=5, n_edges=10)
results = run_simulation(steps=20)

# Save plot
history = sim.get_history()
plot_negentropy_evolution(history, save_path='diagrams/ncf_dynamics.png')
```

---

**Note:** Placeholder directory. Add actual visualizations as they are generated.
