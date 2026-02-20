---
layout: post
title:  "Feel-Good Thompson Sampling for Contextual Bandits: a Markov Chain Monte Carlo Showdown"
date:   2025-12-15 00:00:00 +00:00
image: images/feel-good.png
categories: research
authors: "Emile Anand*, <strong>Sarah Liaw*</strong>"
bibtex: |
  @misc{anand2025feelgoodthompsonsamplingcontextual,
      title={Feel-Good Thompson Sampling for Contextual Bandits: a Markov Chain Monte Carlo Showdown}, 
      author={Emile Anand and Sarah Liaw},
      year={2025},
      eprint={2507.15290},
      archivePrefix={arXiv},
      primaryClass={cs.LG},
      url={https://arxiv.org/abs/2507.15290}, 
  }
venue: "NeurIPS"
tldr: "Benchmark Feel-Good Thompson Sampling across various bandit settings."
arxiv: https://arxiv.org/abs/2507.15290
code: https://github.com/SarahLiaw/ctx-bandits-mcmc-showdown
pypi: https://pypi.org/project/ctx-bandits-mcmc/
---

Thompson Sampling (TS) is widely used to address the exploration/exploitation tradeoff in contextual bandits, yet recent theory shows that it does not explore aggressively enough in high-dimensional problems. Feel-Good Thompson Sampling (FG-TS) addresses this by adding an optimism bonus that biases toward high-reward models, and it achieves the asymptotically minimax-optimal regret in the linear setting when posteriors are exact. However, its performance with approximate posteriors -- common in large-scale or neural problems -- has not been benchmarked. We provide the first systematic study of FG-TS and its smoothed variant (SFG-TS) across eleven real-world and synthetic benchmarks. To evaluate their robustness, we compare performance across settings with exact posteriors (linear and logistic bandits) to approximate regimes produced by fast but coarse stochastic-gradient samplers. Ablations over preconditioning, bonus scale, and prior strength reveal a trade-off: larger bonuses help when posterior samples are accurate, but hurt when sampling noise dominates. FG-TS generally outperforms vanilla TS in linear and logistic bandits, but tends to be weaker in neural bandits. Nevertheless, because FG-TS and its variants are competitive and easy-to-use, we recommend them as baselines in modern contextual-bandit benchmarks.
