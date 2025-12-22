"""
Negentropic Coupling Framework - Python Simulation Module
Author: gsknnft (SigilNet Core Research)
Version: 1.0
"""
import sys
print(sys.path)
import numpy as np
from dataclasses import dataclass
from typing import List, Tuple, Dict, Optional
import json


@dataclass
class CouplingParams:
    """Coupling parameters that shape how aggressively the mesh drifts."""
    noise_scale: float = 0.1


@dataclass
class CoherenceState:
    """Derived coherence metrics for the current step."""
    margin: float
    drift: float
    reserve: float
    horizon: float


@dataclass
class CoherenceLoopConfig:
    """Tuning parameters for the coherence loop."""
    horizon_min: float = 3.0
    margin_target: float = 0.7
    drift_stable: float = 0.02
    couple_down_step: float = 0.02
    couple_up_step: float = 0.01
    horizon_cap: float = 1e6
    min_noise_scale: float = 0.02
    max_noise_scale: float = 0.3


class CoherenceLoop:
    """Estimate coherence state and adapt coupling parameters."""
    def __init__(self, config: Optional[CoherenceLoopConfig] = None):
        self.config = config or CoherenceLoopConfig()

    def estimate_state(
        self,
        avg_negentropy: float,
        avg_coherence: float,
        avg_velocity: float,
        prev_margin: Optional[float],
    ) -> CoherenceState:
        margin = _clamp(0.5 * avg_negentropy + 0.5 * avg_coherence, 0.0, 1.0)
        if prev_margin is None:
            drift = 0.0
        else:
            drift = margin - prev_margin

        reserve = _clamp(1.0 / (1.0 + abs(avg_velocity)), 0.0, 1.0)

        if drift < 0:
            horizon = margin / max(1e-6, abs(drift))
            horizon *= max(0.2, reserve)
        else:
            horizon = self.config.horizon_cap

        horizon = min(horizon, self.config.horizon_cap)

        return CoherenceState(margin=margin, drift=drift, reserve=reserve, horizon=horizon)

    def adapt(self, state: CoherenceState, params: CouplingParams) -> CouplingParams:
        noise_scale = params.noise_scale

        if state.horizon < self.config.horizon_min:
            noise_scale -= self.config.couple_down_step
        elif state.margin > self.config.margin_target and abs(state.drift) < self.config.drift_stable:
            noise_scale += self.config.couple_up_step

        noise_scale = _clamp(noise_scale, self.config.min_noise_scale, self.config.max_noise_scale)
        return CouplingParams(noise_scale=noise_scale)


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


