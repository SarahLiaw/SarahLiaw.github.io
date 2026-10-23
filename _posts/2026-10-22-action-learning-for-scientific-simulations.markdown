---
layout: post
title:  "Action Learning for Scientific Simulations"
date:   2026-10-22 00:00:00 +00:00
image: images/action-learning.png
categories: research
authors: "<strong>Sarah Liaw</strong>, Yuanqi Du, Yilun Du"
bibtex: |
  @misc{liaw2026actionlearningscientificsimulations,
        title={Action Learning for Scientific Simulations},
        author={Sarah Liaw and Yuanqi Du and Yilun Du},
        year={2026},
        eprint={2610.31585},
        archivePrefix={arXiv},
        primaryClass={cs.LG},
        url={https://arxiv.org/abs/2610.31585},
  }
venue: "arXiv preprint"
tldr: "Learn the stochastic action of a system directly from trajectory samples, then reuse it for path inference, mechanism steering, constraints and sampling."
paper: https://arxiv.org/abs/2610.31585v1
blog: https://sarahliaw.github.io/action-learning/
code: https://github.com/SarahLiaw/action-learning
---

Understanding and controlling how systems evolve is central to science and engineering, where many problems require reasoning about complete trajectories. Existing approaches typically learn local dynamics or generate trajectories, but objectives constructed from individual transitions can miss dependencies across time, while generative models do not necessarily provide a tractable objective for evaluating and optimizing arbitrary paths. We study action learning, the problem of recovering a stochastic action from trajectory observations, yielding a common objective for reasoning about dynamical systems. We introduce LEAP (Learned Energy on Action Paths), which anchors the unknown action to a tractable reference process and learns the remaining correction by comparing observed trajectories with reference trajectories. This construction yields a differentiable objective on path space that can capture both local dynamical structure and nonadditive dependencies across time. Once learned, the same action can be flexibly reused for path ranking and inference, mechanism steering, constrained optimization and sampling. Across stochastic physical systems, many-body orbital dynamics and molecular simulations, LEAP recovers underlying dynamics, captures dependencies across time and enables transfer across inference objectives and physical conditions. We show that action learning is a promising framework for turning trajectory observations into reusable objectives for scientific inference and control.
