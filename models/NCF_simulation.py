"""
Negentropic Coupling Framework - Python Simulation Module
Author: gsknnft (SigilNet Core Research)
Version: 1.0
"""
import sys
print(sys.path)
import numpy as np
from typing import List, Tuple, Dict, Optional
import json


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
        for edge in self.edges:
            # Add small random perturbation and renormalize
            probs = self.probabilities[edge]
            noise = np.random.uniform(0, 0.1, size=len(probs))
            new_probs = probs * 0.9 + noise
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
        
        # Log state
        self.history.append({
            'time': self.time,
            'entropy': entropies.copy(),
            'negentropy': avg_negentropy,
            'coherence': avg_coherence,
            'velocity': avg_velocity
        })
        
        # Update distributions for next step
        self.update_distributions()
        self.time += 1
        
        return {
            'negentropy': float(avg_negentropy),
            'coherence': float(avg_coherence),
            'velocity': float(avg_velocity)
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