class NCFSimulation:
    """
    Implements the Negentropic Coupling Framework simulation.
    
    This class provides methods to simulate information dynamics
    in a distributed mesh using entropy, negentropy, and coherence metrics.
    """
    
    def __init__(self, n_nodes: int = 5, n_edges: int = 10):
        """
        Initialize the NCF simulation mesh.
        
        Args:
            n_nodes: Number of nodes in the mesh
            n_edges: Number of directed edges (communication channels)
        """
        self.n_nodes = n_nodes
        self.n_edges = min(n_edges, n_nodes * n_nodes)
        self.edges = []
        self.probabilities = {}
        self.history = []
        self.time = 0
        self.coupling_params = CouplingParams()
        self.coherence_loop = CoherenceLoop()
        self._last_margin = None
        
        self._initialize_mesh()
    
    def _initialize_mesh(self):
        """Initialize mesh with random edges and probability distributions."""
        # Create random directed edges
        all_possible = [(i, j) for i in range(self.n_nodes) 
                       for j in range(self.n_nodes) if i != j]
        self.edges = [all_possible[i] for i in 
                     np.random.choice(len(all_possible), 
                                    size=min(self.n_edges, len(all_possible)), 
                                    replace=False)]
        
        # Initialize random probability distributions for each edge
        for edge in self.edges:
            probs = np.random.uniform(0.1, 1.0, size=10)
            self.probabilities[edge] = probs / probs.sum()
        
        print(f"Mesh initialized: {self.n_nodes} nodes, {len(self.edges)} edges")
    
    def entropy_field(self, edge: Tuple[int, int]) -> float:
        """
        Compute Shannon entropy for an edge.
        
        H = -∑ p log₂ p
        
        Args:
            edge: Tuple (i, j) representing directed edge
            
        Returns:
            Shannon entropy value
        """
        p = self.probabilities.get(edge)
        if p is None:
            return 0.0
        
        # Filter out zero probabilities to avoid log(0)
        p_nonzero = p[p > 0]
        return -np.sum(p_nonzero * np.log2(p_nonzero))
    
    def hmax(self, edge: Tuple[int, int]) -> float:
        """
        Maximum entropy for normalization.
        
        Hₘₐₓ = log₂|Σ|
        
        Args:
            edge: Tuple (i, j) representing directed edge
            
        Returns:
            Maximum possible entropy
        """
        p = self.probabilities.get(edge)
        if p is None:
            return 1.0
        return np.log2(len(p))
    
    def negentropic_index(self, edge: Tuple[int, int]) -> float:
        """
        Compute negentropic index (order measure).
        
        N = 1 - H/Hₘₐₓ
        
        Args:
            edge: Tuple (i, j) representing directed edge
            
        Returns:
            Negentropic index (0 = max entropy, 1 = max order)
        """
        h = self.entropy_field(edge)
        h_max = self.hmax(edge)
        
        if h_max == 0:
            return 0.0
        return 1.0 - (h / h_max)
    
    def entropy_velocity(self, edge: Tuple[int, int]) -> float:
        """
        Compute rate of entropy change.
        
        v = ΔH / Δt
        
        Args:
            edge: Tuple (i, j) representing directed edge
            
        Returns:
            Entropy velocity
        """
        if len(self.history) < 2:
            return 0.0
        
        # Get entropy from last two time steps
        h_curr = self.history[-1]['entropy'].get(edge, 0)
        h_prev = self.history[-2]['entropy'].get(edge, 0)
        
        return h_curr - h_prev
    
    def coherence(self, edge: Tuple[int, int]) -> float:
        """
        Measure bidirectional coherence.
        
        C = 1 - |K_ij - K_ji|
        
        Args:
            edge: Tuple (i, j) representing directed edge
            
        Returns:
            Coherence measure
        """
        i, j = edge
        reverse_edge = (j, i)
        
        h1 = self.entropy_field(edge)
        h2 = self.entropy_field(reverse_edge)
        hmax1 = self.hmax(edge)
        hmax2 = self.hmax(reverse_edge)
        
        k1 = h1 / hmax1 if hmax1 > 0 else 0
        k2 = h2 / hmax2 if hmax2 > 0 else 0
        
        return 1.0 - abs(k1 - k2)
    
    def policy(self, edge: Tuple[int, int]) -> str:
        """
        Determine transport policy based on negentropy.
        
        Args:
            edge: Tuple (i, j) representing directed edge
            
        Returns:
            Policy string: "macro", "defensive", or "balanced"
        """
        n = self.negentropic_index(edge)
        
        if n > 0.8:
            return "macro"
        elif n < 0.3:
            return "defensive"
        else:
            return "balanced"
    
    def update_distributions(self):
        """Update probability distributions (simple diffusion model)."""
        noise_scale = self.coupling_params.noise_scale
        base_weight = max(0.0, 1.0 - noise_scale)
        for edge in self.edges:
            # Add small random perturbation and renormalize
            probs = self.probabilities[edge]
            noise = np.random.uniform(0.0, 1.0, size=len(probs)) * noise_scale
            new_probs = probs * base_weight + noise
            self.probabilities[edge] = new_probs / new_probs.sum()
    
    def evolve(self) -> Dict[str, float]:
        """
        Execute one simulation step.
        
        Returns:
            Dictionary with mesh-level metrics
        """
        # Compute metrics for all edges
        entropies = {e: self.entropy_field(e) for e in self.edges}
        negentropies = {e: self.negentropic_index(e) for e in self.edges}
        coherences = {e: self.coherence(e) for e in self.edges}
        velocities = {e: self.entropy_velocity(e) for e in self.edges}
        
        # Compute mesh-level averages
        avg_negentropy = np.mean(list(negentropies.values()))
        avg_coherence = np.mean(list(coherences.values()))
        avg_velocity = np.mean(list(velocities.values()))

        coherence_state = self.coherence_loop.estimate_state(
            avg_negentropy=float(avg_negentropy),
            avg_coherence=float(avg_coherence),
            avg_velocity=float(avg_velocity),
            prev_margin=self._last_margin,
        )
        self.coupling_params = self.coherence_loop.adapt(
            state=coherence_state,
            params=self.coupling_params,
        )
        self._last_margin = coherence_state.margin

        # Log state
        self.history.append({
            'time': self.time,
            'entropy': entropies.copy(),
            'negentropy': avg_negentropy,
            'coherence': avg_coherence,
            'velocity': avg_velocity,
            'margin': coherence_state.margin,
            'drift': coherence_state.drift,
            'reserve': coherence_state.reserve,
            'horizon': coherence_state.horizon,
            'coupling': {
                'noise_scale': self.coupling_params.noise_scale
            }
        })
        
        # Update distributions for next step
        self.update_distributions()
        self.time += 1
        
        return {
            'negentropy': float(avg_negentropy),
            'coherence': float(avg_coherence),
            'velocity': float(avg_velocity),
            'margin': float(coherence_state.margin),
            'drift': float(coherence_state.drift),
            'reserve': float(coherence_state.reserve),
            'horizon': float(coherence_state.horizon),
            'noise_scale': float(self.coupling_params.noise_scale)
        }
    
    def get_history(self) -> List[Dict]:
        """Return simulation history."""
        return self.history


