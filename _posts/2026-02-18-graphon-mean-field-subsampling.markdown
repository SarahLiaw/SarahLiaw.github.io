---
layout: post
title:  "Graphon Mean-Field Subsampling for Cooperative Heterogeneous Multi-Agent Reinforcement Learning"
date:   2026-02-18 00:00:00 +00:00
image: images/gmfs.png
categories: research
authors: "Emile Anand, Richard Hoffmann, <strong>Sarah Liaw</strong>, Adam Wierman"
bibtex: |
  @misc{anand2026graphonmeanfieldsubsamplingcooperative,
      title={Graphon Mean-Field Subsampling for Cooperative Heterogeneous Multi-Agent Reinforcement Learning}, 
      author={Emile Anand and Richard Hoffmann and Sarah Liaw and Adam Wierman},
      year={2026},
      eprint={2602.16196},
      archivePrefix={arXiv},
      primaryClass={cs.LG},
      url={https://arxiv.org/abs/2602.16196}, 
  }
venue: "arXiv preprint"
tldr: "Graphon-weighted subsampling of κ agents for scalable cooperative MARL with heterogeneous interactions."
arxiv: https://arxiv.org/abs/2602.16196
code: https://github.com/SarahLiaw/graphon-marl
---

Coordinating large populations of interacting agents is a central challenge in multi-agent reinforcement learning (MARL), where the size of the joint state-action space scales exponentially with the number of agents. Mean-field methods alleviate this burden by aggregating agent interactions, but these approaches assume homogeneous interactions. Recent graphon-based frameworks capture heterogeneity, but are computationally expensive as the number of agents grows. Therefore, we introduce GMFS, a Graphon Mean-Field Subsampling framework for scalable cooperative MARL with heterogeneous agent interactions. By subsampling κ agents according to interaction strength, we approximate the graphon-weighted mean-field and learn a policy with sample complexity poly(κ) and optimality gap O(1/√κ). We verify our theory with numerical simulations in robotic coordination, showing that GMFS achieves near-optimal performance.