def run_simulation(steps: int = 10, mode: str = "macro", 
                  n_nodes: int = 5, n_edges: int = 10) -> List[Dict]:
    """
    Run NCF simulation.
    
    Args:
        steps: Number of simulation steps
        mode: Simulation mode ("macro", "defensive", "balanced")
        n_nodes: Number of nodes in mesh
        n_edges: Number of edges in mesh
        
    Returns:
        List of metric dictionaries for each time step
    """
    print(f"Initializing NCF simulation...")
    sim = NCFSimulation(n_nodes=n_nodes, n_edges=n_edges)
    
    print(f"Running {steps} simulation steps in '{mode}' mode...")
    results = []
    
    for step in range(steps):
        metrics = sim.evolve()
        results.append(metrics)
        
        if step % max(1, steps // 5) == 0:
            print(f"  Step {step}: N={metrics['negentropy']:.3f}, "
                  f"C={metrics['coherence']:.3f}, v={metrics['velocity']:.3f}")
    
    print("\nSimulation complete!")
    print(f"Final mesh negentropy: {results[-1]['negentropy']:.3f}")
    print(f"Final coherence: {results[-1]['coherence']:.3f}")
    
    return results


def plot_negentropy_evolution(history: List[Dict], save_path: Optional[str] = None):
    """
    Plot negentropy evolution over time.
    
    Args:
        history: Simulation history from run_simulation()
        save_path: Optional path to save plot image
    """
    try:
        import matplotlib.pyplot as plt
        
        times = [h['time'] for h in history]
        negentropies = [h['negentropy'] for h in history]
        
        plt.figure(figsize=(10, 6))
        plt.plot(times, negentropies, 'b-', linewidth=2, label='Mesh Negentropy')
        plt.xlabel('Time Step')
        plt.ylabel('Negentropy')
        plt.title('Negentropic Evolution Over Time')
        plt.grid(True, alpha=0.3)
        plt.legend()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"Plot saved to {save_path}")
        else:
            plt.show()
            
    except ImportError:
        print("Matplotlib not available. Install with: pip install matplotlib")


if __name__ == "__main__":
    # Example usage
    print("=" * 60)
    print("NCF Simulation Module")
    print("=" * 60)
    
    # Run simulation
    sim = NCFSimulation(n_nodes=5, n_edges=10)
    results = run_simulation(steps=10, mode="macro")
    
    # Optionally plot results
    history = sim.get_history()
    # plot_negentropy_evolution(history)
